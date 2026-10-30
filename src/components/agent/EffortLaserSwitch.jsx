import { Zap, Brain } from 'lucide-react';

export default function EffortLaserSwitch({ effortMode = 'low', onSetEffortMode }) {
  return (
    <div className="effort-switch-container">
      {/* 🛤️ Riel Guía Base de Fondo */}
      <div className="effort-laser-rail" />

      {/* 🟢 Barra Láser Dinámica (Efecto Oruga / Stretch-and-Contract) */}
      <div 
        className="effort-laser-beam"
        style={{
          left: effortMode === 'low' ? '4px' : 'calc(50% + 2px)',
          right: effortMode === 'low' ? 'calc(50% + 2px)' : '4px',
          transition: effortMode === 'high'
            ? 'right 0.20s cubic-bezier(0.25, 1, 0.5, 1) 0s, left 0.20s cubic-bezier(0.25, 1, 0.5, 1) 0.10s'
            : 'left 0.20s cubic-bezier(0.25, 1, 0.5, 1) 0s, right 0.20s cubic-bezier(0.25, 1, 0.5, 1) 0.10s'
        }}
      />

      {/* Botón Flash */}
      <button
        type="button"
        onClick={() => onSetEffortMode && onSetEffortMode('low')}
        className={`effort-switch-tab ${effortMode === 'low' ? 'is-active' : ''}`}
        title="Modo Rápido Flash: ~1.9s de respuesta con modelo ágil"
      >
        <Zap size={13} color="currentColor" />
        <span>Flash</span>
      </button>

      {/* Botón Profundo */}
      <button
        type="button"
        onClick={() => onSetEffortMode && onSetEffortMode('high')}
        className={`effort-switch-tab ${effortMode === 'high' ? 'is-active' : ''}`}
        title="Modo Profundo: Razonamiento exhaustivo con modelo avanzado"
      >
        <Brain size={13} color="currentColor" />
        <span>Profundo</span>
      </button>
    </div>
  );
}
