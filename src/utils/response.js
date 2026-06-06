'use strict';

/**
 * Standardized API response builders.
 * All responses follow the envelope: { success, data, meta, message, errors }
 */

function sendSuccess(res, data = null, message = null, statusCode = 200, meta = null) {
  const payload = { success: true, data, message };
  if (meta) payload.meta = meta;
  return res.status(statusCode).json(payload);
}

function sendCreated(res, data, message = 'Created successfully') {
  return sendSuccess(res, data, message, 201);
}

function sendError(res, statusCode = 500, message = 'An error occurred', errors = null) {
  return res.status(statusCode).json({
    success: false,
    data: null,
    message,
    errors,
  });
}

function sendPaginated(res, data, total, page, limit, message = null) {
  return sendSuccess(res, data, message, 200, {
    total,
    page: Number(page),
    limit: Number(limit),
    pages: Math.ceil(total / limit),
  });
}

module.exports = { sendSuccess, sendCreated, sendError, sendPaginated };
