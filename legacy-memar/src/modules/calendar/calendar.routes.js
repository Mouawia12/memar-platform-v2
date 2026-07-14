'use strict';

const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const { PERMISSIONS: P } = require('../../config/permissions');
const svc = require('./calendar.service');
const { sendSuccess } = require('../../utils/response');

const router = Router();
router.use(authenticate, requirePermission(P.CALENDAR_VIEW));
const wrap = fn => async (req, res, next) => { try { await fn(req, res); } catch (e) { next(e); } };

const ctx = req => ({ userId: req.user.id, userRole: req.user.role, userPermissions: req.user.permissions });

router.get('/month', wrap(async (req, res) => {
  const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;
  sendSuccess(res, await svc.getMonthView({ ...ctx(req), year, month }));
}));

router.get('/week', wrap(async (req, res) => {
  const weekStart = req.query.date || new Date().toISOString();
  sendSuccess(res, await svc.getWeekView({ ...ctx(req), weekStart }));
}));

router.get('/day', wrap(async (req, res) => {
  const { date = new Date().toISOString() } = req.query;
  sendSuccess(res, await svc.getDayView({ ...ctx(req), date }));
}));

router.get('/feed', wrap(async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ success: false, message: 'from and to query params required' });
  sendSuccess(res, await svc.getCalendarFeed({ ...ctx(req), from, to }));
}));

module.exports = router;
