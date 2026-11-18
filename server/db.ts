import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { CampusStateModel } from './models/mongooseModels';
import { buildInitialDatabaseSeed } from './seedData';
import { ActivityLog, DatabasePayload, UserRole } from '../src/types/campus';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'nanicampus.json');
const MONGO_STATE_KEY = 'nani_campus_primary';

let cachedDb: DatabasePayload | null = null;
let mongoConnected = false;

export async function initDatabase(): Promise<{ mode: 'mongodb' | 'file' }> {
  const mongoUri = process.env.MONGODB_URI?.trim();

  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 });
      mongoConnected = true;
      const existing = await CampusStateModel.findOne({ key: MONGO_STATE_KEY }).lean();
      if (existing && (existing as { payload?: DatabasePayload }).payload) {
        cachedDb = (existing as { payload: DatabasePayload }).payload;
      } else {
        cachedDb = buildInitialDatabaseSeed();
        await CampusStateModel.create({
          key: MONGO_STATE_KEY,
          payload: cachedDb,
          updatedAt: new Date().toISOString(),
        });
      }
      console.log('[NANI CAMPUS DB] Connected to MongoDB.');
      return { mode: 'mongodb' };
    } catch (err) {
      console.warn(
        '[NANI CAMPUS DB] MongoDB connection failed, falling back to local persistent document store:',
        err instanceof Error ? err.message : String(err)
      );
      mongoConnected = false;
    }
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      cachedDb = JSON.parse(raw) as DatabasePayload;
    } catch {
      cachedDb = buildInitialDatabaseSeed();
      fs.writeFileSync(DATA_FILE, JSON.stringify(cachedDb, null, 2), 'utf-8');
    }
  } else {
    cachedDb = buildInitialDatabaseSeed();
    fs.writeFileSync(DATA_FILE, JSON.stringify(cachedDb, null, 2), 'utf-8');
  }

  console.log('[NANI CAMPUS DB] Using persistent file store at data/nanicampus.json');
  return { mode: 'file' };
}

export function getDb(): DatabasePayload {
  if (!cachedDb) {
    cachedDb = buildInitialDatabaseSeed();
  }
  return cachedDb;
}

export async function saveDb(nextDb?: DatabasePayload): Promise<void> {
  if (nextDb) {
    cachedDb = nextDb;
  }
  if (!cachedDb) return;

  if (mongoConnected) {
    try {
      await CampusStateModel.findOneAndUpdate(
        { key: MONGO_STATE_KEY },
        {
          payload: cachedDb,
          updatedAt: new Date().toISOString(),
        },
        { upsert: true }
      );
    } catch (err) {
      console.error('[NANI CAMPUS DB] MongoDB save error:', err);
    }
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(cachedDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('[NANI CAMPUS DB] File persistence error:', err);
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
  return mongoConnected;
}
