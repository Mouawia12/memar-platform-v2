'use strict';

const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const { PERMISSIONS: P } = require('../../config/permissions');
const svc = require('./audit.service');
const { sendSuccess, sendPaginated } = require('../../utils/response');

const router = Router();
router.use(authenticate, requirePermission(P.AUDIT_VIEW));
const wrap = fn => async (req, res, next) => { try { await fn(req, res); } catch (e) { next(e); } };
const isAdmin = req => ['admin', 'super_admin'].includes(req.user.role);

router.get('/', wrap(async (req, res) => {
  const r = await svc.listLogs({ query: req.query, userId: req.user.id, isAdmin: isAdmin(req) });
  sendPaginated(res, r.data, r.total, r.page, r.limit);
}));

router.get('/:id', wrap(async (req, res) => {
  sendSuccess(res, await svc.getLogById(req.params.id));
}));

module.exports = router;
