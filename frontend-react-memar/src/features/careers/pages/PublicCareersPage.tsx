import { type FormEvent, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { apiErrorMessage } from '../../../lib/api';
import { careersApi } from '../api/careersApi';
import { EMPLOYMENT_LABELS, type JobOpening } from '../types';

const HERO_STATS = [
  { num: '+19', lbl: 'سنة خبرة' },
  { num: '+14', lbl: 'عضو في الفريق' },
  { num: '+500', lbl: 'مشروع منجز' },
];

/** صفحة التوظيف العامة (/jobs) — منقولة طبق الأصل عن careers.html. */
export function PublicCareersPage() {
  const { data } = useQuery({ queryKey: ['public-jobs'], queryFn: () => careersApi.publicList() });
  const jobs = useMemo(() => data ?? [], [data]);

  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');
  const [type, setType] = useState('');
  const [loc, setLoc] = useState('');
  const [applyJob, setApplyJob] = useState<JobOpening | null>(null);

  const depts = useMemo(() => [...new Set(jobs.map((j) => j.department).filter(Boolean))] as string[], [jobs]);
  const locs = useMemo(() => [...new Set(jobs.map((j) => j.location).filter(Boolean))] as string[], [jobs]);

  const filtered = jobs.filter((j) => {
    const s = search.trim().toLowerCase();
    if (s && !j.title.toLowerCase().includes(s) && !(j.description ?? '').toLowerCase().includes(s)) return false;
    if (dept && j.department !== dept) return false;
    if (type && j.employment_type !== type) return false;
    if (loc && j.location !== loc) return false;
    return true;
  });

  return (
    <div className="memar-careers">
      <style>{css}</style>

      {/* NAV */}
      <nav className="mc-nav">
        <Link to="/" className="mc-logo"><span className="mc-logo-icon">م</span><span>مجموعة معمار</span></Link>
        <div className="mc-links">
          <Link to="/">الرئيسية</Link>
          <Link to="/">الخدمات</Link>
          <Link to="/login">تسجيل الدخول</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="mc-hero">
        <h1>🚀 انضم إلى فريقنا</h1>
        <p>نبحث عن مواهب استثنائية تشاركنا شغف الهندسة والإبداع. بيئة عمل محفزة وفرص نمو حقيقية في واحد من أعرق المكاتب الهندسية بالكويت.</p>
        <div className="mc-hero-stats">
          {HERO_STATS.map((s) => <div key={s.lbl} className="mc-hero-stat"><div className="num">{s.num}</div><div className="lbl">{s.lbl}</div></div>)}
        </div>
      </section>

      {/* FILTERS */}
      <div className="mc-filters">
        <input className="mc-search" placeholder="🔍 ابحث عن وظيفة..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="mc-select" value={dept} onChange={(e) => setDept(e.target.value)}>
          <option value="">كل الأقسام</option>
          {depts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="mc-select" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">كل الأنواع</option>
          {(Object.keys(EMPLOYMENT_LABELS) as (keyof typeof EMPLOYMENT_LABELS)[]).map((k) => <option key={k} value={k}>{EMPLOYMENT_LABELS[k]}</option>)}
        </select>
        <select className="mc-select" value={loc} onChange={(e) => setLoc(e.target.value)}>
          <option value="">كل المواقع</option>
          {locs.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {/* JOBS */}
      <div className="mc-jobs">
        {filtered.length === 0 ? (
          <div className="mc-empty"><div className="ico">🔍</div><h3>لا توجد وظائف مطابقة</h3><p>جرب تغيير معايير البحث</p></div>
        ) : (
          <div className="mc-grid">
            {filtered.map((j) => (
              <div key={j.id} className="mc-card">
                {j.department && <div className="mc-dept">{j.department}</div>}
                <div className="mc-title">{j.title}</div>
                <div className="mc-meta">
                  <span>📋 {EMPLOYMENT_LABELS[j.employment_type]}</span>
                  {j.location && <span>📍 {j.location}</span>}
                  {j.salary_range && <span>💰 {j.salary_range}</span>}
                </div>
                <div className="mc-desc">{j.description ?? '—'}</div>
                <button className="mc-btn mc-btn-primary" type="button" onClick={() => setApplyJob(j)}>📤 تقديم الآن</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="mc-footer">© 2026 <Link to="/">مجموعة معمار للاستشارات الهندسية</Link> · الكويت</div>

      {applyJob && <ApplyModal job={applyJob} jobs={jobs} onClose={() => setApplyJob(null)} />}
    </div>
  );
}

function ApplyModal({ job, jobs, onClose }: { job: JobOpening; jobs: JobOpening[]; onClose: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [done, setDone] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cvName, setCvName] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) { alert('يرجى إدخال الاسم ورقم الهاتف'); return; }
    if (!formRef.current) return;

    const payload = new FormData(formRef.current);
    payload.append('job_opening_id', String(job.id));

    setSending(true);
    setError('');
    try {
      await careersApi.apply(payload);
      setDone(true);
    } catch (err) {
      setError(apiErrorMessage(err, 'تعذّر إرسال الطلب — حاول مرة أخرى.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mc-overlay open" onClick={onClose}>
      <div className="mc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mc-modal-head">
          <h2>تقديم طلب توظيف</h2>
          <button className="mc-modal-close" type="button" onClick={onClose}>✕</button>
        </div>
        <div className="mc-modal-body">
          {!done ? (
            <form ref={formRef} onSubmit={submit}>
              <div className="mc-badge">📌 التقديم على: {job.title}</div>
              <div className="mc-row">
                <div className="mc-fg"><label>الاسم الكامل *</label><input name="applicant_name" value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم الثلاثي" /></div>
                <div className="mc-fg"><label>رقم الهاتف *</label><input name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="5XXXXXXXX" dir="ltr" /></div>
              </div>
              <div className="mc-fg"><label>البريد الإلكتروني</label><input name="email" type="email" placeholder="example@email.com" dir="ltr" /></div>
              <div className="mc-row">
                <div className="mc-fg"><label>الوظيفة المطلوبة</label>
                  <select name="position" defaultValue={job.title}>{jobs.map((j) => <option key={j.id} value={j.title}>{j.title}</option>)}</select>
                </div>
                <div className="mc-fg"><label>سنوات الخبرة</label>
                  <select name="experience"><option>بدون خبرة</option><option>1-3 سنوات</option><option>3-5 سنوات</option><option>5-10 سنوات</option><option>+10 سنوات</option></select>
                </div>
              </div>
              <div className="mc-fg"><label>المهارات</label><input name="skills" placeholder="مثال: AutoCAD, Revit, 3D Max" /></div>
              <div className="mc-fg"><label>السيرة الذاتية (CV)</label>
                <div className="mc-file">
                  <input name="cv" type="file" accept=".pdf,.doc,.docx" onChange={(e) => setCvName(e.target.files?.[0]?.name ?? '')} />
                  <div className="icon">📄</div><div className="txt">اضغط لرفع الملف (PDF/Word)</div>
                  {cvName && <div className="txt">📎 {cvName}</div>}
                </div>
              </div>
              <div className="mc-fg"><label>رسالة تعريفية (اختياري)</label><textarea name="message" placeholder="اكتب نبذة عن نفسك وسبب اهتمامك بالوظيفة..." /></div>
              {error && <div style={{ color: '#DC4A3D', fontSize: '13px', marginBottom: '10px' }}>{error}</div>}
              <button className="mc-btn mc-btn-primary mc-btn-full" type="submit" disabled={sending}>{sending ? 'جارٍ الإرسال…' : '📤 إرسال الطلب'}</button>
            </form>
          ) : (
            <div className="mc-success">
              <div className="ico">✅</div>
              <h3>تم إرسال طلبك بنجاح!</h3>
              <p>سيقوم فريق الموارد البشرية بمراجعة طلبك والتواصل معك قريباً.</p>
              <br /><button className="mc-btn mc-btn-outline" type="button" onClick={onClose}>إغلاق</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const css = `
.memar-careers{--primary:#1A5A99;--primary-dark:#0D3B66;--primary-light:#EBF3FA;--accent:#F39C12;--bg:#F4F7F9;--text:#111827;--muted:#6B7280;--border:#E5E7EB;font-family:'Cairo',sans-serif;background:var(--bg);color:var(--text);direction:rtl;line-height:1.7;min-height:100vh}
.memar-careers *{box-sizing:border-box}
.memar-careers .mc-nav{position:sticky;top:0;z-index:100;background:rgba(255,255,255,.9);backdrop-filter:blur(16px);border-bottom:1px solid var(--border);padding:0 5%;display:flex;align-items:center;justify-content:space-between;height:68px}
.memar-careers .mc-logo{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:800;font-size:16px;color:var(--text)}
.memar-careers .mc-logo-icon{width:40px;height:40px;background:linear-gradient(135deg,var(--primary),var(--primary-dark));border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px;font-weight:800}
.memar-careers .mc-links{display:flex;gap:8px;align-items:center}
.memar-careers .mc-links a{text-decoration:none;font-size:13px;color:var(--muted);padding:8px 14px;border-radius:8px;font-weight:600;transition:all .3s}
.memar-careers .mc-links a:hover{color:var(--primary);background:var(--primary-light)}
.memar-careers .mc-hero{background:linear-gradient(135deg,var(--primary-dark) 0%,var(--primary) 60%,#2980B9 100%);padding:80px 5% 60px;text-align:center;color:#fff;position:relative;overflow:hidden}
.memar-careers .mc-hero::before{content:'';position:absolute;top:-50%;right:-20%;width:500px;height:500px;background:rgba(255,255,255,.04);border-radius:50%}
.memar-careers .mc-hero h1{font-size:clamp(28px,4vw,44px);font-weight:800;margin-bottom:16px}
.memar-careers .mc-hero p{font-size:17px;opacity:.9;max-width:600px;margin:0 auto 32px}
.memar-careers .mc-hero-stats{display:flex;justify-content:center;gap:40px;flex-wrap:wrap}
.memar-careers .mc-hero-stat .num{font-size:28px;font-weight:800}
.memar-careers .mc-hero-stat .lbl{font-size:12px;opacity:.8}
.memar-careers .mc-filters{max-width:1100px;margin:-30px auto 30px;padding:16px 24px;background:#fff;border-radius:14px;box-shadow:0 12px 32px rgba(0,0,0,.08);display:flex;gap:12px;flex-wrap:wrap;align-items:center;position:relative;z-index:10}
.memar-careers .mc-select{padding:8px 14px;border:1px solid var(--border);border-radius:8px;font-family:'Cairo';font-size:13px;font-weight:600;color:var(--text);background:#fff;outline:none;min-width:140px}
.memar-careers .mc-search{flex:1;min-width:200px;padding:8px 14px;border:1px solid var(--border);border-radius:8px;font-family:'Cairo';font-size:13px;outline:none}
.memar-careers .mc-select:focus,.memar-careers .mc-search:focus{border-color:var(--primary)}
.memar-careers .mc-jobs{max-width:1100px;margin:0 auto;padding:0 5% 60px}
.memar-careers .mc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px}
.memar-careers .mc-card{background:#fff;border:1px solid var(--border);border-radius:16px;padding:24px;transition:all .3s;position:relative;overflow:hidden}
.memar-careers .mc-card::before{content:'';position:absolute;top:0;right:0;left:0;height:4px;background:linear-gradient(90deg,var(--primary),var(--accent));transform:scaleX(0);transition:transform .3s;transform-origin:right}
.memar-careers .mc-card:hover{transform:translateY(-6px);box-shadow:0 12px 32px rgba(0,0,0,.08);border-color:transparent}
.memar-careers .mc-card:hover::before{transform:scaleX(1)}
.memar-careers .mc-dept{display:inline-block;background:var(--primary-light);color:var(--primary);font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;margin-bottom:12px}
.memar-careers .mc-title{font-size:18px;font-weight:800;color:var(--text);margin-bottom:8px}
.memar-careers .mc-meta{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px;font-size:12px;color:var(--muted);font-weight:600}
.memar-careers .mc-desc{font-size:13px;color:var(--muted);line-height:1.7;margin-bottom:16px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.memar-careers .mc-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 24px;border-radius:10px;font-family:'Cairo';font-weight:700;font-size:14px;cursor:pointer;transition:all .3s;text-decoration:none;border:none}
.memar-careers .mc-btn-primary{background:linear-gradient(135deg,var(--primary),var(--primary-dark));color:#fff;box-shadow:0 4px 14px rgba(26,90,153,.25)}
.memar-careers .mc-btn-primary:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(26,90,153,.35)}
.memar-careers .mc-btn-outline{background:transparent;color:var(--primary);border:1.5px solid var(--primary)}
.memar-careers .mc-btn-full{width:100%}
.memar-careers .mc-empty{text-align:center;padding:60px 20px;color:var(--muted)}
.memar-careers .mc-empty .ico{font-size:48px;margin-bottom:12px}
.memar-careers .mc-footer{background:var(--primary-dark);color:rgba(255,255,255,.7);text-align:center;padding:24px;font-size:12px}
.memar-careers .mc-footer a{color:var(--accent);text-decoration:none}
.memar-careers .mc-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px}
.memar-careers .mc-modal{background:#fff;border-radius:16px;width:100%;max-width:640px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.2)}
.memar-careers .mc-modal-head{padding:20px 24px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center}
.memar-careers .mc-modal-head h2{font-size:18px;font-weight:800}
.memar-careers .mc-modal-close{width:32px;height:32px;border-radius:8px;border:1px solid var(--border);background:#fff;cursor:pointer;font-size:16px}
.memar-careers .mc-modal-body{padding:24px}
.memar-careers .mc-badge{background:var(--primary-light);color:var(--primary);padding:10px 16px;border-radius:8px;font-size:13px;font-weight:700;margin-bottom:20px}
.memar-careers .mc-fg{margin-bottom:16px}
.memar-careers .mc-fg label{display:block;font-size:12px;font-weight:700;color:var(--text);margin-bottom:6px}
.memar-careers .mc-fg input,.memar-careers .mc-fg select,.memar-careers .mc-fg textarea{width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:8px;font-family:'Cairo';font-size:13px;outline:none}
.memar-careers .mc-fg input:focus,.memar-careers .mc-fg select:focus,.memar-careers .mc-fg textarea:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(26,90,153,.1)}
.memar-careers .mc-fg textarea{min-height:100px;resize:vertical}
.memar-careers .mc-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.memar-careers .mc-file{border:2px dashed var(--border);border-radius:10px;padding:20px;text-align:center;cursor:pointer;position:relative}
.memar-careers .mc-file:hover{border-color:var(--primary);background:var(--primary-light)}
.memar-careers .mc-file input{position:absolute;inset:0;opacity:0;cursor:pointer}
.memar-careers .mc-file .icon{font-size:28px;margin-bottom:6px}
.memar-careers .mc-file .txt{font-size:12px;color:var(--muted);font-weight:600}
.memar-careers .mc-success{text-align:center;padding:30px;background:#f0fdf4;border:1px solid #86efac;border-radius:12px}
.memar-careers .mc-success .ico{font-size:48px;margin-bottom:12px}
.memar-careers .mc-success h3{font-size:18px;font-weight:800;color:#16a34a;margin-bottom:8px}
.memar-careers .mc-success p{font-size:13px;color:var(--muted)}
@media(max-width:768px){.memar-careers .mc-filters{flex-direction:column}.memar-careers .mc-grid{grid-template-columns:1fr}.memar-careers .mc-row{grid-template-columns:1fr}.memar-careers .mc-hero-stats{gap:20px}}
`;
