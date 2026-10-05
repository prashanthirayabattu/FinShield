import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface ServerEnv {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_URL: string;
  JWT_SECRET: string;
  FRONTEND_URL: string;
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/finshield?schema=public';
}

const getEnv = (): ServerEnv => {
  const nodeEnv = (process.env.NODE_ENV as ServerEnv['NODE_ENV']) || 'development';

  return {
    PORT: parseInt(process.env.PORT || '5000', 10),
    NODE_ENV: nodeEnv,
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/finshield?schema=public',
    JWT_SECRET: process.env.JWT_SECRET || 'finshield_secure_dev_jwt_secret_min32chars_test',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  };
};

export const env = getEnv();
