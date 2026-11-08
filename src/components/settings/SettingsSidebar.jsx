import { ShieldCheck } from 'lucide-react';
import { MACRO_HUBS } from './settingsHelpers';

export default function SettingsSidebar({ activeSection, onSelectSection, searchQuery = '' }) {
  const query = searchQuery.trim().toLowerCase();
  const visibleHubs = query
    ? MACRO_HUBS.filter((hub) =>
        hub.label.toLowerCase().includes(query) ||
        (hub.desc && hub.desc.toLowerCase().includes(query)) ||
        (hub.keywords && hub.keywords.toLowerCase().includes(query))
      )
    : MACRO_HUBS;

  return (
    <div className="settings-sidebar" style={{
      width: '15.5rem',
      borderRight: '1px solid var(--border-color)',
      background: 'color-mix(in srgb, var(--bg-card) 45%, transparent)',
      padding: '0.75rem 0.6rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.4rem',
      flexShrink: 0,
      overflowY: 'auto'
    }}>
      <div className="settings-sidebar-header" style={{ padding: '0 4px 6px 4px', borderBottom: '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)' }}>
        <span style={{ fontSize: '0.66rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Macro-Hubs de Ajustes
        </span>
      </div>

      <div className="settings-sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {visibleHubs.length === 0 ? (
          <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
            Sin hubs coincidentes con "{searchQuery}"
          </div>
        ) : (
          visibleHubs.map((hub) => {
            const Icon = hub.icon;
            const isActive = activeSection === hub.id;
            return (
              <button
                key={hub.id}
                onClick={() => onSelectSection(hub.id)}
                className={`settings-nav-item ${isActive ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '9px 10px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive
                    ? 'color-mix(in srgb, var(--primary) 15%, transparent)'
                    : 'color-mix(in srgb, var(--bg-main) 30%, transparent)',
                  border: isActive
                    ? '1px solid color-mix(in srgb, var(--primary) 40%, transparent)'
                    : '1px solid color-mix(in srgb, var(--border-color) 30%, transparent)',
                  color: isActive ? 'var(--text-high)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                <div style={{
                  padding: '5px',
                  borderRadius: 'var(--radius-sm)',
                  background: isActive
                    ? 'var(--primary)'
                    : 'color-mix(in srgb, var(--text-muted) 12%, transparent)',
                  color: isActive ? 'var(--bg-main)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '1px'
                }}>
                  <Icon size={14} />
                </div>

                <div className="settings-nav-label-box" style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: isActive ? 800 : 600, color: isActive ? 'var(--text-high)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {hub.label}
                    </span>
                    <span className="settings-nav-badge" style={{
                      fontSize: '0.58rem',
                      fontFamily: 'var(--font-mono)',
                      color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                      background: isActive ? 'color-mix(in srgb, var(--primary) 18%, transparent)' : 'transparent',
                      padding: '1px 4px',
                      borderRadius: '3px',
                      fontWeight: 700
                    }}>
                      {hub.badge}
                    </span>
                  </div>
                  <span className="settings-nav-desc" style={{ fontSize: '0.64rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px', lineHeight: '1.2' }}>
                    {hub.desc}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="settings-sidebar-footer" style={{
        marginTop: 'auto',
        padding: '10px 4px 2px 4px',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.66rem' }}>
          <ShieldCheck size={13} color="var(--primary)" />
          <span style={{ fontWeight: 600 }}>Cero Hardcode · 100% Local</span>
        </div>
        <span style={{ fontSize: '0.6rem', color: 'color-mix(in srgb, var(--text-muted) 70%, transparent)' }}>
          4 Hubs Consolidados · Full Bleed UI
        </span>
      </div>
    </div>
  );
}
