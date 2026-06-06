'use strict';

const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');

/**
 * Attaches an X-Request-ID and logs each incoming request
 */
function requestLogger(req, res, next) {
  req.requestId = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.requestId);

  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`, {
      requestId: req.requestId,
      userId: req.user?.id,
    });
  });

  next();
}

module.exports = { requestLogger };
