'use strict';

/**
 * Notifications Cron Engine
 * 
 * Runs scheduled checks to fire proactive notifications:
 *   - Late tasks (past due, not done)
 *   - Today's tasks  
 *   - Upcoming tasks (due in 1 day)
 *   - Payment due reminders
 *   - Appointment reminders (24h + 1h before)
 */

const cron = require('node-cron');
const { supabase } = require('../../config/supabase');
const { createNotification } = require('./notifications.service');
const { kuwaitToday, dayjs } = require('../../utils/dateHelpers');
const logger = require('../../config/logger');

// ── Late Tasks ────────────────────────────────────────────────────────────────
async function checkLateTasks() {
  const today = kuwaitToday();

  // Tasks past due, not done, not cancelled
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('id, title_ar, title_en, due_date, assigned_to')
    .lt('due_date', today.start)
    .not('status', 'in', '("done","cancelled")')
    .is('deleted_at', null)
    .not('assigned_to', 'is', null);

  if (error) { logger.error('checkLateTasks error:', error); return; }

  for (const task of tasks || []) {
    await createNotification({
      userId: task.assigned_to,
      type: 'task_late',
      title_ar: '⚠️ مهمة متأخرة',
      title_en: '⚠️ Overdue Task',
      body_ar: `المهمة "${task.title_ar}" تجاوزت موعد تسليمها`,
      body_en: `Task "${task.title_en || task.title_ar}" is overdue`,
      data: { entity_type: 'task', entity_id: task.id },
    });
  }
  logger.info(`[Cron] Late tasks notified: ${(tasks || []).length}`);
}

// ── Today Tasks ───────────────────────────────────────────────────────────────
async function checkTodayTasks() {
  const today = kuwaitToday();

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title_ar, title_en, due_date, assigned_to')
    .gte('due_date', today.start)
    .lte('due_date', today.end)
    .not('status', 'in', '("done","cancelled")')
    .is('deleted_at', null)
    .not('assigned_to', 'is', null);

  for (const task of tasks || []) {
    await createNotification({
      userId: task.assigned_to,
      type: 'task_due_today',
      title_ar: '📅 مهمة مستحقة اليوم',
      title_en: '📅 Task Due Today',
      body_ar: `المهمة "${task.title_ar}" مستحقة اليوم`,
      body_en: `Task "${task.title_en || task.title_ar}" is due today`,
      data: { entity_type: 'task', entity_id: task.id },
    });
  }
  logger.info(`[Cron] Today tasks notified: ${(tasks || []).length}`);
}

// ── Upcoming Tasks (tomorrow) ─────────────────────────────────────────────────
async function checkUpcomingTasks() {
  const tomorrow = {
    start: dayjs.utc().add(1, 'day').startOf('day').toISOString(),
    end:   dayjs.utc().add(1, 'day').endOf('day').toISOString(),
  };

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title_ar, title_en, due_date, assigned_to')
    .gte('due_date', tomorrow.start)
    .lte('due_date', tomorrow.end)
    .not('status', 'in', '("done","cancelled")')
    .is('deleted_at', null)
    .not('assigned_to', 'is', null);

  for (const task of tasks || []) {
    await createNotification({
      userId: task.assigned_to,
      type: 'task_due_tomorrow',
      title_ar: '🔔 مهمة مستحقة غداً',
      title_en: '🔔 Task Due Tomorrow',
      body_ar: `المهمة "${task.title_ar}" مستحقة غداً`,
      body_en: `Task "${task.title_en || task.title_ar}" is due tomorrow`,
      data: { entity_type: 'task', entity_id: task.id },
    });
  }
  logger.info(`[Cron] Upcoming tasks notified: ${(tasks || []).length}`);
}

