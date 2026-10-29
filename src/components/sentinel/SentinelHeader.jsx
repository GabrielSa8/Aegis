import { 
  Activity, 
  Sparkles, 
  Pause, 
  Play, 
  ShieldCheck, 
  RefreshCw 
} from 'lucide-react';
import TacticalButton from '../ui/TacticalButton';

export default function SentinelHeader({
  telemetry,
  cleanMessage,
  isPurging,
  onCleanMemory,
  autoRefresh,
  onToggleAutoRefresh,
  statusCfg,
  loading,
  onRefresh
}) {
  return (
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
        <TacticalButton
          variant="secondary"
          size="sm"
          icon={Sparkles}
          disabled={isPurging}
          onClick={onCleanMemory}
          title="Sincroniza escrituras en disco (sync) y compacta memoria ZRAM"
          style={{ height: '24px', padding: '2px 9px', fontSize: '0.68rem' }}
        >
          {isPurging ? 'Purgando...' : 'Purgar RAM'}
        </TacticalButton>

        {/* Toggle de Auto-Refresco */}
        <button
          onClick={onToggleAutoRefresh}
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
          onClick={onRefresh}
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
  );
}
