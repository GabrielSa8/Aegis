import React, { useEffect } from 'react';
import { LayoutDashboard, FolderGit2, Activity, Sparkles, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { TacticalButton } from '../ui';

const DEVOPS_NAV_TABS = [
  { id: 'cockpit', label: 'Cockpit Mando', icon: LayoutDashboard, keyHint: '1' },
  { id: 'fleet', label: 'Flota Git', icon: FolderGit2, keyHint: '2' },
  { id: 'daemons', label: 'Daemons & Servicios', icon: Activity, keyHint: '3' },
  { id: 'skills', label: 'Arsenal & Modpacks', icon: Sparkles, keyHint: '4' }
];

/**
 * DevOpsNav — Barra táctica de sub-navegación para el radar DevOps.
 * Soporta atajos de teclado (1..4) y telemetría sintética en vivo.
 */
export function DevOpsNav({
  activeTab,
  onSelectTab,
  repoCount = 0,
  dirtyRepoCount = 0,
  skillCount = 0,
  modpackCount = 0,
  activeDaemonsCount = 0,
  onRefresh,
  refreshing = false
}) {
  // Atajos de teclado numéricos (1..4)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable) {
        return;
      }
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= DEVOPS_NAV_TABS.length) {
        e.preventDefault();
        onSelectTab(DEVOPS_NAV_TABS[num - 1].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelectTab]);

  return (
    <nav
      aria-label="Sub-navegación de DevOps"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingBottom: '0.45rem',
        borderBottom: '1px solid var(--border-color)',
        flexShrink: 0,
        gap: '8px',
        flexWrap: 'wrap'
      }}
    >
      {/* Pills de Sub-Pestañas */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {DEVOPS_NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          let countLabel = null;
          if (tab.id === 'fleet') countLabel = repoCount;
          if (tab.id === 'daemons') countLabel = activeDaemonsCount;
          if (tab.id === 'skills') countLabel = skillCount;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 9px',
                borderRadius: 'var(--radius-sm)',
                background: isActive
                  ? 'color-mix(in srgb, var(--primary) 18%, transparent)'
                  : 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
                border: isActive
                  ? '1px solid var(--primary)'
                  : '1px solid var(--border-color)',
                color: isActive ? 'var(--text-high)' : 'var(--text-muted)',
                fontSize: '0.73rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon
                size={13}
                style={{
                  color: isActive ? 'var(--primary)' : 'currentColor',
                  opacity: isActive ? 1 : 0.7
                }}
              />
              <span>{tab.label}</span>

              {countLabel !== null && (
                <span
                  style={{
                    fontSize: '0.62rem',
                    padding: '0 4px',
                    borderRadius: '8px',
                    background: isActive
                      ? 'color-mix(in srgb, var(--primary) 25%, transparent)'
                      : 'color-mix(in srgb, var(--border-color) 40%, transparent)',
                    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: 700
                  }}
                >
                  {countLabel}
                </span>
              )}

              <span
                style={{
                  fontSize: '0.58rem',
                  padding: '1px 3px',
                  borderRadius: '3px',
                  background: 'color-mix(in srgb, var(--text-muted) 15%, transparent)',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono, monospace)',
                  opacity: 0.75
                }}
              >
                {tab.keyHint}
              </span>
            </button>
          );
        })}
      </div>

      {/* Derecha: Estado de Salud & Refresco Global */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '0.68rem',
          padding: '2px 8px',
          borderRadius: 'var(--radius-sm)',
          background: dirtyRepoCount === 0
            ? 'color-mix(in srgb, var(--primary) 12%, transparent)'
            : 'color-mix(in srgb, var(--warning) 12%, transparent)',
          border: `1px solid ${dirtyRepoCount === 0 ? 'color-mix(in srgb, var(--primary) 30%, transparent)' : 'color-mix(in srgb, var(--warning) 30%, transparent)'}`,
          color: dirtyRepoCount === 0 ? 'var(--primary)' : 'var(--warning)',
          fontWeight: 600
        }}>
          {dirtyRepoCount === 0 ? (
            <>
              <CheckCircle2 size={11} />
              <span>Flota al día</span>
            </>
          ) : (
            <>
              <AlertCircle size={11} />
              <span>{dirtyRepoCount} repo(s) con cambios</span>
            </>
          )}
        </div>

        <TacticalButton
          variant="secondary"
          size="xs"
          icon={<RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />}
          onClick={onRefresh}
          disabled={refreshing}
          title="Refrescar estado de Git, Daemons y Skills (Ctrl+R)"
          style={{ width: '26px', height: '26px', padding: 0, justifyContent: 'center' }}
        />
      </div>
    </nav>
  );
}
