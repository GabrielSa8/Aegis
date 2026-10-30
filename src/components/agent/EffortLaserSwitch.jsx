import { Zap, Brain } from 'lucide-react';

export default function EffortLaserSwitch({ effortMode = 'low', onSetEffortMode }) {
  return (
    <div 
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        alignItems: 'center',
        background: 'rgba(0, 0, 0, 0.45)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm, 8px)',
        padding: '2px',
        userSelect: 'none',
        minWidth: '168px'
      }}
    >
      {/* 🛤️ Riel Guía Base de Fondo */}
      <div 
        style={{
          position: 'absolute',
          bottom: '2px',
          left: '4px',
          right: '4px',
          height: '2px',
          borderRadius: '2px',
          background: 'rgba(255, 255, 255, 0.08)',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      {/* 🟢 Barra Láser Dinámica (Efecto Oruga / Stretch-and-Contract Asimétrico) */}
      <div 
        style={{
          position: 'absolute',
          bottom: '2px',
          left: effortMode === 'low' ? '4px' : 'calc(50% + 2px)',
          right: effortMode === 'low' ? 'calc(50% + 2px)' : '4px',
          height: '2.5px',
          borderRadius: '2px',
          background: 'var(--primary)',
          boxShadow: '0 0 8px var(--primary), 0 0 14px color-mix(in srgb, var(--primary) 70%, transparent)',
          transition: effortMode === 'high'
            ? 'right 0.20s cubic-bezier(0.25, 1, 0.5, 1) 0s, left 0.20s cubic-bezier(0.25, 1, 0.5, 1) 0.10s'
            : 'left 0.20s cubic-bezier(0.25, 1, 0.5, 1) 0s, right 0.20s cubic-bezier(0.25, 1, 0.5, 1) 0.10s',
          willChange: 'left, right',
          pointerEvents: 'none',
          zIndex: 3
        }}
      />

      {/* Botón Flash */}
      <button
        onClick={() => onSetEffortMode && onSetEffortMode('low')}
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '5px',
          padding: '4px 10px 6px 10px',
          borderRadius: '6px',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          color: effortMode === 'low' ? 'var(--primary)' : 'var(--text-muted)',
          opacity: effortMode === 'low' ? 1 : 0.72,
          fontSize: '0.74rem',
          fontWeight: 600,
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          transition: 'color 0.16s ease, opacity 0.16s ease',
          whiteSpace: 'nowrap'
        }}
        title="Modo Rápido: ~1.9s de respuesta"
      >
        <Zap size={13} color="currentColor" />
        <span>Flash</span>
      </button>

      {/* Botón Profundo */}
      <button
        onClick={() => onSetEffortMode && onSetEffortMode('high')}
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '5px',
          padding: '4px 10px 6px 10px',
          borderRadius: '6px',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          color: effortMode === 'high' ? 'var(--primary)' : 'var(--text-muted)',
          opacity: effortMode === 'high' ? 1 : 0.72,
          fontSize: '0.74rem',
          fontWeight: 600,
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          transition: 'color 0.16s ease, opacity 0.16s ease',
          whiteSpace: 'nowrap'
        }}
        title="Modo Profundo: Razonamiento exhaustivo"
      >
        <Brain size={13} color="currentColor" />
        <span>Profundo</span>
      </button>
    </div>
  );
}
