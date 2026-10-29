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
  onToggleTask
}) {
  return (
    <div
      style={{
        background: 'rgba(0, 0, 0, 0.32)',
        border: `1px solid ${theme.border}`,
        borderRadius: '7px',
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
      }}
    >
      {/* Cabecera del Swimlane */}
      <div
        onClick={onToggleCollapse}
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
          {isCollapsed ? <ChevronRight size={13} color="#94a3b8" /> : <ChevronDown size={13} color={theme.color} />}
          <span style={{ fontSize: '0.9rem' }}>{theme.icon}</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: theme.color, letterSpacing: '0.02em' }}>
            {projectName}
          </span>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
            ({pTotal} {pTotal === 1 ? 'tarea' : 'tareas'})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '55px', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
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
            background: 'rgba(0, 0, 0, 0.18)'
          }}
        >
          {/* Por Hacer */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(148, 163, 184, 0.15)',
              borderRadius: '5px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                padding: '4px 8px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
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
                todoTasks.map((t) => <TaskCard key={t.id} task={t} onToggle={onToggleTask} compact />)
              )}
            </div>
          </div>

          {/* En Foco */}
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.04)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: '5px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                padding: '4px 8px',
                background: 'rgba(245, 158, 11, 0.08)',
                borderBottom: '1px solid rgba(245, 158, 11, 0.25)',
                fontSize: '0.66rem',
                fontWeight: 700,
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Flame size={11} color="#fbbf24" />
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
                focusTasks.map((t) => <TaskCard key={t.id} task={t} onToggle={onToggleTask} compact highlight />)
              )}
            </div>
          </div>

          {/* Completadas */}
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.03)',
              border: '1px solid rgba(16, 185, 129, 0.18)',
              borderRadius: '5px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                padding: '4px 8px',
                background: 'rgba(16, 185, 129, 0.06)',
                borderBottom: '1px solid rgba(16, 185, 129, 0.18)',
                fontSize: '0.66rem',
                fontWeight: 700,
                color: '#34d399',
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
                doneTasks.map((t) => <TaskCard key={t.id} task={t} onToggle={onToggleTask} compact />)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default ProjectKanbanSwimlane;
