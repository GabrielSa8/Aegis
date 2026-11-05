import { ChevronDown, ChevronRight, Flame } from 'lucide-react';
import { TaskCard } from './TaskCard';

export function ProjectKanbanSwimlane({
  projectName,
  theme,
  pTotal,
  pDone,
  pPercent,
  isCollapsed,
  onToggleCollapse,
  todoTasks,
  focusTasks,
  doneTasks,
  onToggleTask,
  onSelectTask
}) {
  return (
    <div
      style={{
        background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
        border: `1px solid ${theme.border}`,
        borderRadius: '7px',
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
      }}
    >
      {/* Cabecera del Swimlane */}
      <div
        onClick={onToggleCollapse}
        className="task-group-header task-swimlane-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.45rem 0.8rem',
          background: theme.bg,
          borderBottom: isCollapsed ? 'none' : `1px solid ${theme.border}`,
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          {isCollapsed ? <ChevronRight size={13} color="var(--text-muted)" /> : <ChevronDown size={13} color={theme.color} />}
          <span style={{ fontSize: '0.9rem' }}>{theme.icon}</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: theme.color, letterSpacing: '0.02em' }}>
            {projectName}
          </span>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
            ({pTotal} {pTotal === 1 ? 'tarea' : 'tareas'})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '55px', height: '4px', background: 'color-mix(in srgb, var(--text-high) 8%, transparent)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${pPercent}%`, height: '100%', background: theme.color, transition: 'width 0.3s ease' }} />
          </div>
          <span style={{ fontSize: '0.64rem', color: theme.color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            {pDone}/{pTotal} ({pPercent}%)
          </span>
        </div>
      </div>

      {/* 3 Columnas del Swimlane */}
      {!isCollapsed && (
        <div
          style={{
            padding: '0.55rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '0.55rem',
            background: 'color-mix(in srgb, var(--bg-main) 40%, transparent)'
          }}
        >
          {/* Por Hacer */}
          <div
            style={{
              background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
              border: '1px solid var(--border-color)',
              borderRadius: '5px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                padding: '4px 8px',
                background: 'color-mix(in srgb, var(--text-high) 2%, transparent)',
                borderBottom: '1px solid var(--border-color)',
                fontSize: '0.66rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span>📥 Por Hacer</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem' }}>{todoTasks.length}</span>
            </div>
            <div style={{ padding: '4px', display: 'flex', flexDirection: 'column', gap: '3px', minHeight: '50px' }}>
              {todoTasks.length === 0 ? (
                <div style={{ padding: '0.6rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.66rem', opacity: 0.6 }}>
                  Sin tareas en cola
                </div>
              ) : (
                todoTasks.map((t) => <TaskCard key={t.id} task={t} onToggle={onToggleTask} onSelectTask={onSelectTask} compact />)
              )}
            </div>
          </div>

          {/* En Foco */}
          <div
            style={{
              background: 'color-mix(in srgb, var(--warning) 6%, transparent)',
              border: '1px solid color-mix(in srgb, var(--warning) 25%, transparent)',
              borderRadius: '5px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                padding: '4px 8px',
                background: 'color-mix(in srgb, var(--warning) 10%, transparent)',
                borderBottom: '1px solid color-mix(in srgb, var(--warning) 25%, transparent)',
                fontSize: '0.66rem',
                fontWeight: 700,
                color: 'var(--warning)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Flame size={11} color="var(--warning)" />
                🔥 En Foco
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem' }}>{focusTasks.length}</span>
            </div>
            <div style={{ padding: '4px', display: 'flex', flexDirection: 'column', gap: '3px', minHeight: '50px' }}>
              {focusTasks.length === 0 ? (
                <div style={{ padding: '0.6rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.66rem', opacity: 0.6 }}>
                  Sin tareas urgentes
                </div>
              ) : (
                focusTasks.map((t) => <TaskCard key={t.id} task={t} onToggle={onToggleTask} onSelectTask={onSelectTask} compact highlight />)
              )}
            </div>
          </div>

          {/* Completadas */}
          <div
            style={{
              background: 'color-mix(in srgb, var(--primary) 6%, transparent)',
              border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
              borderRadius: '5px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                padding: '4px 8px',
                background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                borderBottom: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
                fontSize: '0.66rem',
                fontWeight: 700,
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span>✅ Completadas</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem' }}>{doneTasks.length}</span>
            </div>
            <div style={{ padding: '4px', display: 'flex', flexDirection: 'column', gap: '3px', minHeight: '50px' }}>
              {doneTasks.length === 0 ? (
                <div style={{ padding: '0.6rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.66rem', opacity: 0.6 }}>
                  Sin completadas
                </div>
              ) : (
                doneTasks.map((t) => <TaskCard key={t.id} task={t} onToggle={onToggleTask} onSelectTask={onSelectTask} compact />)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default ProjectKanbanSwimlane;
