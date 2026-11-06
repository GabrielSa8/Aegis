import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';
import { applyUiScale } from './settingsHelpers';

export function useSettings({ onThemeChange }) {
  const [activeSection, setActiveSection] = useState('general');
  const [config, setConfig] = useState(null);
  const [storageStats, setStorageStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null);
  const [purgeStatus, setPurgeStatus] = useState(null);

  // Referencia inmutable a la configuración guardada original
  const initialConfigRef = useRef(null);

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
      initialConfigRef.current = cfg ? JSON.parse(JSON.stringify(cfg)) : null;
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

  // Detección estricta de cambios sin guardar
  const isDirty = useMemo(() => {
    if (!config || !initialConfigRef.current) return false;
    return JSON.stringify(config) !== JSON.stringify(initialConfigRef.current);
  }, [config]);

  // Selección de tema: sólo actualiza borrador y previsualiza en DOM; NO persiste en disco
  const handleSelectTheme = useCallback((themeId) => {
    document.documentElement.setAttribute('data-theme', themeId);
    setConfig(prev => {
      if (!prev) return prev;
      return { ...prev, theme: themeId };
    });
  }, []);

  // Cambio de escala: sólo actualiza borrador y previsualiza; NO persiste en disco
  const handleScaleChange = useCallback((scale) => {
    const s = Number(scale) || 1.0;
    applyUiScale(s);
    setConfig(prev => {
      if (!prev) return prev;
      return { ...prev, uiScale: s };
    });
  }, []);

  // Descartar cambios y restaurar estado original guardado
  const handleDiscardChanges = useCallback(() => {
    if (!initialConfigRef.current) return;
    const restored = JSON.parse(JSON.stringify(initialConfigRef.current));
    setConfig(restored);
    if (restored.theme) {
      document.documentElement.setAttribute('data-theme', restored.theme);
    }
    applyUiScale(restored.uiScale || 1.0);
    setSaveStatus('Cambios descartados.');
    setTimeout(() => setSaveStatus(null), 2500);
  }, []);

  // Blindaje al desmontar: Si el usuario sale de Ajustes sin guardar, revertir DOM a valores guardados
  useEffect(() => {
    return () => {
      if (initialConfigRef.current) {
        if (initialConfigRef.current.theme) {
          document.documentElement.setAttribute('data-theme', initialConfigRef.current.theme);
        }
        applyUiScale(initialConfigRef.current.uiScale || 1.0);
      }
    };
  }, []);

  // Guardar configuración completa (Única vía oficial de persistencia)
  const handleSaveConfig = useCallback(async () => {
    if (!config) return;
    try {
      const res = await invoke('save_aegis_config', { config });
      setConfig(res);
      initialConfigRef.current = JSON.parse(JSON.stringify(res));

      // Aplicar formalmente cambios en el árbol global
      if (res.theme && onThemeChange) {
        onThemeChange(res.theme);
      }
      if (res.uiScale) {
        applyUiScale(res.uiScale);
      }
      if (res.enabledModules) {
        window.dispatchEvent(new CustomEvent('aegis:modules-changed', { detail: res.enabledModules }));
      }

      setSaveStatus('Configuración soberana persistida con éxito.');
      setTimeout(() => setSaveStatus(null), 3500);
    } catch (e) {
      setSaveStatus(`Error guardando: ${e}`);
      setTimeout(() => setSaveStatus(null), 3500);
    }
  }, [config, onThemeChange]);

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

  // Añadir repositorio (Borrador en memoria)
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

  // Eliminar repositorio (Borrador en memoria)
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

  // Mutadores directos de conveniencia (Borrador en memoria)
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
    isDirty,
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
    handleDiscardChanges,
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
