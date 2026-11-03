import React from 'react';
import { Clock, Trophy } from 'lucide-react';

export default function GameCardFooterMeta({ playtimeStr, achUnlocked, achTotal, rating }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
      {playtimeStr && (
        <span style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          fontSize: '0.6rem',
          fontWeight: 700,
          color: 'var(--primary)',
          background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
          padding: '1px 4px',
          borderRadius: 'var(--radius-sm)'
        }}>
          <Clock size={9} />
          {playtimeStr}
        </span>
      )}

      {achTotal > 0 ? (
        <span style={{
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          fontSize: '0.62rem',
          fontWeight: 800,
          color: achUnlocked === achTotal ? 'var(--primary)' : 'var(--accent)',
          background: achUnlocked === achTotal
            ? 'color-mix(in srgb, var(--primary) 15%, transparent)'
            : 'color-mix(in srgb, var(--accent) 12%, transparent)',
          padding: '1px 5px',
          borderRadius: 'var(--radius-sm)',
          border: `1px solid ${achUnlocked === achTotal ? 'var(--primary)' : 'color-mix(in srgb, var(--accent) 25%, transparent)'}`
        }}>
          <Trophy size={9} />
          {achUnlocked}/{achTotal}
        </span>
      ) : (
        <span style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          fontSize: '0.58rem',
          color: 'var(--text-muted)',
          opacity: 0.6
        }}>
          <Trophy size={8} />
          0
        </span>
      )}

      {rating > 0 && (
        <span style={{
          fontSize: '0.6rem',
          fontWeight: 700,
          color: 'var(--warning)',
          background: 'color-mix(in srgb, var(--warning) 12%, transparent)',
          padding: '1px 4px',
          borderRadius: 'var(--radius-sm)'
        }}>
          ⭐ {rating}
        </span>
      )}
    </div>
  );
}
