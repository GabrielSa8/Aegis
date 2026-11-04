import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function useEnvironmentSettings({ config, setConfig }) {
  const [installedTools, setInstalledTools] = useState({ editors: [], terminals: [] });
  const [loadingTools, setLoadingTools] = useState(true);
  const [testingTool, setTestingTool] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const envConfig = config?.environment || {
    preferredEditor: 'cursor',
    customEditorCmd: '',
    preferredTerminal: 'auto',
    customTerminalCmd: ''
  };

  const loadTools = useCallback(async () => {
    try {
      setLoadingTools(true);
      const tools = await invoke('get_installed_environment_tools');
      setInstalledTools(tools);
    } catch (err) {
      console.warn('Error detectando herramientas instaladas:', err);
    } finally {
      setLoadingTools(false);
    }
  }, []);

  useEffect(() => {
    loadTools();
  }, [loadTools]);

  const updateEnvironment = useCallback((updates) => {
    setConfig(prev => {
      if (!prev) return prev;
      const currentEnv = prev.environment || {
        preferredEditor: 'cursor',
        customEditorCmd: '',
        preferredTerminal: 'auto',
        customTerminalCmd: ''
      };
      const updated = {
        ...prev,
        environment: { ...currentEnv, ...updates }
      };
      invoke('save_aegis_config', { config: updated }).catch(err => {
        console.error('Error guardando configuración de entorno:', err);
      });
      return updated;
    });
  }, [setConfig]);

  const handleTestTool = useCallback(async (toolType, toolId, customCmd) => {
    const testKey = `${toolType}:${toolId}`;
    try {
      setTestingTool(testKey);
      setTestResult(null);
      const msg = await invoke('test_environment_tool', {
        toolType,
        toolId,
        customCmd: customCmd || null
      });
      setTestResult({ key: testKey, success: true, message: msg || 'Ejecutado con éxito' });
    } catch (err) {
      setTestResult({ key: testKey, success: false, message: String(err) });
    } finally {
      setTestingTool(null);
      setTimeout(() => setTestResult(null), 5000);
    }
  }, []);

  return {
    envConfig,
    installedTools,
    loadingTools,
    testingTool,
    testResult,
    updateEnvironment,
    handleTestTool,
    reloadTools: loadTools
  };
}
