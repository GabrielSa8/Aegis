import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Zap, Brain, Cpu } from 'lucide-react';

export default function AgentHeaderPortal({
  portalTarget,
  effortMode = 'low',
  onSetEffortMode,
  expandThoughts = false,
  onToggleExpandThoughts,
  messages = []
}) {
  // 🎯 Resolución síncrona y estable del slot en el DOM
  const targetEl = (portalTarget && portalTarget.isConnected)
    ? portalTarget
    : (typeof document !== 'undefined' ? document.getElementById('top-header-slot') : null);

  // 🪙 Cálculo reactivo de tokens de la sesión activa
  const tokenStats = useMemo(() => {
    let total = 0;
    let input = 0;
    let output = 0;

    for (const m of messages) {
      if (m.totalTokens) {
        total += m.totalTokens;
        input += m.inputTokens || 0;
        output += m.outputTokens || 0;
      } else if (m.content) {
        const est = Math.round(m.content.length / 4);
        total += est;
        if (m.role === 'user') input += est;
        else output += est;
      }
    }

    const formatNum = (num) => {
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
      return String(num);
    };

    return {
      total,
      input,
      output,
      formatted: formatNum(total)
    };
  }, [messages]);

  if (!targetEl) return null;

  return createPortal(
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {/* ⚡ Toggle de Modo de Trabajo (Efecto Oruga / Stretch-and-Contract) */}
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
          minWidth: '172px'
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
            gap: '6px',
            padding: '5px 12px 7px 12px',
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
            gap: '6px',
            padding: '5px 12px 7px 12px',
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

      {/* 🧠 Toggle Acordeón de Pensamiento (Ver Razonamiento) */}
      <button
        onClick={onToggleExpandThoughts}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: 'var(--radius-sm, 8px)',
          border: expandThoughts 
            ? '1px solid color-mix(in srgb, var(--primary) 45%, transparent)' 
            : '1px solid var(--border-color)',
          background: expandThoughts 
            ? 'color-mix(in srgb, var(--primary) 20%, transparent)' 
            : 'rgba(255, 255, 255, 0.03)',
          color: expandThoughts ? 'var(--primary)' : 'var(--text-muted)',
          fontSize: '0.74rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          outline: 'none',
          boxShadow: 'none',
          flexShrink: 0
        }}
        title="Alternar vista de pensamiento y herramientas (Ctrl + O)"
      >
        <Brain size={16} color={expandThoughts ? 'var(--primary)' : 'var(--text-muted)'} />
        <span>{expandThoughts ? 'Ocultar Raz.' : 'Ver Raz.'}</span>
        <kbd style={{
          fontSize: '0.62rem',
          padding: '1px 5px',
          borderRadius: '4px',
          background: 'rgba(255, 255, 255, 0.08)',
          color: 'inherit',
          fontFamily: 'inherit'
        }}>
          Ctrl+O
        </kbd>
      </button>

      {/* 🪙 Métrica Táctica de Tokens de la Sesión (Compacta y Proporcionada) */}
      <div 
        title={`Telemetría de Sesión: ${tokenStats.total.toLocaleString()} tokens (${tokenStats.input.toLocaleString()} in | ${tokenStats.output.toLocaleString()} out)`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          background: 'color-mix(in srgb, var(--primary) 14%, transparent)',
          border: '1px solid color-mix(in srgb, var(--primary) 35%, transparent)',
          borderRadius: 'var(--radius-sm, 8px)',
          padding: '3px 8px',
          fontSize: '0.72rem',
          fontWeight: 700,
          fontFamily: 'var(--font-mono, monospace)',
          color: 'var(--primary)',
          cursor: 'help',
          flexShrink: 0,
          whiteSpace: 'nowrap'
        }}
      >
        <Cpu size={12} color="var(--primary)" />
        <span>{tokenStats.formatted} tk</span>
      </div>
    </div>,
    targetEl
  );
}
