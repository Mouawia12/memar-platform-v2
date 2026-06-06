'use strict';

const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const { requirePermission, requireAnyPermission } = require('../../middleware/rbac');
const { PERMISSIONS: P } = require('../../config/permissions');
const svc = require('./projects.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../../utils/response');

const router = Router();
router.use(authenticate);

// Projects
router.get('/', requireAnyPermission(P.PROJECTS_VIEW_ALL, P.PROJECTS_VIEW_OWN), async (req, res, next) => {
  try {
    const r = await svc.listProjects({ query: req.query, userId: req.user.id, userRole: req.user.role, userPermissions: req.user.permissions });
    sendPaginated(res, r.data, r.total, r.page, r.limit);
  } catch (e) { next(e); }
});

router.get('/:id', requireAnyPermission(P.PROJECTS_VIEW_ALL, P.PROJECTS_VIEW_OWN), async (req, res, next) => {
  try { sendSuccess(res, await svc.getProjectById({ id: req.params.id, userId: req.user.id, userRole: req.user.role })); } catch (e) { next(e); }
});

router.post('/', requirePermission(P.PROJECTS_CREATE), async (req, res, next) => {
  try { sendCreated(res, await svc.createProject({ body: req.body, requesterId: req.user.id })); } catch (e) { next(e); }
});

router.patch('/:id', requirePermission(P.PROJECTS_EDIT), async (req, res, next) => {
  try { sendSuccess(res, await svc.updateProject({ id: req.params.id, body: req.body, requesterId: req.user.id }), 'Updated'); } catch (e) { next(e); }
});

router.delete('/:id', requirePermission(P.PROJECTS_DELETE), async (req, res, next) => {
  try { await svc.deleteProject({ id: req.params.id, requesterId: req.user.id }); sendSuccess(res, null, 'Deleted'); } catch (e) { next(e); }
});

// Stages
router.get('/:id/stages', requireAnyPermission(P.PROJECTS_VIEW_ALL, P.PROJECTS_VIEW_OWN), async (req, res, next) => {
  try { sendSuccess(res, await svc.getStages(req.params.id)); } catch (e) { next(e); }
});

router.post('/:id/stages', requirePermission(P.PROJECTS_EDIT), async (req, res, next) => {
  try { sendCreated(res, await svc.createStage({ projectId: req.params.id, body: req.body, requesterId: req.user.id })); } catch (e) { next(e); }
});

router.patch('/:id/stages/:stageId', requirePermission(P.PROJECTS_EDIT), async (req, res, next) => {
  try { sendSuccess(res, await svc.updateStage({ stageId: req.params.stageId, body: req.body, requesterId: req.user.id })); } catch (e) { next(e); }
});

router.post('/:id/stages/:stageId/approve', requirePermission(P.STAGES_APPROVE), async (req, res, next) => {
  try { sendSuccess(res, await svc.approveStage({ stageId: req.params.stageId, requesterId: req.user.id }), 'Stage approved'); } catch (e) { next(e); }
});

// Members
router.get('/:id/members', requireAnyPermission(P.PROJECTS_VIEW_ALL, P.PROJECTS_VIEW_OWN), async (req, res, next) => {
  try { sendSuccess(res, await svc.getMembers(req.params.id)); } catch (e) { next(e); }
});

router.post('/:id/members', requirePermission(P.PROJECTS_EDIT), async (req, res, next) => {
  try {
    await svc.addMember({ projectId: req.params.id, userId: req.body.userId, role: req.body.role, requesterId: req.user.id });
    sendSuccess(res, null, 'Member added');
  } catch (e) { next(e); }
});

router.delete('/:id/members/:userId', requirePermission(P.PROJECTS_EDIT), async (req, res, next) => {
  try { await svc.removeMember({ projectId: req.params.id, userId: req.params.userId, requesterId: req.user.id }); sendSuccess(res, null, 'Member removed'); } catch (e) { next(e); }
});

// Comments
router.get('/:id/comments', requireAnyPermission(P.PROJECTS_VIEW_ALL, P.PROJECTS_VIEW_OWN), async (req, res, next) => {
  try { sendSuccess(res, await svc.getComments({ projectId: req.params.id, userRole: req.user.role })); } catch (e) { next(e); }
});

router.post('/:id/comments', requireAnyPermission(P.PROJECTS_VIEW_ALL, P.PROJECTS_VIEW_OWN), async (req, res, next) => {
  try { sendCreated(res, await svc.addComment({ projectId: req.params.id, body: req.body, userId: req.user.id, userRole: req.user.role })); } catch (e) { next(e); }
});

module.exports = router;
