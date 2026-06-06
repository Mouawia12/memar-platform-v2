'use strict';

const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const { PERMISSIONS: P } = require('../../config/permissions');
const svc = require('./notifications.service');
const { sendSuccess, sendPaginated } = require('../../utils/response');

const router = Router();
router.use(authenticate);

const wrap = fn => async (req, res, next) => { try { await fn(req, res); } catch (e) { next(e); } };

router.get('/', requirePermission(P.NOTIFICATIONS_VIEW), wrap(async (req, res) => {
  const r = await svc.listNotifications({ userId: req.user.id, query: req.query });
  res.json({ success: true, data: r.data, meta: { total: r.total, page: r.page, limit: r.limit, unread: r.unread } });
}));

router.post('/:id/read', requirePermission(P.NOTIFICATIONS_VIEW), wrap(async (req, res) => {
  await svc.markRead({ notifId: req.params.id, userId: req.user.id });
  sendSuccess(res, null, 'Marked as read');
}));

router.post('/read-all', requirePermission(P.NOTIFICATIONS_VIEW), wrap(async (req, res) => {
  await svc.markAllRead(req.user.id);
  sendSuccess(res, null, 'All marked as read');
}));

router.get('/preferences', requirePermission(P.NOTIFICATIONS_VIEW), wrap(async (req, res) => {
  sendSuccess(res, await svc.getPreferences(req.user.id));
}));

router.put('/preferences', requirePermission(P.NOTIFICATIONS_VIEW), wrap(async (req, res) => {
  sendSuccess(res, await svc.updatePreferences(req.user.id, req.body.preferences));
}));

module.exports = router;
