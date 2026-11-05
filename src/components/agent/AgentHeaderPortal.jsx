import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Brain, History, Trash2, Cpu } from 'lucide-react';
import EffortLaserSwitch from './EffortLaserSwitch';
import ModelSelectorDropdown from './ModelSelectorDropdown';

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
  messages = [],
  activeModel,
  onSelectModel,
  agentType,
  onInjectSystemMessage,
  activeContext
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

      {/* 🤖 Selector Táctico de Modelo del Motor según Proveedor */}
      <ModelSelectorDropdown
        activeModel={activeModel}
        onSelectModel={onSelectModel}
        onSetEffortMode={onSetEffortMode}
        agentType={agentType}
        onInjectSystemMessage={onInjectSystemMessage}
        activeContext={activeContext}
      />

      {/* 🧠 Toggle Acordeón de Pensamiento (Ver Razonamiento) */}
      <button
        onClick={onToggleExpandThoughts}
        className={`header-tactical-toggle ${expandThoughts ? 'is-active' : ''}`}
        title="Alternar vista de pensamiento y herramientas (Ctrl + O)"
      >
        <Brain size={14} color="currentColor" />
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
        data-historial-toggle="true"
        onClick={onToggleSessionsDrawer}
        className={`header-tactical-toggle ${showSessionsDrawer ? 'is-active' : ''}`}
        title={`Historial de conversaciones (${sessionsCount})`}
        aria-label={`Historial de conversaciones (${sessionsCount})`}
        style={{ padding: '4px 7px' }}
      >
        <History size={14} color="currentColor" />
        {sessionsCount > 0 && (
          <span style={{
            fontSize: '0.62rem',
            fontWeight: 700,
            padding: '1px 5px',
            borderRadius: '10px',
            background: showSessionsDrawer ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)',
            color: showSessionsDrawer ? 'var(--bg-app, #000)' : 'var(--text-muted)',
            fontFamily: 'var(--font-mono, monospace)',
            lineHeight: 1
          }}>
            {sessionsCount}
          </span>
        )}
      </button>

      {/* 🗑️ Vaciar Chat Activo */}
      <button
        onClick={onClearHistory}
        className="header-tactical-toggle header-tactical-danger"
        title="Vaciar conversación activa / Limpiar chat"
        aria-label="Vaciar conversación activa"
        style={{ padding: '4px 7px' }}
      >
        <Trash2 size={13} />
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
