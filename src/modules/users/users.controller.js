'use strict';

const { sendSuccess, sendCreated, sendError, sendPaginated } = require('../../utils/response');
const svc = require('./users.service');

const list    = async (req, res, next) => { try { const r = await svc.listUsers({ query: req.query, requesterId: req.user.id, requesterRole: req.user.role }); return sendPaginated(res, r.data, r.total, r.page, r.limit); } catch (e) { next(e); } };
const getOne  = async (req, res, next) => { try { return sendSuccess(res, await svc.getUserById(req.params.id)); } catch (e) { next(e); } };
const create  = async (req, res, next) => { try { return sendCreated(res, await svc.createUser({ body: req.body, requesterId: req.user.id })); } catch (e) { next(e); } };
const update  = async (req, res, next) => { try { return sendSuccess(res, await svc.updateUser({ id: req.params.id, body: req.body, requesterId: req.user.id }), 'Updated'); } catch (e) { next(e); } };
const remove  = async (req, res, next) => { try { await svc.softDeleteUser({ id: req.params.id, requesterId: req.user.id }); return sendSuccess(res, null, 'Deleted'); } catch (e) { next(e); } };
const addRole = async (req, res, next) => { try { await svc.assignRole({ userId: req.params.id, roleId: req.body.roleId, grantedBy: req.user.id }); return sendSuccess(res, null, 'Role assigned'); } catch (e) { next(e); } };
const delRole = async (req, res, next) => { try { await svc.removeRole({ userId: req.params.id, roleId: req.params.roleId, requesterId: req.user.id }); return sendSuccess(res, null, 'Role removed'); } catch (e) { next(e); } };

module.exports = { list, getOne, create, update, remove, addRole, delRole };
