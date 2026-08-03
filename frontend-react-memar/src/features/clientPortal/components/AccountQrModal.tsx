import { useEffect, useState, type CSSProperties } from 'react';
import QRCode from 'qrcode';

interface Props {
  accountNumber: string;
  clientName?: string | null;
  onClose: () => void;
}

/**
 * بطاقة الرقم الشخصي مع QR Code (اجتماع 2026-08-03، بند 6).
 * الرقم الشخصي MEE-YYYY-NNN ثابت — بخلاف كود الخصم/الإحالة المتغيّر (يُدار في «اقترحنا لصديق»).
 * يُولَّد الـ QR محليًا في المتصفّح (لا يُرسَل الرقم لأي خدمة خارجية).
 */
export function AccountQrModal({ accountNumber, clientName, onClose }: Props) {
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(accountNumber, { margin: 1, width: 320, color: { dark: '#0D4A7A', light: '#ffffff' } })
      .then((url) => { if (alive) setQr(url); })
      .catch(() => { if (alive) setQr(''); });

    return () => { alive = false; };
  }, [accountNumber]);

  const copy = () => {
    navigator.clipboard?.writeText(accountNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => undefined);
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={card} onClick={(e) => e.stopPropagation()}>
        <button style={closeBtn} onClick={onClose} title="إغلاق"><i className="fas fa-xmark" /></button>
        <div style={{ textAlign: 'center' }}>
          <div style={brand}><i className="fas fa-id-card" /> رقم الحساب الشخصي</div>
          {clientName && <div style={nameLine}>{clientName}</div>}
          <div style={qrBox}>
            {qr ? <img src={qr} alt={`QR ${accountNumber}`} style={{ width: 220, height: 220 }} /> : <div style={{ width: 220, height: 220, display: 'grid', placeItems: 'center', color: '#94A3B8' }}>…</div>}
          </div>
          <div style={numberLine} dir="ltr">{accountNumber}</div>
          <button style={copyBtn} onClick={copy}><i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`} /> {copied ? 'تم النسخ' : 'نسخ الرقم'}</button>
          <p style={hint}>هذا رقمك الشخصي الثابت لدى مجموعة معمار. كود الخصم/الإحالة منفصل ومتغيّر — تجده في «اقترحنا لصديق».</p>
        </div>
      </div>
    </div>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'grid', placeItems: 'center', zIndex: 80, padding: '20px' };
const card: CSSProperties = { position: 'relative', background: '#fff', borderRadius: 18, padding: '28px 26px', width: 'min(360px, 100%)', boxShadow: '0 20px 45px rgba(0,0,0,0.25)' };
const closeBtn: CSSProperties = { position: 'absolute', top: 14, insetInlineStart: 14, border: 'none', background: '#F1F5F9', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', color: '#334155' };
const brand: CSSProperties = { fontWeight: 800, color: '#0D4A7A', fontSize: 15, marginBottom: 6 };
const nameLine: CSSProperties = { fontSize: 13, color: '#64748B', marginBottom: 14 };
const qrBox: CSSProperties = { display: 'grid', placeItems: 'center', padding: 12, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, width: 244, height: 244, margin: '0 auto' };
const numberLine: CSSProperties = { marginTop: 16, fontSize: 22, fontWeight: 800, letterSpacing: '1px', color: '#0F172A' };
const copyBtn: CSSProperties = { marginTop: 12, border: '1px solid #1B6CA8', background: '#EBF5FF', color: '#0D4A7A', fontWeight: 700, borderRadius: 10, padding: '8px 18px', cursor: 'pointer', fontSize: 13 };
const hint: CSSProperties = { marginTop: 16, fontSize: 11.5, color: '#64748B', lineHeight: 1.7 };
