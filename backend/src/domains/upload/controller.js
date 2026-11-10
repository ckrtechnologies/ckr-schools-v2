import fs from 'fs';
import path from 'path';
import { config } from '../../config/env.js';

/**
 * Standard structured folders maintained for each school campus CDN
 */
export const STANDARD_SCHOOL_FOLDERS = [
  'logo',
  'avatar',
  'admissions',
  'academics/material',
  'academics/assignment',
  'exams',
  'circulars',
  'gallery',
  'finance',
  'documents',
  'general'
];

/**
 * Pre-provisions all standard directories for a school campus tenant
 */
export function provisionSchoolDirectories(slug, tenantId) {
  if (!slug || !tenantId) return;
  const tenantFolder = `${slug}-${tenantId}`;
  const baseDir = path.join(config.cdn.uploadDir, tenantFolder);

  for (const folder of STANDARD_SCHOOL_FOLDERS) {
    const fullPath = path.join(baseDir, folder);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }
}

/**
 * Resolves query category to a safe relative folder
 */
export function resolveCategory(rawCategory = 'general') {
  if (!rawCategory) return 'general';
  const c = String(rawCategory).toLowerCase().trim();

  if (c.startsWith('class_')) return `academics/${c}`;
  if (c === 'logo' || c === 'branding' || c === 'favicon' || c === 'school_logo' || c === 'school' || c === 'school_info') return 'logo';
  if (c === 'avatar' || c === 'avatars' || c === 'profile' || c === 'photo') return 'avatar';
  if (
    c === 'document' ||
    c === 'documents' ||
    c === 'admissions' ||
    c === 'student' ||
    c === 'aadhar' ||
    c === 'pan' ||
    c === 'birthcertificate' ||
    c === 'tc'
  )
    return 'admissions';
  if (c === 'circular' || c === 'circulars' || c === 'notice' || c === 'newsletter') return 'circulars';
  if (c === 'gallery' || c === 'event' || c === 'events') return 'gallery';
  if (c === 'material' || c === 'study_material' || c === 'syllabus') return 'academics/material';
  if (c === 'assignment' || c === 'homework') return 'academics/assignment';
  if (c === 'exam' || c === 'exams' || c === 'datesheet' || c === 'marksheet' || c === 'reportcard') return 'exams';
  if (c === 'fee' || c === 'fees' || c === 'finance' || c === 'receipt' || c === 'receipts' || c === 'voucher') return 'finance';
  if (c === 'docs' || c === 'certificates') return 'documents';
  return 'general';
}

/**
 * Handles uploaded file response
 */
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    const tenantFolder = req.uploadTenantFolder || (req.tenant ? `${req.tenant.slug || 'school'}-${req.tenant.id}` : 'common');
    const category = req.uploadCategory || resolveCategory(req.query.category);

    const targetDir = path.join(config.cdn.uploadDir, tenantFolder, category);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const finalPath = path.join(targetDir, req.file.filename);
    if (req.file.path !== finalPath && fs.existsSync(req.file.path)) {
      fs.renameSync(req.file.path, finalPath);
    }

    // Relative asset key: Completely independent of host, domain or CDN infrastructure changes
    const fileUrl = `/cdn/${tenantFolder}/${category}/${req.file.filename}`;

    return res.status(200).json({
      success: true,
      url: fileUrl,
      fileName: req.file.filename
    });
  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    return res.status(500).json({ success: false, message: `Upload failed: ${err.message}` });
  }
};

/**
 * Deletes file
 */
export const deleteFile = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: 'File URL is required' });
    }

    // Support both /uploads/ and /cdn/ paths
    const match = url.match(/\/(?:uploads|cdn)\/(.+)$/);
    if (match && match[1]) {
      const relativePath = match[1];
      const fullPath = path.join(config.cdn.uploadDir, relativePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: `Delete failed: ${err.message}` });
  }
};
