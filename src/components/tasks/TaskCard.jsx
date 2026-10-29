import { CheckSquare, FileText, Flame, Calendar } from 'lucide-react';

export function TaskCard({ task, onToggle, compact = false, highlight = false }) {
  const theme = task.theme || {
    icon: '📁',
    color: '#94a3b8',
    border: 'rgba(148, 163, 184, 0.3)',
    bg: 'rgba(148, 163, 184, 0.1)'
  };

  return (
    <div
      onClick={() => onToggle(task)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: compact ? '7px 9px' : '8px 12px',
        borderRadius: '6px',
        background: task.completed
          ? 'rgba(15, 20, 18, 0.4)'
          : highlight
          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(20, 24, 22, 0.85) 100%)'
          : 'linear-gradient(135deg, rgba(26, 32, 29, 0.75) 0%, rgba(18, 22, 21, 0.85) 100%)',
        border: highlight
          ? '1px solid rgba(245, 158, 11, 0.35)'
          : task.completed
          ? '1px solid rgba(255, 255, 255, 0.05)'
          : '1px solid rgba(52, 211, 153, 0.15)',
        boxShadow: highlight
          ? '0 2px 10px rgba(245, 158, 11, 0.08)'
          : task.completed
          ? 'none'
          : '0 2px 8px rgba(0, 0, 0, 0.25)',
        cursor: 'pointer',
        transition: 'all 0.16s ease',
        gap: '9px',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        if (!task.completed) {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.45)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4), 0 0 10px rgba(52, 211, 153, 0.12)';
        }
      }}
      onMouseLeave={(e) => {
        if (!task.completed) {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.borderColor = highlight ? 'rgba(245, 158, 11, 0.35)' : 'rgba(52, 211, 153, 0.15)';
          e.currentTarget.style.boxShadow = highlight ? '0 2px 10px rgba(245, 158, 11, 0.08)' : '0 2px 8px rgba(0, 0, 0, 0.25)';
        }
      }}
    >
      {/* Tira lateral de acento de proyecto */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '3px',
          background: task.completed ? 'transparent' : theme.color,
          opacity: task.completed ? 0.3 : 0.85
        }}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1, minWidth: 0, paddingLeft: '4px' }}>
        {/* Checkbox táctico interactivo */}
        <div
          style={{
            marginTop: '2px',
            color: task.completed ? '#10b981' : 'var(--text-muted)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease'
          }}
        >
          {task.completed ? (
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1.5px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 6px rgba(16, 185, 129, 0.3)'
              }}
            >
              <CheckSquare size={13} color="#34d399" />
            </div>
          ) : (
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1.5px solid rgba(148, 163, 184, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
          )}
        </div>

        {/* Texto y Metadatos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0, flex: 1 }}>
          {/* Fila de Badges */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '5px' }}>
            {/* Chip de Proyecto */}
            <span
              style={{
                fontSize: '0.62rem',
                fontWeight: 800,
                color: theme.color,
                background: theme.bg,
                border: `1px solid ${theme.border}`,
                padding: '1px 6px',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                letterSpacing: '0.02em',
                textTransform: 'uppercase'
              }}
            >
              <span>{theme.icon}</span>
              <span>{task.project}</span>
            </span>

            {/* Badge de Prioridad Alta */}
            {task.priority === 'high' && !task.completed && (
              <span
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  color: '#fbbf24',
                  background: 'rgba(245, 158, 11, 0.18)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                  boxShadow: '0 0 6px rgba(245, 158, 11, 0.2)'
                }}
              >
                <Flame size={10} color="#fbbf24" />
                ALTA
              </span>
            )}

            {/* Badge de Fecha Límite */}
            {task.dueDate && (
              <span
                style={{
                  fontSize: '0.6rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 600,
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.14)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                <Calendar size={10} />
                {task.dueDate}
              </span>
            )}

            {/* Badges de Tags */}
            {task.tags &&
              task.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: '0.58rem',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontWeight: 600,
                    color: '#c084fc',
                    background: 'rgba(168, 85, 247, 0.12)',
                    border: '1px solid rgba(168, 85, 247, 0.25)',
                    padding: '1px 5px',
                    borderRadius: '4px'
                  }}
                >
                  #{tag}
                </span>
              ))}
          </div>

          {/* Texto de la tarea */}
          <span
            style={{
              fontSize: compact ? '0.76rem' : '0.82rem',
              color: task.completed ? 'var(--text-muted)' : '#f1f5f9',
              textDecoration: task.completed ? 'line-through' : 'none',
              fontWeight: task.completed ? 400 : 500,
              lineHeight: '1.4',
              wordBreak: 'break-word',
              letterSpacing: '0.01em'
            }}
          >
            {task.cleanText}
          </span>

          {/* Archivo y Línea de origen */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.62rem', color: '#64748b', marginTop: '1px' }}>
            <FileText size={10} color="#64748b" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.file_name}
            </span>
            <span>•</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', color: '#94a3b8' }}>L{task.line_number}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
export default TaskCard;
