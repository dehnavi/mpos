import express, { Express } from 'express';
import * as path from 'path';
import { createApiRouter } from './routes';
import { resolveResourcePath } from '../utils/paths';
import { MPOSConfig } from '../domain/types';

/** Builds the local MPOS IDE Express app: JSON API under `/api`, static SPA otherwise. */
export function createIdeApp(root: string, config: MPOSConfig): Express {
  const app = express();
  app.use(express.json());
  app.use('/api', createApiRouter(root, config));

  const webRoot = resolveResourcePath('ide-web');
  app.use(express.static(webRoot));
  app.use((_req, res) => {
    res.sendFile(path.join(webRoot, 'index.html'));
  });

  return app;
}
