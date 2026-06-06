'use strict';

const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const { PERMISSIONS: P } = require('../../config/permissions');
const svc = require('./roles.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../../utils/response');

const router = Router();
router.use(authenticate);

router.get('/',     requirePermission(P.ROLES_VIEW),   async (req, res, next) => { try { const r = await svc.listRoles({ query: req.query }); sendPaginated(res, r.data, r.total, r.page, r.limit); } catch (e) { next(e); } });
router.get('/:id',  requirePermission(P.ROLES_VIEW),   async (req, res, next) => { try { sendSuccess(res, await svc.getRoleById(req.params.id)); } catch (e) { next(e); } });
router.post('/',    requirePermission(P.ROLES_MANAGE),  async (req, res, next) => { try { sendCreated(res, await svc.createRole({ body: req.body, requesterId: req.user.id })); } catch (e) { next(e); } });
router.patch('/:id',requirePermission(P.ROLES_MANAGE),  async (req, res, next) => { try { sendSuccess(res, await svc.updateRole({ id: req.params.id, body: req.body, requesterId: req.user.id }), 'Updated'); } catch (e) { next(e); } });
router.delete('/:id',requirePermission(P.ROLES_MANAGE), async (req, res, next) => { try { await svc.deleteRole({ id: req.params.id, requesterId: req.user.id }); sendSuccess(res, null, 'Deleted'); } catch (e) { next(e); } });

module.exports = router;
