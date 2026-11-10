import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '../../');

// Explicitly load backend/.env first, then fallback to current directory
dotenv.config({ path: path.resolve(backendRoot, '.env') });
dotenv.config();

const rawUploadDir = process.env.CDN_UPLOAD_DIR || './uploads';
const resolvedUploadDir = path.isAbsolute(rawUploadDir)
  ? rawUploadDir
  : path.resolve(backendRoot, rawUploadDir);

export const config = {
  port: parseInt(process.env.PORT || '5006', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  baseDomain: (process.env.BASE_DOMAIN || 'ckrschools.online').toLowerCase(),
  databaseUrl: process.env.DATABASE_URL,
  directUrl: process.env.DIRECT_URL || process.env.DATABASE_URL,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'ckr_schools_v2_access_secret_2026',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'ckr_schools_v2_refresh_secret_2026',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '30d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '365d'
  },
  cdn: {
    uploadDir: resolvedUploadDir,
    baseUrl: (process.env.CDN_BASE_URL || '/cdn').replace(/\/+$/, '')
  }
};
