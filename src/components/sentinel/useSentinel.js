import { useState, useEffect, useCallback, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getStatusBadgeConfig, getThermalState, formatUptime } from './sentinelHelpers';

const MAX_HISTORY_POINTS = 60; // 60 muestras (buffer circular de 60s/muestras)

// Caché en memoria para transiciones instantáneas a 60fps sin stutter
let _cachedTelemetry = null;
let _cachedAlerts = [];
let _cachedProcesses = [];
let _cachedHistory = {
  cpu: [],
  ram: [],
  temp: [],
  netRx: [],
  netTx: [],
  diskRead: [],
  diskWrite: []
};

export function useSentinel() {
  const [telemetry, setTelemetry] = useState(_cachedTelemetry);
  const [alerts, setAlerts] = useState(_cachedAlerts);
  const [processes, setProcesses] = useState(_cachedProcesses);
  const [cleanMessage, setCleanMessage] = useState(null);
  const [loading, setLoading] = useState(!_cachedTelemetry);
  const [processSearch, setProcessSearch] = useState('');
  const [processSortMode, setProcessSortMode] = useState('ram'); // 'ram' | 'cpu' | 'io' | 'zombie'
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isPurging, setIsPurging] = useState(false);
  const [powerProfileSwitching, setPowerProfileSwitching] = useState(false);

  // Buffers históricos reactivos
  const [history, setHistory] = useState(_cachedHistory);

  const appendHistory = useCallback((data) => {
    if (!data) return;
    setHistory((prev) => {
      const next = {
        cpu: [...prev.cpu, data.cpuPercent || 0].slice(-MAX_HISTORY_POINTS),
        ram: [...prev.ram, data.ramUsagePercent || 0].slice(-MAX_HISTORY_POINTS),
        temp: [...prev.temp, data.cpuTempCelsius || 45].slice(-MAX_HISTORY_POINTS),
        netRx: [...prev.netRx, data.netRxKbs || 0].slice(-MAX_HISTORY_POINTS),
        netTx: [...prev.netTx, data.netTxKbs || 0].slice(-MAX_HISTORY_POINTS),
        diskRead: [...prev.diskRead, data.diskReadKbs || 0].slice(-MAX_HISTORY_POINTS),
        diskWrite: [...prev.diskWrite, data.diskWriteKbs || 0].slice(-MAX_HISTORY_POINTS)
      };
      _cachedHistory = next;
      return next;
    });
  }, []);

  const fetchTelemetry = useCallback(async () => {
    try {
      const [data, alts, procs] = await Promise.all([
        invoke('get_system_telemetry'),
        invoke('get_system_alerts'),
        invoke('get_top_processes')
      ]);
      _cachedTelemetry = data;
      _cachedAlerts = Array.isArray(alts) ? alts : [];
      _cachedProcesses = Array.isArray(procs) ? procs : [];

      setTelemetry(data);
      appendHistory(data);
      setAlerts(_cachedAlerts);
      setProcesses(_cachedProcesses);
    } catch (e) {
      console.error('Error obteniendo telemetría:', e);
    } finally {
      setLoading(false);
    }
  }, [appendHistory]);

  useEffect(() => {
    fetchTelemetry();
    if (!autoRefresh) return;

    let interval = null;
    const startPolling = () => {
      if (!interval && document.visibilityState === 'visible') {
        interval = setInterval(fetchTelemetry, 2000);
      }
    };
    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchTelemetry();
        startPolling();
      } else {
        stopPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchTelemetry, autoRefresh]);

  const handleKillProcess = async (pid, signal = 15) => {
    try {
      const res = await invoke('kill_process', { pid, signal });
      setCleanMessage(res);
      setTimeout(() => setCleanMessage(null), 3000);
      fetchTelemetry();
    } catch (e) {
      setCleanMessage(`Error: ${e}`);
      setTimeout(() => setCleanMessage(null), 3000);
    }
  };

  const handleCleanMemory = async () => {
    setIsPurging(true);
    try {
      const res = await invoke('clean_system_memory');
      setCleanMessage(res);
      setTimeout(() => setCleanMessage(null), 3500);
      await fetchTelemetry();
    } catch (e) {
      setCleanMessage(`Error: ${e}`);
      setTimeout(() => setCleanMessage(null), 3500);
    } finally {
      setIsPurging(false);
    }
  };

  const handleSetPowerProfile = async (targetProfile) => {
    setPowerProfileSwitching(true);
    try {
      const res = await invoke('set_power_profile', { profile: targetProfile });
      setCleanMessage(res);
      setTimeout(() => setCleanMessage(null), 3000);
      await fetchTelemetry();
    } catch (err) {
      setCleanMessage(`Error cambiando perfil: ${err}`);
      setTimeout(() => setCleanMessage(null), 3000);
    } finally {
      setPowerProfileSwitching(false);
    }
  };

  const statusCfg = useMemo(() => {
    return getStatusBadgeConfig(telemetry?.statusBadge || 'OPTIMAL');
  }, [telemetry?.statusBadge]);

  const zombieCount = useMemo(() => {
    return processes.filter((p) => p.isZombie || p.state === 'Z').length;
  }, [processes]);

  const filteredProcesses = useMemo(() => {
    let list = processes;
    if (processSearch.trim()) {
      const q = processSearch.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.pid.toString().includes(q) ||
          p.cmdline.toLowerCase().includes(q)
      );
    }

    if (processSortMode === 'zombie') {
      return [...list.filter((p) => p.isZombie || p.state === 'Z')];
    }

    return [...list].sort((a, b) => {
      if (processSortMode === 'cpu') {
        return (b.cpuPercent || 0) - (a.cpuPercent || 0);
      }
      if (processSortMode === 'io') {
        return (b.ioKbs || 0) - (a.ioKbs || 0);
      }
      // default: 'ram'
      return (b.memoryMb || 0) - (a.memoryMb || 0);
    });
  }, [processes, processSearch, processSortMode]);

  const maxMemoryMb = useMemo(() => {
    if (!processes.length) return 1000;
    return Math.max(...processes.map((p) => p.memoryMb || 0), 100);
  }, [processes]);

  const maxCpuPercent = useMemo(() => {
    if (!processes.length) return 100;
    return Math.max(...processes.map((p) => p.cpuPercent || 0), 10);
  }, [processes]);

  const maxIoKbs = useMemo(() => {
    if (!processes.length) return 100;
    return Math.max(...processes.map((p) => p.ioKbs || 0), 10);
  }, [processes]);

  const thermalState = useMemo(() => {
    return getThermalState(telemetry?.cpuTempCelsius);
  }, [telemetry?.cpuTempCelsius]);

  const formattedUptime = useMemo(() => {
    return formatUptime(telemetry?.uptimeSeconds);
  }, [telemetry?.uptimeSeconds]);

  return {
    telemetry,
    alerts,
    processes,
    history,
    cleanMessage,
    loading,
    processSearch,
    setProcessSearch,
    processSortMode,
    setProcessSortMode,
    zombieCount,
    autoRefresh,
    setAutoRefresh,
    isPurging,
    powerProfileSwitching,
    handleSetPowerProfile,
    fetchTelemetry,
    handleKillProcess,
    handleCleanMemory,
    statusCfg,
    filteredProcesses,
    maxMemoryMb,
    maxCpuPercent,
    maxIoKbs,
    thermalState,
    formattedUptime
  };
}
