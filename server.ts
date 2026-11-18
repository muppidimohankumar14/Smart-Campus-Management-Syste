import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import { ensureDatabaseReady, isMongoMode } from './server/db';
import authRoutes from './server/routes/authRoutes';
import academicRoutes from './server/routes/academicRoutes';
import operationsRoutes from './server/routes/operationsRoutes';

const app = express();

app.use(express.json({ limit: '5mb' }));

app.get('/api/health', async (_req, res) => {
  try {
    const dbInfo = await ensureDatabaseReady();
    res.json({
      status: 'ok',
      service: 'SMART CAMPUS API',
      databaseMode: isMongoMode() ? 'mongodb' : dbInfo.mode,
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      service: 'SMART CAMPUS API',
      error:
        err instanceof Error
          ? err.message
          : 'Database service unavailable.',
    });
  }
});

// Ensure database is initialized and synchronized before protected/data API routes
app.use('/api', async (req, res, next) => {
  if (req.path === '/health') {
    next();
    return;
  }
  try {
    await ensureDatabaseReady();
    next();
  } catch (err) {
    res.status(503).json({
      error:
        err instanceof Error
          ? err.message
          : 'Database service is currently unavailable.',
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api', academicRoutes);
app.use('/api', operationsRoutes);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

app.use(
  (
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    if (res.headersSent) {
      next(err);
      return;
    }
    const message =
      err instanceof Error ? err.message : 'Internal server error.';
    if (req.path.startsWith('/api')) {
      console.error('[SMART CAMPUS API] Unhandled error:', message);
      res.status(500).json({ error: message });
      return;
    }
    next(err);
  }
);

const isVercelRuntime =
  process.env.VERCEL === '1' || Boolean(process.env.VERCEL_ENV);

async function startLocalServer() {
  await ensureDatabaseReady();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`[SMART CAMPUS] Server listening on http://0.0.0.0:${port}`);
  });
}

if (!isVercelRuntime && process.env.NODE_ENV !== 'test') {
  startLocalServer().catch((err) => {
    console.error('[SMART CAMPUS] Fatal local startup error:', err);
  });
}

export default app;
