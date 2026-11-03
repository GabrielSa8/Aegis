import React from 'react';
import { Clock } from 'lucide-react';

export default function GameCardFooterMeta({ playtimeStr, rating }) {
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
