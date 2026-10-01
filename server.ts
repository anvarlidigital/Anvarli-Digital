import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import sendSmsHandler from './api/send-sms.ts';

dotenv.config();

async function startServer() {
  const app = express();
  const port = parseInt(process.env.PORT || '3000', 10);

  // Body parser for JSON API requests
  app.use(express.json());

  // Mount Twilio Programmable SMS API endpoint
  app.all('/api/send-sms', async (req, res) => {
    try {
      await sendSmsHandler(req, res);
    } catch (err) {
      console.error('[Server] Uncaught error in /api/send-sms:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Internal server error' });
      }
    }
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Trim & Twisted Unisex Salon API',
      timestamp: new Date().toISOString()
    });
  });

  // Serve SPA in production or Vite middleware in development
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    // Vite development middleware for SPA frontend
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[Trim & Twisted] Server running on port ${port} (0.0.0.0)`);
  });
}

startServer().catch((err) => {
  console.error('[Trim & Twisted] Failed to start server:', err);
  process.exit(1);
});

