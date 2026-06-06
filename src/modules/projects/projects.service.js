'use strict';

const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../../config/supabase');
const { getPagination } = require('../../utils/pagination');
const { logActivity } = require('../audit/audit.service');
const { createNotification } = require('../notifications/notifications.service');
const { emitToProject } = require('../../websocket/ws.server');

// ── Counter helper ────────────────────────────────────────────────────────────
async function generateProjectNumber() {
  const year  = new Date().getFullYear();
  const { count } = await supabase.from('projects').select('*', { count: 'exact', head: true });
  return `MEP-${year}-${String((count || 0) + 1).padStart(3, '0')}`;
}

// ── Projects ──────────────────────────────────────────────────────────────────

async function listProjects({ query, userId, userRole, userPermissions }) {
  const { from, to, page, limit } = getPagination(query);
  const isAdmin = ['admin', 'super_admin', 'project_manager'].includes(userRole);

  let q = supabase.from('projects')
    .select(`
      id, project_number, name_ar, name_en, type, status, priority,
      start_date, end_date, progress_pct, contract_value_kwd, area_sqm,
      client:contacts(id, full_name_ar, full_name_en),
      manager:users!manager_id(id, full_name_ar, full_name_en),
      created_at
    `, { count: 'exact' })
    .is('deleted_at', null)
    .range(from, to)
    .order(query.sortBy || 'created_at', { ascending: query.sortDir === 'asc' });

  // Scope non-admins to their assigned projects
  if (!isAdmin && !userPermissions.includes('projects:view_all')) {
    q = q.or(`contact_user_id.eq.${userId},project_members.user_id.eq.${userId}`);
  }

  if (query.status) q = q.eq('status', query.status);
  if (query.type)   q = q.eq('type', query.type);
  if (query.search) q = q.or(`name_ar.ilike.%${query.search}%,name_en.ilike.%${query.search}%,project_number.ilike.%${query.search}%`);

  const { data, count, error } = await q;
  if (error) throw error;
  return { data, total: count, page, limit };
}

