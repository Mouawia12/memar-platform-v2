'use strict';

const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter — 200 req / 15 min per IP
 */
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    data: null,
  },
});

/**
 * Auth endpoints — stricter: 10 req / 15 min
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts.',
    data: null,
  },
});

/**
 * File upload rate limiter — 30 req / 10 min
 */
const uploadRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'Too many file uploads, slow down.',
    data: null,
  },
});

module.exports = { apiRateLimiter, authRateLimiter, uploadRateLimiter };
