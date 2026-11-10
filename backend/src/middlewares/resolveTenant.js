import { config } from '../config/env.js';
import { pgPool } from '../config/db.js';

/**
 * Multi-Tenant Subdomain & Header Resolver Middleware
 * Extracts and resolves the school tenant from headers or Host header.
 * 
 * Supports:
 * - Header: x-tenant-slug: "vision" or "dps"
 * - Subdomain: vision.ckrschools.online -> slug "vision"
 * - Query param: ?school=vision (for testing/dev)
 * - Base domain (ckrschools.online or localhost) -> req.isSuperAdmin = true
 */
export async function resolveTenant(req, res, next) {
  try {
    const forwardedHost = req.headers['x-forwarded-host'];
    const hostHeader = (forwardedHost || req.headers.host || '').toLowerCase().split(':')[0];
    const queryOverride = req.query?.school;
    const headerOverride = req.headers['x-tenant-slug'] || req.headers['x-tenant-subdomain'];

    let slug = null;

    if (headerOverride) {
      slug = String(headerOverride).toLowerCase().trim();
    } else if (queryOverride) {
      slug = String(queryOverride).toLowerCase().trim();
    } else if (hostHeader) {
      const base = config.baseDomain;

      // Check for base platform domain (Super Admin console / Marketplace)
      if (hostHeader === base || hostHeader === 'localhost' || hostHeader === '127.0.0.1') {
        req.isSuperAdmin = true;
        req.tenant = null;
        return next();
      }

      // Check if host ends with the base domain e.g. "vision.ckrschools.online"
      if (hostHeader.endsWith(`.${base}`)) {
        slug = hostHeader.slice(0, -(base.length + 1)).split('.').pop();
      } else {
        const parts = hostHeader.split('.');
        if (parts.length >= 2) {
          slug = parts[0];
        }
      }
    }

    // Reserved subdomains for platform super admin / API / Marketplace
    const reserved = ['admin', 'www', 'api', 'app', 'hq', 'portal', 'dashboard', 'superadmin'];
    if (!slug || reserved.includes(slug)) {
      req.isSuperAdmin = true;
      req.tenant = null;
      return next();
    }

    // Look up tenant in PostgreSQL
    const query = `
      SELECT id, slug, name, affiliation_board, plan_tier, theme_color, accent_color, motto, logo_url, is_active
      FROM tenants
      WHERE slug = $1 AND is_active = TRUE
      LIMIT 1;
    `;
    const { rows } = await pgPool.query(query, [slug]);

    if (!rows[0]) {
      req.tenantNotFound = slug;
      req.tenant = null;
      return res.status(404).json({
        success: false,
        error: {
          code: 'TENANT_NOT_FOUND',
          message: `School tenant '${slug}' not found or inactive.`
        }
      });
    }

    req.tenant = rows[0];
    req.isSuperAdmin = false;
    next();
  } catch (error) {
    next(error);
  }
}

