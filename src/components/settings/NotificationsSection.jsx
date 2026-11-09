import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { NOTIFICATION_DEFINITIONS } from './settingsHelpers';
import TacticalButton from '../ui/TacticalButton';
import { Bell, Monitor, CheckCircle2, ShieldAlert, Volume2, VolumeX } from 'lucide-react';
import { soundService } from '../../utils/soundService';

export default function NotificationsSection({ config, setConfig, updateNotifications }) {
  const [testStatus, setTestStatus] = useState(null);
  const [testing, setTesting] = useState(false);

  if (!config) return null;
  const notifications = config.notifications || {};
  const closeToTray = config.closeToTray ?? true;
  const startMinimized = config.startMinimized ?? false;
  const soundEnabled = notifications.soundEnabled ?? true;
  const soundVolume = notifications.soundVolume ?? 0.5;

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '0.88rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-high)' }}>
            Bandeja del Sistema (Tray) & Notificaciones Nativas
          </h3>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
            Configura el comportamiento silente en segundo plano (~25MB RAM) y los disparadores de avisos del SO.
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
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)',
          background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
          border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <CheckCircle2 size={14} />
          <span>{testStatus}</span>
        </div>
      )}

      {/* Grid de 2 Columnas Tácticas */}
      <div className="settings-2col-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '16px',
        alignItems: 'start'
      }}>
        {/* Columna Izquierda: Comportamiento System Tray */}
        <div style={{
          background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
          padding: '14px 16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Monitor size={15} color="var(--primary)" />
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-high)' }}>
              Comportamiento del System Tray
            </span>
          </div>

          <div
            onClick={() => setConfig && setConfig({ ...config, closeToTray: !closeToTray })}
            className={`tactical-option-row ${closeToTray ? 'active' : ''}`}
          >
            <div style={{ paddingRight: '1rem', flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: closeToTray ? 'var(--text-high)' : 'var(--text-muted)', display: 'block' }}>
                Minimizar a la Bandeja al cerrar ventana
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                Al pulsar cerrar o Alt+F4, la app se oculta en el System Tray manteniendo activos los monitores sin consumir CPU.
              </span>
            </div>
            <div className="tactical-switch" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={closeToTray}
                onChange={(e) => setConfig && setConfig({ ...config, closeToTray: e.target.checked })}
              />
            </div>
          </div>

          <div
            onClick={() => setConfig && setConfig({ ...config, startMinimized: !startMinimized })}
            className={`tactical-option-row ${startMinimized ? 'active' : ''}`}
          >
            <div style={{ paddingRight: '1rem', flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: startMinimized ? 'var(--text-high)' : 'var(--text-muted)', display: 'block' }}>
                Iniciar Aegis minimizado en segundo plano
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                Al arrancar con el SO, Aegis permanece silente en la bandeja hasta que abras el cockpit.
              </span>
            </div>
            <div className="tactical-switch" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={startMinimized}
                onChange={(e) => setConfig && setConfig({ ...config, startMinimized: e.target.checked })}
              />
            </div>
          </div>

          {/* Sección de Audio Táctico Sintetizado */}
          <div style={{
            marginTop: '8px',
            paddingTop: '10px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {soundEnabled ? <Volume2 size={15} color="var(--primary)" /> : <VolumeX size={15} color="var(--text-muted)" />}
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-high)' }}>
                  Efectos Sonoros y Chimes Tácticos
                </span>
              </div>
              <TacticalButton
                variant="ghost"
                size="xs"
                onClick={() => {
                  soundService.configure({ enabled: true, volume: soundVolume });
                  soundService.playSuccess();
                }}
              >
                Probar
              </TacticalButton>
            </div>

            <div
              onClick={() => {
                const next = !soundEnabled;
                updateNotifications({ soundEnabled: next });
                soundService.configure({ enabled: next, volume: soundVolume });
              }}
              className={`tactical-option-row ${soundEnabled ? 'active' : ''}`}
            >
              <div style={{ paddingRight: '1rem', flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: soundEnabled ? 'var(--text-high)' : 'var(--text-muted)', display: 'block' }}>
                  Sonidos de Alertas y Tareas
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Chimes sutiles sintetizados con Web Audio API (cero assets) al resolver tareas o recibir alertas.
                </span>
              </div>
              <div className="tactical-switch" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => {
                    updateNotifications({ soundEnabled: e.target.checked });
                    soundService.configure({ enabled: e.target.checked, volume: soundVolume });
                  }}
                />
              </div>
            </div>

            {soundEnabled && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                background: 'color-mix(in srgb, var(--primary) 6%, transparent)',
                border: '1px solid color-mix(in srgb, var(--primary) 15%, transparent)'
              }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', minWidth: '55px' }}>
                  Volumen: {Math.round(soundVolume * 100)}%
                </span>
                <input
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.05"
                  value={soundVolume}
                  onChange={(e) => {
                    const vol = parseFloat(e.target.value);
                    updateNotifications({ soundVolume: vol });
                    soundService.configure({ enabled: true, volume: vol });
                  }}
                  style={{
                    flex: 1,
                    accentColor: 'var(--primary)',
                    cursor: 'pointer'
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Alertas Preventivas de Escritorio */}
        <div style={{
          background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
          padding: '14px 16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldAlert size={15} color="var(--primary)" />
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-high)' }}>
              Disparadores de Alertas Nativas
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {NOTIFICATION_DEFINITIONS.map((notif) => {
              const isChecked = notifications[notif.id] ?? true;
              return (
                <div
                  key={notif.id}
                  onClick={() => updateNotifications({ [notif.id]: !isChecked })}
                  className={`tactical-option-row ${isChecked ? 'active' : ''}`}
                >
                  <div style={{ paddingRight: '1rem', flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isChecked ? 'var(--text-high)' : 'var(--text-muted)', display: 'block' }}>
                      {notif.title}
                    </span>
                    <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>
                      {notif.desc}
                    </span>
                  </div>
                  <div className="tactical-switch" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => updateNotifications({ [notif.id]: e.target.checked })}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
