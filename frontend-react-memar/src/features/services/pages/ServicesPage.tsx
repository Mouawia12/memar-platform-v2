import { useMemo, useState, type CSSProperties } from 'react';

import { rowOffset } from '../../../lib/rowNumber';
import { usePermission } from '../../auth/hooks/usePermission';
import { QuotationFormModal } from '../../quotations/components/QuotationFormModal';
import { ServiceFormModal } from '../components/ServiceFormModal';
import { ServicesTable } from '../components/ServicesTable';
import { useDeleteService, useServiceStats, useServices } from '../hooks/useServices';
import { categoryColor, type Service } from '../types';

/**
 * الخدمات والأسعار (إعادة تصميم — طلب أيمن 2026-09-14): مؤشّرات أعلى الصفحة،
 * ثم قائمة الخدمات مصنَّفةً بلونها، وفلترٌ بالتصنيف، ومنها يُنشأ عرض السعر.
 */
export function ServicesPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  // بوّابة الإجراءات: إضافة/تعديل/حذف = pricing.manage (لا توجد صلاحية pricing.delete). طلب أيمن 2026-08-12.
  const canManage = usePermission('pricing.manage');

  const { data, isLoading, isError } = useServices({
    search: search || undefined,
    category: category === 'all' ? undefined : category,
    page,
  });
  const { data: stats } = useServiceStats();
  const del = useDeleteService();

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (s: Service) => { setEditing(s); setModalOpen(true); };
  const handleDelete = (s: Service) => { if (confirm(`حذف "${s.name}"؟`)) del.mutate(s.id); };

  // تصنيفات الصفحة المعروضة — يكفي لملء الفلتر بلا نداءٍ ثانٍ للخادم
  const categories = useMemo(
    () => [...new Set((data?.data ?? []).map((s) => s.category).filter((c): c is string => !!c))].sort(),
    [data],
  );

  const meta = data?.meta;

  return (
    <div>
      <div style={headRow}>
        <div>
          <h1 style={{ margin: 0 }}>الخدمات والأسعار</h1>
          <p style={sub}>قاعدة بيانات الخدمات الهندسية — التصنيف والتسعير</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {canManage && <button className="btn btn-primary" onClick={openCreate} type="button">+ خدمة جديدة</button>}
          {canManage && <button className="btn" onClick={() => setQuoteOpen(true)} type="button" style={outlineBtn}>📋 عرض سعر</button>}
        </div>
      </div>

      {/* مؤشّرات الصفحة — كلّها من بياناتٍ حقيقية لا أرقام عرض */}
      <div style={kpiRow}>
        <Kpi icon="💼" tone="#1B6CA8" label="إجمالي الخدمات" value={stats?.services_count ?? '—'} hint="خدمة مسعّرة ونشطة" />
        <Kpi icon="📋" tone="#7C3AED" label="عروض الأسعار" value={stats?.quotations_this_year ?? '—'} hint="هذا العام" />
        <Kpi
          icon="✅"
          tone="#2D9B6F"
          label="نسبة القبول"
          value={stats ? `${stats.acceptance_rate}%` : '—'}
          hint={stats ? `من ${stats.quotations_sent} عرضًا مُرسَلًا` : 'من العروض المرسلة'}
        />
        <Kpi icon="🏷️" tone="#E8A838" label="التصنيفات" value={stats?.categories_count ?? '—'} hint="تصنيف مستعمَل" />
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <div style={listHead}>
          <div>
            <b style={{ fontSize: '15px', color: '#0F2A4A' }}>قائمة الخدمات</b>
            <div style={{ fontSize: '12px', color: '#8A93A6', marginTop: '2px' }}>جميع الخدمات المسعّرة حسب التصنيف</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input
              className="input"
              placeholder="بحث باسم الخدمة…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ width: '220px' }}
            />
            {/* فلتر التصنيف — ألوانه نفسها التي على البطاقات في الجدول */}
            <select
              className="input"
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              style={{ width: '170px', color: category === 'all' ? undefined : categoryColor(category), fontWeight: 700 }}
            >
              <option value="all">جميع التصنيفات</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {isLoading && <p>جارٍ التحميل…</p>}
        {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل الخدمات.</p>}
        {data && <ServicesTable services={data.data} onEdit={openEdit} onDelete={handleDelete} canManage={canManage} canDelete={canManage} rowOffset={rowOffset(meta)} />}

        {meta && meta.last_page > 1 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '14px' }}>
            <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} type="button">السابق</button>
            <span style={{ fontSize: '13px', opacity: 0.7 }}>صفحة {meta.current_page} من {meta.last_page} ({meta.total})</span>
            <button className="btn btn-sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} type="button">التالي</button>
          </div>
        )}
      </div>

      {modalOpen && <ServiceFormModal service={editing} onClose={() => setModalOpen(false)} />}
      {quoteOpen && <QuotationFormModal quotationId={null} onClose={() => setQuoteOpen(false)} />}
    </div>
  );
}

/** بطاقة مؤشّر واحدة — الرقم أوّل ما تقع عليه العين، والتفسير تحته. */
function Kpi({ icon, tone, label, value, hint }: { icon: string; tone: string; label: string; value: number | string; hint: string }) {
  return (
    <div className="card" style={kpiCard}>
      <div style={{ ...kpiIcon, background: `${tone}14`, color: tone }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '12.5px', color: '#7A8394', fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: '26px', fontWeight: 900, color: '#0F2A4A', lineHeight: 1.25 }}>{value}</div>
        <div style={{ fontSize: '11.5px', color: '#A0A8B8' }}>{hint}</div>
      </div>
    </div>
  );
}

const headRow: CSSProperties = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' };
const sub: CSSProperties = { margin: '4px 0 0', fontSize: '13px', color: '#8A93A6' };
const outlineBtn: CSSProperties = { border: '1.5px solid #1B6CA8', color: '#1B6CA8', background: '#fff', fontWeight: 700 };
const kpiRow: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px', marginBottom: '16px' };
const kpiCard: CSSProperties = { padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' };
const kpiIcon: CSSProperties = { width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 };
const listHead: CSSProperties = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' };
