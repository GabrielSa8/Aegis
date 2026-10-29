import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function SystemAlertsBanner({ alerts }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {alerts.map((alt) => {
        const isDanger = alt.level === 'danger';
        const isWarning = alt.level === 'warning';
        const col = isDanger ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';
        const bg = isDanger ? 'rgba(239, 68, 68, 0.08)' : isWarning ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)';
        const bdr = isDanger ? 'rgba(239, 68, 68, 0.25)' : isWarning ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.2)';

        return (
          <div
            key={alt.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 12px',
              background: bg,
              border: `1px solid ${bdr}`,
              borderRadius: 'var(--radius-md)',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isDanger || isWarning ? <AlertTriangle size={14} color={col} /> : <CheckCircle2 size={14} color={col} />}
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: col }}>{alt.title}: </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{alt.message}</span>
              </div>
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {alt.timestamp}
            </span>
          </div>
        );
      })}
    </div>
  );
}
