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
    <nav aria-label="Sub-navegación de DevOps" className="devops-nav">
      {/* Pills de Sub-Pestañas */}
      <div className="devops-nav-tabs">
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
              className={`devops-nav-tab-btn ${isActive ? 'is-active' : ''}`}
            >
              <Icon
                size={13}
                style={{
                  color: isActive ? 'var(--primary)' : 'currentColor',
                  opacity: isActive ? 1 : 0.7
                }}
              />
              <span className="devops-nav-tab-label">{tab.label}</span>

              {countLabel !== null && (
                <span className="devops-nav-tab-count">
                  {countLabel}
                </span>
              )}

              <span className="devops-nav-tab-hint">
                {tab.keyHint}
              </span>
            </button>
          );
        })}
      </div>

      {/* Derecha: Estado de Salud & Refresco Global */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div className={`devops-nav-status ${dirtyRepoCount === 0 ? 'is-clean' : 'is-dirty'}`}>
          {dirtyRepoCount === 0 ? (
            <>
              <CheckCircle2 size={11} />
              <span className="devops-nav-status-text">Flota al día</span>
            </>
          ) : (
            <>
              <AlertCircle size={11} />
              <span className="devops-nav-status-text">{dirtyRepoCount} con cambios</span>
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
