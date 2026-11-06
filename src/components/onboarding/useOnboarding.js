import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function useOnboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [inspection, setInspection] = useState(null);
  const [loadingInspection, setLoadingInspection] = useState(true);
  const [creatingVault, setCreatingVault] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Datos del formulario
  const [operatorName, setOperatorName] = useState('Gabriel');
  const [operatorRole, setOperatorRole] = useState('Ingeniero de Software');
  const [responseStyle, setResponseStyle] = useState('caveman');
  const [selectedTheme, setSelectedTheme] = useState('nordic-moss');
  const [selectedVault, setSelectedVault] = useState('');
  const [selectedEngine, setSelectedEngine] = useState('agy');
  const [selectedEditor, setSelectedEditor] = useState('auto');
  const [selectedTerminal, setSelectedTerminal] = useState('auto');

  const fetchInspection = useCallback(async () => {
    try {
      setLoadingInspection(true);
      const res = await invoke('inspect_system_environment');
      setInspection(res);

      if (res?.currentConfig) {
        if (res.currentConfig.profile?.name) setOperatorName(res.currentConfig.profile.name);
        if (res.currentConfig.profile?.role) setOperatorRole(res.currentConfig.profile.role);
        if (res.currentConfig.profile?.responseStyle) setResponseStyle(res.currentConfig.profile.responseStyle);
        if (res.currentConfig.theme) setSelectedTheme(res.currentConfig.theme);
        if (res.currentConfig.vaultPath) setSelectedVault(res.currentConfig.vaultPath);
        if (res.currentConfig.agentType) setSelectedEngine(res.currentConfig.agentType);
        if (res.currentConfig.environment?.preferredEditor) setSelectedEditor(res.currentConfig.environment.preferredEditor);
        if (res.currentConfig.environment?.preferredTerminal) setSelectedTerminal(res.currentConfig.environment.preferredTerminal);
      }

      // Si no hay bóveda seleccionada pero se detectaron bóvedas
      if (!selectedVault && res?.vaults?.length > 0) {
        const primary = res.vaults.find((v) => v.isCurrent) || res.vaults[0];
        setSelectedVault(primary.path);
      }
    } catch (err) {
      console.warn('[Onboarding] Error inspeccionando entorno:', err);
    } finally {
      setLoadingInspection(false);
    }
  }, [selectedVault]);

  useEffect(() => {
    fetchInspection();
  }, [fetchInspection]);

  const handleCreateDefaultVault = async () => {
    try {
      setCreatingVault(true);
      const newPath = await invoke('auto_create_default_vault', { customName: 'Aegis Vault' });
      setSelectedVault(newPath);
      await fetchInspection();
    } catch (err) {
      console.error('[Onboarding] Error creando bóveda por defecto:', err);
    } finally {
      setCreatingVault(false);
    }
  };

  const handleFinish = async () => {
    try {
      setCompleting(true);
      const payload = {
        operatorName,
        operatorRole,
        responseStyle,
        theme: selectedTheme,
        vaultPath: selectedVault,
        agentType: selectedEngine,
        preferredEditor: selectedEditor,
        preferredTerminal: selectedTerminal
      };

      const updated = await invoke('complete_system_onboarding', { payload });
      if (onComplete) {
        onComplete(updated);
      }
    } catch (err) {
      console.error('[Onboarding] Error completando onboarding:', err);
    } finally {
      setCompleting(false);
    }
  };

  return {
    step,
    setStep,
    inspection,
    loadingInspection,
    creatingVault,
    completing,
    operatorName,
    setOperatorName,
    operatorRole,
    setOperatorRole,
    responseStyle,
    setResponseStyle,
    selectedTheme,
    setSelectedTheme,
    selectedVault,
    setSelectedVault,
    selectedEngine,
    setSelectedEngine,
    selectedEditor,
    setSelectedEditor,
    selectedTerminal,
    setSelectedTerminal,
    handleCreateDefaultVault,
    handleFinish
  };
}
