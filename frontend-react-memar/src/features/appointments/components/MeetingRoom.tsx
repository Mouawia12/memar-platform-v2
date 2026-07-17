import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  room: string;
  title: string;
  displayName?: string;
  onClose: () => void;
}

/** غرفة اجتماع فيديو مدمجة داخل المنصة (Jitsi عبر iframe). */
export function MeetingRoom({ room, title, displayName, onClose }: Props) {
  const src = `https://meet.jit.si/${room}#config.prejoinPageEnabled=false&userInfo.displayName=%22${encodeURIComponent(displayName ?? 'مستخدم معمار')}%22`;

  return createPortal(
    <div style={overlay}>
      <div style={bar}>
        <span style={{ fontWeight: 700 }}>📹 {title}</span>
        <button type="button" className="btn btn-sm" onClick={onClose} style={{ background: '#DC2626', color: '#fff' }}>إنهاء ومغادرة</button>
      </div>
      <iframe
        title="اجتماع فيديو"
        src={src}
        allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
        style={{ flex: 1, width: '100%', border: 'none' }}
      />
    </div>,
    document.body,
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: '#0f172a', zIndex: 100000, display: 'flex', flexDirection: 'column' };
const bar: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px', background: '#274A78', color: '#fff' };
