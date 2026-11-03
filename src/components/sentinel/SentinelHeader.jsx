import { 
  Activity, 
  Sparkles, 
  Pause, 
  Play, 
  ShieldCheck, 
  RefreshCw,
  Zap,
  Leaf
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
  onRefresh,
  powerProfileSwitching,
  onSetPowerProfile
}) {
  const currentProfile = (telemetry?.powerProfile || 'performance').toLowerCase();
  const isPerformance = currentProfile === 'performance';

  const toggleProfile = () => {
    if (onSetPowerProfile) {
      onSetPowerProfile(isPerformance ? 'powersave' : 'performance');
    }
  };

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
          <Activity color="var(--primary)" size={15} />
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-high)' }}>
            Centinela & Telemetría Host
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
            background: 'color-mix(in srgb, var(--bg-surface) 60%, transparent)',
            padding: '2px 7px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            fontFamily: 'var(--font-mono)'
          }}>
            {telemetry?.osName || 'Linux'}
          </span>
          <span style={{
            fontSize: '0.65rem',
            color: 'var(--accent)',
            background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
            padding: '2px 7px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
            fontFamily: 'var(--font-mono)'
          }}>
            {telemetry?.cpuModel || 'CPU Host'}
          </span>
          {telemetry?.kernelVersion && (
            <span style={{
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              background: 'color-mix(in srgb, var(--bg-surface) 40%, transparent)',
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {cleanMessage && (
          <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
            {cleanMessage}
          </span>
        )}

        {/* Conmutador de Perfil de Energía Universal Multiplataforma */}
        {!telemetry?.canSwitchPower ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              height: '24px',
              padding: '2px 8px',
              fontSize: '0.65rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              background: 'color-mix(in srgb, var(--bg-surface) 70%, transparent)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-color)',
              fontFamily: 'var(--font-mono)'
            }}
            title="El sistema anfitrión no expone conmutación de energía (modo fijo AC / Desktop)"
          >
            <Zap size={11} color="var(--text-muted)" />
            <span>Perfil: Host AC</span>
          </div>
        ) : (
          <button
            onClick={toggleProfile}
            disabled={powerProfileSwitching}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              height: '24px',
              padding: '2px 8px',
              fontSize: '0.66rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-sm)',
              cursor: powerProfileSwitching ? 'wait' : 'pointer',
              background: isPerformance 
                ? 'color-mix(in srgb, var(--warning) 14%, transparent)' 
                : 'color-mix(in srgb, var(--primary) 14%, transparent)',
              color: isPerformance ? 'var(--warning)' : 'var(--primary)',
              border: isPerformance 
                ? '1px solid color-mix(in srgb, var(--warning) 35%, transparent)' 
                : '1px solid color-mix(in srgb, var(--primary) 35%, transparent)'
            }}
            title={isPerformance ? 'Perfil: Rendimiento Máximo. Clic para Ahorro.' : 'Perfil: Ahorro de Energía. Clic para Rendimiento.'}
          >
            {isPerformance ? <Zap size={11} /> : <Leaf size={11} />}
            <span>{powerProfileSwitching ? 'Cambiando...' : isPerformance ? 'Rendimiento' : 'Ahorro'}</span>
          </button>
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
          style={{
            padding: '2px 7px',
            fontSize: '0.65rem',
            height: '24px',
            background: 'var(--bg-surface)',
            color: autoRefresh ? 'var(--primary)' : 'var(--text-muted)',
            border: `1px solid ${autoRefresh ? 'color-mix(in srgb, var(--primary) 35%, transparent)' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer'
          }}
          title={autoRefresh ? 'Pausar auto-refresco (2s)' : 'Reanudar auto-refresco'}
        >
          {autoRefresh ? <Pause size={10} /> : <Play size={10} />}
          <span>{autoRefresh ? '2s' : 'Pausado'}</span>
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
