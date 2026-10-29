import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Activity, 
  Cpu, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  HardDrive, 
  Clock, 
  RefreshCw,
  Server,
  Zap,
  Trash2,
  Sparkles,
  Search,
  Pause,
  Play,
  Terminal,
  Layers,
  Thermometer
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

export default function SentinelView() {
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

  const formatUptime = (sec) => {
    if (!sec) return '0m';
    const days = Math.floor(sec / 86400);
    const hrs = Math.floor((sec % 86400) / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    if (days > 0) return `${days}d ${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const getStatusBadgeConfig = (badge) => {
    switch (badge) {
      case 'CRITICAL':
        return { text: 'Crítico / Throttling', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.35)' };
      case 'ATTENTION':
        return { text: 'Atención Requerida', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.35)' };
      default:
        return { text: 'Sistema Óptimo', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' };
    }
  };

  const statusCfg = getStatusBadgeConfig(telemetry?.statusBadge || 'OPTIMAL');

  // Procesos filtrados por búsqueda
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

  // Clasificación térmica dinámica
  const thermalState = useMemo(() => {
    const temp = telemetry?.cpuTempCelsius || 45;
    if (temp >= 82) return { label: 'Alerta / Throttling', color: '#ef4444' };
    if (temp >= 72) return { label: 'Carga Sostenida', color: '#f59e0b' };
    if (temp >= 55) return { label: 'Operación Nominal', color: '#38bdf8' };
    return { label: 'Reposo / Frío', color: '#10b981' };
  }, [telemetry?.cpuTempCelsius]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.75rem', overflowY: 'auto' }}>
      {/* 🧭 Barra de Telemetría Host Compacta (Nordic Tactical HUD) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.45rem 0.85rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        flexShrink: 0,
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        {/* Identidad del Host descubierta dinámicamente */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity color="#10b981" size={15} />
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-high)' }}>
              Centinela & Telemetría Host
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '2px 7px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              fontFamily: 'var(--font-mono)'
            }}>
              {telemetry?.osName || 'Linux'}
            </span>
            <span style={{
              fontSize: '0.65rem',
              color: '#38bdf8',
              background: 'rgba(56, 189, 248, 0.08)',
              padding: '2px 7px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              fontFamily: 'var(--font-mono)'
            }}>
              {telemetry?.cpuModel || 'CPU Host'}
            </span>
            {telemetry?.kernelVersion && (
              <span style={{
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-mono)'
              }}>
                {telemetry.kernelVersion}
              </span>
            )}
          </div>
        </div>

        {/* Acciones y Badges de Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {cleanMessage && (
            <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
              {cleanMessage}
            </span>
          )}

          {/* Botón Purgar RAM */}
          <button
            onClick={handleCleanMemory}
            disabled={isPurging}
            className="btn btn-secondary"
            style={{ padding: '2px 9px', fontSize: '0.68rem', height: '24px', display: 'flex', alignItems: 'center', gap: '5px' }}
            title="Sincroniza escrituras en disco (sync) y compacta memoria ZRAM"
          >
            <Sparkles size={11} color="var(--primary)" className={isPurging ? 'animate-spin' : ''} />
            <span>{isPurging ? 'Purgando...' : 'Purgar RAM'}</span>
          </button>

          {/* Toggle de Auto-Refresco */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="btn btn-secondary"
            style={{
              padding: '2px 7px',
              fontSize: '0.65rem',
              height: '24px',
              color: autoRefresh ? 'var(--primary)' : 'var(--text-muted)',
              borderColor: autoRefresh ? 'rgba(52, 211, 153, 0.3)' : 'var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title={autoRefresh ? 'Pausar auto-refresco (2.5s)' : 'Reanudar auto-refresco'}
          >
            {autoRefresh ? <Pause size={10} /> : <Play size={10} />}
            <span>{autoRefresh ? '2.5s' : 'Pausado'}</span>
          </button>

          {/* Badge de Estado del Sistema */}
          <div style={{
            background: statusCfg.bg,
            border: `1px solid ${statusCfg.border}`,
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.68rem',
            color: statusCfg.color,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <ShieldCheck size={12} />
            <span>{statusCfg.text}</span>
          </div>

          {/* Refresco Manual */}
          <button
            onClick={fetchTelemetry}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '2px'
            }}
            title="Refrescar métricas ahora"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 🚨 Alertas Proactivas */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {alerts.map((alt) => {
            const isDanger = alt.level === 'danger';
            const isWarning = alt.level === 'warning';
            const col = isDanger ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';
            const bg = isDanger ? 'rgba(239, 68, 68, 0.08)' : isWarning ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)';
            const bdr = isDanger ? 'rgba(239, 68, 68, 0.25)' : isWarning ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.2)';

            return (
              <div
                key={alt.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 12px',
                  background: bg,
                  border: `1px solid ${bdr}`,
                  borderRadius: 'var(--radius-md)',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isDanger || isWarning ? <AlertTriangle size={14} color={col} /> : <CheckCircle2 size={14} color={col} />}
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: col }}>{alt.title}: </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{alt.message}</span>
                  </div>
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {alt.timestamp}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* 📊 Grid de Métricas Principales de Hardware */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '10px' }}>
        {/* 1. Tarjeta CPU & Núcleos */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                <Cpu size={15} color="#10b981" />
                <span style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#fff',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {telemetry?.cpuModel || 'Procesador'}
                </span>
              </div>
              <span style={{
                fontSize: '0.88rem',
                fontWeight: 800,
                color: (telemetry?.cpuPercent || 0) > 80 ? '#ef4444' : (telemetry?.cpuPercent || 0) > 60 ? '#f59e0b' : '#10b981',
                fontFamily: 'var(--font-mono)'
              }}>
                {telemetry?.cpuPercent || 0}%
              </span>
            </div>

            {/* Barra Global de Uso */}
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '10px' }}>
              <div style={{
                width: `${Math.min(100, telemetry?.cpuPercent || 0)}%`,
                height: '100%',
                background: (telemetry?.cpuPercent || 0) > 80 ? '#ef4444' : (telemetry?.cpuPercent || 0) > 60 ? '#f59e0b' : '#10b981',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>

          {/* Grilla Adaptativa de Cores */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(46px, 1fr))`,
            gap: '4px'
          }}>
            {(telemetry?.cpuCores || []).map((core) => {
              const coreUsage = Math.round(core.usagePercent);
              const coreCol = coreUsage > 80 ? '#ef4444' : coreUsage > 50 ? '#f59e0b' : '#34d399';
              return (
                <div key={core.coreId} style={{ background: 'rgba(0,0,0,0.25)', padding: '4px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block' }}>C{core.coreId}</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: coreCol, fontFamily: 'var(--font-mono)' }}>
                    {coreUsage}%
                  </span>
                  <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '1.5px', overflow: 'hidden', marginTop: '2px' }}>
                    <div style={{ width: `${coreUsage}%`, height: '100%', background: coreCol }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Tarjeta Térmica */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Flame size={15} color={thermalState.color} />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>Temperatura CPU</span>
              </div>
              <span style={{
                fontSize: '0.88rem',
                fontWeight: 800,
                color: thermalState.color,
                fontFamily: 'var(--font-mono)'
              }}>
                {telemetry?.cpuTempCelsius || 0}°C
              </span>
            </div>

            {/* Barra Térmica Proporcional (30°C - 95°C) */}
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{
                width: `${Math.min(100, Math.max(5, (((telemetry?.cpuTempCelsius || 40) - 25) / 75) * 100))}%`,
                height: '100%',
                background: thermalState.color,
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            <span style={{ color: thermalState.color, fontWeight: 600 }}>{thermalState.label}</span>
            <span>TjMax: ~100°C</span>
          </div>
        </div>

        {/* 3. Tarjeta Memoria RAM & Swap (ZRAM) */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={15} color="#38bdf8" />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>
                  Memoria RAM ({((telemetry?.ramTotalMb || 0) / 1024).toFixed(0)} GB)
                </span>
              </div>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                {telemetry?.ramUsagePercent || 0}%
              </span>
            </div>

            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{
                width: `${Math.min(100, telemetry?.ramUsagePercent || 0)}%`,
                height: '100%',
                background: (telemetry?.ramUsagePercent || 0) > 85 ? '#ef4444' : '#38bdf8',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            <span>RAM: {((telemetry?.ramUsedMb || 0) / 1024).toFixed(1)} / {((telemetry?.ramTotalMb || 0) / 1024).toFixed(1)} GB</span>
            <span>Swap/ZRAM: {((telemetry?.zramUsedMb || 0) / 1024).toFixed(1)} GB</span>
          </div>
        </div>

        {/* 4. Tarjeta Almacenamiento Raíz (/) */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HardDrive size={15} color="#a855f7" />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>Almacenamiento Raíz (/)</span>
              </div>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#a855f7', fontFamily: 'var(--font-mono)' }}>
                {telemetry?.diskUsagePercent || 0}%
              </span>
            </div>

            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{
                width: `${Math.min(100, telemetry?.diskUsagePercent || 0)}%`,
                height: '100%',
                background: (telemetry?.diskUsagePercent || 0) > 85 ? '#ef4444' : '#a855f7',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            <span>Libre: {telemetry?.diskAvailableGb || 0} GB</span>
            <span>Total: {telemetry?.diskTotalGb || 0} GB</span>
          </div>
        </div>
      </div>

      {/* 🛡️ Huella de Proceso Aegis & Host Telemetry */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px'
      }}>
        <h3 style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={14} color="#10b981" />
          Telemetría del Proceso Aegis & Entorno Operativo
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
          {/* VmRSS Aegis */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Consumo RAM Aegis (VmRSS)</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
              <span style={{ fontSize: '0.88rem', color: '#10b981', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                {telemetry?.aegisRamMb || 48} MB
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>(Objetivo ≤ 55 MB)</span>
            </div>
          </div>

          {/* Uptime Host */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Uptime del Host</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-high)', fontWeight: 700, fontFamily: 'var(--font-mono)', display: 'block', marginTop: '2px' }}>
              {formatUptime(telemetry?.uptimeSeconds)}
            </span>
          </div>

          {/* Load Avg */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Carga Promedio (1m • 5m • 15m)</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-high)', fontWeight: 700, fontFamily: 'var(--font-mono)', display: 'block', marginTop: '2px' }}>
              {telemetry?.loadAvg1m || 0.5} • {telemetry?.loadAvg5m || 0.5} • {telemetry?.loadAvg15m || 0.5}
            </span>
          </div>

          {/* Protección Git */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Protección de Repositorios Git</span>
            <span style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 700, display: 'block', marginTop: '2px' }}>
              Compuertas y Bloqueos de Seguridad ACTIVOS
            </span>
          </div>
        </div>
      </div>

      {/* ⚡ Gestor de Procesos en Tiempo Real (Process Killer Táctico) */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Server size={14} color="var(--primary)" />
            <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-high)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
              Top Procesos por Consumo de Memoria RAM
            </h3>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              ({filteredProcesses.length} de {processes.length})
            </span>
          </div>

          {/* Buscador de Procesos */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={processSearch}
              onChange={(e) => setProcessSearch(e.target.value)}
              placeholder="Filtrar proceso por nombre o PID..."
              style={{
                width: '100%',
                padding: '3px 8px 3px 26px',
                fontSize: '0.68rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'rgba(0,0,0,0.25)',
                color: 'var(--text-high)',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Lista de Procesos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '300px', overflowY: 'auto' }}>
          {filteredProcesses.length > 0 ? (
            filteredProcesses.map((proc) => {
              const memRatio = Math.min(100, (proc.memoryMb / maxMemoryMb) * 100);
              const isHigh = proc.memoryMb > 500;

              return (
                <div
                  key={proc.pid}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '5px 10px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    gap: '8px',
                    overflow: 'hidden'
                  }}
                >
                  {/* Barra de fondo proporcional al consumo de memoria */}
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${memRatio}%`,
                    background: isHigh ? 'rgba(239, 68, 68, 0.08)' : 'rgba(56, 189, 248, 0.05)',
                    pointerEvents: 'none'
                  }} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, position: 'relative', zIndex: 1 }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: '45px', flexShrink: 0 }}>
                      {proc.pid}
                    </span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {proc.name}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={proc.cmdline}>
                      {proc.cmdline}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 1, flexShrink: 0 }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: isHigh ? '#ef4444' : 'var(--text-high)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {proc.memoryMb} MB
                    </span>
                    <button
                      onClick={() => handleKillProcess(proc.pid)}
                      className="btn btn-secondary"
                      style={{
                        padding: '2px 7px',
                        fontSize: '0.65rem',
                        height: '22px',
                        color: '#ef4444',
                        borderColor: 'rgba(239, 68, 68, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title={`Enviar SIGTERM/SIGKILL a proceso ${proc.pid}`}
                    >
                      <Trash2 size={11} />
                      <span>Terminar</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
              No se encontraron procesos que coincidan con &quot;{processSearch}&quot;
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
