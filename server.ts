import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initDatabase, isMongoMode } from './server/db';
import authRoutes from './server/routes/authRoutes';
import academicRoutes from './server/routes/academicRoutes';
import operationsRoutes from './server/routes/operationsRoutes';

async function bootstrap() {
  const dbInfo = await initDatabase();

  const app = express();
  app.use(express.json({ limit: '5mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'NANI CAMPUS API',
      databaseMode: isMongoMode() ? 'mongodb' : dbInfo.mode,
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api', academicRoutes);
  app.use('/api', operationsRoutes);

  app.use('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  if (process.env.NODE_ENV !== 'production') {
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
    console.log(`[NANI CAMPUS] Server listening on http://0.0.0.0:${port}`);
  });
}

bootstrap().catch((err) => {
  console.error('[NANI CAMPUS] Fatal startup error:', err);
  process.exit(1);
});
