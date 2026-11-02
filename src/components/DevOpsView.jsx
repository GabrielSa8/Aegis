import React, { useState, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { 
  useDevOps, 
  useModpacks,
  useDevDaemons,
  DevOpsNav,
  DevOpsCockpitView,
  GitFleetSection, 
  DevDaemonsSection,
  SkillsArsenalSection, 
  DevOpsModals,
  DevOpsToast 
} from './devops';

/**
 * DevOpsView — Radar DevOps, Flota Git y Arsenal de Habilidades.
 * Arquitectura modular de alta cohesión y bajo acoplamiento (Doctrina Aegis).
 * Aprovechamiento al 100% del espacio con sub-vistas tácticas y Cockpit integrado.
 */
export default function DevOpsView() {
  const [subTab, setSubTab] = useState(() => {
    try {
      return localStorage.getItem('aegis_devops_subtab') || 'fleet';
    } catch {
      return 'fleet';
    }
  });

  const handleSelectSubTab = (tab) => {
    setSubTab(tab);
    try {
      localStorage.setItem('aegis_devops_subtab', tab);
    } catch {}
  };

  const devops = useDevOps();
  const modpacks = useModpacks({ showToast: devops.showToast });
  const daemons = useDevDaemons({ showToast: devops.showToast });

  const dirtyRepoCount = useMemo(() => devops.repos.filter(r => !r.is_clean).length, [devops.repos]);

  const activeDaemonsCount = useMemo(() => {
    const adbOnline = daemons.daemons?.adb?.server_running ? 1 : 0;
    const containersActive = (daemons.daemons?.containers || []).filter(c => c.state === 'running').length;
    const portsActive = (daemons.daemons?.listening_ports || []).filter(p => !p.is_system).length;
    return adbOnline + containersActive + portsActive;
  }, [daemons.daemons]);

  const handleGlobalRefresh = () => {
    devops.fetchDevOpsData();
    daemons.fetchDaemons(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', gap: '0.65rem', overflow: 'hidden' }}>
      {/* 🧭 Barra Táctica de Navegación DevOps */}
      <DevOpsNav
        activeTab={subTab}
        onSelectTab={handleSelectSubTab}
        repoCount={devops.repos.length}
        dirtyRepoCount={dirtyRepoCount}
        skillCount={devops.skills.length}
        modpackCount={modpacks.modpacks.length}
        activeDaemonsCount={activeDaemonsCount}
        onRefresh={handleGlobalRefresh}
        refreshing={devops.refreshing || daemons.refreshing}
      />

      {/* ⚠️ Mensaje de error si falla */}
      {devops.error && (
        <div style={{
          padding: '0.5rem 0.85rem',
          background: 'color-mix(in srgb, var(--warning) 12%, transparent)',
          border: '1px solid color-mix(in srgb, var(--warning) 30%, transparent)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--warning)',
          fontSize: '0.73rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0
        }}>
          <AlertCircle size={14} />
          <span>Error escaneando entorno DevOps: {devops.error}</span>
        </div>
      )}

      {/* 🚀 Contenedor Flexible de Sub-Vistas (100% Pantalla Útil) */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* 🧭 VISTA 1: COCKPIT MANDO INTEGRAL */}
        {subTab === 'cockpit' && (
          <DevOpsCockpitView
            repos={devops.repos}
            daemons={daemons.daemons}
            skills={devops.skills}
            modpacks={modpacks.modpacks}
            onNavigateTab={handleSelectSubTab}
            onInspectRepo={devops.handleOpenRepoInspector}
            onFetchRepo={devops.handleFetchRepo}
            onPullRepo={devops.handlePullRepo}
            onToggleContainer={daemons.handleToggleContainer}
            onOpenContainerLogs={daemons.handleOpenLogs}
            onRestartAdb={daemons.handleRestartAdb}
            onStopProcess={daemons.handleStopProcess}
            onOpenUrl={daemons.handleOpenUrl}
            onToggleModpackMaster={modpacks.handleToggleMaster}
            onActivateModpackInAgent={modpacks.handleActivateInAgent}
            onOpenInstallSkillModal={() => devops.setIsInstallSkillModalOpen(true)}
            onOpenAddRepoModal={() => devops.setIsAddRepoModalOpen(true)}
            actionLoading={devops.actionLoading}
            daemonActionLoadingId={daemons.actionLoadingId}
          />
        )}

        {/* 🚢 VISTA 2: FLOTA GIT COMPLETA */}
        {subTab === 'fleet' && (
          <GitFleetSection
            repos={devops.repos}
            loading={devops.loading}
            onInspect={devops.handleOpenRepoInspector}
            onFetch={devops.handleFetchRepo}
            onPull={devops.handlePullRepo}
            onOpenInEditor={devops.handleOpenInEditor}
            onRequestDelete={devops.setRepoToDelete}
            onOpenAddModal={() => devops.setIsAddRepoModalOpen(true)}
            actionLoading={devops.actionLoading}
            fillHeight={true}
          />
        )}

        {/* 📡 VISTA 3: DAEMONS Y SERVICIOS DEV */}
        {subTab === 'daemons' && (
          <DevDaemonsSection
            daemons={daemons.daemons}
            loading={daemons.loading}
            refreshing={daemons.refreshing}
            actionLoadingId={daemons.actionLoadingId}
            onRefresh={daemons.fetchDaemons}
            onRestartAdb={daemons.handleRestartAdb}
            onToggleContainer={daemons.handleToggleContainer}
            onOpenCreateContainer={() => daemons.setIsCreateContainerOpen(true)}
            onViewContainerLogs={daemons.handleOpenLogs}
            onDeleteContainer={daemons.handleDeleteContainer}
            onStopProcess={daemons.handleStopProcess}
            onOpenUrl={daemons.handleOpenUrl}
            fillHeight={true}
          />
        )}

        {/* ⚡ VISTA 4: ARSENAL DE SKILLS Y MODPACKS */}
        {subTab === 'skills' && (
          <SkillsArsenalSection
            skills={devops.filteredSkills}
            modpacks={modpacks.modpacks}
            skillSearch={devops.skillSearch}
            onOpenSkill={devops.handleOpenSkill}
            onDeleteSkill={devops.handleDeleteSkill}
            onToggleModpackMaster={modpacks.handleToggleMaster}
            onToggleModpackSubSkill={modpacks.handleToggleSubSkill}
            onActivateModpackInAgent={modpacks.handleActivateInAgent}
            onOpenInstallModal={() => devops.setIsInstallSkillModalOpen(true)}
            onOpenCreateModpackModal={modpacks.handleOpenCreateModal}
            onEditModpack={modpacks.handleOpenEditModal}
            onDeleteModpack={modpacks.handleDeleteModpack}
            fillHeight={true}
          />
        )}
      </div>

      {/* 🧩 Conjunto de Modales Desacoplados del Ecosistema DevOps */}
      <DevOpsModals
        devops={devops}
        modpacks={modpacks}
        daemons={daemons}
      />

      {/* 🔔 Toast Flotante de Notificaciones */}
      <DevOpsToast toast={devops.toastMessage} />
    </div>
  );
}
