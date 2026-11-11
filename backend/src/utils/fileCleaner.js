import fs from 'fs';
import path from 'path';
import { config } from '../config/env.js';

/**
 * Safely removes a file from the server's uploads/CDN storage given its URL or relative path.
 * Supports:
 *   - /cdn/<tenant>/<category>/<file>
 *   - /uploads/<tenant>/<category>/<file>
 *   - Full URLs (e.g. https://.../cdn/...)
 *
 * @param {string|string[]} targetUrls - URL(s) of the file(s) to remove
 * @returns {number} Count of successfully unlinked files
 */
export function removeFileFromDisk(targetUrls) {
  if (!targetUrls) return 0;
  const urls = Array.isArray(targetUrls) ? targetUrls : [targetUrls];
  let removedCount = 0;

  for (const rawUrl of urls) {
    if (!rawUrl || typeof rawUrl !== 'string') continue;

    // Match relative path after /cdn/ or /uploads/
    const match = rawUrl.match(/\/(?:uploads|cdn)\/(.+)$/);
    if (!match || !match[1]) continue;

    const relativePath = match[1].split('?')[0]; // strip query params if any
    
    // Prevent directory traversal attacks
    if (relativePath.includes('..')) continue;

    const possiblePaths = [
      path.join(config.cdn.uploadDir, relativePath),
      path.resolve(process.cwd(), 'uploads', relativePath)
    ];

    for (const filePath of possiblePaths) {
      try {
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
          removedCount++;
          break;
        }
      } catch (err) {
        console.warn(`[fileCleaner] Failed to unlink ${filePath}:`, err.message);
      }
    }
  }

  return removedCount;
}
