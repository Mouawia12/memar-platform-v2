'use strict';

/**
 * All RBAC permission constants used across the platform.
 * These keys are stored in roles.permissions (JSONB array).
 */

const PERMISSIONS = {
  // ── Users ────────────────────────────────────────────────────────────────
  USERS_VIEW:         'users:view',
  USERS_CREATE:       'users:create',
  USERS_EDIT:         'users:edit',
  USERS_DELETE:       'users:delete',

  // ── Roles ────────────────────────────────────────────────────────────────
  ROLES_VIEW:         'roles:view',
  ROLES_MANAGE:       'roles:manage',

  // ── Projects ─────────────────────────────────────────────────────────────
  PROJECTS_VIEW_ALL:  'projects:view_all',
  PROJECTS_VIEW_OWN:  'projects:view_own',
  PROJECTS_CREATE:    'projects:create',
  PROJECTS_EDIT:      'projects:edit',
  PROJECTS_DELETE:    'projects:delete',
  STAGES_APPROVE:     'projects:stages_approve',

  // ── Tasks ─────────────────────────────────────────────────────────────────
  TASKS_VIEW_ALL:     'tasks:view_all',
  TASKS_VIEW_OWN:     'tasks:view_own',
  TASKS_CREATE:       'tasks:create',
  TASKS_EDIT:         'tasks:edit',
  TASKS_DELETE:       'tasks:delete',

  // ── Finance ───────────────────────────────────────────────────────────────
  FINANCE_VIEW:       'finance:view',
  FINANCE_CREATE:     'finance:create',
  FINANCE_EDIT:       'finance:edit',
  PAYMENTS_RECORD:    'finance:payments_record',

  // ── HR ────────────────────────────────────────────────────────────────────
  HR_VIEW:            'hr:view',
  HR_MANAGE:          'hr:manage',
  PAYROLL_VIEW_OWN:   'hr:payroll_own',

  // ── Files ─────────────────────────────────────────────────────────────────
  FILES_UPLOAD:       'files:upload',
  FILES_DOWNLOAD:     'files:download',
  FILES_DELETE:       'files:delete',
  FILES_MANAGE:       'files:manage',

  // ── Calendar / Appointments ───────────────────────────────────────────────
  CALENDAR_VIEW:      'calendar:view',
  CALENDAR_MANAGE:    'calendar:manage',
  APPOINTMENTS_VIEW:  'appointments:view',
  APPOINTMENTS_CREATE:'appointments:create',
  APPOINTMENTS_MANAGE:'appointments:manage',

  // ── Notifications ─────────────────────────────────────────────────────────
  NOTIFICATIONS_VIEW: 'notifications:view',
  NOTIFICATIONS_ADMIN:'notifications:admin',

  // ── Audit ─────────────────────────────────────────────────────────────────
  AUDIT_VIEW:         'audit:view',

  // ── System ────────────────────────────────────────────────────────────────
  SETTINGS_MANAGE:    'settings:manage',
  REPORTS_FULL:       'reports:full',
};

/**
 * Default permission sets per built-in role.
 * Stored in DB but seeded from here.
 */
const ROLE_DEFAULTS = {
  super_admin: Object.values(PERMISSIONS),

  admin: Object.values(PERMISSIONS).filter(p => p !== 'settings:manage'),

  project_manager: [
    PERMISSIONS.PROJECTS_VIEW_ALL, PERMISSIONS.PROJECTS_CREATE,
    PERMISSIONS.PROJECTS_EDIT, PERMISSIONS.STAGES_APPROVE,
    PERMISSIONS.TASKS_VIEW_ALL, PERMISSIONS.TASKS_CREATE, PERMISSIONS.TASKS_EDIT,
    PERMISSIONS.FILES_UPLOAD, PERMISSIONS.FILES_DOWNLOAD,
    PERMISSIONS.CALENDAR_VIEW, PERMISSIONS.CALENDAR_MANAGE,
    PERMISSIONS.APPOINTMENTS_VIEW, PERMISSIONS.APPOINTMENTS_CREATE,
    PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.PAYROLL_VIEW_OWN,
  ],

  engineer: [
    PERMISSIONS.PROJECTS_VIEW_OWN,
    PERMISSIONS.TASKS_VIEW_OWN, PERMISSIONS.TASKS_EDIT,
    PERMISSIONS.FILES_UPLOAD, PERMISSIONS.FILES_DOWNLOAD,
    PERMISSIONS.CALENDAR_VIEW,
    PERMISSIONS.APPOINTMENTS_VIEW,
    PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.PAYROLL_VIEW_OWN,
  ],

  accountant: [
    PERMISSIONS.PROJECTS_VIEW_ALL,
    PERMISSIONS.FINANCE_VIEW, PERMISSIONS.FINANCE_CREATE,
    PERMISSIONS.FINANCE_EDIT, PERMISSIONS.PAYMENTS_RECORD,
    PERMISSIONS.FILES_DOWNLOAD,
    PERMISSIONS.CALENDAR_VIEW,
    PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.PAYROLL_VIEW_OWN,
    PERMISSIONS.REPORTS_FULL,
  ],

  hr_manager: [
    PERMISSIONS.HR_VIEW, PERMISSIONS.HR_MANAGE,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.CALENDAR_VIEW,
    PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.PAYROLL_VIEW_OWN,
  ],

  client: [
    PERMISSIONS.PROJECTS_VIEW_OWN,
    PERMISSIONS.FILES_DOWNLOAD,
    PERMISSIONS.CALENDAR_VIEW,
    PERMISSIONS.APPOINTMENTS_VIEW, PERMISSIONS.APPOINTMENTS_CREATE,
    PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.STAGES_APPROVE,
  ],
};

module.exports = { PERMISSIONS, ROLE_DEFAULTS };
