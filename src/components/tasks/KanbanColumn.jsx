import { useState, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { TaskCard } from './TaskCard';

export function KanbanColumn({
  title,
  statusKey,
  count,
  tasks = [],
  onToggle,
  onSetStatus,
  onSelectTask,
  headerColor,
  accentColor,
  highlight = false,
  emptyMessage,
  wipLimit
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const isWipExceeded = wipLimit && count > wipLimit;

  const grouped = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      if (!map[t.project]) map[t.project] = [];
      map[t.project].push(t);
    });
    return map;
  }, [tasks]);

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const raw = e.dataTransfer.getData('application/json');
      if (raw) {
        const item = JSON.parse(raw);
        if (item && onSetStatus) {
          onSetStatus(item, statusKey);
        }
      }
    } catch (_) {}
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        background: isDragOver
          ? 'color-mix(in srgb, var(--primary) 10%, var(--bg-card))'
          : 'var(--bg-card)',
        border: isDragOver
          ? '1.5px dashed var(--primary)'
          : `1px solid ${accentColor}`,
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 180px)',
        boxShadow: isDragOver
          ? '0 0 20px color-mix(in srgb, var(--primary) 25%, transparent)'
          : highlight
          ? '0 0 16px color-mix(in srgb, var(--accent) 15%, transparent)'
          : 'var(--shadow-lg)',
        transition: 'all 0.15s ease'
      }}
    >
      <div
        style={{
          padding: '0.55rem 0.85rem',
          background: highlight
            ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
            : 'color-mix(in srgb, var(--text-high) 2%, transparent)',
          borderBottom: `1px solid ${accentColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: headerColor }}>
          {title} ({count})
        </span>

        {isWipExceeded && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '0.62rem',
              color: 'var(--warning)',
              fontWeight: 700
            }}
            title={`Atención: Límite WIP sugerido superado (${count}/${wipLimit})`}
          >
            <AlertCircle size={11} color="var(--warning)" />
            WIP!
          </span>
        )}
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
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={onToggle}
                    onSetStatus={onSetStatus}
                    onSelectTask={onSelectTask}
                    compact
                    highlight={highlight}
                  />
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
