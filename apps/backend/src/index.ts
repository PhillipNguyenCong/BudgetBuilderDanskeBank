import express from 'express';
import { healthRouter } from './features/health/routes.js';

const app = express();
app.disable('x-powered-by');
app.use('/health', healthRouter);
app.use((_request, response) => {
  response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } });
});

// Vercel imports this application; only server.ts starts a local listener.
export default app;
