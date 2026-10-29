import { TaskCard } from './TaskCard';

export function ConfigurableMatrixQuadrant({
  quadrantId,
  currentConfig,
  data,
  onConfigChange,
  activeHubs,
  availableProjects,
  onToggle
}) {
  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(20, 26, 24, 0.8) 0%, rgba(14, 18, 17, 0.9) 100%)',
        border: `1px solid ${data.borderColor}`,
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '220px',
        boxShadow: '0 4px 14px rgba(0,0,0,0.25)'
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
              background: 'rgba(0, 0, 0, 0.4)',
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
              <option value="urgent" style={{ background: '#131716', color: '#fbbf24' }}>🚨 Urgente & Crítico</option>
              <option value="focus" style={{ background: '#131716', color: '#f97316' }}>🔥 En Foco</option>
              <option value="backlog" style={{ background: '#131716', color: '#94a3b8' }}>📥 Backlog General</option>
              <option value="done" style={{ background: '#131716', color: '#10b981' }}>✅ Completadas</option>
            </optgroup>

            {activeHubs.length > 0 && (
              <optgroup label="Por Hub Maestro (Bóveda)">
                {activeHubs.map((h) => (
                  <option key={h} value={`hub:${h}`} style={{ background: '#131716', color: '#34d399' }}>
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
                    <option key={p} value={`project:${p}`} style={{ background: '#131716', color: '#38bdf8' }}>
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
            <TaskCard key={task.id} task={task} onToggle={onToggle} compact />
          ))
        )}
      </div>
    </div>
  );
}
export default ConfigurableMatrixQuadrant;
