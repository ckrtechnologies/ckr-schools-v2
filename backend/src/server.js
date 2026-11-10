import http from 'http';
import app from './app.js';
import { config } from './config/env.js';
import { pgPool } from './config/db.js';
import { initSocket } from './sockets/socketManager.js';
import { provisionSchoolDirectories } from './domains/upload/controller.js';

const server = http.createServer(app);

// Initialize Multi-Tenant Socket.io Engine
initSocket(server);

async function start() {
  try {
    // Test PostgreSQL database connection
    const client = await pgPool.connect();
    console.log('🐘 PostgreSQL connected via pg.Pool successfully!');
    client.release();

    // Pre-provision structured CDN folders for all active school tenants
    try {
      const { rows: tenants } = await pgPool.query('SELECT id, slug FROM public.tenants WHERE is_active = TRUE;');
      for (const t of tenants) {
        provisionSchoolDirectories(t.slug, t.id);
      }
      console.log(`📁 Verified structured CDN directories for ${tenants.length} school campuses`);
    } catch (cdnErr) {
      console.warn('⚠️ Could not verify CDN directories on start:', cdnErr.message);
    }

    server.listen(config.port, () => {
      console.log(`🚀 CKR Schools v2 Backend running on port ${config.port} (${config.nodeEnv})`);
      console.log(`📡 Base domain: ${config.baseDomain}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();
