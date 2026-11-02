import React from 'react';
import { CockpitGitPanel } from './cockpit/CockpitGitPanel';
import { CockpitDaemonsPanel } from './cockpit/CockpitDaemonsPanel';
import { CockpitSkillsPanel } from './cockpit/CockpitSkillsPanel';

/**
 * DevOpsCockpitView — Tablero integral de mando DevOps en 3 columnas de alta densidad.
 * Ensambla los paneles atómicos CockpitGitPanel, CockpitDaemonsPanel y CockpitSkillsPanel.
 * Aprovecha el 100% del espacio útil sin scroll kilométrico ni componentes gigantes.
 */
export function DevOpsCockpitView({
  repos = [],
  daemons,
  skills = [],
  modpacks = [],
  onNavigateTab,
  onInspectRepo,
  onFetchRepo,
  onPullRepo,
  onToggleContainer,
  onOpenContainerLogs,
  onRestartAdb,
  onStopProcess,
  onOpenUrl,
  onToggleModpackMaster,
  onActivateModpackInAgent,
  onOpenInstallSkillModal,
  onOpenAddRepoModal,
  actionLoading,
  daemonActionLoadingId
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '0.75rem',
      flex: 1,
      minHeight: 0,
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* 🚢 PANEL 1: FLOTA GIT RESUMIDA */}
      <CockpitGitPanel
        repos={repos}
        onNavigateTab={onNavigateTab}
        onInspectRepo={onInspectRepo}
        onFetchRepo={onFetchRepo}
        onPullRepo={onPullRepo}
        actionLoading={actionLoading}
      />

      {/* 📡 PANEL 2: DAEMONS, CONTENEDORES Y PUERTOS DEV */}
      <CockpitDaemonsPanel
        daemons={daemons}
        onNavigateTab={onNavigateTab}
        onRestartAdb={onRestartAdb}
        onToggleContainer={onToggleContainer}
        onOpenUrl={onOpenUrl}
        daemonActionLoadingId={daemonActionLoadingId}
      />

      {/* ⚡ PANEL 3: MODPACKS & SKILLS ACTIVAS */}
      <CockpitSkillsPanel
        skills={skills}
        modpacks={modpacks}
        onNavigateTab={onNavigateTab}
        onToggleModpackMaster={onToggleModpackMaster}
        onOpenInstallSkillModal={onOpenInstallSkillModal}
      />
    </div>
  );
}
