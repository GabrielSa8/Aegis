import { useMemo } from 'react';
import { TaskCard } from './TaskCard';

export function KanbanColumn({
  title,
  count,
  tasks,
  onToggle,
  onSelectTask,
  headerColor,
  accentColor,
  highlight = false,
  emptyMessage
}) {
  const grouped = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      if (!map[t.project]) map[t.project] = [];
      map[t.project].push(t);
    });
    return map;
  }, [tasks]);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${accentColor}`,
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 180px)',
        boxShadow: highlight ? '0 0 16px color-mix(in srgb, var(--warning) 12%, transparent)' : 'var(--shadow-lg)'
      }}
    >
      <div
        style={{
          padding: '0.55rem 0.85rem',
          background: highlight ? 'color-mix(in srgb, var(--warning) 12%, transparent)' : 'color-mix(in srgb, var(--text-high) 2%, transparent)',
          borderBottom: `1px solid ${accentColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: headerColor }}>
          {title} ({count})
        </span>
      </div>

      <div style={{ padding: '0.55rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {tasks.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
            {emptyMessage}
          </div>
        ) : (
          Object.entries(grouped).map(([project, projTasks]) => {
            const theme = projTasks[0]?.theme || {
              icon: '📁',
              color: 'var(--text-muted)',
              border: 'var(--border-color)'
            };
            return (
              <div key={project} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div
                  style={{
                    fontSize: '0.64rem',
                    fontWeight: 800,
                    color: theme.color,
                    padding: '2px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: `1px dashed ${theme.border}`,
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{theme.icon}</span>
                    <span>{project}</span>
                  </div>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>({projTasks.length})</span>
                </div>
                {projTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onToggle={onToggle} onSelectTask={onSelectTask} compact highlight={highlight} />
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
export default KanbanColumn;
