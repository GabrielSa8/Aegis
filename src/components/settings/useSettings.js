import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';
import { applyUiScale } from './settingsHelpers';

export function useSettings({ onThemeChange }) {
  const [activeSection, setActiveSection] = useState('profile');
  const [config, setConfig] = useState(null);
  const [storageStats, setStorageStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null);
  const [purgeStatus, setPurgeStatus] = useState(null);

  // Formulario nuevo repositorio
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoPath, setNewRepoPath] = useState('');
  const [newRepoRole, setNewRepoRole] = useState('');
  const [newRepoWarning, setNewRepoWarning] = useState('');

  // Carga de configuración y estadísticas
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [cfg, stats] = await Promise.all([
        invoke('get_aegis_config').catch(() => null),
        invoke('get_storage_stats').catch(() => null)
      ]);
      setConfig(cfg);
      setStorageStats(stats);
    } catch (e) {
      console.error('Error cargando configuración:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Selección de tema
  const handleSelectTheme = useCallback(async (themeId) => {
    if (onThemeChange) {
      onThemeChange(themeId);
    }
    setConfig(prev => {
      if (!prev) return prev;
      const updated = { ...prev, theme: themeId };
      invoke('save_aegis_config', { config: updated }).catch((e) => {
        console.error('Error guardando tema:', e);
      });
      return updated;
    });
  }, [onThemeChange]);

  // Cambio de escala de interfaz (DPI armónico)
  const handleScaleChange = useCallback((scale) => {
    const s = Number(scale) || 1.0;
    applyUiScale(s);
    setConfig(prev => {
      if (!prev) return prev;
      const updated = { ...prev, uiScale: s };
      invoke('save_aegis_config', { config: updated }).catch(console.error);
      return updated;
    });
  }, []);

  // Guardar configuración completa
  const handleSaveConfig = useCallback(async () => {
    if (!config) return;
    try {
      const res = await invoke('save_aegis_config', { config });
      setConfig(res);
      setSaveStatus('Configuración soberana persistida con éxito.');
      setTimeout(() => setSaveStatus(null), 3500);
    } catch (e) {
      setSaveStatus(`Error guardando: ${e}`);
      setTimeout(() => setSaveStatus(null), 3500);
    }
  }, [config]);

  // Purgar cachés temporales
  const handlePurgeCaches = useCallback(async () => {
    try {
      const bytes = await invoke('purge_app_caches');
      const mb = (bytes / (1024 * 1024)).toFixed(2);
      setPurgeStatus(`Caché purgada: ${mb} MB liberados.`);
      loadData();
      setTimeout(() => setPurgeStatus(null), 3500);
    } catch (e) {
      setPurgeStatus(`Error: ${e}`);
      setTimeout(() => setPurgeStatus(null), 3500);
    }
  }, [loadData]);

  // Añadir repositorio
  const handleAddRepo = useCallback(() => {
    if (!newRepoName.trim() || !newRepoPath.trim()) return;
    const newRepo = {
      id: `repo_${Date.now()}`,
      name: newRepoName.trim(),
      path: newRepoPath.trim(),
      role: newRepoRole.trim() || 'Proyecto Local',
      warning: newRepoWarning.trim() || null
    };
    setConfig(prev => ({
      ...prev,
      gitRepos: [...(prev?.gitRepos || []), newRepo]
    }));
    setNewRepoName('');
    setNewRepoPath('');
    setNewRepoRole('');
    setNewRepoWarning('');
  }, [newRepoName, newRepoPath, newRepoRole, newRepoWarning]);

  // Eliminar repositorio
  const handleRemoveRepo = useCallback((id) => {
    setConfig(prev => ({
      ...prev,
      gitRepos: (prev?.gitRepos || []).filter(r => r.id !== id)
    }));
  }, []);

  // Enlace externo
  const handleOpenExternal = useCallback((url) => {
    openUrl(url).catch(() => window.open(url, '_blank'));
  }, []);

  // Mutadores directos de conveniencia
  const updateProfile = useCallback((profileUpdates) => {
    setConfig(prev => ({
      ...prev,
      profile: { ...(prev?.profile || {}), ...profileUpdates }
    }));
  }, []);

  const updateNotifications = useCallback((notifUpdates) => {
    setConfig(prev => ({
      ...prev,
      notifications: { ...(prev?.notifications || {}), ...notifUpdates }
    }));
  }, []);

  const updateTokenBudget = useCallback((budgetUpdates) => {
    setConfig(prev => ({
      ...prev,
      tokenBudget: { ...(prev?.tokenBudget || {}), ...budgetUpdates }
    }));
  }, []);

  return {
    activeSection,
    setActiveSection,
    config,
    setConfig,
    storageStats,
    loading,
    saveStatus,
    purgeStatus,
    newRepoName,
    setNewRepoName,
    newRepoPath,
    setNewRepoPath,
    newRepoRole,
    setNewRepoRole,
    newRepoWarning,
    setNewRepoWarning,
    handleSelectTheme,
    handleScaleChange,
    handleSaveConfig,
    handlePurgeCaches,
    handleAddRepo,
    handleRemoveRepo,
    handleOpenExternal,
    updateProfile,
    updateNotifications,
    updateTokenBudget
  };
}
