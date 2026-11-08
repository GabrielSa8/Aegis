import React, { useState } from 'react';
import { FolderGit2, ChevronDown, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { ProjectKanbanSwimlane } from './ProjectKanbanSwimlane';
import { KanbanColumn } from './KanbanColumn';
import { resolveProjectTheme } from './taskHelpers';

export function KanbanBoard({
  kanbanLayout,
  groupBy,
  tasksHierarchy,
  tasksByProject,
  collapsedHubs,
  toggleHubCollapse,
  collapsedProjects,
  toggleProjectCollapse,
  kanbanColumns,
  customizations,
  onToggle,
  onSetStatus,
  onSelectTask,
  onAddTask
}) {
  const [maximizedProject, setMaximizedProject] = useState(null);

  if (kanbanLayout === 'swimlanes') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Banner de Proyecto Enfocado/Agrandado */}
        {maximizedProject && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.45rem 0.85rem',
              background: 'color-mix(in srgb, var(--primary) 14%, transparent)',
              border: '1px solid color-mix(in srgb, var(--primary) 35%, transparent)',
              borderRadius: '6px',
              fontSize: '0.74rem',
              color: 'var(--text-high)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Maximize2 size={13} color="var(--primary)" />
              <span>Vista enfocada en proyecto: <strong style={{ color: 'var(--primary)', letterSpacing: '0.02em' }}>{maximizedProject}</strong></span>
            </div>
            <button
              type="button"
              onClick={() => setMaximizedProject(null)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'color-mix(in srgb, var(--bg-card) 80%, transparent)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '3px 8px',
                color: 'var(--text-high)',
                fontSize: '0.66rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Minimize2 size={11} />
              <span>Ver todos los proyectos</span>
            </button>
          </div>
        )}

        {groupBy === 'hub_project' ? (
          /* Swimlanes agrupadas dentro de cada Hub */
          Object.entries(tasksHierarchy)
            .filter(([_, projectsMap]) => !maximizedProject || Object.keys(projectsMap).includes(maximizedProject))
            .map(([hubName, projectsMap]) => {
            const isHubCollapsed = collapsedHubs.has(hubName);
            const allHubTasks = Object.values(projectsMap).flat();
            const hubTotal = allHubTasks.length;
            const hubDone = allHubTasks.filter((t) => t.completed || t.status === 'done').length;
            const hubPercent = hubTotal > 0 ? Math.round((hubDone / hubTotal) * 100) : 0;

            const visibleProjects = Object.entries(projectsMap).filter(
              ([projectName]) => !maximizedProject || projectName === maximizedProject
            );

            return (
              <div
                key={hubName}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-lg)'
                }}
              >
                {/* Banner del Hub */}
                <div
                  onClick={() => toggleHubCollapse(hubName)}
                  className="task-group-header task-hub-header"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.95rem',
                    background: 'color-mix(in srgb, var(--text-high) 2%, transparent)',
                    borderBottom: isHubCollapsed ? 'none' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isHubCollapsed ? <ChevronRight size={15} color="var(--text-muted)" /> : <ChevronDown size={15} color="var(--primary)" />}
                    <FolderGit2 size={15} color="var(--primary)" />
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-high)' }}>
                      {hubName}
                    </span>
                    <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                      ({Object.keys(projectsMap).length} proyectos • {hubTotal} tareas)
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '60px', height: '4px', background: 'color-mix(in srgb, var(--text-high) 6%, transparent)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${hubPercent}%`, height: '100%', background: 'var(--primary)' }} />
                    </div>
                    <span style={{ fontSize: '0.66rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {hubDone}/{hubTotal} ({hubPercent}%)
                    </span>
                  </div>
                </div>

                {/* Swimlanes de Proyectos */}
                {!isHubCollapsed && (
                  <div style={{ padding: '0.65rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {visibleProjects.map(([projectName, projTasks]) => {
                      const projKey = `${hubName}::${projectName}`;
                      const isProjCollapsed = collapsedProjects.has(projKey);
                      const pTotal = projTasks.length;
                      const pDone = projTasks.filter((t) => t.completed || t.status === 'done').length;
                      const pPercent = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0;
                      const theme = projTasks[0]?.theme || resolveProjectTheme(projectName, customizations);

                      const pTodo = [];
                      const pInProgress = [];
                      const pCompleted = [];
                      projTasks.forEach((t) => {
                        if (t.status === 'done' || t.completed) pCompleted.push(t);
                        else if (t.status === 'in_progress') pInProgress.push(t);
                        else pTodo.push(t);
                      });

                      return (
                        <ProjectKanbanSwimlane
                          key={projectName}
                          projectName={projectName}
                          theme={theme}
                          pTotal={pTotal}
                          pDone={pDone}
                          pPercent={pPercent}
                          isCollapsed={isProjCollapsed}
                          onToggleCollapse={() => toggleProjectCollapse(projKey)}
                          todoTasks={pTodo}
                          inProgressTasks={pInProgress}
                          doneTasks={pCompleted}
                          onToggleTask={onToggle}
                          onSetStatus={onSetStatus}
                          onSelectTask={onSelectTask}
                          onAddTask={onAddTask}
                          isMaximized={maximizedProject === projectName}
                          onToggleMaximize={() => setMaximizedProject(maximizedProject === projectName ? null : projectName)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          /* Swimlanes directas por Proyecto */
          Object.entries(tasksByProject)
            .filter(([projectName]) => !maximizedProject || projectName === maximizedProject)
            .map(([projectName, projTasks]) => {
            const isProjCollapsed = collapsedProjects.has(projectName);
            const pTotal = projTasks.length;
            const pDone = projTasks.filter((t) => t.completed || t.status === 'done').length;
            const pPercent = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0;
            const theme = projTasks[0]?.theme || resolveProjectTheme(projectName, customizations);

            const pTodo = [];
            const pInProgress = [];
            const pCompleted = [];
            projTasks.forEach((t) => {
              if (t.status === 'done' || t.completed) pCompleted.push(t);
              else if (t.status === 'in_progress') pInProgress.push(t);
              else pTodo.push(t);
            });

            return (
              <ProjectKanbanSwimlane
                key={projectName}
                projectName={projectName}
                theme={theme}
                pTotal={pTotal}
                pDone={pDone}
                pPercent={pPercent}
                isCollapsed={isProjCollapsed}
                onToggleCollapse={() => toggleProjectCollapse(projectName)}
                todoTasks={pTodo}
                inProgressTasks={pInProgress}
                doneTasks={pCompleted}
                onToggleTask={onToggle}
                onSetStatus={onSetStatus}
                onSelectTask={onSelectTask}
                onAddTask={onAddTask}
                isMaximized={maximizedProject === projectName}
                onToggleMaximize={() => setMaximizedProject(maximizedProject === projectName ? null : projectName)}
              />
            );
          })
        )}
      </div>
    );
  }

  /* Sub-modo B: 3 Columnas Globales Oficiales Kanban (Por Hacer, En Proceso, Completadas) */
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
        gap: '0.85rem',
        alignItems: 'start'
      }}
    >
      <KanbanColumn
        title="📥 Por Hacer"
        statusKey="todo"
        count={kanbanColumns.todo.length}
        tasks={kanbanColumns.todo}
        onToggle={onToggle}
        onSetStatus={onSetStatus}
        onSelectTask={onSelectTask}
        headerColor="var(--text-high)"
        accentColor="var(--border-color)"
        emptyMessage="Sin tareas en cola"
      />

      <KanbanColumn
        title="⚡ En Proceso"
        statusKey="in_progress"
        count={kanbanColumns.inProgress.length}
        tasks={kanbanColumns.inProgress}
        onToggle={onToggle}
        onSetStatus={onSetStatus}
        onSelectTask={onSelectTask}
        headerColor="var(--accent)"
        accentColor="color-mix(in srgb, var(--accent) 45%, transparent)"
        highlight
        wipLimit={5}
        emptyMessage="Sin tareas en proceso. Arrastra o inicia una aquí."
      />

      <KanbanColumn
        title="✅ Completadas"
        statusKey="done"
        count={kanbanColumns.done.length}
        tasks={kanbanColumns.done}
        onToggle={onToggle}
        onSetStatus={onSetStatus}
        onSelectTask={onSelectTask}
        headerColor="var(--primary)"
        accentColor="color-mix(in srgb, var(--primary) 35%, transparent)"
        emptyMessage="Aún no has completado tareas hoy"
      />
    </div>
  );
}
export default KanbanBoard;
