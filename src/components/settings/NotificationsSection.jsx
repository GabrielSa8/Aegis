import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { NOTIFICATION_DEFINITIONS } from './settingsHelpers';
import TacticalButton from '../ui/TacticalButton';
import { Bell, Monitor, CheckCircle2 } from 'lucide-react';

export default function NotificationsSection({ config, setConfig, updateNotifications }) {
  const [testStatus, setTestStatus] = useState(null);
  const [testing, setTesting] = useState(false);

  if (!config) return null;
  const notifications = config.notifications || {};
  const closeToTray = config.closeToTray ?? true;
  const startMinimized = config.startMinimized ?? false;

  const handleTestNotification = async () => {
    try {
      setTesting(true);
      await invoke('send_desktop_notification', {
        title: '🛡️ Aegis Core Online',
        body: 'Notificación nativa del SO verificada. Centro de Mando enlazado con éxito.',
        notificationType: null
      });
      setTestStatus('¡Notificación enviada al sistema operativo!');
      setTimeout(() => setTestStatus(null), 3500);
    } catch (e) {
      setTestStatus(`Error: ${e}`);
      setTimeout(() => setTestStatus(null), 4000);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '720px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 4px 0', color: '#fff' }}>
            Bandeja del Sistema (Tray) & Notificaciones Nativas
          </h3>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
            Configura el comportamiento en segundo plano (~25MB RAM) y alertas preventivas de escritorio.
          </p>
        </div>

        <TacticalButton
          variant="outline"
          size="sm"
          icon={Bell}
          loading={testing}
          onClick={handleTestNotification}
        >
          Probar Notificación
        </TacticalButton>
      </div>

      {testStatus && (
        <div style={{
          fontSize: '0.72rem',
          padding: '6px 10px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(16, 185, 129, 0.1)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <CheckCircle2 size={14} />
          <span>{testStatus}</span>
        </div>
      )}

      {/* Comportamiento System Tray */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Comportamiento del System Tray
        </span>

        <label className={`tactical-option-row ${closeToTray ? 'active' : ''}`}>
          <div style={{ paddingRight: '1rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: closeToTray ? '#fff' : 'var(--text-high)', display: 'block' }}>
              Minimizar a la Bandeja al cerrar ventana
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Al pulsar cerrar o Alt+F4, la ventana se oculta en el System Tray manteniendo activos los monitores sin consumir CPU.
            </span>
          </div>
          <div className="tactical-switch">
            <input
              type="checkbox"
              checked={closeToTray}
              onChange={(e) => setConfig && setConfig({ ...config, closeToTray: e.target.checked })}
            />
          </div>
        </label>

        <label className={`tactical-option-row ${startMinimized ? 'active' : ''}`}>
          <div style={{ paddingRight: '1rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: startMinimized ? '#fff' : 'var(--text-high)', display: 'block' }}>
              Iniciar Aegis minimizado en segundo plano
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Al arrancar con el sistema operativo, Aegis permanece silente en la bandeja hasta que hagas clic en su icono.
            </span>
          </div>
          <div className="tactical-switch">
            <input
              type="checkbox"
              checked={startMinimized}
              onChange={(e) => setConfig && setConfig({ ...config, startMinimized: e.target.checked })}
            />
          </div>
        </label>
      </div>

      {/* Filtros de Alertas Preventivas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Alertas Preventivas de Escritorio
        </span>

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
