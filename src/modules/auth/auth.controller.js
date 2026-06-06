'use strict';

const { sendSuccess, sendError } = require('../../utils/response');
const authService = require('./auth.service');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return sendError(res, 400, 'Email and password are required');

    const result = await authService.login({
      email, password,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return sendSuccess(res, result, 'Login successful');
  } catch (err) { next(err); }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return sendError(res, 400, 'refreshToken is required');
    const tokens = await authService.refreshTokens(refreshToken);
    return sendSuccess(res, tokens, 'Token refreshed');
  } catch (err) { next(err); }
}

async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    await authService.logout(req.user.id, refreshToken);
    return sendSuccess(res, null, 'Logged out');
  } catch (err) { next(err); }
}

async function me(req, res, next) {
  try {
    const user = await authService.me(req.user.id);
    return sendSuccess(res, user);
  } catch (err) { next(err); }
}

module.exports = { login, refresh, logout, me };
