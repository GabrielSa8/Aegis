import { createPortal } from 'react-dom';
import { 
  FolderGit2, 
  Settings, 
  Zap, 
  Brain, 
  History, 
  Trash2 
} from 'lucide-react';

export default function AgentHeaderPortal({
  portalTarget,
  contexts,
  selectedContextId,
  onSelectContext,
  onOpenContextModal,
  effortMode,
  onSetEffortMode,
  expandThoughts,
  onToggleExpandThoughts,
  showSessionsDrawer,
  onToggleSessionsDrawer,
  sessionsCount,
  onClearHistory
}) {
  if (!portalTarget) return null;

  return createPortal(
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '6px' }}>
      {/* Separador */}
      <div style={{ width: '1px', height: '14px', background: 'var(--border-color)', margin: '0 2px', flexShrink: 0 }} />

      {/* Selector de perfiles dinámicos con scrollbar invisible */}
      <div 
        className="no-scrollbar"
        onWheel={(e) => {
          if (e.deltaY !== 0) {
            e.currentTarget.scrollLeft += e.deltaY;
          }
        }}
        style={{ display: 'flex', alignItems: 'center', gap: '5px', overflowX: 'auto', flex: 1, minWidth: '160px' }}
      >
        <span style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', marginRight: '2px', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />
          CONTEXTO:
        </span>
        {contexts.map((ctx) => {
          const isSelected = selectedContextId === ctx.id;
          return (
            <button
              key={ctx.id}
              onClick={() => onSelectContext(ctx.id)}
              className={`terminal-btn ${isSelected ? 'active' : ''}`}
              style={{ padding: '2px 7px' }}
            >
              <FolderGit2 size={11} color={isSelected ? 'var(--primary)' : 'var(--text-muted)'} />
              <span>{ctx.label}</span>
              {ctx.skills?.length > 0 && (
                <span style={{ fontSize: '0.55rem', padding: '1px 4px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.06)', fontFamily: 'var(--font-mono)' }}>
                  {ctx.skills.length}
                </span>
              )}
            </button>
          );
        })}

        {/* Botón Gestión de Contextos */}
        <button
          onClick={onOpenContextModal}
          className="terminal-btn"
          title="Administrar carpetas, skills y modelos de contextos"
          style={{ padding: '2px 6px' }}
        >
          <Settings size={11} />
          <span>Editar</span>
        </button>
      </div>

      {/* Toggle de Esfuerzo (Flash vs Profundo) y Controles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
        {/* Toggle Flash / Profundo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.35)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '1px'
        }}>
          <button
            onClick={() => onSetEffortMode('low')}
            className={`terminal-btn ${effortMode === 'low' ? 'active' : ''}`}
            style={{ border: 'none', padding: '2px 6px' }}
            title="Modo Rápido: ~1.9s de respuesta"
          >
            <Zap size={10} color={effortMode === 'low' ? 'var(--primary)' : 'var(--text-muted)'} />
            <span>Flash</span>
          </button>

          <button
            onClick={() => onSetEffortMode('high')}
            className={`terminal-btn ${effortMode === 'high' ? 'active' : ''}`}
            style={{ border: 'none', padding: '2px 6px' }}
            title="Modo Profundo: Razonamiento exhaustivo"
          >
            <Brain size={10} color={effortMode === 'high' ? 'var(--primary)' : 'var(--text-muted)'} />
            <span>Profundo</span>
          </button>
        </div>

        {/* Toggle Acordeón de Pensamiento */}
        <button
          onClick={onToggleExpandThoughts}
          className={`terminal-btn ${expandThoughts ? 'active' : ''}`}
          title="Alternar vista de pensamiento y herramientas (Ctrl + O)"
          style={{ padding: '2px 6px' }}
        >
          <Brain size={11} color={expandThoughts ? 'var(--primary)' : 'var(--text-muted)'} />
          <span>{expandThoughts ? 'Ocultar Raz.' : 'Ver Raz.'}</span>
          <kbd className="tactical-kbd" style={{ fontSize: '0.52rem', padding: '0 3px' }}>Ctrl+O</kbd>
        </button>

        {/* Historial de Sesiones Drawer Toggle */}
        <button
          onClick={onToggleSessionsDrawer}
          className={`terminal-btn ${showSessionsDrawer ? 'active' : ''}`}
          title="Abrir historial de sesiones tácticas"
          style={{ padding: '2px 6px' }}
        >
          <History size={11} color={showSessionsDrawer ? 'var(--primary)' : 'var(--text-muted)'} />
          <span>Sesiones ({sessionsCount})</span>
        </button>

        {/* Limpiar Historial */}
        <button
          onClick={onClearHistory}
          className="terminal-btn"
          style={{ width: '22px', height: '22px', padding: 0, justifyContent: 'center' }}
          title="Limpiar conversación"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>,
    portalTarget
  );
}
