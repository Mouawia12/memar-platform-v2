'use strict';

const logger = require('../config/logger');

/**
 * Global error handler — catches anything passed to next(err)
 */
function errorHandler(err, req, res, _next) {
  logger.error(`${err.message}`, { stack: err.stack, path: req.path });

  // Validation errors from express-validator
  if (err.type === 'validation') {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors,
      data: null,
    });
  }

  // Supabase / DB errors
  if (err.code && err.code.startsWith('2')) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Database error',
      data: null,
    });
  }

  const status = err.status || err.statusCode || 500;
  const message = status < 500 ? err.message : 'Internal server error';

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    data: null,
  });
}

module.exports = { errorHandler };
