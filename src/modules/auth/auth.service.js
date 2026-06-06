'use strict';

const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../../config/supabase');
const { logActivity } = require('../audit/audit.service');

// ── Token helpers ─────────────────────────────────────────────────────────────

function signAccessToken(userId, role) {
  return jwt.sign(
    { sub: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function signRefreshToken(userId) {
  return jwt.sign(
    { sub: userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
}

// ── Auth Service ──────────────────────────────────────────────────────────────

async function login({ email, password, ipAddress, userAgent }) {
  // 1) Fetch user
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, role, is_active, full_name_ar, full_name_en, preferred_lang')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (error || !user) throw { status: 401, message: 'Invalid email or password' };
  if (!user.is_active) throw { status: 403, message: 'Account is deactivated' };

  // 2) Verify password via Supabase Auth
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password,
  });
  if (authError) throw { status: 401, message: 'Invalid email or password' };

  // 3) Generate tokens
  const accessToken  = signAccessToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id);

  // 4) Store refresh token as session
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await supabase.from('sessions').insert({
    id: uuidv4(),
    user_id: user.id,
    token_hash: refreshToken,
    ip_address: ipAddress,
    device_info: { userAgent },
    expires_at: expiresAt,
  });

  // 5) Update last_login
  await supabase.from('users').update({ last_login_at: new Date().toISOString() }).eq('id', user.id);

  // 6) Audit log
  await logActivity({ userId: user.id, action: 'login', entityType: 'auth', entityId: user.id, ipAddress });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      role: user.role,
      email: user.email,
      full_name_ar: user.full_name_ar,
      full_name_en: user.full_name_en,
      preferred_lang: user.preferred_lang,
    },
  };
}

async function refreshTokens(token) {
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw { status: 401, message: 'Invalid refresh token' };
  }
  if (decoded.type !== 'refresh') throw { status: 401, message: 'Not a refresh token' };

  // Check session in DB
  const { data: session } = await supabase
    .from('sessions')
    .select('user_id, expires_at')
    .eq('token_hash', token)
    .single();

  if (!session || new Date(session.expires_at) < new Date()) {
    throw { status: 401, message: 'Session expired or not found' };
  }

  // Get user role for new token
  const { data: user } = await supabase.from('users').select('role').eq('id', session.user_id).single();

  return {
    accessToken: signAccessToken(session.user_id, user.role),
    refreshToken: signRefreshToken(session.user_id),
  };
}

async function logout(userId, refreshToken) {
  await supabase.from('sessions').delete()
    .match({ user_id: userId, token_hash: refreshToken });
  await logActivity({ userId, action: 'logout', entityType: 'auth', entityId: userId });
}

async function me(userId) {
  const { data, error } = await supabase
    .from('users')
    .select(`id, role, email, full_name_ar, full_name_en, phone,
             avatar_url, preferred_lang, is_active, last_login_at,
             user_roles(roles(name, permissions))`)
    .eq('id', userId)
    .single();

  if (error || !data) throw { status: 404, message: 'User not found' };
  return data;
}

module.exports = { login, refreshTokens, logout, me };
