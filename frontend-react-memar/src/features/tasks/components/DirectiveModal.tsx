import { type CSSProperties } from 'react';

import { DirectiveThread } from './DirectiveThread';
import type { CardRef } from '../hooks/useCardActivity';

interface Props {
  /** البطاقة: مهمة أو متابعة — الخيط واحد والمسار يختلف. */
  card: CardRef;
  /** يبدأ توجيهًا جديدًا (الإدارة). */
  canSend: boolean;
  /** طرفٌ في الخيط: صاحب البطاقة أو مُرسِل التوجيه — يردّ ويردّ على الردّ. */
  canReply: boolean;
  onClose: () => void;
}

/**
 * نافذة خيط التوجيه (طلب أيمن 2026-08-29) — غلافٌ حول «DirectiveThread»
 * الذي يحمل المحادثة نفسها ويُستعمل كذلك داخل تفاصيل الفرصة.
 */
export function DirectiveModal({ card, canSend, canReply, onClose }: Props) {
  return (
    <div style={overlay} onClick={onClose}>
      <div className="card" style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={head}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: '16px' }}>📣 توجيهات البطاقة</h2>
            <div style={sub}>
              {card.code} · {card.title}
              {card.owner && <> · {card.ownerLabel ?? 'المكلَّف'}: <b style={{ color: '#334155' }}>{card.owner}</b></>}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق" style={closeBtn}>×</button>
        </div>

        <DirectiveThread card={card} canSend={canSend} canReply={canReply} />
      </div>
    </div>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(10,25,45,0.45)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', zIndex: 11000, padding: '20px' };
const modal: CSSProperties = { padding: '20px 22px', width: '100%', maxWidth: '520px', maxHeight: '88vh', overflow: 'auto' };
const head: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' };
const sub: CSSProperties = { fontSize: '12px', color: '#8A93A3', marginTop: '3px' };
const closeBtn: CSSProperties = { background: 'none', border: 'none', fontSize: '24px', lineHeight: 1, cursor: 'pointer', color: '#94A3B8', fontFamily: 'inherit' };
