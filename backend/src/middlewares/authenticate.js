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
    const decoded = jwt.verify(token, config.jwt.accessSecret);

    req.user = decoded;

    // Cross-tenant boundary check: Ensure token's school matches the requested tenant
    if (req.tenant && decoded.schoolId && decoded.schoolId !== req.tenant.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Token belongs to a different school tenant.' }
      });
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

