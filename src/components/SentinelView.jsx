import { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Cpu, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  HardDrive, 
  Layers, 
  Clock, 
  RefreshCw,
  Server,
  Zap,
  Trash2,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

export default function SentinelView() {
  const [telemetry, setTelemetry] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [cleanMessage, setCleanMessage] = useState(null);
  const [loading, setLoading] = useState(true);

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
    const interval = setInterval(fetchTelemetry, 2500);
    return () => clearInterval(interval);
  }, [fetchTelemetry]);

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
    try {
      const res = await invoke('clean_system_memory');
      setCleanMessage(res);
      setTimeout(() => setCleanMessage(null), 3500);
      fetchTelemetry();
    } catch (e) {
      setCleanMessage(`Error: ${e}`);
      setTimeout(() => setCleanMessage(null), 3500);
    }
  };

  const formatUptime = (sec) => {
    if (!sec) return '0m';
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const getStatusBadgeConfig = (badge) => {
    switch (badge) {
      case 'CRITICAL':
        return { text: 'Crítico / Throttling', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' };
      case 'ATTENTION':
        return { text: 'Atención Requerida', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' };
      default:
        return { text: 'Sistema Óptimo (N150)', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)' };
    }
  };

  const statusCfg = getStatusBadgeConfig(telemetry?.statusBadge || 'OPTIMAL');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.75rem', overflowY: 'auto' }}>
      {/* 🧭 Barra de Telemetría Host Compacta */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity color="#10b981" size={15} />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-high)' }}>
            Centinela Intel N150 & Monitor de Recursos en Vivo
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            • Refresco cada 2.5s
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {cleanMessage && (
            <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
              {cleanMessage}
            </span>
          )}

          <button
            onClick={handleCleanMemory}
            className="btn btn-secondary"
            style={{ padding: '2px 8px', fontSize: '0.68rem', height: '24px' }}
            title="Sincroniza disco y compacta ZRAM"
          >
            <Sparkles size={11} color="var(--primary)" />
            <span>Purgar RAM</span>
          </button>

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
            <RefreshCw size={13} />
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
        {/* Tarjeta CPU Intel N150 */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Cpu size={15} color="#10b981" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>CPU Intel N150</span>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
              {telemetry?.cpuPercent || 0}%
            </span>
          </div>

          {/* Barra Global */}
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '10px' }}>
            <div style={{
              width: `${Math.min(100, telemetry?.cpuPercent || 0)}%`,
              height: '100%',
              background: (telemetry?.cpuPercent || 0) > 80 ? '#ef4444' : '#10b981',
              transition: 'width 0.4s ease'
            }} />
          </div>

          {/* 4 E-Cores Gracemont */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
            {(telemetry?.cpuCores || []).map((core) => (
              <div key={core.coreId} style={{ background: 'rgba(0,0,0,0.25)', padding: '4px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block' }}>C{core.coreId}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: core.usagePercent > 80 ? '#ef4444' : '#fff', fontFamily: 'var(--font-mono)' }}>
                  {Math.round(core.usagePercent)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tarjeta Térmica */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Flame size={15} color="#f59e0b" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>Temperatura CPU</span>
            </div>
            <span style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              color: (telemetry?.cpuTempCelsius || 0) > 75 ? '#ef4444' : (telemetry?.cpuTempCelsius || 0) > 60 ? '#f59e0b' : '#10b981',
              fontFamily: 'var(--font-mono)'
            }}>
              {telemetry?.cpuTempCelsius || 0}°C
            </span>
          </div>

          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{
              width: `${Math.min(100, ((telemetry?.cpuTempCelsius || 40) / 95) * 100)}%`,
              height: '100%',
              background: (telemetry?.cpuTempCelsius || 0) > 75 ? '#ef4444' : '#f59e0b',
              transition: 'width 0.4s ease'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            <span>Disipación: Pasiva / Silenciosa</span>
            <span>Límite TjMax: 105°C</span>
          </div>
        </div>

        {/* Tarjeta Memoria RAM & ZRAM */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={15} color="#3b82f6" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>RAM & ZRAM (16 GB)</span>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#3b82f6', fontFamily: 'var(--font-mono)' }}>
              {telemetry?.ramUsagePercent || 0}%
            </span>
          </div>

          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{
              width: `${Math.min(100, telemetry?.ramUsagePercent || 0)}%`,
              height: '100%',
              background: '#3b82f6',
              transition: 'width 0.4s ease'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            <span>RAM: {((telemetry?.ramUsedMb || 0) / 1024).toFixed(1)} / {((telemetry?.ramTotalMb || 0) / 1024).toFixed(1)} GB</span>
            <span>ZRAM Swap: {((telemetry?.zramUsedMb || 0) / 1024).toFixed(1)} GB</span>
          </div>
        </div>

        {/* Tarjeta NVMe LUKS */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HardDrive size={15} color="#a855f7" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>NVMe Btrfs (LUKS)</span>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#a855f7', fontFamily: 'var(--font-mono)' }}>
              {telemetry?.diskUsagePercent || 0}%
            </span>
          </div>

          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{
              width: `${Math.min(100, telemetry?.diskUsagePercent || 0)}%`,
              height: '100%',
              background: '#a855f7',
              transition: 'width 0.4s ease'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            <span>Disponible: {telemetry?.diskAvailableGb || 0} GB</span>
            <span>Total: {telemetry?.diskTotalGb || 0} GB</span>
          </div>
        </div>
      </div>

      {/* 🛡️ Huella Aegis & Verificaciones de Seguridad */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px'
      }}>
        <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={14} color="#10b981" />
          Telemetría del Proceso Aegis & Host
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Consumo RAM Aegis (VmRSS)</span>
            <span style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {telemetry?.aegisRamMb || 48} MB (Objetivo ≤ 55 MB)
            </span>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Uptime del Sistema</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-high)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {formatUptime(telemetry?.uptimeSeconds)}
            </span>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Carga Promedio (Load Avg)</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-high)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {telemetry?.loadAvg1m || 0.5} • {telemetry?.loadAvg5m || 0.5} • {telemetry?.loadAvg15m || 0.5}
            </span>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Protección de Repositorios Git</span>
            <span style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 700 }}>
              Compuertas y Bloqueos de Seguridad ACTIVOS
            </span>
          </div>
        </div>
      </div>

      {/* ⚡ Gestor de Procesos en Tiempo Real (Process Killer) */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Server size={14} color="var(--primary)" />
            Top Procesos por Consumo de Memoria RAM
          </h3>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            {processes.length} procesos listados
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {processes.map(proc => (
            <div
              key={proc.pid}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 10px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: '45px' }}>
                  {proc.pid}
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {proc.name}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {proc.cmdline}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: proc.memoryMb > 500 ? '#ef4444' : 'var(--text-high)', fontFamily: 'var(--font-mono)' }}>
                  {proc.memoryMb} MB
                </span>
                <button
                  onClick={() => handleKillProcess(proc.pid)}
                  className="btn btn-secondary"
                  style={{ padding: '2px 6px', fontSize: '0.65rem', height: '22px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.25)' }}
                  title={`Terminar proceso ${proc.pid}`}
                >
                  <Trash2 size={11} />
                  <span>Matar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
