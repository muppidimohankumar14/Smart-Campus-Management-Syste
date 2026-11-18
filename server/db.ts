import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { CampusStateModel } from './models/mongooseModels';
import { buildInitialDatabaseSeed } from './seedData';
import { ActivityLog, DatabasePayload, UserRole } from '../src/types/campus';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'smartcampus.json');
const MONGO_STATE_KEY = 'smart_campus_primary';

interface GlobalDbCache {
  cachedDb: DatabasePayload | null;
  mongoConnected: boolean;
  initPromise: Promise<{ mode: 'mongodb' | 'file' }> | null;
  connectPromise: Promise<typeof mongoose> | null;
}

const globalForDb = globalThis as unknown as {
  __smartCampusDbCache?: GlobalDbCache;
};

const cache: GlobalDbCache =
  globalForDb.__smartCampusDbCache ||
  (globalForDb.__smartCampusDbCache = {
    cachedDb: null,
    mongoConnected: false,
    initPromise: null,
    connectPromise: null,
  });

export function isProductionRuntime(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL === '1' ||
    process.env.VERCEL_ENV === 'production' ||
    process.env.VERCEL_ENV === 'preview'
  );
}

async function connectMongoWithCache(mongoUri: string): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!cache.connectPromise) {
    cache.connectPromise = mongoose
      .connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10,
      })
      .catch((err) => {
        cache.connectPromise = null;
        throw err;
      });
  }

  return cache.connectPromise;
}

async function loadOrSeedMongoState(): Promise<DatabasePayload> {
  const existing = await CampusStateModel.findOne({ key: MONGO_STATE_KEY }).lean();
  if (existing && (existing as { payload?: DatabasePayload }).payload) {
    return (existing as { payload: DatabasePayload }).payload;
  }

  const seeded = buildInitialDatabaseSeed();
  await CampusStateModel.findOneAndUpdate(
    { key: MONGO_STATE_KEY },
    {
      key: MONGO_STATE_KEY,
      payload: seeded,
      updatedAt: new Date().toISOString(),
    },
    { upsert: true }
  );
  return seeded;
}

export async function initDatabase(): Promise<{ mode: 'mongodb' | 'file' }> {
  if (cache.initPromise) {
    return cache.initPromise;
  }

  cache.initPromise = (async (): Promise<{ mode: 'mongodb' | 'file' }> => {
    const mongoUri = process.env.MONGODB_URI?.trim();
    const isProd = isProductionRuntime();

    if (isProd && !mongoUri) {
      throw new Error(
        'Database configuration error: MONGODB_URI environment variable is required in production.'
      );
    }

    if (mongoUri) {
      try {
        await connectMongoWithCache(mongoUri);
        cache.mongoConnected = true;
        cache.cachedDb = await loadOrSeedMongoState();
        console.log('[SMART CAMPUS DB] Connected to MongoDB.');
        return { mode: 'mongodb' };
      } catch (err) {
        cache.mongoConnected = false;
        cache.connectPromise = null;
        const message = err instanceof Error ? err.message : String(err);

        if (isProd) {
          console.error('[SMART CAMPUS DB] MongoDB connection failed in production:', message);
          throw new Error(
            'Database connection failed. Please verify MongoDB availability and credentials.'
          );
        }

        console.warn(
          '[SMART CAMPUS DB] MongoDB connection failed, falling back to local persistent document store:',
          message
        );
      }
    }

    if (isProd) {
      throw new Error(
        'Persistent MongoDB connection is required in production.'
      );
    }

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DATA_FILE)) {
      try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        cache.cachedDb = JSON.parse(raw) as DatabasePayload;
      } catch {
        cache.cachedDb = buildInitialDatabaseSeed();
        fs.writeFileSync(DATA_FILE, JSON.stringify(cache.cachedDb, null, 2), 'utf-8');
      }
    } else {
      cache.cachedDb = buildInitialDatabaseSeed();
      fs.writeFileSync(DATA_FILE, JSON.stringify(cache.cachedDb, null, 2), 'utf-8');
    }

    console.log('[SMART CAMPUS DB] Using persistent file store at data/smartcampus.json');
    return { mode: 'file' };
  })().catch((err) => {
    cache.initPromise = null;
    throw err;
  });

  return cache.initPromise;
}

export async function ensureDatabaseReady(): Promise<{ mode: 'mongodb' | 'file' }> {
  const mongoUri = process.env.MONGODB_URI?.trim();

  // Handle dropped MongoDB connection across serverless pauses
  if (mongoUri && cache.mongoConnected && mongoose.connection.readyState !== 1) {
    cache.mongoConnected = false;
    cache.connectPromise = null;
    cache.initPromise = null;
  }

  const info = await initDatabase();

  // Keep in-memory view synchronized with MongoDB across serverless invocations
  if (info.mode === 'mongodb' && mongoose.connection.readyState === 1) {
    cache.cachedDb = await loadOrSeedMongoState();
  }

  return info;
}

export function getDb(): DatabasePayload {
  if (!cache.cachedDb) {
    if (isProductionRuntime()) {
      throw new Error('Database has not been initialized.');
    }
    cache.cachedDb = buildInitialDatabaseSeed();
  }
  return cache.cachedDb;
}

export async function saveDb(nextDb?: DatabasePayload): Promise<void> {
  if (nextDb) {
    cache.cachedDb = nextDb;
  }
  if (!cache.cachedDb) {
    throw new Error('Cannot save empty database state.');
  }

  const isProd = isProductionRuntime();

  if (cache.mongoConnected) {
    try {
      await CampusStateModel.findOneAndUpdate(
        { key: MONGO_STATE_KEY },
        {
          payload: cache.cachedDb,
          updatedAt: new Date().toISOString(),
        },
        { upsert: true }
      );
      return;
    } catch (err) {
      console.error('[SMART CAMPUS DB] MongoDB save error:', err);
      throw new Error('Failed to persist changes to MongoDB.');
    }
  }

  if (isProd) {
    throw new Error(
      'MongoDB is not connected in production. Refusing temporary local file fallback.'
    );
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(cache.cachedDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('[SMART CAMPUS DB] File persistence error:', err);
    throw new Error('Failed to persist changes to local storage.');
  }
}

export function appendActivity(
  action: string,
  actorName: string,
  actorRole: UserRole | 'SYSTEM',
  details: string
): void {
  const db = getDb();
  const entry: ActivityLog = {
    id: `ACT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    action,
    actorName,
    actorRole,
    details,
    createdAt: new Date().toISOString(),
  };
  db.activities.unshift(entry);
  if (db.activities.length > 50) {
    db.activities = db.activities.slice(0, 50);
  }
}

export function isMongoMode(): boolean {
  return cache.mongoConnected && mongoose.connection.readyState === 1;
}
