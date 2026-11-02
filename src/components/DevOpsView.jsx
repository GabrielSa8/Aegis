import React from 'react';
import { AlertCircle } from 'lucide-react';
import { 
  useDevOps, 
  DevOpsHeader, 
  GitFleetSection, 
  SkillsArsenalSection, 
  SkillManualModal, 
  RepoInspectorModal, 
  AddRepoModal,
  RepoDeleteModal,
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
    handleOpenSkill,
    handleCloseSkill,
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.85rem', overflowY: 'auto' }}>
      {/* 🧭 Barra Superior de Control DevOps */}
      <DevOpsHeader
        repoCount={repos.length}
        skillCount={skills.length}
        skillSearch={skillSearch}
        onSearchChange={setSkillSearch}
        onRefresh={fetchDevOpsData}
        refreshing={refreshing}
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

      {/* ⚡ Arsenal Activo (~/.agents/skills/) */}
      <SkillsArsenalSection
        skills={filteredSkills}
        skillSearch={skillSearch}
        onOpenSkill={handleOpenSkill}
      />

      {/* 📖 MODAL: Lector de Manual SKILL.md */}
      <SkillManualModal
        skill={activeSkillModal}
        markdown={skillMarkdown}
        loading={loadingSkillMd}
        onClose={handleCloseSkill}
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

      {/* 🔔 Toast Flotante de Notificaciones */}
      <DevOpsToast toast={toastMessage} />
    </div>
  );
}
