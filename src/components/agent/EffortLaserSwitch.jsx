import { Shield, Zap, Brain } from 'lucide-react';

export default function EffortLaserSwitch({ effortMode = 'auto', onSetEffortMode }) {
  const modeIndex = effortMode === 'auto' ? 0 : effortMode === 'high' ? 2 : 1;
  const beamLeft = modeIndex === 0 ? '4px' : modeIndex === 1 ? 'calc(33.33% + 2px)' : 'calc(66.66% + 2px)';
  const beamRight = modeIndex === 0 ? 'calc(66.66% + 2px)' : modeIndex === 1 ? 'calc(33.33% + 2px)' : '4px';

  return (
    <div
      className="effort-switch-container"
      style={{ gridTemplateColumns: '1fr 1fr 1fr', minWidth: '248px' }}
    >
      {/* 🛤️ Riel Guía Base de Fondo */}
      <div className="effort-laser-rail" />

      {/* 🟢 Barra Láser Dinámica */}
      <div
        className="effort-laser-beam"
        style={{
          left: beamLeft,
          right: beamRight,
          transition: 'left 0.20s cubic-bezier(0.25, 1, 0.5, 1), right 0.20s cubic-bezier(0.25, 1, 0.5, 1)'
        }}
      />

      {/* Botón Auto (Aegis Adaptive Harness L1⇄L3) */}
      <button
        type="button"
        onClick={() => onSetEffortMode && onSetEffortMode('auto')}
        className={`effort-switch-tab ${effortMode === 'auto' ? 'is-active' : ''}`}
        title="Aegis Harness Activo: Detecta y cambia el nivel automáticamente en cada paso (L1 Flash ⇄ L2 Balanceado ⇄ L3 Profundo) con poda ACI y auto-verificación"
      >
        <Shield size={13} color="currentColor" />
        <span>Auto L1⇄L3</span>
      </button>

      {/* Botón Flash (Manual L1) */}
      <button
        type="button"
        onClick={() => onSetEffortMode && onSetEffortMode('low')}
        className={`effort-switch-tab ${effortMode === 'low' ? 'is-active' : ''}`}
        title="Modo Manual L1 (Flash): Respuesta rápida fija para toda la consulta"
      >
        <Zap size={13} color="currentColor" />
        <span>Flash</span>
      </button>

      {/* Botón Profundo (Manual L3) */}
      <button
        type="button"
        onClick={() => onSetEffortMode && onSetEffortMode('high')}
        className={`effort-switch-tab ${effortMode === 'high' ? 'is-active' : ''}`}
        title="Modo Manual L3 (Profundo): Razonamiento exhaustivo fijo para toda la consulta"
      >
        <Brain size={13} color="currentColor" />
        <span>Profundo</span>
      </button>
    </div>
  );
}
