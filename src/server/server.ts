import { app } from './app';
import { env } from './config/env';

const server = app.listen(env.PORT, () => {
  console.log(`[FinShield Server] Running on http://localhost:${env.PORT} in ${env.NODE_ENV} mode`);
});

// Graceful termination
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('[FinShield Server] Process terminated gracefully');
  });
});
