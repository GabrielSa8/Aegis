import { NOTIFICATION_DEFINITIONS } from './settingsHelpers';

export default function NotificationsSection({ config, updateNotifications }) {
  if (!config) return null;
  const notifications = config.notifications || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '720px' }}>
      <div>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 4px 0', color: '#fff' }}>
          Centro de Notificaciones Nativas del SO
        </h3>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
          Activa alertas preventivas de escritorio para eventos críticos sin saturación sensorial.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {NOTIFICATION_DEFINITIONS.map(notif => {
          const isChecked = notifications[notif.id] ?? true;
          return (
            <label
              key={notif.id}
              className={`tactical-option-row ${isChecked ? 'active' : ''}`}
            >
              <div style={{ paddingRight: '1rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isChecked ? '#fff' : 'var(--text-high)', display: 'block' }}>
                  {notif.title}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {notif.desc}
                </span>
              </div>
              <div className="tactical-switch">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => updateNotifications({ [notif.id]: e.target.checked })}
                />
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
