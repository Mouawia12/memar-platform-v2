import { useContacts } from '../clients/hooks/useContacts';
import { useInvoices } from '../invoices/hooks/useInvoices';
import { useProjects } from '../projects/hooks/useProjects';
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS } from '../projects/types';
import { STATUS_LABELS as TASK_STATUS_LABELS, STATUS_ORDER } from '../tasks/types';
import { useTasks } from '../tasks/hooks/useTasks';
import { KpiCard } from './components/KpiCard';

/**
 * لوحة التحكم — بطاقات مؤشرات (KPI) حقيقية من الـAPI + نظرة عامة.
 */
export function DashboardPage() {
  const projects = useProjects({ per_page: 100 });
  const clients = useContacts({ type: 'client', per_page: 1 });
  const tasks = useTasks({});
  const invoices = useInvoices({ per_page: 100 });

  const projectList = projects.data?.data ?? [];
  const activeProjects = projectList.filter((p) => p.status === 'active').length;
  const clientsTotal = clients.data?.meta.total ?? 0;
  const taskList = tasks.data ?? [];
  const inProgress = taskList.filter((t) => t.status === 'in_progress').length;
  const invoiceList = invoices.data?.data ?? [];
  const outstanding = invoiceList.reduce((s, i) => s + Number(i.balance_kwd), 0);
  const overdueCount = invoiceList.filter((i) => i.is_overdue).length;

  const recent = [...projectList].slice(0, 5);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>لوحة التحكم</h1>

      {/* بطاقات المؤشرات */}
      <div className="kpi-grid">
        <KpiCard icon="🏗️" color="blue" label="مشاريع نشطة" value={activeProjects} sub={`${projectList.length} إجمالي`} />
        <KpiCard icon="👥" color="green" label="العملاء" value={clientsTotal} />
        <KpiCard icon="✅" color="orange" label="مهام قيد التنفيذ" value={inProgress} sub={`${taskList.length} إجمالي`} />
        <KpiCard
          icon="💰"
          color="red"
          label="مستحقات غير محصّلة"
          value={`${outstanding.toLocaleString('ar', { maximumFractionDigits: 3 })} د.ك`}
          sub={overdueCount ? `${overdueCount} فاتورة متأخرة` : undefined}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginTop: '20px' }}>
        {/* المهام حسب الحالة */}
        <div className="card" style={{ padding: '18px' }}>
          <h3 style={{ marginTop: 0 }}>المهام حسب الحالة</h3>
          {STATUS_ORDER.map((s) => {
            const count = taskList.filter((t) => t.status === s).length;
            const pct = taskList.length ? (count / taskList.length) * 100 : 0;
            return (
              <div key={s} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                  <span>{TASK_STATUS_LABELS[s]}</span>
                  <b>{count}</b>
                </div>
                <div style={{ height: '8px', background: '#EEF2F7', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: '#274A78', transition: 'width .3s ease' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* آخر المشاريع */}
        <div className="card" style={{ padding: '18px' }}>
          <h3 style={{ marginTop: 0 }}>آخر المشاريع</h3>
          {recent.length === 0 && <p style={{ opacity: 0.6 }}>لا توجد مشاريع.</p>}
          {recent.map((p) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
              <div>
                <b>{p.name}</b>
                <div style={{ fontSize: '12px', opacity: 0.6 }}>{p.code} · {p.client?.name ?? '—'}</div>
              </div>
              <span style={{ fontSize: '12px', padding: '2px 10px', borderRadius: '6px', background: `${PROJECT_STATUS_COLORS[p.status]}1a`, color: PROJECT_STATUS_COLORS[p.status] }}>
                {PROJECT_STATUS_LABELS[p.status]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
