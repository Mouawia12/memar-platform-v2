import { describe, expect, it } from 'vitest';

import { isSystemAdmin } from './nav';

/**
 * هذه الدالة تحدّد وحدها من يفتح لوحتَي المهام والفرص على «الكل» بدل «ما يخصّني».
 * الحالة المهمّة: من يهبط على لوحة الإدارة ليس بالضرورة إدارةَ نظام.
 */
describe('isSystemAdmin', () => {
  it('المدير العام والأدمن إدارةُ نظام', () => {
    expect(isSystemAdmin({ roles: ['super_admin'] })).toBe(true);
    expect(isSystemAdmin({ roles: ['admin'] })).toBe(true);
  });

  it('مدير المشاريع والمحاسب والموارد البشرية ليسوا إدارةَ نظام رغم هبوطهم على لوحة الإدارة', () => {
    for (const role of ['مدير مشاريع', 'محاسب', 'موارد بشرية']) {
      expect(isSystemAdmin({ dashboard: 'admin', roles: [role] })).toBe(false);
    }
  });

  it('الموظف والعميل ليسا إدارةَ نظام', () => {
    expect(isSystemAdmin({ dashboard: 'employee', roles: ['employee'] })).toBe(false);
    expect(isSystemAdmin({ dashboard: 'client', roles: ['client'] })).toBe(false);
  });

  it('يكفي أن يحمل المستخدم دور الأدمن ضمن عدّة أدوار', () => {
    expect(isSystemAdmin({ roles: ['مهندس تصميم', 'admin'] })).toBe(true);
  });

  it('لا يعتمد على dashboard وحده — دور الأدمن هو الفيصل', () => {
    expect(isSystemAdmin({ dashboard: 'admin' })).toBe(false);
    expect(isSystemAdmin({ dashboard: 'employee', roles: ['admin'] })).toBe(true);
  });

  it('يتحمّل غياب المستخدم قبل وصول بياناته', () => {
    expect(isSystemAdmin(null)).toBe(false);
    expect(isSystemAdmin(undefined)).toBe(false);
    expect(isSystemAdmin({})).toBe(false);
    expect(isSystemAdmin({ roles: [] })).toBe(false);
  });
});
