import { useEffect } from 'react';
import { History } from 'lucide-react';
import { FINANCES_SUBTABS } from './financesConstants';

export default function FinancesNav({
  subTab,
  onSelectSubTab,
  snapshotsCount,
  onOpenBackups
}) {
  // Atajos numéricos 1..6 cuando el foco no está en un input/textarea
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable) {
        return;
      }
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= FINANCES_SUBTABS.length) {
        e.preventDefault();
        onSelectSubTab(FINANCES_SUBTABS[num - 1].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelectSubTab]);

  return (
    <nav
      aria-label="Sub-navegación de Finanzas"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingBottom: '0.45rem',
        borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))',
        flexShrink: 0
      }}
    >
      {/* Pills de Sub-Pestañas */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {FINANCES_SUBTABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectSubTab(tab.id)}
              className={`finances-nav-pill ${isActive ? 'active' : ''}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm, 6px)',
                background: isActive 
                  ? 'color-mix(in srgb, var(--accent, var(--primary)) 18%, transparent)' 
                  : 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
                border: isActive 
                  ? '1px solid var(--accent, var(--primary))' 
                  : '1px solid var(--border-color, rgba(255,255,255,0.08))',
                color: isActive ? 'var(--text-high)' : 'var(--text-muted)',
                fontSize: '0.73rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon 
                size={13} 
                style={{ 
                  color: isActive ? 'var(--accent, var(--primary))' : 'currentColor',
                  opacity: isActive ? 1 : 0.7 
                }} 
              />
              <span>{tab.label}</span>
              <span 
                style={{
                  fontSize: '0.62rem',
                  padding: '1px 4px',
                  borderRadius: '3px',
                  background: 'color-mix(in srgb, var(--text-muted) 15%, transparent)',
                  color: 'var(--text-muted)',
                  fontFamily: 'JetBrains Mono, monospace',
                  opacity: 0.8
                }}
              >
                {tab.keyHint}
              </span>
            </button>
          );
        })}
      </div>

      {/* Botón de Respaldos a la Derecha */}
      <button
        type="button"
        onClick={onOpenBackups}
        className="cockpit-filter-pill"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 9px',
          borderRadius: 'var(--radius-sm, 6px)',
          background: 'transparent',
          border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
          color: 'var(--text-muted)',
          fontSize: '0.71rem',
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap'
        }}
        title="Copias de seguridad automáticas"
      >
        <History size={13} />
        <span>Respaldos ({snapshotsCount})</span>
      </button>
    </nav>
  );
}
