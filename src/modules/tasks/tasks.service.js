'use strict';

const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../../config/supabase');
const { getPagination } = require('../../utils/pagination');
const { classifyDate } = require('../../utils/dateHelpers');
const { logActivity } = require('../audit/audit.service');
const { createNotification } = require('../notifications/notifications.service');
const { emitToProject } = require('../../websocket/ws.server');

async function listTasks({ query, userId, userRole, userPermissions }) {
  const { from, to, page, limit } = getPagination(query);
  const isAdmin = userPermissions.includes('tasks:view_all');

  let q = supabase.from('tasks')
    .select(`
      id, title_ar, title_en, status, priority, due_date,
      estimated_hours, actual_hours, created_at,
      project:projects(id, name_ar, project_number),
      assignee:users!assigned_to(id, full_name_ar, full_name_en, avatar_url)
    `, { count: 'exact' })
    .is('deleted_at', null)
    .is('parent_task_id', null)  // top-level only by default
    .range(from, to)
    .order(query.sortBy || 'due_date', { ascending: true });

  if (!isAdmin) q = q.eq('assigned_to', userId);
  if (query.project_id) q = q.eq('project_id', query.project_id);
  if (query.status)     q = q.eq('status', query.status);
  if (query.priority)   q = q.eq('priority', query.priority);
  if (query.assigned_to) q = q.eq('assigned_to', query.assigned_to);
  if (query.search)     q = q.ilike('title_ar', `%${query.search}%`);

  const { data, count, error } = await q;
  if (error) throw error;

  // Classify each task by due date urgency
  const enriched = (data || []).map(t => ({
    ...t,
    urgency: classifyDate(t.due_date),
  }));

  return { data: enriched, total: count, page, limit };
}

async function getTaskById(id) {
  const { data, error } = await supabase.from('tasks')
    .select(`
      *,
      project:projects(id, name_ar, project_number),
      assignee:users!assigned_to(id, full_name_ar, full_name_en, avatar_url),
      creator:users!created_by(id, full_name_ar),
      subtasks:tasks!parent_task_id(id, title_ar, status, priority, due_date, assigned_to),
      time_logs:task_time_logs(*, user:users(full_name_ar))
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error || !data) throw { status: 404, message: 'Task not found' };
  return { ...data, urgency: classifyDate(data.due_date) };
}

async function createTask({ body, requesterId }) {
  const {
    title_ar, title_en, description, project_id, stage_id, parent_task_id,
    assigned_to, priority, due_date, estimated_hours, tags, order_index,
  } = body;

  const { data, error } = await supabase.from('tasks').insert({
    id: uuidv4(),
    title_ar, title_en, description, project_id, stage_id, parent_task_id,
    assigned_to, priority: priority || 'medium', due_date, estimated_hours,
    tags: tags || [], order_index: order_index || 0,
    status: 'todo',
    created_by: requesterId,
  }).select().single();
  if (error) throw error;

  // Notify assignee
  if (assigned_to && assigned_to !== requesterId) {
    await createNotification({
      userId: assigned_to,
      type: 'task_assigned',
      title_ar: 'تم تعيين مهمة لك',
      title_en: 'Task assigned to you',
      body_ar: `المهمة: ${title_ar}`,
      body_en: `Task: ${title_en || title_ar}`,
      data: { entity_type: 'task', entity_id: data.id },
    });
  }

  if (project_id) emitToProject(project_id, 'task.updated', { projectId: project_id, task: data });
  await logActivity({ userId: requesterId, action: 'create', entityType: 'task', entityId: data.id });
  return data;
}

async function updateTask({ id, body, requesterId }) {
  const allowed = ['title_ar', 'title_en', 'description', 'status', 'priority',
    'assigned_to', 'due_date', 'estimated_hours', 'actual_hours', 'tags', 'order_index'];
  const updates = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select('*, project_id').single();
  if (error) throw error;

  // Notify new assignee on reassignment
  if (updates.assigned_to && updates.assigned_to !== requesterId) {
    await createNotification({
      userId: updates.assigned_to,
      type: 'task_assigned',
      title_ar: 'تم تعيين مهمة لك',
      title_en: 'Task assigned to you',
      data: { entity_type: 'task', entity_id: id },
    });
  }

  if (data.project_id) emitToProject(data.project_id, 'task.updated', { taskId: id, updates });
  await logActivity({ userId: requesterId, action: 'update', entityType: 'task', entityId: id, newValues: updates });
  return data;
}

async function deleteTask({ id, requesterId }) {
  await supabase.from('tasks').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  await logActivity({ userId: requesterId, action: 'delete', entityType: 'task', entityId: id });
}

// ── Time Tracking ─────────────────────────────────────────────────────────────

async function startTimeLog({ taskId, userId, notes }) {
  // Close any open log for this user+task
  await supabase.from('task_time_logs')
    .update({ ended_at: new Date().toISOString() })
    .eq('task_id', taskId)
    .eq('user_id', userId)
    .is('ended_at', null);

  const { data, error } = await supabase.from('task_time_logs').insert({
    id: uuidv4(),
    task_id: taskId,
    user_id: userId,
    started_at: new Date().toISOString(),
    notes,
  }).select().single();
  if (error) throw error;
  return data;
}

async function stopTimeLog({ taskId, userId }) {
  const endedAt = new Date().toISOString();

  const { data: log, error } = await supabase.from('task_time_logs')
    .select('id, started_at')
    .eq('task_id', taskId)
    .eq('user_id', userId)
    .is('ended_at', null)
    .single();
  if (error || !log) throw { status: 404, message: 'No active time log found' };

  const durationMin = Math.round((new Date(endedAt) - new Date(log.started_at)) / 60000);

  const { data, error: updErr } = await supabase.from('task_time_logs')
    .update({ ended_at: endedAt, duration_min: durationMin })
    .eq('id', log.id)
    .select().single();
  if (updErr) throw updErr;

  // Update task actual_hours
  const { data: allLogs } = await supabase.from('task_time_logs').select('duration_min').eq('task_id', taskId).not('duration_min', 'is', null);
  const totalMin = (allLogs || []).reduce((s, l) => s + (l.duration_min || 0), 0);
  await supabase.from('tasks').update({ actual_hours: +(totalMin / 60).toFixed(2) }).eq('id', taskId);

  return data;
}

async function getTimeLogs(taskId) {
  const { data, error } = await supabase.from('task_time_logs')
    .select('*, user:users(full_name_ar, full_name_en)')
    .eq('task_id', taskId)
    .order('started_at', { ascending: false });
  if (error) throw error;
  return data;
}

// ── Board & Gantt ─────────────────────────────────────────────────────────────

async function getBoard({ projectId, userId, userPermissions }) {
  const statuses = ['todo', 'in_progress', 'review', 'done'];
  const isAdmin = userPermissions.includes('tasks:view_all');

  const results = {};
  for (const status of statuses) {
    let q = supabase.from('tasks')
      .select('id, title_ar, title_en, priority, due_date, order_index, assignee:users!assigned_to(id, full_name_ar, avatar_url)')
      .eq('status', status)
      .is('deleted_at', null)
      .is('parent_task_id', null)
      .order('order_index');

    if (projectId) q = q.eq('project_id', projectId);
    if (!isAdmin)  q = q.eq('assigned_to', userId);

    const { data } = await q;
    results[status] = (data || []).map(t => ({ ...t, urgency: classifyDate(t.due_date) }));
  }
  return results;
}

module.exports = { listTasks, getTaskById, createTask, updateTask, deleteTask, startTimeLog, stopTimeLog, getTimeLogs, getBoard };
