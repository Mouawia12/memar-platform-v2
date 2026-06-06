'use strict';

const { supabase } = require('../../config/supabase');
const { dayjs, kuwaitToday } = require('../../utils/dateHelpers');

/**
 * Shared Calendar Service
 * Aggregates: tasks (due dates), appointments, project stage milestones,
 * and payment due dates into a single unified calendar feed.
 */

async function getCalendarFeed({ userId, userRole, userPermissions, from, to }) {
  const isAdmin = userPermissions.includes('projects:view_all');
  const events = [];

  // ── 1. Tasks ───────────────────────────────────────────────────────────────
  let taskQ = supabase.from('tasks')
    .select('id, title_ar, title_en, due_date, priority, status, project_id')
    .not('due_date', 'is', null)
    .not('status', 'in', '("done","cancelled")')
    .is('deleted_at', null)
    .gte('due_date', from)
    .lte('due_date', to);

  if (!isAdmin) taskQ = taskQ.eq('assigned_to', userId);
  const { data: tasks } = await taskQ;

  (tasks || []).forEach(t => events.push({
    id: `task-${t.id}`,
    type: 'task',
    title_ar: t.title_ar,
    title_en: t.title_en,
    date: t.due_date,
    status: t.status,
    priority: t.priority,
    color: priorityColor(t.priority, t.due_date),
    entity_id: t.id,
    project_id: t.project_id,
  }));

  // ── 2. Appointments ────────────────────────────────────────────────────────
  const { data: appts } = await supabase.from('appointment_attendees')
    .select('appointment:appointments(id, title_ar, title_en, scheduled_at, status, type, location_ar)')
    .eq('user_id', userId)
    .not('appointment.status', 'in', '("cancelled")')
    .gte('appointment.scheduled_at', from)
    .lte('appointment.scheduled_at', to);

  (appts || []).forEach(a => {
    if (a.appointment) events.push({
      id: `appt-${a.appointment.id}`,
      type: 'appointment',
      title_ar: a.appointment.title_ar,
      title_en: a.appointment.title_en,
      date: a.appointment.scheduled_at,
      status: a.appointment.status,
      color: '#6366f1',
      entity_id: a.appointment.id,
      location_ar: a.appointment.location_ar,
    });
  });

  // ── 3. Project Stage Milestones ────────────────────────────────────────────
  let stageQ = supabase.from('project_stages')
    .select('id, name_ar, name_en, planned_end, status, project:projects(id, name_ar, project_number)')
    .not('planned_end', 'is', null)
    .not('status', 'in', '("completed","approved")')
    .gte('planned_end', from)
    .lte('planned_end', to);

  if (!isAdmin) {
    const { data: myProjects } = await supabase.from('project_members').select('project_id').eq('user_id', userId);
    const ids = (myProjects || []).map(p => p.project_id);
    if (ids.length > 0) stageQ = stageQ.in('project_id', ids);
    else stageQ = stageQ.eq('project_id', 'none');
  }

  const { data: stages } = await stageQ;
  (stages || []).forEach(s => events.push({
    id: `stage-${s.id}`,
    type: 'milestone',
    title_ar: `${s.project?.name_ar} — ${s.name_ar}`,
    title_en: `${s.project?.name_en || ''} — ${s.name_en || ''}`,
    date: s.planned_end,
    status: s.status,
    color: '#f59e0b',
    entity_id: s.id,
    project_id: s.project?.id,
  }));

  // ── 4. Invoice Due Dates (accountant/admin only) ───────────────────────────
  if (isAdmin || userPermissions.includes('finance:view')) {
    const { data: invoices } = await supabase.from('invoices')
      .select('id, invoice_number, due_date, balance_kwd, client:contacts(full_name_ar)')
      .not('status', 'in', '("paid","cancelled","void")')
      .gte('due_date', from)
      .lte('due_date', to)
      .is('deleted_at', null);

    (invoices || []).forEach(inv => events.push({
      id: `invoice-${inv.id}`,
      type: 'payment',
      title_ar: `فاتورة ${inv.invoice_number} — ${inv.client?.full_name_ar}`,
      title_en: `Invoice ${inv.invoice_number}`,
      date: inv.due_date,
      amount: inv.balance_kwd,
      color: '#ef4444',
      entity_id: inv.id,
    }));
  }

  // Sort all events by date ascending
  events.sort((a, b) => new Date(a.date) - new Date(b.date));

  return events;
}

function priorityColor(priority, dueDate) {
  const urgency = require('../../utils/dateHelpers').classifyDate(dueDate);
  if (urgency === 'late')     return '#ef4444';
  if (urgency === 'today')    return '#f97316';
  if (urgency === 'upcoming') return '#eab308';
  if (priority === 'urgent')  return '#dc2626';
  if (priority === 'high')    return '#f97316';
  return '#22c55e';
}

async function getMonthView({ userId, year, month, userRole, userPermissions }) {
  const from = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).startOf('month').toISOString();
  const to   = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).endOf('month').toISOString();
  return getCalendarFeed({ userId, userRole, userPermissions, from, to });
}

async function getWeekView({ userId, weekStart, userRole, userPermissions }) {
  const from = dayjs(weekStart).startOf('week').toISOString();
  const to   = dayjs(weekStart).endOf('week').toISOString();
  return getCalendarFeed({ userId, userRole, userPermissions, from, to });
}

async function getDayView({ userId, date, userRole, userPermissions }) {
  const from = dayjs(date).startOf('day').toISOString();
  const to   = dayjs(date).endOf('day').toISOString();
  return getCalendarFeed({ userId, userRole, userPermissions, from, to });
}

module.exports = { getCalendarFeed, getMonthView, getWeekView, getDayView };
