import type { CSSProperties } from 'react';

import { CHANNEL_LABELS, CHANNEL_META, type CommunicationStats } from '../types';

interface Props {
  stats: CommunicationStats | undefined;
  dueActive: boolean;
  onToggleDue: () => void;
}

const tone = (color: string) => ({ '--tone': color }) as CSSProperties;

export function CommunicationStatsStrip({ stats, dueActive, onToggleDue }: Props) {
  if (!stats) {
    return (
      <div className="comms-stats" aria-hidden>
        {[0, 1, 2, 3].map((i) => <div key={i} className="comms-skel" style={{ height: 72, borderRadius: 14 }} />)}
      </div>
    );
  }

  const top = stats.top_channel;

  return (
    <div className="comms-stats">
      <div className="comms-stat" style={tone('#274A78')}>
        <div className="comms-stat-icon"><i className="fa-solid fa-calendar-day" /></div>
        <div>
          <div className="comms-stat-value">{stats.today}</div>
          <div className="comms-stat-label">تواصل اليوم</div>
        </div>
      </div>

      <button type="button" className={`comms-stat${dueActive ? ' on' : ''}`} style={tone(stats.follow_up_due > 0 ? '#DC2626' : '#059669')}
        onClick={onToggleDue} aria-pressed={dueActive} title="عرض المتابعات المستحقة فقط">
        <div className="comms-stat-icon"><i className="fa-solid fa-bell" /></div>
        <div>
          <div className="comms-stat-value">{stats.follow_up_due}</div>
          <div className="comms-stat-label">متابعات مستحقة</div>
          {stats.my_follow_up_due > 0 && <div className="comms-stat-sub">منها {stats.my_follow_up_due} لك</div>}
        </div>
      </button>

      <div className="comms-stat" style={tone('#0369A1')}>
        <div className="comms-stat-icon"><i className="fa-solid fa-arrow-right-arrow-left" /></div>
        <div>
          <div className="comms-stat-value">{stats.week_inbound + stats.week_outbound}</div>
          <div className="comms-stat-label">هذا الأسبوع</div>
          <div className="comms-stat-sub">↙ {stats.week_inbound} وارد · ↗ {stats.week_outbound} صادر</div>
        </div>
      </div>

      <div className="comms-stat" style={tone(top ? CHANNEL_META[top.channel].color : '#64748B')}>
        <div className="comms-stat-icon"><i className={top ? CHANNEL_META[top.channel].icon : 'fa-solid fa-chart-simple'} /></div>
        <div>
          <div className="comms-stat-value">{top ? CHANNEL_LABELS[top.channel] : '—'}</div>
          <div className="comms-stat-label">القناة الأكثر استخدامًا</div>
          {top && <div className="comms-stat-sub">{top.count} تواصل خلال 30 يومًا</div>}
        </div>
      </div>
    </div>
  );
}
