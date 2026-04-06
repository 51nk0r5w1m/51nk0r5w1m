/**
 * @module api/app
 * Express application factory.
 * Separated from server.ts to allow testing without starting HTTP server.
 *
 * Security headers applied here:
 * - X-Content-Type-Options: nosniff
 * - X-Frame-Options: DENY
 * - No X-Powered-By header (removed by Express)
 */

import express, { Express } from 'express';
import cors from 'cors';
import { Container } from './container';
import { buildRequestsRouter } from './routes/requests';

export function buildApp(container: Container): Express {
  const app = express();

  // Security: remove X-Powered-By
  app.disable('x-powered-by');

  // Parse JSON bodies — limit to 1mb to prevent payload attacks
  app.use(express.json({ limit: '1mb' }));

  // CORS: Sprint 1 allows localhost origins only
  // Production: scope to specific domains
  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  }));

  // Security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  });

  // Health check — unauthenticated (Sprint 1)
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'custom-account-factory-api', version: '0.1.0' });
  });

  // API routes
  app.use('/api/requests', buildRequestsRouter(container));

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  return app;
}
