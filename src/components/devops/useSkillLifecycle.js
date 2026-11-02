import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

/**
 * useSkillLifecycle — Custom Hook para el ciclo de vida de habilidades (CRUD, manuales, instalación).
 */
export function useSkillLifecycle({ showToast, onSkillsChanged }) {
  const [activeSkillModal, setActiveSkillModal] = useState(null);
  const [skillMarkdown, setSkillMarkdown] = useState('');
  const [loadingSkillMd, setLoadingSkillMd] = useState(false);
  const [isInstallSkillModalOpen, setIsInstallSkillModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const handleOpenSkill = useCallback(async (skill) => {
    setActiveSkillModal(skill);
    setLoadingSkillMd(true);
    try {
      const content = await invoke('read_skill_markdown', { skillId: skill.id });
      setSkillMarkdown(content);
    } catch (err) {
      console.error('Error leyendo manual SKILL.md:', err);
      setSkillMarkdown(`Error al leer manual: ${err}`);
    } finally {
      setLoadingSkillMd(false);
    }
  }, []);

  const handleCloseSkill = useCallback(() => {
    setActiveSkillModal(null);
    setSkillMarkdown('');
  }, []);

  const handleSaveSkillMarkdown = useCallback(async (skillId, content) => {
    try {
      await invoke('save_skill_markdown', { skillId, content });
      setSkillMarkdown(content);
      showToast('Manual SKILL.md actualizado con éxito');
    } catch (err) {
      console.error('Error guardando manual:', err);
      showToast(String(err), true);
      throw err;
    }
  }, [showToast]);

  const handleInstallSkill = useCallback(async (pkgName) => {
    setActionLoading('install-skill');
    try {
      const res = await invoke('install_agent_skill', { packageName: pkgName });
      showToast(res || 'Habilidad instalada');
      if (onSkillsChanged) await onSkillsChanged();
      return res;
    } catch (err) {
      console.error('Error instalando habilidad:', err);
      showToast(String(err), true);
      throw err;
    } finally {
      setActionLoading(null);
    }
  }, [showToast, onSkillsChanged]);

  const handleDeleteSkill = useCallback(async (skill) => {
    setActionLoading(`delete-skill-${skill.id}`);
    try {
      await invoke('delete_agent_skill', { skillId: skill.id });
      showToast(`Habilidad '${skill.name}' desinstalada`);
      if (activeSkillModal && activeSkillModal.id === skill.id) {
        handleCloseSkill();
      }
      if (onSkillsChanged) await onSkillsChanged();
    } catch (err) {
      console.error('Error eliminando habilidad:', err);
      showToast(String(err), true);
    } finally {
      setActionLoading(null);
    }
  }, [showToast, activeSkillModal, handleCloseSkill, onSkillsChanged]);

  return {
    activeSkillModal,
    skillMarkdown,
    loadingSkillMd,
    isInstallSkillModalOpen,
    setIsInstallSkillModalOpen,
    actionLoading,
    handleOpenSkill,
    handleCloseSkill,
    handleSaveSkillMarkdown,
    handleInstallSkill,
    handleDeleteSkill
  };
}
