import { type CSSProperties } from 'react';
import { Link } from 'react-router-dom';

import { useAppointments } from '../appointments/hooks/useAppointments';
import { TYPE_LABELS as APPT_TYPE_LABELS, STATUS_LABELS as APPT_STATUS_LABELS } from '../appointments/types';
import { useContracts } from '../contracts/hooks/useContracts';
import { useEmployees } from '../hr/hooks/useEmployees';
import { useInvoices } from '../invoices/hooks/useInvoices';
import { useProjects } from '../projects/hooks/useProjects';
import { useTasks } from '../tasks/hooks/useTasks';
import { KpiCard } from './components/KpiCard';

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
const endOfToday = () => { const d = new Date(); d.setHours(23, 59, 59, 999); return d.getTime(); };
const isToday = (iso: string | null) => { if (!iso) return false; const t = new Date(iso).getTime(); return t >= startOfToday() && t <= endOfToday(); };
const fmtTime = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }) : '—');
const money = (v: number) => v.toLocaleString('ar', { maximumFractionDigits: 3 });

export function DashboardPage() {
  const projects = useProjects({ per_page: 100 });
  const tasks = useTasks({});
  const appts = useAppointments({ per_page: 100 });
  const contracts = useContracts({ per_page: 100 });
  const employees = useEmployees({ per_page: 1 });
  const invoices = useInvoices({ per_page: 100 });

  const projectList = projects.data?.data ?? [];
  const taskList = tasks.data ?? [];
  const apptList = appts.data?.data ?? [];
  const contractList = contracts.data?.data ?? [];
  const invoiceList = invoices.data?.data ?? [];

  const inProgress = taskList.filter((t) => t.status === 'in_progress').length;
  const overdueTasks = taskList.filter((t) => t.due_date && new Date(t.due_date).getTime() < startOfToday() && t.status !== 'done').length;
  const doneTasks = taskList.filter((t) => t.status === 'done').length;

  const todayAppts = apptList.filter((a) => isToday(a.start_at) && a.status !== 'cancelled');
  const upcomingAppts = apptList.filter((a) => a.start_at && new Date(a.start_at).getTime() > endOfToday() && a.status === 'scheduled').length;

  const activeProjects = projectList.filter((p) => p.status === 'active').length;
  const onHold = projectList.filter((p) => p.status === 'on_hold').length;
  const completed = projectList.filter((p) => p.status === 'done').length;

  const contractsValue = contractList.reduce((s, c) => s + Number(c.value_kwd), 0);
  const overdueInvoices = invoiceList.filter((i) => i.is_overdue).length;
  const employeesTotal = employees.data?.meta.total ?? 0;

  const today = new Date().toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div>
      {/* شريط التنبيهات */}
      <div style={alertStrip}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}><span style={boltIcon}>⚡</span> التنبيهات:</span>
          <span style={{ ...pill, background: '#FDE8E8', color: '#DC4A3D' }}>متأخرة <b>{overdueTasks}</b></span>
          <span style={{ ...pill, background: '#FFF3DB', color: '#B9770E' }}>اليوم <b>{todayAppts.length}</b></span>
          <span style={{ ...pill, background: '#E6F1FB', color: '#1B6CA8' }}>قادمة <b>{upcomingAppts}</b></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ ...pill, background: '#E1F5EE', color: '#2D9B6F' }}>منجزة <b>{doneTasks}</b></span>
          <Link to="/tasks" style={{ fontSize: '13px', color: '#1B6CA8', textDecoration: 'none', fontWeight: 600 }}>عرض الكل ←</Link>
        </div>
      </div>

      {/* رؤوس القسمين */}
      <div style={headers}>
        <div>
          <div style={hTitle}>ملخص نشاط اليوم</div>
          <div style={hSub}>{today}</div>
        </div>
        <div style={{ textAlign: 'start' }}>
          <div style={hTitle}>نظرة عامة على المشاريع</div>
          <div style={hSub}>{projectList.length} مشروع مسجل في النظام · <Link to="/projects" style={{ color: '#1B6CA8', textDecoration: 'none', fontWeight: 600 }}>تفاصيل المشاريع ←</Link></div>
        </div>
      </div>

      {/* بطاقات المؤشرات */}
      <div style={kpiGrid}>
        <KpiCard icon="📝" color="blue" label="مهام قيد التنفيذ" value={inProgress} sub={overdueTasks ? <span style={{ color: '#DC4A3D' }}>{overdueTasks} متأخرة</span> : 'لا مهام متأخرة'} />
        <KpiCard icon="📅" color="blue" label="مواعيد اليوم" value={todayAppts.length} sub="موزعة على الأقسام" />
        <KpiCard icon="🏗️" color="orange" label="مشاريع نشطة" value={activeProjects} sub={<span style={{ color: '#1B6CA8' }}>جاري العمل عليها</span>} />
        <KpiCard icon="⏸️" color="orange" label="مشاريع معلقة" value={onHold} sub="بانتظار الموافقات" />
        <KpiCard icon="💰" color="purple" label="حجم العقود التقديري" value={`${money(contractsValue)} د.ك`} sub="دينار كويتي" />
        <KpiCard icon="✅" color="green" label="مشاريع مكتملة" value={completed} sub="تم التسليم النهائي" />
        <KpiCard icon="⚠️" color="red" label="تنبيهات معلقة" value={overdueInvoices} sub="تحتاج متابعة إدارية" />
        <KpiCard icon="👥" color="green" label="الحضور والدوام" value={employeesTotal} sub={<span style={{ color: '#2D9B6F' }}>إجمالي الموظفين</span>} />
      </div>

      {/* جدول مواعيد اليوم */}
      <div style={tableCard}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid #E4E8EF' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>📅 جدول مواعيد اليوم</h3>
          <Link to="/appointments" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>➕ إضافة موعد جديد</Link>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>الوقت</th>
                <th style={th}>الموضوع / الموعد</th>
                <th style={th}>العميل / الجهة</th>
                <th style={th}>النوع</th>
                <th style={th}>الموقع</th>
                <th style={th}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {todayAppts.map((a) => (
                <tr key={a.id}>
                  <td style={td}><b>{fmtTime(a.start_at)}</b></td>
                  <td style={td}>{a.title}</td>
                  <td style={td}>{a.project?.name ?? '—'}</td>
                  <td style={td}>{a.is_video ? '📹 فيديو' : APPT_TYPE_LABELS[a.type]}</td>
                  <td style={td}>{a.location ?? '—'}</td>
                  <td style={td}>{APPT_STATUS_LABELS[a.status]}</td>
                </tr>
              ))}
              {todayAppts.length === 0 && <tr><td style={{ ...td, textAlign: 'center', padding: '28px', opacity: 0.6 }} colSpan={6}>لا توجد مواعيد مبرمجة لليوم</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const alertStrip: CSSProperties = { background: '#fff', border: '1px solid #E4E8EF', borderRadius: '12px', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', boxShadow: '0 1px 3px rgba(0,0,0,.05)', marginBottom: '20px' };
const boltIcon: CSSProperties = { width: '26px', height: '26px', borderRadius: '8px', background: 'linear-gradient(135deg,#1B6CA8,#2D9B6F)', display: 'grid', placeItems: 'center', fontSize: '14px' };
const pill: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '999px', fontSize: '12.5px', fontWeight: 600 };
const headers: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' };
const hTitle: CSSProperties = { fontSize: '17px', fontWeight: 800, color: '#1A1F2E' };
const hSub: CSSProperties = { fontSize: '13px', color: '#5A6478', marginTop: '2px' };
const kpiGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '22px' };
const tableCard: CSSProperties = { background: '#fff', border: '1px solid #E4E8EF', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.05)' };
const th: CSSProperties = { textAlign: 'start', padding: '10px 14px', borderBottom: '2px solid #E4E8EF', fontSize: '12.5px', color: '#5A6478', fontWeight: 700 };
const td: CSSProperties = { padding: '11px 14px', borderBottom: '1px solid #F1F5F9', fontSize: '13px' };
