import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

/**
 * useDevDaemons — Hook para telemetría y control de daemons locales.
 * Maneja ADB/Android, Contenedores Podman/Docker, Puertos listening y SAM CLI.
 */
export function useDevDaemons({ showToast } = {}) {
  const [daemons, setDaemons] = useState({
    adb: { server_running: false, binary_path: null, devices: [] },
    containers: [],
    listening_ports: [],
    sam_cli_installed: false,
    sam_version: null,
    container_runtime: null
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Estados de Modales de Contenedores
  const [isCreateContainerOpen, setIsCreateContainerOpen] = useState(false);
  const [activeLogsContainer, setActiveLogsContainer] = useState(null);
  const [containerLogs, setContainerLogs] = useState('');
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchDaemons = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await invoke('get_dev_daemons_status');
      setDaemons(data);
    } catch (err) {
      console.error('Error fetching dev daemons:', err);
      showToast?.(`Error en radar de daemons: ${err}`, 'error');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDaemons();
  }, [fetchDaemons]);

  const handleRestartAdb = async () => {
    setActionLoadingId('adb-restart');
    try {
      const msg = await invoke('restart_adb_server');
      showToast?.(msg, 'success');
      await fetchDaemons();
    } catch (err) {
      showToast?.(`Fallo al reiniciar ADB: ${err}`, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleContainer = async (containerId, action) => {
    setActionLoadingId(`container-${containerId}-${action}`);
    try {
      const msg = await invoke('toggle_container_state', { containerId, action });
      showToast?.(msg, 'success');
      await fetchDaemons();
    } catch (err) {
      showToast?.(`Fallo en contenedor: ${err}`, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateContainer = async ({ name, image, portMapping, envVars }) => {
    setActionLoadingId('create-container');
    try {
      const msg = await invoke('create_container', {
        name,
        image,
        portMapping: portMapping || null,
        envVars: envVars || null
      });
      showToast?.(msg, 'success');
      setIsCreateContainerOpen(false);
      await fetchDaemons();
    } catch (err) {
      showToast?.(`Fallo creando contenedor: ${err}`, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteContainer = async (containerId, force = true) => {
    setActionLoadingId(`container-${containerId}-delete`);
    try {
      const msg = await invoke('delete_container', { containerId, force });
      showToast?.(msg, 'success');
      await fetchDaemons();
    } catch (err) {
      showToast?.(`Fallo eliminando contenedor: ${err}`, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenLogs = async (container, tail = 100) => {
    setActiveLogsContainer(container);
    setLoadingLogs(true);
    try {
      const logs = await invoke('get_container_logs', { containerId: container.id, tail });
      setContainerLogs(logs || '(Sin logs disponibles)');
    } catch (err) {
      setContainerLogs(`Error obteniendo logs: ${err}`);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleRefreshLogs = async (tail = 100) => {
    if (!activeLogsContainer) return;
    setLoadingLogs(true);
    try {
      const logs = await invoke('get_container_logs', { containerId: activeLogsContainer.id, tail });
      setContainerLogs(logs || '(Sin logs disponibles)');
    } catch (err) {
      setContainerLogs(`Error obteniendo logs: ${err}`);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleCloseLogs = () => {
    setActiveLogsContainer(null);
    setContainerLogs('');
  };

  const handleStopProcess = async (pid) => {
    if (!pid) return;
    setActionLoadingId(`proc-${pid}`);
    try {
      const msg = await invoke('stop_dev_server_process', { pid });
      showToast?.(msg, 'success');
      await fetchDaemons();
    } catch (err) {
      showToast?.(`Fallo al detener PID ${pid}: ${err}`, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenUrl = (url) => {
    window.open(url, '_blank');
  };

  return {
    daemons,
    loading,
    refreshing,
    actionLoadingId,
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
  };
}
