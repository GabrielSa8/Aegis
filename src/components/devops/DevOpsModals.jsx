import React from 'react';
import { SkillManualModal } from './SkillManualModal';
import { RepoInspectorModal } from './RepoInspectorModal';
import { AddRepoModal } from './AddRepoModal';
import { RepoDeleteModal } from './RepoDeleteModal';
import { ModpackManagerModal } from './ModpackManagerModal';
import { InstallSkillModal } from './InstallSkillModal';
import { CreateContainerModal } from './daemons/CreateContainerModal';
import { ContainerLogsModal } from './daemons/ContainerLogsModal';

/**
 * DevOpsModals — Contenedor desacoplado de modales del ecosistema DevOps.
 * Recibe los hooks agrupados (devops, modpacks, daemons) y gestiona la presentación de diálogos.
 */
export function DevOpsModals({ devops, modpacks, daemons }) {
  return (
    <>
      {/* 📖 MODAL: Lector y Editor de Manual SKILL.md */}
      <SkillManualModal
        skill={devops.activeSkillModal}
        markdown={devops.skillMarkdown}
        loading={devops.loadingSkillMd}
        onClose={devops.handleCloseSkill}
        onSave={devops.handleSaveSkillMarkdown}
        onDelete={devops.handleDeleteSkill}
      />

      {/* 📦 MODAL: Gestor de Modpacks (Crear / Editar) */}
      <ModpackManagerModal
        isOpen={modpacks.isModpackModalOpen}
        onClose={modpacks.handleCloseModal}
        initialData={modpacks.editingModpack}
        availableSkills={devops.skills}
        onSave={modpacks.handleSaveModpack}
      />

      {/* 📥 MODAL: Instalar Skill del Ecosistema */}
      <InstallSkillModal
        isOpen={devops.isInstallSkillModalOpen}
        onClose={() => devops.setIsInstallSkillModalOpen(false)}
        onInstall={devops.handleInstallSkill}
        actionLoading={devops.actionLoading}
      />

      {/* ➕ MODAL: Gestor de Repositorios (Vincular / Crear) */}
      <AddRepoModal
        isOpen={devops.isAddRepoModalOpen}
        onClose={() => devops.setIsAddRepoModalOpen(false)}
        onAddExisting={devops.handleAddFleetRepo}
        onCreateNew={devops.handleCreateFleetRepo}
        actionLoading={devops.actionLoading}
      />

      {/* 🗑️ MODAL: Desvincular / Eliminar Repositorio */}
      <RepoDeleteModal
        isOpen={Boolean(devops.repoToDelete)}
        onClose={() => devops.setRepoToDelete(null)}
        repo={devops.repoToDelete}
        onConfirmDelete={devops.handleDeleteRepo}
        actionLoading={devops.actionLoading}
      />

      {/* 🔍 MODAL: Inspector de Repositorio en Vivo (Diff, Commits, Ramas, CI/CD, PRs) */}
      <RepoInspectorModal
        repo={devops.activeRepoInspector}
        repoDetails={devops.repoDetails}
        loading={devops.loadingRepoDetails}
        inspectorTab={devops.inspectorTab}
        onTabChange={devops.setInspectorTab}
        onClose={devops.handleCloseRepoInspector}
        onFetch={devops.handleFetchRepo}
        onPull={devops.handlePullRepo}
        onSwitchBranch={devops.handleSwitchBranch}
        onOpenInEditor={devops.handleOpenInEditor}
        copiedHash={devops.copiedHash}
        onCopyHash={devops.handleCopyHash}
        actionLoading={devops.actionLoading}
        showToast={devops.showToast}
      />

      {/* 🐳 MODAL: Crear Contenedor Podman/Docker */}
      <CreateContainerModal
        isOpen={daemons.isCreateContainerOpen}
        onClose={() => daemons.setIsCreateContainerOpen(false)}
        onCreate={daemons.handleCreateContainer}
        actionLoadingId={daemons.actionLoadingId}
      />

      {/* 📋 MODAL: Visor de Logs de Contenedor */}
      <ContainerLogsModal
        container={daemons.activeLogsContainer}
        logs={daemons.containerLogs}
        loading={daemons.loadingLogs}
        onClose={daemons.handleCloseLogs}
        onRefresh={daemons.handleRefreshLogs}
      />
    </>
  );
}
