import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file if available
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface EnvConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  clientOrigin: string;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  logLevel: string;
  resendApiKey: string;
  emailFrom: string;
}

export const env: EnvConfig = {
  nodeEnv: (process.env.NODE_ENV as EnvConfig['nodeEnv']) || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:4200',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/project_mate',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_project_mate_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  logLevel: process.env.LOG_LEVEL || 'dev',
  resendApiKey: process.env.RESEND_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || 'Project Mate <onboarding@resend.dev>',
};
