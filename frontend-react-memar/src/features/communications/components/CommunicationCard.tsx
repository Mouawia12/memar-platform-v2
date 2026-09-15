import { type CSSProperties, type KeyboardEvent, useEffect, useRef, useState } from 'react';

import { CHANNEL_LABELS, CHANNEL_META, CONTACT_TYPE_LABELS, DIRECTION_LABELS, type Communication } from '../types';
import { avatarColor, digits, followUpState, initial, timeAgo, timeUntil } from '../utils';

interface Props {
  item: Communication;
  canManage: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onFollowUpDone: () => void;
}

export function Avatar({ name, channel, size }: { name: string; channel?: Communication['channel']; size?: 'lg' }) {
  return (
    <div className={`comms-avatar${size ? ` ${size}` : ''}`} style={{ '--av': avatarColor(name), '--ch': channel ? CHANNEL_META[channel].color : undefined } as CSSProperties} aria-hidden>
      {initial(name)}
      {channel && <span className="comms-avatar-ch"><i className={CHANNEL_META[channel].icon} /></span>}
    </div>
  );
}

export function FollowUpBadge({ item }: { item: Communication }) {
  const state = followUpState(item);
  if (state === 'none' || !item.follow_up_at) return null;
  const text = state === 'done' ? 'تمت المتابعة' : state === 'due' ? `متابعة مستحقة · ${timeAgo(item.follow_up_at)}` : `متابعة ${timeUntil(item.follow_up_at)}`;
  const icon = state === 'done' ? 'fa-circle-check' : 'fa-bell';
  return <span className={`comms-fu ${state}`}><i className={`fa-solid ${icon}`} />{text}</span>;
}

/** أزرار التواصل السريع — تظهر حسب ما يتوفر للجهة (رقم هاتف). */
export function QuickContactLinks({ phone, variant }: { phone: string | null; variant: 'icon' | 'button' }) {
  if (!phone) return null;
  const links: Array<{ href: string; label: string; color: string; icon: string; external?: boolean }> = [
    { href: `tel:${digits(phone)}`, label: 'اتصال', ...CHANNEL_META.phone },
    { href: `https://wa.me/${digits(phone)}`, label: 'واتساب', ...CHANNEL_META.whatsapp, external: true },
  ];
  return (
    <>
      {links.map((l) => (
        <a key={l.label} href={l.href} className={variant === 'icon' ? 'comms-icon-btn' : undefined} style={{ '--tone': l.color } as CSSProperties}
          title={l.label} aria-label={l.label} onClick={(e) => e.stopPropagation()}
          {...(l.external ? { target: '_blank', rel: 'noreferrer' } : {})}>
          <i className={l.icon} />{variant === 'button' && ` ${l.label}`}
        </a>
      ))}
    </>
  );
}

export function CommunicationCard({ item, canManage, onOpen, onEdit, onDelete, onFollowUpDone }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const meta = CHANNEL_META[item.channel];
  const fu = followUpState(item);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false); };
    const esc = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [menuOpen]);

  const onKey = (e: KeyboardEvent) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onOpen(); } };
  const menuAction = (fn: () => void) => (e: React.MouseEvent) => { e.stopPropagation(); setMenuOpen(false); fn(); };

  return (
    <li className="comms-card" style={{ '--ch': meta.color } as CSSProperties} role="button" tabIndex={0} onClick={onOpen} onKeyDown={onKey}
      aria-label={`${item.contact_name} — ${CHANNEL_LABELS[item.channel]}`}>
      <Avatar name={item.contact_name} channel={item.channel} />

      <div className="comms-main">
        <div className="comms-line1">
          <span className="comms-name">{item.linked?.name ?? item.contact_name}</span>
          <span className="comms-type">{CONTACT_TYPE_LABELS[item.contact_type] ?? item.contact_type}</span>
          <span className={`comms-dir ${item.direction}`}>{item.direction === 'inbound' ? '↙' : '↗'} {DIRECTION_LABELS[item.direction]}</span>
        </div>
        <div className="comms-subject">
          {item.subject ?? <span className="comms-body">{CHANNEL_LABELS[item.channel]}</span>}
          {item.body && <span className="comms-body"> — {item.body}</span>}
        </div>
        <div className="comms-meta">
          <span title={item.happened_at ? new Date(item.happened_at).toLocaleString('ar') : undefined}><i className="fa-regular fa-clock" />{timeAgo(item.happened_at)}</span>
          {item.logger && <span><i className="fa-regular fa-user" />سجّله {item.logger.name}</span>}
          <FollowUpBadge item={item} />
        </div>
      </div>

      <div className="comms-actions">
        <QuickContactLinks phone={item.phone} variant="icon" />
        {canManage && (
          <div className="comms-menu" ref={menuRef}>
            <button type="button" className="comms-icon-btn" aria-label="المزيد" aria-haspopup="menu" aria-expanded={menuOpen}
              onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}>
              <i className="fa-solid fa-ellipsis-vertical" />
            </button>
            {menuOpen && (
              <div className="comms-menu-list" role="menu">
                {(fu === 'due' || fu === 'upcoming') && (
                  <button type="button" role="menuitem" onClick={menuAction(onFollowUpDone)}><i className="fa-solid fa-circle-check" />تمت المتابعة</button>
                )}
                <button type="button" role="menuitem" onClick={menuAction(onEdit)}><i className="fa-solid fa-pen" />تعديل</button>
                <button type="button" role="menuitem" className="danger" onClick={menuAction(onDelete)}><i className="fa-solid fa-trash" />حذف</button>
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
