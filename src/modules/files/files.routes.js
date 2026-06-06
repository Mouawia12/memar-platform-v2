'use strict';

const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const { PERMISSIONS: P } = require('../../config/permissions');
const { uploadRateLimiter } = require('../../middleware/rateLimiter');
const svc = require('./files.service');
const { sendSuccess, sendCreated, sendError, sendPaginated } = require('../../utils/response');

const router = Router();
router.use(authenticate);
const wrap = fn => async (req, res, next) => { try { await fn(req, res); } catch (e) { next(e); } };

// List files by entity
router.get('/', requirePermission(P.FILES_DOWNLOAD), wrap(async (req, res) => {
  const r = await svc.listFiles({ entityType: req.query.entity_type, entityId: req.query.entity_id, query: req.query });
  sendPaginated(res, r.data, r.total, r.page, r.limit);
}));

// Upload new file
router.post('/upload', requirePermission(P.FILES_UPLOAD), uploadRateLimiter, svc.upload.single('file'), wrap(async (req, res) => {
  if (!req.file) return sendError(res, 400, 'No file provided');
  const { entity_type, entity_id, parent_file_id, tags, is_public } = req.body;

  const record = await svc.uploadFile({
    buffer: req.file.buffer,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    entityType: entity_type,
    entityId: entity_id,
    parentFileId: parent_file_id,
    tags: tags ? JSON.parse(tags) : [],
    isPublic: is_public === 'true',
    userId: req.user.id,
  });
  sendCreated(res, record, 'File uploaded');
}));

// Get file metadata
router.get('/:id', requirePermission(P.FILES_DOWNLOAD), wrap(async (req, res) => {
  sendSuccess(res, await svc.getFile(req.params.id));
}));

// Get download URL (signed)
router.get('/:id/download', requirePermission(P.FILES_DOWNLOAD), wrap(async (req, res) => {
  sendSuccess(res, await svc.getDownloadUrl(req.params.id, req.user.id));
}));

// Get version history
router.get('/:id/versions', requirePermission(P.FILES_DOWNLOAD), wrap(async (req, res) => {
  sendSuccess(res, await svc.getVersions(req.params.id));
}));

// Upload new version
router.post('/:id/version', requirePermission(P.FILES_UPLOAD), uploadRateLimiter, svc.upload.single('file'), wrap(async (req, res) => {
  if (!req.file) return sendError(res, 400, 'No file provided');
  const record = await svc.uploadFile({
    buffer: req.file.buffer,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    parentFileId: req.params.id,
    userId: req.user.id,
  });
  sendCreated(res, record, 'New version uploaded');
}));

// Delete file
router.delete('/:id', requirePermission(P.FILES_DELETE), wrap(async (req, res) => {
  await svc.deleteFile({ fileId: req.params.id, userId: req.user.id });
  sendSuccess(res, null, 'File deleted');
}));

// Grant permission
router.post('/:id/permissions', requirePermission(P.FILES_MANAGE), wrap(async (req, res) => {
  const { userId, permission } = req.body;
  await svc.grantPermission({ fileId: req.params.id, targetUserId: userId, permission, grantedBy: req.user.id });
  sendSuccess(res, null, 'Permission granted');
}));

// Revoke permission
router.delete('/:id/permissions/:userId', requirePermission(P.FILES_MANAGE), wrap(async (req, res) => {
  await svc.revokePermission({ fileId: req.params.id, targetUserId: req.params.userId, requesterId: req.user.id });
  sendSuccess(res, null, 'Permission revoked');
}));

module.exports = router;
