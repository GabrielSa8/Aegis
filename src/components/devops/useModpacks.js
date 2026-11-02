import { useState, useCallback } from 'react';
import { loadStoredModpacks, saveStoredModpacks } from './devopsHelpers';

/**
 * useModpacks — Custom Hook para gestionar Meta-Skills y Modpacks.
 * Aísla la persistencia, conmutación maestro/sub-skills y sincronización con el Agente IA.
 */
export function useModpacks({ showToast }) {
  const [modpacks, setModpacks] = useState(() => loadStoredModpacks());
  const [isModpackModalOpen, setIsModpackModalOpen] = useState(false);
  const [editingModpack, setEditingModpack] = useState(null);

  // Toggle Rey Maestro
  const handleToggleMaster = useCallback((modpackId) => {
    setModpacks((prev) => {
      const updated = prev.map((m) =>
        m.id === modpackId ? { ...m, enabled: !m.enabled } : m
      );
      saveStoredModpacks(updated);
      return updated;
    });
  }, []);

  // Toggle de Sub-Skill individual
  const handleToggleSubSkill = useCallback((modpackId, skillId) => {
    setModpacks((prev) => {
      const updated = prev.map((m) => {
        if (m.id !== modpackId) return m;
        const disabled = m.disabledSubSkills || [];
        const nextDisabled = disabled.includes(skillId)
          ? disabled.filter((s) => s !== skillId)
          : [...disabled, skillId];
        return { ...m, disabledSubSkills: nextDisabled };
      });
      saveStoredModpacks(updated);
      return updated;
    });
  }, []);

  // Guardar (crear o editar)
  const handleSaveModpack = useCallback((modpackData) => {
    setModpacks((prev) => {
      const idx = prev.findIndex((m) => m.id === modpackData.id);
      const updated = idx >= 0
        ? prev.map((m) => (m.id === modpackData.id ? modpackData : m))
        : [modpackData, ...prev];
      saveStoredModpacks(updated);
      return updated;
    });
    showToast(`Modpack '${modpackData.name}' guardado`);
  }, [showToast]);

  // Eliminar modpack personalizado
  const handleDeleteModpack = useCallback((modpackId) => {
    setModpacks((prev) => {
      const updated = prev.filter((m) => m.id !== modpackId);
      saveStoredModpacks(updated);
      return updated;
    });
    showToast('Modpack eliminado');
  }, [showToast]);

  // Sincronizar y activar en Pestaña 1 (Agente IA)
  const handleActivateInAgent = useCallback((modpack) => {
    const disabled = modpack.disabledSubSkills || [];
    const activeSkills = modpack.skills.filter((s) => !disabled.includes(s));

    localStorage.setItem('aegis_active_skills', JSON.stringify(activeSkills));
    localStorage.setItem('aegis_active_modpack', modpack.name);

    // Evento reactivo global para inyección en el prompt del Agente
    window.dispatchEvent(
      new CustomEvent('aegis:modpack-activated', {
        detail: { modpackName: modpack.name, skills: activeSkills }
      })
    );

    showToast(`Modpack '${modpack.name}' inyectado en Agente (${activeSkills.length} skills)`);
  }, [showToast]);

  const handleOpenCreateModal = useCallback(() => {
    setEditingModpack(null);
    setIsModpackModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((modpack) => {
    setEditingModpack(modpack);
    setIsModpackModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setEditingModpack(null);
    setIsModpackModalOpen(false);
  }, []);

  return {
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
    handleCloseModal
  };
}