async function getProjectById({ id, userId, userRole }) {
  const { data, error } = await supabase.from('projects')
    .select(`
      *,
      client:contacts(id, full_name_ar, full_name_en, email, phone),
      manager:users!manager_id(id, full_name_ar, full_name_en),
      project_stages(* ORDER BY order_index ASC),
      project_members(user_id, role, users(id, full_name_ar, full_name_en, avatar_url))
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error || !data) throw { status: 404, message: 'Project not found' };
  return data;
}

async function createProject({ body, requesterId }) {
  const projectNumber = await generateProjectNumber();
  const {
    name_ar, name_en, type, client_id, contact_user_id, manager_id,
    location_ar, location_en, area_sqm, floors, start_date, end_date,
    budget_kwd, contract_value_kwd, scope_ar, scope_en, priority, tags,
  } = body;

  const { data, error } = await supabase.from('projects').insert({
    id: uuidv4(),
    project_number: projectNumber,
    name_ar, name_en, type, client_id, contact_user_id, manager_id,
    location_ar, location_en, area_sqm, floors, start_date, end_date,
    budget_kwd, contract_value_kwd, scope_ar, scope_en,
    priority: priority || 'medium',
    tags: tags || [],
    status: 'active',
    progress_pct: 0,
  }).select().single();
  if (error) throw error;

  // Auto-add creator as member
  await supabase.from('project_members').insert({ project_id: data.id, user_id: requesterId, role: 'manager' });

  // Notify client
  if (contact_user_id) {
    await createNotification({
      userId: contact_user_id,
      type: 'project_created',
      title_ar: 'تم إنشاء مشروعك',
      title_en: 'Your project has been created',
      body_ar: `تم إنشاء المشروع: ${name_ar}`,
      body_en: `Project created: ${name_en || name_ar}`,
      data: { entity_type: 'project', entity_id: data.id },
    });
  }

  await logActivity({ userId: requesterId, action: 'create', entityType: 'project', entityId: data.id, newValues: { name_ar, project_number: projectNumber } });
  return data;
}

async function updateProject({ id, body, requesterId }) {
  const allowed = ['name_ar', 'name_en', 'status', 'type', 'priority', 'manager_id',
    'start_date', 'end_date', 'area_sqm', 'floors', 'budget_kwd', 'contract_value_kwd',
    'scope_ar', 'scope_en', 'progress_pct', 'tags', 'location_ar', 'location_en'];
  const updates = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from('projects').update(updates).eq('id', id).select().single();
  if (error) throw error;

  emitToProject(id, 'stage.updated', { projectId: id, updates });
  await logActivity({ userId: requesterId, action: 'update', entityType: 'project', entityId: id, newValues: updates });
  return data;
}

async function deleteProject({ id, requesterId }) {
  await supabase.from('projects').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  await logActivity({ userId: requesterId, action: 'delete', entityType: 'project', entityId: id });
}

// ── Stages ────────────────────────────────────────────────────────────────────

async function getStages(projectId) {
  const { data, error } = await supabase
    .from('project_stages')
    .select('*')
    .eq('project_id', projectId)
    .order('order_index');
  if (error) throw error;
  return data;
}

async function createStage({ projectId, body, requesterId }) {
  const { data, error } = await supabase.from('project_stages').insert({
    id: uuidv4(),
    project_id: projectId,
    ...body,
  }).select().single();
  if (error) throw error;

  emitToProject(projectId, 'stage.updated', { projectId, stage: data });
  await logActivity({ userId: requesterId, action: 'create', entityType: 'project_stage', entityId: data.id });
  return data;
}

async function updateStage({ stageId, body, requesterId }) {
  const allowed = ['name_ar', 'name_en', 'status', 'planned_start', 'planned_end',
    'actual_start', 'actual_end', 'progress_pct', 'deliverables', 'notes_ar', 'notes_en', 'order_index'];
  const updates = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from('project_stages').update(updates).eq('id', stageId).select().single();
  if (error) throw error;

  await logActivity({ userId: requesterId, action: 'update', entityType: 'project_stage', entityId: stageId });
  return data;
}

async function approveStage({ stageId, requesterId }) {
  const { data, error } = await supabase.from('project_stages').update({
    status: 'approved',
    approved_by: requesterId,
    approved_at: new Date().toISOString(),
  }).eq('id', stageId).select('*, project_id').single();
  if (error) throw error;

  emitToProject(data.project_id, 'stage.updated', { stageId, status: 'approved' });
  await logActivity({ userId: requesterId, action: 'approve', entityType: 'project_stage', entityId: stageId });
  return data;
}

// ── Members ───────────────────────────────────────────────────────────────────

async function getMembers(projectId) {
  const { data, error } = await supabase.from('project_members')
    .select('role, joined_at, users(id, full_name_ar, full_name_en, email, avatar_url, role)')
    .eq('project_id', projectId);
  if (error) throw error;
  return data;
}

async function addMember({ projectId, userId, role, requesterId }) {
  await supabase.from('project_members').upsert({ project_id: projectId, user_id: userId, role }, { onConflict: 'project_id,user_id' });

  await createNotification({
    userId,
    type: 'project_assigned',
    title_ar: 'تمت إضافتك إلى مشروع',
    title_en: 'You were added to a project',
    data: { entity_type: 'project', entity_id: projectId },
  });
  await logActivity({ userId: requesterId, action: 'add_member', entityType: 'project', entityId: projectId, newValues: { userId, role } });
}

async function removeMember({ projectId, userId, requesterId }) {
  await supabase.from('project_members').delete().match({ project_id: projectId, user_id: userId });
  await logActivity({ userId: requesterId, action: 'remove_member', entityType: 'project', entityId: projectId, newValues: { userId } });
}

// ── Comments ──────────────────────────────────────────────────────────────────

async function getComments({ projectId, isInternal, userRole }) {
  let q = supabase.from('project_comments')
    .select('*, user:users(id, full_name_ar, full_name_en, avatar_url, role)')
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (!['admin', 'super_admin', 'project_manager', 'engineer'].includes(userRole)) {
    q = q.eq('is_internal', false);
  }

  const { data, error } = await q;
  if (error) throw error;
  return data;
}

async function addComment({ projectId, body, userId, userRole }) {
  const { text, stage_id, is_internal, attachments } = body;
  const isInternalAllowed = ['admin', 'super_admin', 'project_manager', 'engineer'].includes(userRole);

  const { data, error } = await supabase.from('project_comments').insert({
    id: uuidv4(),
    project_id: projectId,
    user_id: userId,
    body: text,
    stage_id,
    is_internal: isInternalAllowed ? (is_internal || false) : false,
    attachments: attachments || [],
  }).select().single();
  if (error) throw error;

  emitToProject(projectId, 'comment.new', { projectId, comment: data });
  return data;
}

module.exports = {
  listProjects, getProjectById, createProject, updateProject, deleteProject,
  getStages, createStage, updateStage, approveStage,
  getMembers, addMember, removeMember,
  getComments, addComment,
};
