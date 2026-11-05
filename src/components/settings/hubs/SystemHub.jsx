import React, { useState } from 'react';
import { HardDrive, Lock, Radio, Puzzle } from 'lucide-react';
import StorageSection from '../StorageSection';
import SecuritySettingsSection from '../security/SecuritySettingsSection';
import P2pSyncSection from '../p2p/P2pSyncSection';
import TelegramGatewaySection from '../gateway/TelegramGatewaySection';
import PluginsSection from '../PluginsSection';

const SUB_TABS = [
  { id: 'storage', label: 'Almacenamiento & Backup', icon: HardDrive },
  { id: 'security', label: 'Seguridad & Cifrado', icon: Lock },
  { id: 'network', label: 'Conectividad (P2P & Telegram)', icon: Radio },
  { id: 'plugins', label: 'Plugins & Módulos', icon: Puzzle }
];

export function SystemHub({
  config,
  setConfig,
  storageStats,
  purgeStatus,
  onPurgeCaches,
  security
}) {
  const [activeSubTab, setActiveSubTab] = useState('storage');

  if (!config) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%' }}>
      {/* Sub-navegación Táctica de Sistema */}
      <div className="settings-subtabs-bar" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '8px',
        overflowX: 'auto'
      }}>
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`settings-subtab-btn ${isActive ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                background: isActive
                  ? 'color-mix(in srgb, var(--primary) 15%, transparent)'
                  : 'color-mix(in srgb, var(--bg-card) 40%, transparent)',
                border: isActive
                  ? '1px solid var(--primary)'
                  : '1px solid var(--border-color)',
                color: isActive ? 'var(--text-high)' : 'var(--text-muted)',
                fontSize: '0.74rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={13} color={isActive ? 'var(--primary)' : 'var(--text-muted)'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contenido según Sub-Tab activo */}
      {activeSubTab === 'storage' && (
        <StorageSection
          config={config}
          setConfig={setConfig}
          storageStats={storageStats}
          purgeStatus={purgeStatus}
          onPurgeCaches={onPurgeCaches}
        />
      )}

      {activeSubTab === 'security' && security && (
        <SecuritySettingsSection
          security={security}
          onLockVault={security.lockVault}
        />
      )}

      {activeSubTab === 'network' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <P2pSyncSection />
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <TelegramGatewaySection />
          </div>
        </div>
      )}

      {activeSubTab === 'plugins' && (
        <PluginsSection config={config} setConfig={setConfig} />
      )}
    </div>
  );
}
export default SystemHub;
