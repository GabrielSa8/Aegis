import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { SwimlaneColumn } from './SwimlaneColumn';

export function ProjectKanbanSwimlane({
  projectName,
  theme,
  pTotal,
  pDone,
  pPercent,
  isCollapsed,
  onToggleCollapse,
  todoTasks = [],
  inProgressTasks = [],
  doneTasks = [],
  onToggleTask,
  onSetStatus,
  onSelectTask,
  onAddTask,
  isMaximized = false,
  onToggleMaximize
}) {
  const [expandedColumn, setExpandedColumn] = useState(null); // null | 'todo' | 'in_progress' | 'done'
  const columnHeight = isMaximized ? 'calc(100vh - 270px)' : '320px';

  // Obtener ruta del archivo del proyecto para creación rápida de tareas
  const sampleTask = todoTasks[0] || inProgressTasks[0] || doneTasks[0];
  const filePath = sampleTask?.file_path;

  return (
    <div
      style={{
        background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
        border: isMaximized ? `1.5px solid ${theme.color}` : `1px solid ${theme.border}`,
        borderRadius: '7px',
        overflow: 'hidden',
        boxShadow: isMaximized ? `0 4px 20px color-mix(in srgb, ${theme.color} 20%, transparent)` : '0 2px 10px rgba(0,0,0,0.2)',
        transition: 'all 0.2s ease'
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

          {onToggleMaximize && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMaximize();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: isMaximized ? 'color-mix(in srgb, var(--primary) 22%, transparent)' : 'color-mix(in srgb, var(--text-high) 6%, transparent)',
                border: isMaximized ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '2px 7px',
                color: isMaximized ? 'var(--primary)' : 'var(--text-muted)',
                fontSize: '0.62rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title={isMaximized ? 'Restaurar vista con todos los proyectos' : `Agrandar y enfocar únicamente ${projectName}`}
            >
              {isMaximized ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
              <span>{isMaximized ? 'Restaurar' : 'Agrandar'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Columnas del Swimlane: Triada Oficial Kanban */}
      {!isCollapsed && (
        <div
          style={{
            padding: '0.55rem',
            display: 'grid',
            gridTemplateColumns: expandedColumn ? '1fr' : 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '0.55rem',
            background: 'color-mix(in srgb, var(--bg-main) 40%, transparent)'
          }}
        >
          {/* Columna 1: 📥 Por Hacer */}
          {(!expandedColumn || expandedColumn === 'todo') && (
            <SwimlaneColumn
              title="📥 Por Hacer"
              statusKey="todo"
              tasks={todoTasks}
              onToggleTask={onToggleTask}
              onSetStatus={onSetStatus}
              onSelectTask={onSelectTask}
              accentColor="var(--border-color)"
              headerBg="color-mix(in srgb, var(--text-high) 2%, transparent)"
              isExpanded={expandedColumn === 'todo'}
              onToggleExpand={() => setExpandedColumn(expandedColumn === 'todo' ? null : 'todo')}
              emptyMessage="Sin tareas en cola"
              columnHeight={columnHeight}
              onAddTask={onAddTask}
              filePath={filePath}
            />
          )}

          {/* Columna 2: ⚡ En Proceso (Con Límite WIP de 4 tareas) */}
          {(!expandedColumn || expandedColumn === 'in_progress') && (
            <SwimlaneColumn
              title="⚡ En Proceso"
              statusKey="in_progress"
              tasks={inProgressTasks}
              onToggleTask={onToggleTask}
              onSetStatus={onSetStatus}
              onSelectTask={onSelectTask}
              accentColor="color-mix(in srgb, var(--accent) 35%, transparent)"
              headerBg="color-mix(in srgb, var(--accent) 12%, transparent)"
              isExpanded={expandedColumn === 'in_progress'}
              onToggleExpand={() => setExpandedColumn(expandedColumn === 'in_progress' ? null : 'in_progress')}
              emptyMessage="Sin tareas en proceso. Arrastra una aquí."
              columnHeight={columnHeight}
              wipLimit={4}
            />
          )}

          {/* Columna 3: ✅ Completadas */}
          {(!expandedColumn || expandedColumn === 'done') && (
            <SwimlaneColumn
              title="✅ Completadas"
              statusKey="done"
              tasks={doneTasks}
              onToggleTask={onToggleTask}
              onSetStatus={onSetStatus}
              onSelectTask={onSelectTask}
              accentColor="color-mix(in srgb, var(--primary) 25%, transparent)"
              headerBg="color-mix(in srgb, var(--primary) 10%, transparent)"
              isExpanded={expandedColumn === 'done'}
              onToggleExpand={() => setExpandedColumn(expandedColumn === 'done' ? null : 'done')}
              emptyMessage="Sin tareas completadas aún"
              columnHeight={columnHeight}
            />
          )}
        </div>
      )}
    </div>
  );
}
export default ProjectKanbanSwimlane;