// ── Appointment Reminders (24h before) ────────────────────────────────────────
async function checkAppointmentReminders() {
  const from = dayjs.utc().add(23, 'hour').toISOString();
  const to   = dayjs.utc().add(25, 'hour').toISOString();

  const { data: appts } = await supabase
    .from('appointments')
    .select('id, title_ar, title_en, scheduled_at, appointment_attendees(user_id)')
    .gte('scheduled_at', from)
    .lte('scheduled_at', to)
    .not('status', 'in', '("cancelled","completed")');

  for (const appt of appts || []) {
    for (const att of appt.appointment_attendees || []) {
      await createNotification({
        userId: att.user_id,
        type: 'appointment_reminder',
        title_ar: '📌 تذكير بموعد غداً',
        title_en: '📌 Appointment Tomorrow',
        body_ar: `لديك موعد غداً: ${appt.title_ar}`,
        body_en: `You have an appointment tomorrow: ${appt.title_en || appt.title_ar}`,
        data: { entity_type: 'appointment', entity_id: appt.id },
      });
    }
  }
  logger.info(`[Cron] Appointment reminders sent: ${(appts || []).length}`);
}

// ── Payment Due Reminders ─────────────────────────────────────────────────────
async function checkPaymentDue() {
  const tomorrow = dayjs.utc().add(1, 'day').format('YYYY-MM-DD');

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, total_kwd, balance_kwd, due_date, client:contacts(user_id)')
    .eq('due_date', tomorrow)
    .in('status', ['sent', 'partially_paid'])
    .is('deleted_at', null);

  for (const inv of invoices || []) {
    const clientUserId = inv.client?.user_id;
    if (!clientUserId) continue;

    await createNotification({
      userId: clientUserId,
      type: 'payment_due',
      title_ar: '💳 دفعة مستحقة غداً',
      title_en: '💳 Payment Due Tomorrow',
      body_ar: `فاتورة رقم ${inv.invoice_number} بمبلغ ${inv.balance_kwd} د.ك مستحقة غداً`,
      body_en: `Invoice ${inv.invoice_number} — KWD ${inv.balance_kwd} due tomorrow`,
      data: { entity_type: 'invoice', entity_id: inv.id },
    });
  }
  logger.info(`[Cron] Payment reminders sent: ${(invoices || []).length}`);
}

// ── Start All Cron Jobs ───────────────────────────────────────────────────────
function startNotificationsCron() {
  // Every day at 7:00 AM Kuwait time (04:00 UTC)
  cron.schedule('0 4 * * *', async () => {
    logger.info('[Cron] Running daily notification checks...');
    await checkLateTasks();
    await checkTodayTasks();
    await checkUpcomingTasks();
    await checkPaymentDue();
    await checkAppointmentReminders();
  });

  // Every hour — for 1-hour-before appointment reminders
  cron.schedule('0 * * * *', async () => {
    const from = dayjs.utc().add(55, 'minute').toISOString();
    const to   = dayjs.utc().add(65, 'minute').toISOString();
    const { data: appts } = await supabase
      .from('appointments')
      .select('id, title_ar, title_en, appointment_attendees(user_id)')
      .gte('scheduled_at', from)
      .lte('scheduled_at', to)
      .not('status', 'in', '("cancelled","completed")');

    for (const appt of appts || []) {
      for (const att of appt.appointment_attendees || []) {
        await createNotification({
          userId: att.user_id,
          type: 'appointment_soon',
          title_ar: '🔔 موعدك بعد ساعة',
          title_en: '🔔 Appointment in 1 hour',
          body_ar: `موعدك "${appt.title_ar}" بعد ساعة واحدة`,
          body_en: `Your appointment "${appt.title_en || appt.title_ar}" starts in 1 hour`,
          data: { entity_type: 'appointment', entity_id: appt.id },
        });
      }
    }
  });

  logger.info('✅ Notifications cron engine started');
}

module.exports = {
  startNotificationsCron,
  checkLateTasks, checkTodayTasks, checkUpcomingTasks,
  checkPaymentDue, checkAppointmentReminders,
};
