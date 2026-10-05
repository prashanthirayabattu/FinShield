import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check for .env across standard locations (server dir, cwd server dir, or root)
const candidatePaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(process.cwd(), 'src/server/.env'),
  path.resolve(process.cwd(), '.env'),
];

let envFileLoaded = false;
for (const p of candidatePaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    envFileLoaded = true;
    break;
  }
}

if (!envFileLoaded) {
  dotenv.config();
}

export interface ServerEnv {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_URL: string;
  IS_REAL_DATABASE_CONFIGURED: boolean;
  JWT_SECRET: string;
  FRONTEND_URL: string;
  AI_PROVIDER?: string;
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;
}

const isRealDbConfigured = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '');

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/finshield?schema=public';
}

const getEnv = (): ServerEnv => {
  const nodeEnv = (process.env.NODE_ENV as ServerEnv['NODE_ENV']) || 'development';

  return {
    PORT: parseInt(process.env.PORT || '5000', 10),
    NODE_ENV: nodeEnv,
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/finshield?schema=public',
    IS_REAL_DATABASE_CONFIGURED: isRealDbConfigured,
    JWT_SECRET: process.env.JWT_SECRET || 'finshield_secure_dev_jwt_secret_min32chars_test',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
    AI_PROVIDER: process.env.AI_PROVIDER || (process.env.GEMINI_API_KEY ? 'gemini' : process.env.OPENAI_API_KEY ? 'openai' : undefined),
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  };
};

export const env = getEnv();
