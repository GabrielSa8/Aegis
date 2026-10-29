import { useState, useEffect, useCallback, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getStatusBadgeConfig, getThermalState, formatUptime } from './sentinelHelpers';

export function useSentinel() {
  const [telemetry, setTelemetry] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [cleanMessage, setCleanMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processSearch, setProcessSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isPurging, setIsPurging] = useState(false);

  const fetchTelemetry = useCallback(async () => {
    try {
      const [data, alts, procs] = await Promise.all([
        invoke('get_system_telemetry'),
        invoke('get_system_alerts'),
        invoke('get_top_processes')
      ]);
      setTelemetry(data);
      setAlerts(Array.isArray(alts) ? alts : []);
      setProcesses(Array.isArray(procs) ? procs : []);
    } catch (e) {
      console.error('Error obteniendo telemetría:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTelemetry();
    if (!autoRefresh) return;
    const interval = setInterval(fetchTelemetry, 2500);
    return () => clearInterval(interval);
  }, [fetchTelemetry, autoRefresh]);

  const handleKillProcess = async (pid) => {
    try {
      const res = await invoke('kill_process', { pid });
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

  const statusCfg = useMemo(() => {
    return getStatusBadgeConfig(telemetry?.statusBadge || 'OPTIMAL');
  }, [telemetry?.statusBadge]);

  const filteredProcesses = useMemo(() => {
    if (!processSearch.trim()) return processes;
    const q = processSearch.toLowerCase().trim();
    return processes.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.pid.toString().includes(q) ||
        p.cmdline.toLowerCase().includes(q)
    );
  }, [processes, processSearch]);

  const maxMemoryMb = useMemo(() => {
    if (!processes.length) return 1000;
    return Math.max(...processes.map((p) => p.memoryMb), 100);
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
    cleanMessage,
    loading,
    processSearch,
    setProcessSearch,
    autoRefresh,
    setAutoRefresh,
    isPurging,
    fetchTelemetry,
    handleKillProcess,
    handleCleanMemory,
    statusCfg,
    filteredProcesses,
    maxMemoryMb,
    thermalState,
    formattedUptime
  };
}
