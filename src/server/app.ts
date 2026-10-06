import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { apiRoutes } from './routes';
import { errorHandler } from './middleware/errorHandler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const allowedOrigins = Array.from(
  new Set([
    env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ])
);

// 2. Strict CORS policy
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      if (process.env.VERCEL && origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 3. Request parsing with strict payload bounds
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: false, limit: '16kb' }));
app.use(cookieParser());

// 4. API Endpoints
app.use('/api', apiRoutes);

// Optional static file serving if dist directory exists (for unified production deployment)
const candidateDistPaths = [
  path.resolve(__dirname, '../dist'),
  path.resolve(__dirname, '../../dist'),
  path.resolve(process.cwd(), 'src/dist'),
  path.resolve(process.cwd(), 'dist'),
];

const distPath = candidateDistPaths.find((p) => fs.existsSync(p));

if (distPath && env.NODE_ENV === 'production') {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// 5. 404 Fallback for unmapped routes
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// 6. Centralized Error Handler (no stack trace / internal leakage in production)
app.use(errorHandler);
