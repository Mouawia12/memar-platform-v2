'use strict';

const { sendError } = require('../utils/response');

/**
 * requirePermission(permission)
 * Usage: router.get('/route', authenticate, requirePermission('projects:view_all'), handler)
 */
const requirePermission = (...requiredPerms) => (req, res, next) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthenticated');
  }

  const userPerms = new Set(req.user.permissions || []);
  const hasAll = requiredPerms.every(p => userPerms.has(p));

  if (!hasAll) {
    return sendError(res, 403, 'Insufficient permissions', {
      required: requiredPerms,
      role: req.user.role,
    });
  }
  next();
};

/**
 * requireAnyPermission(perm1, perm2, ...)
 * Passes if the user has AT LEAST ONE of the listed permissions
 */
const requireAnyPermission = (...requiredPerms) => (req, res, next) => {
  if (!req.user) return sendError(res, 401, 'Unauthenticated');

  const userPerms = new Set(req.user.permissions || []);
  const hasAny = requiredPerms.some(p => userPerms.has(p));

  if (!hasAny) {
    return sendError(res, 403, 'Insufficient permissions', { required: requiredPerms });
  }
  next();
};

/**
 * requireRole(role1, role2, ...)
 * Simple role check (faster than permission lookup for admin guards)
 */
const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return sendError(res, 401, 'Unauthenticated');
  if (!allowedRoles.includes(req.user.role)) {
    return sendError(res, 403, 'Access denied for your role');
  }
  next();
};

module.exports = { requirePermission, requireAnyPermission, requireRole };
