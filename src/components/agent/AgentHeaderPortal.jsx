import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Brain, History, Trash2, Cpu } from 'lucide-react';
import EffortLaserSwitch from './EffortLaserSwitch';

export default function AgentHeaderPortal({
  portalTarget,
  effortMode = 'low',
  onSetEffortMode,
  expandThoughts = false,
  onToggleExpandThoughts,
  showSessionsDrawer = false,
  onToggleSessionsDrawer,
  sessionsCount = 0,
  onClearHistory,
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
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {/* ⚡ Toggle de Modo de Trabajo (Efecto Oruga / Stretch-and-Contract) */}
      <EffortLaserSwitch effortMode={effortMode} onSetEffortMode={onSetEffortMode} />

      {/* 🧠 Toggle Acordeón de Pensamiento (Ver Razonamiento) */}
      <button
        onClick={onToggleExpandThoughts}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 8px',
          borderRadius: 'var(--radius-sm, 8px)',
          border: expandThoughts 
            ? '1px solid color-mix(in srgb, var(--primary) 45%, transparent)' 
            : '1px solid var(--border-color)',
          background: expandThoughts 
            ? 'color-mix(in srgb, var(--primary) 18%, transparent)' 
            : 'rgba(255, 255, 255, 0.03)',
          color: expandThoughts ? 'var(--primary)' : 'var(--text-muted)',
          fontSize: '0.73rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          outline: 'none',
          boxShadow: 'none',
          flexShrink: 0
        }}
        title="Alternar vista de pensamiento y herramientas (Ctrl + O)"
      >
        <Brain size={14} color={expandThoughts ? 'var(--primary)' : 'var(--text-muted)'} />
        <span>{expandThoughts ? 'Ocultar Raz.' : 'Ver Raz.'}</span>
        <kbd style={{
          fontSize: '0.60rem',
          padding: '1px 4px',
          borderRadius: '3px',
          background: 'rgba(255, 255, 255, 0.08)',
          color: 'inherit',
          fontFamily: 'inherit'
        }}>
          Ctrl+O
        </kbd>
      </button>

      {/* 📜 Historial de Sesiones Tácticas */}
      <button
        onClick={onToggleSessionsDrawer}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 8px',
          borderRadius: 'var(--radius-sm, 8px)',
          border: showSessionsDrawer 
            ? '1px solid color-mix(in srgb, var(--primary) 45%, transparent)' 
            : '1px solid var(--border-color)',
          background: showSessionsDrawer 
            ? 'color-mix(in srgb, var(--primary) 18%, transparent)' 
            : 'rgba(255, 255, 255, 0.03)',
          color: showSessionsDrawer ? 'var(--primary)' : 'var(--text-muted)',
          fontSize: '0.73rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          outline: 'none',
          flexShrink: 0
        }}
        title="Ver historial de sesiones de chat"
      >
        <History size={14} color={showSessionsDrawer ? 'var(--primary)' : 'var(--text-muted)'} />
        <span>Sesiones</span>
        <span style={{
          fontSize: '0.62rem',
          fontWeight: 700,
          padding: '1px 5px',
          borderRadius: '10px',
          background: showSessionsDrawer ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)',
          color: showSessionsDrawer ? '#000' : 'var(--text-muted)',
          fontFamily: 'var(--font-mono, monospace)',
          lineHeight: 1
        }}>
          {sessionsCount}
        </span>
      </button>

      {/* 🗑️ Vaciar Chat Activo */}
      <button
        onClick={onClearHistory}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          borderRadius: 'var(--radius-sm, 8px)',
          border: '1px solid var(--border-color)',
          background: 'rgba(255, 255, 255, 0.03)',
          color: 'var(--text-muted)',
          fontSize: '0.73rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          outline: 'none',
          flexShrink: 0
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent) 70%, transparent)';
          e.currentTarget.style.color = 'var(--text-high)';
          e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 12%, transparent)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-color)';
          e.currentTarget.style.color = 'var(--text-muted)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
        }}
        title="Vaciar conversación activa / Limpiar chat"
      >
        <Trash2 size={13} />
        <span>Vaciar</span>
      </button>

      {/* 🪙 Métrica Táctica de Tokens de la Sesión */}
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
