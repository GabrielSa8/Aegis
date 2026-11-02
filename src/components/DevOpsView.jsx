import React from 'react';
import { AlertCircle } from 'lucide-react';
import { 
  useDevOps, 
  useModpacks,
  useDevDaemons,
  DevOpsHeader, 
  GitFleetSection, 
  DevDaemonsSection,
  SkillsArsenalSection, 
  SkillManualModal, 
  RepoInspectorModal, 
  AddRepoModal,
  RepoDeleteModal,
  ModpackManagerModal,
  InstallSkillModal,
  CreateContainerModal,
  ContainerLogsModal,
  DevOpsToast 
} from './devops';

/**
 * DevOpsView — Radar DevOps, Flota Git y Arsenal de Habilidades.
 * Arquitectura modular de alta cohesión y bajo acoplamiento (Doctrina Aegis).
 */
export default function DevOpsView() {
  const {
    repos,
    skills,
    loading,
    refreshing,
    error,
    skillSearch,
    setSkillSearch,
    filteredSkills,
    activeSkillModal,
    skillMarkdown,
    loadingSkillMd,
    isInstallSkillModalOpen,
    setIsInstallSkillModalOpen,
    handleOpenSkill,
    handleCloseSkill,
    handleSaveSkillMarkdown,
    handleInstallSkill,
    handleDeleteSkill,
    activeRepoInspector,
    repoDetails,
    loadingRepoDetails,
    inspectorTab,
    setInspectorTab,
    actionLoading,
    toastMessage,
    copiedHash,
    isAddRepoModalOpen,
    setIsAddRepoModalOpen,
    fetchDevOpsData,
    handleOpenRepoInspector,
    handleCloseRepoInspector,
    handleFetchRepo,
    handlePullRepo,
    handleSwitchBranch,
    handleOpenInEditor,
    handleCopyHash,
    handleAddFleetRepo,
    repoToDelete,
    setRepoToDelete,
    handleDeleteRepo,
    handleCreateFleetRepo,
    showToast
  } = useDevOps();

  // Gestión de Modpacks / Meta-Skills
  const {
    modpacks,
    isModpackModalOpen,
    editingModpack,
    handleToggleMaster,
    handleToggleSubSkill,
    handleSaveModpack,
    handleDeleteModpack,
    handleActivateInAgent,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleCloseModal: handleCloseModpackModal
  } = useModpacks({ showToast });

  // Radar de Daemons y Servicios de Desarrollo (Fase 4.4)
  const {
    daemons,
    loading: loadingDaemons,
    refreshing: refreshingDaemons,
    actionLoadingId: daemonActionLoadingId,
    isCreateContainerOpen,
    setIsCreateContainerOpen,
    activeLogsContainer,
    containerLogs,
    loadingLogs,
    fetchDaemons,
    handleRestartAdb,
    handleToggleContainer,
    handleCreateContainer,
    handleDeleteContainer,
    handleOpenLogs,
    handleRefreshLogs,
    handleCloseLogs,
    handleStopProcess,
    handleOpenUrl
  } = useDevDaemons({ showToast });

  const handleGlobalRefresh = () => {
    fetchDevOpsData();
    fetchDaemons(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.85rem', overflowY: 'auto' }}>
      {/* 🧭 Barra Superior de Control DevOps */}
      <DevOpsHeader
        repoCount={repos.length}
        skillCount={skills.length}
        skillSearch={skillSearch}
        onSearchChange={setSkillSearch}
        onRefresh={handleGlobalRefresh}
        refreshing={refreshing || refreshingDaemons}
      />

      {/* ⚠️ Mensaje de error si falla */}
      {error && (
        <div style={{
          padding: '0.6rem 0.85rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: 'var(--radius-md)',
          color: '#f87171',
          fontSize: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={14} />
          <span>Error escaneando entorno DevOps: {error}</span>
        </div>
      )}

      {/* 🚢 Flota de Repositorios Locales (Live Git Fleet) */}
      <GitFleetSection
        repos={repos}
        loading={loading}
        onInspect={handleOpenRepoInspector}
        onFetch={handleFetchRepo}
        onPull={handlePullRepo}
        onOpenInEditor={handleOpenInEditor}
        onRequestDelete={setRepoToDelete}
        onOpenAddModal={() => setIsAddRepoModalOpen(true)}
        actionLoading={actionLoading}
      />

      {/* 📡 Radar de Daemons y Servicios de Desarrollo (Fase 4.4) */}
      <DevDaemonsSection
        daemons={daemons}
        loading={loadingDaemons}
        refreshing={refreshingDaemons}
        actionLoadingId={daemonActionLoadingId}
        onRefresh={fetchDaemons}
        onRestartAdb={handleRestartAdb}
        onToggleContainer={handleToggleContainer}
        onOpenCreateContainer={() => setIsCreateContainerOpen(true)}
        onViewContainerLogs={handleOpenLogs}
        onDeleteContainer={handleDeleteContainer}
        onStopProcess={handleStopProcess}
        onOpenUrl={handleOpenUrl}
      />

      {/* ⚡ Arsenal Activo & Modpacks (~/.agents/skills/) */}
      <SkillsArsenalSection
        skills={filteredSkills}
        modpacks={modpacks}
        skillSearch={skillSearch}
        onOpenSkill={handleOpenSkill}
        onDeleteSkill={handleDeleteSkill}
        onToggleModpackMaster={handleToggleMaster}
        onToggleModpackSubSkill={handleToggleSubSkill}
        onActivateModpackInAgent={handleActivateInAgent}
        onOpenInstallModal={() => setIsInstallSkillModalOpen(true)}
        onOpenCreateModpackModal={handleOpenCreateModal}
        onEditModpack={handleOpenEditModal}
        onDeleteModpack={handleDeleteModpack}
      />

      {/* 📖 MODAL: Lector y Editor de Manual SKILL.md */}
      <SkillManualModal
        skill={activeSkillModal}
        markdown={skillMarkdown}
        loading={loadingSkillMd}
        onClose={handleCloseSkill}
        onSave={handleSaveSkillMarkdown}
        onDelete={handleDeleteSkill}
      />

      {/* 📦 MODAL: Gestor de Modpacks (Crear / Editar) */}
      <ModpackManagerModal
        isOpen={isModpackModalOpen}
        onClose={handleCloseModpackModal}
        initialData={editingModpack}
        availableSkills={skills}
        onSave={handleSaveModpack}
      />

      {/* 📥 MODAL: Instalar Skill del Ecosistema */}
      <InstallSkillModal
        isOpen={isInstallSkillModalOpen}
        onClose={() => setIsInstallSkillModalOpen(false)}
        onInstall={handleInstallSkill}
        actionLoading={actionLoading}
      />

      {/* ➕ MODAL: Gestor de Repositorios (Vincular / Crear) */}
      <AddRepoModal
        isOpen={isAddRepoModalOpen}
        onClose={() => setIsAddRepoModalOpen(false)}
        onAddExisting={handleAddFleetRepo}
        onCreateNew={handleCreateFleetRepo}
        actionLoading={actionLoading}
      />

      {/* 🗑️ MODAL: Desvincular / Eliminar Repositorio */}
      <RepoDeleteModal
        isOpen={Boolean(repoToDelete)}
        onClose={() => setRepoToDelete(null)}
        repo={repoToDelete}
        onConfirmDelete={handleDeleteRepo}
        actionLoading={actionLoading}
      />

      {/* 🔍 MODAL: Inspector de Repositorio en Vivo (Diff, Commits, Ramas, CI/CD, PRs) */}
      <RepoInspectorModal
        repo={activeRepoInspector}
        repoDetails={repoDetails}
        loading={loadingRepoDetails}
        inspectorTab={inspectorTab}
        onTabChange={setInspectorTab}
        onClose={handleCloseRepoInspector}
        onFetch={handleFetchRepo}
        onPull={handlePullRepo}
        onSwitchBranch={handleSwitchBranch}
        onOpenInEditor={handleOpenInEditor}
        copiedHash={copiedHash}
        onCopyHash={handleCopyHash}
        actionLoading={actionLoading}
        showToast={showToast}
      />

      {/* 🐳 MODAL: Crear Contenedor Podman/Docker */}
      <CreateContainerModal
        isOpen={isCreateContainerOpen}
        onClose={() => setIsCreateContainerOpen(false)}
        onCreate={handleCreateContainer}
        actionLoadingId={daemonActionLoadingId}
      />

      {/* 📋 MODAL: Visor de Logs de Contenedor */}
      <ContainerLogsModal
        container={activeLogsContainer}
        logs={containerLogs}
        loading={loadingLogs}
        onClose={handleCloseLogs}
        onRefresh={handleRefreshLogs}
      />

      {/* 🔔 Toast Flotante de Notificaciones */}
      <DevOpsToast toast={toastMessage} />
    </div>
  );
}
