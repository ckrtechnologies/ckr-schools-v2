import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { pgPool } from '../config/db.js';

/**
 * Multi-Tenant JWT Authentication Middleware
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Missing or malformed Authorization header.' }
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.accessSecret);
    } catch (verifyErr) {
      // Fallback verification for tokens signed with earlier fallback key
      try {
        decoded = jwt.verify(token, 'ckr_schools_v2_access_secret_2026');
      } catch (fbErr) {
        throw verifyErr;
      }
    }

    req.user = decoded;

    // SPOC accounts are confined to the public-domain surface (marketplace management,
    // uploads and their own profile) — never school operations APIs.
    const role = String(decoded.role || decoded.type || '').toLowerCase();
    if (role === 'spoc') {
      const path = String(req.originalUrl || req.url || '').split('?')[0];
      const allowedPrefixes = [
        '/api/marketplace/manage',
        '/api/marketplace/auth',
        '/api/auth/me',
        '/api/auth/profile',
        '/api/auth/change-password',
        '/api/auth/auth/change-password',
        '/api/upload',
        '/api/public-school-profile'
      ];
      if (!allowedPrefixes.some(prefix => path.startsWith(prefix))) {
        return res.status(403).json({
          success: false,
          error: { code: 'SPOC_SCOPE_FORBIDDEN', message: 'SPOC accounts can only use the public-domain portal.' }
        });
      }
    }

    // Cross-tenant boundary check: Ensure token's school matches the requested tenant
    if (req.tenant && decoded.schoolId && decoded.schoolId !== req.tenant.id) {
      const forwardedHost = req.headers['x-forwarded-host'];
      const hostHeader = (forwardedHost || req.headers.host || '').toLowerCase().split(':')[0];
      const base = config.baseDomain;
      const isSubdomain = hostHeader.endsWith(`.${base}`) && !hostHeader.startsWith('api.') && !hostHeader.startsWith('www.');

      if (isSubdomain) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Token belongs to a different school tenant.' }
        });
      }

      // On shared API gateway / mobile endpoint, self-heal req.tenant to token's actual school
      const { rows } = await pgPool.query(
        'SELECT id, slug, name, affiliation_board, plan_tier, theme_color, accent_color, motto, logo_url, is_active FROM public.tenants WHERE id = $1 AND is_active = TRUE LIMIT 1;',
        [decoded.schoolId]
      );
      if (rows[0]) {
        req.tenant = rows[0];
      }
    }

    // Auto-populate req.tenant from user's authenticated token if not already resolved by subdomain/header
    const tokenTenantId = decoded.schoolId || decoded.tenant_id || decoded.tenantId;
    if (!req.tenant && tokenTenantId) {
      const { rows } = await pgPool.query(
        'SELECT id, slug, name, affiliation_board, plan_tier, theme_color, accent_color, motto, logo_url, is_active FROM public.tenants WHERE id = $1 AND is_active = TRUE LIMIT 1;',
        [tokenTenantId]
      );
      if (rows[0]) {
        req.tenant = rows[0];
      }
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: 'Access token has expired.' }
      });
    }
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid authentication token.' }
    });
  }
}

/**
 * Role-Based Access Control (RBAC) Guard
 */
export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' }
      });
    }

    const role = (req.user.role || req.user.type || '').toLowerCase();
    const normalized = allowedRoles.map(r => r.toLowerCase());

    if (normalized.includes('*') || normalized.includes(role) || req.user.isSuperAdmin) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: `Access denied for role '${role}'.` }
    });
  };
}

