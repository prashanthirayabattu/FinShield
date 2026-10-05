import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { apiRoutes } from './routes';
import { errorHandler } from './middleware/errorHandler';

export const app = express();

// 1. Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// 2. Strict CORS policy
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 3. Request parsing with strict payload bounds
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: false, limit: '16kb' }));
app.use(cookieParser());

// 4. API Endpoints
app.use('/api', apiRoutes);

// 5. 404 Fallback for unmapped routes
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// 6. Centralized Error Handler (no stack trace / internal leakage in production)
app.use(errorHandler);
