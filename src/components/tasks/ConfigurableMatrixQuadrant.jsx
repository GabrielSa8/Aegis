import { TaskCard } from './TaskCard';

export function ConfigurableMatrixQuadrant({
  quadrantId,
  currentConfig,
  data,
  onConfigChange,
  activeHubs,
  availableProjects,
  onToggle,
  onSelectTask
}) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${data.borderColor}`,
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '220px',
        boxShadow: 'var(--shadow-lg)'
      }}
    >
      {/* Cabecera Interactiva con Selector */}
      <div
        style={{
          padding: '0.45rem 0.75rem',
          background: data.bgColor,
          borderBottom: `1px solid ${data.borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}
      >
        {/* Selector de Objetivo para este Cuadrante */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
          <select
            value={currentConfig}
            onChange={(e) => onConfigChange(e.target.value)}
            style={{
              fontSize: '0.74rem',
              fontWeight: 800,
              color: data.color,
              background: 'color-mix(in srgb, var(--bg-card) 85%, transparent)',
              border: `1px solid ${data.borderColor}`,
              borderRadius: '4px',
              padding: '2px 20px 2px 6px',
              cursor: 'pointer',
              outline: 'none',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            title="Cambiar qué monitorea este cuadrante"
          >
            <optgroup label="Tácticas & Urgencia">
              <option value="urgent" style={{ background: 'var(--bg-card)', color: 'var(--text-high)' }}>🚨 Urgente & Crítico</option>
              <option value="focus" style={{ background: 'var(--bg-card)', color: 'var(--text-high)' }}>🔥 En Foco</option>
              <option value="backlog" style={{ background: 'var(--bg-card)', color: 'var(--text-high)' }}>📥 Backlog General</option>
              <option value="done" style={{ background: 'var(--bg-card)', color: 'var(--text-high)' }}>✅ Completadas</option>
            </optgroup>

            {activeHubs.length > 0 && (
              <optgroup label="Por Hub Maestro (Bóveda)">
                {activeHubs.map((h) => (
                  <option key={h} value={`hub:${h}`} style={{ background: 'var(--bg-card)', color: 'var(--text-high)' }}>
                    📁 Hub: {h}
                  </option>
                ))}
              </optgroup>
            )}

            {availableProjects.filter((p) => p !== 'Todos').length > 0 && (
              <optgroup label="Por Proyecto / Contexto">
                {availableProjects
                  .filter((p) => p !== 'Todos')
                  .map((p) => (
                    <option key={p} value={`project:${p}`} style={{ background: 'var(--bg-card)', color: 'var(--text-high)' }}>
                      📦 Proyecto: {p}
                    </option>
                  ))}
              </optgroup>
            )}
          </select>
        </div>

        <span style={{ fontSize: '0.66rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: data.color, flexShrink: 0 }}>
          {data.tasks.length}
        </span>
      </div>

      {/* Lista de Tareas */}
      <div style={{ padding: '0.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {data.tasks.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
            Sin tareas en este cuadrante
          </div>
        ) : (
          data.tasks.map((task) => (
            <TaskCard key={task.id} task={task} onToggle={onToggle} onSelectTask={onSelectTask} compact />
          ))
        )}
      </div>
    </div>
  );
}
export default ConfigurableMatrixQuadrant;
