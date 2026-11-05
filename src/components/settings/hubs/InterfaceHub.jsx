import React from 'react';
import AppearanceSection from '../AppearanceSection';
import GamingSection from '../GamingSection';
import NotificationsSection from '../NotificationsSection';

export function InterfaceHub({
  config,
  setConfig,
  currentTheme,
  onSelectTheme,
  onScaleChange,
  updateNotifications
}) {
  if (!config) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      {/* 1. Apariencia y Escala */}
      <AppearanceSection
        config={config}
        currentTheme={currentTheme}
        onSelectTheme={onSelectTheme}
        onScaleChange={onScaleChange}
      />

      {/* 2. Grid de Gráficos / Gaming y Alertas Nativas */}
      <div className="settings-2col-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
        alignItems: 'start'
      }}>
        {/* Aceleración Gráfica & Modo Gaming */}
        <div style={{
          background: 'color-mix(in srgb, var(--bg-card) 40%, transparent)',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <GamingSection config={config} setConfig={setConfig} />
        </div>

        {/* Notificaciones y System Tray */}
        <div style={{
          background: 'color-mix(in srgb, var(--bg-card) 40%, transparent)',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <NotificationsSection
            config={config}
            setConfig={setConfig}
            updateNotifications={updateNotifications}
          />
        </div>
      </div>
    </div>
  );
}
export default InterfaceHub;
