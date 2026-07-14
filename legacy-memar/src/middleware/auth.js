'use strict';

const jwt        = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const { sendError } = require('../utils/response');

/**
 * Middleware: verify JWT and attach req.user
 */
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return sendError(res, 401, 'Missing or invalid authorization header');
    }

    const token = header.split(' ')[1];
    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 401, 'Token expired');
      }
      return sendError(res, 401, 'Invalid token');
    }

    // Fetch fresh user + roles from DB
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id, role, full_name_ar, full_name_en, email,
        preferred_lang, is_active,
        user_roles(
          role_id,
          roles(name, permissions)
        )
      `)
      .eq('id', decoded.sub)
      .single();

    if (error || !user) {
      return sendError(res, 401, 'User not found');
    }
    if (!user.is_active) {
      return sendError(res, 403, 'Account is deactivated');
    }

    // Flatten permissions from all assigned roles
    const permissions = new Set();
    (user.user_roles || []).forEach(ur => {
      if (ur.roles?.permissions) {
        ur.roles.permissions.forEach(p => permissions.add(p));
      }
    });

    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      fullName: user.full_name_ar || user.full_name_en,
      lang: req.headers['accept-language'] === 'en' ? 'en' : (user.preferred_lang || 'ar'),
      permissions: [...permissions],
    };

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional auth — attach user if token present, continue if not
 */
async function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();
  return authenticate(req, res, next);
}

module.exports = { authenticate, optionalAuth };
