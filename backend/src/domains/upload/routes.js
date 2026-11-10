import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../../config/env.js';
import { pgPool } from '../../config/db.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { uploadFile, deleteFile, resolveCategory, provisionSchoolDirectories } from './controller.js';

const tempDir = path.join(config.cdn.uploadDir, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fname = `${uniqueSuffix}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    cb(null, fname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB limit
});

const router = Router();

/**
 * Middleware: Resolves tenant-specific target directory and pre-provisions standard subfolders
 */
async function resolveUploadContext(req, res, next) {
  try {
    let tenantFolder = 'common';
    let tenantId = req.tenant?.id;
    let tenantSlug = req.tenant?.slug;

    // 1. If req.tenant exists (from token or subdomain)
    if (req.tenant) {
      tenantFolder = `${req.tenant.slug || 'school'}-${req.tenant.id}`;
    } 
    // 2. If Super Admin passed tenantId query/header
    else if (req.query?.tenantId || req.headers['x-tenant-id']) {
      const targetId = req.query?.tenantId || req.headers['x-tenant-id'];
      const { rows } = await pgPool.query('SELECT id, slug FROM public.tenants WHERE id = $1 LIMIT 1', [targetId]);
      if (rows[0]) {
        tenantId = rows[0].id;
        tenantSlug = rows[0].slug;
        tenantFolder = `${rows[0].slug}-${rows[0].id}`;
      }
    } 
    // 3. If Super Admin passed tenantSlug query/header
    else if (req.query?.tenantSlug || req.query?.slug || req.headers['x-tenant-slug']) {
      const targetSlug = req.query?.tenantSlug || req.query?.slug || req.headers['x-tenant-slug'];
      const { rows } = await pgPool.query('SELECT id, slug FROM public.tenants WHERE slug = $1 LIMIT 1', [targetSlug]);
      if (rows[0]) {
        tenantId = rows[0].id;
        tenantSlug = rows[0].slug;
        tenantFolder = `${rows[0].slug}-${rows[0].id}`;
      } else {
        tenantFolder = `campus-${targetSlug}`;
      }
    }

    // Provision all 11 standard category folders for this school if tenant is identified
    if (tenantSlug && tenantId) {
      provisionSchoolDirectories(tenantSlug, tenantId);
    }

    const category = resolveCategory(req.query.category);
    const targetDir = path.join(config.cdn.uploadDir, tenantFolder, category);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    req.uploadTenantFolder = tenantFolder;
    req.uploadCategory = category;
    req.uploadTargetDir = targetDir;
    next();
  } catch (err) {
    next(err);
  }
}

// Upload endpoint: POST /file
// Multer is executed FIRST to consume the incoming stream synchronously without event loop stalls
router.post(
  '/file',
  (req, res, next) => {
    upload.any()(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(500).json({ success: false, message: `Upload error: ${err.message}` });
      }
      if (req.files && req.files.length > 0) {
        req.file = req.files[0];
      }
      // Ensure temp file is pruned if response is an error
      res.on('finish', () => {
        if (res.statusCode >= 400 && req.file?.path && fs.existsSync(req.file.path)) {
          try { fs.unlinkSync(req.file.path); } catch (e) {}
        }
      });
      next();
    });
  },
  authenticate,
  resolveUploadContext,
  uploadFile
);

// Delete endpoint: DELETE /file
router.delete('/file', authenticate, deleteFile);

export default router;
