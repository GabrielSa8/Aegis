import { FolderGit2, ChevronDown, ChevronRight } from 'lucide-react';
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
  onSelectTask
}) {
  if (kanbanLayout === 'swimlanes') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {groupBy === 'hub_project' ? (
          /* Swimlanes agrupadas dentro de cada Hub */
          Object.entries(tasksHierarchy).map(([hubName, projectsMap]) => {
            const isHubCollapsed = collapsedHubs.has(hubName);
            const allHubTasks = Object.values(projectsMap).flat();
            const hubTotal = allHubTasks.length;
            const hubDone = allHubTasks.filter((t) => t.completed).length;
            const hubPercent = hubTotal > 0 ? Math.round((hubDone / hubTotal) * 100) : 0;

            return (
              <div
                key={hubName}
                style={{
                  background: 'linear-gradient(180deg, rgba(20, 26, 24, 0.85) 0%, rgba(14, 18, 17, 0.95) 100%)',
                  border: '1px solid rgba(52, 211, 153, 0.22)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
                }}
              >
                {/* Banner del Hub */}
                <div
                  onClick={() => toggleHubCollapse(hubName)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.95rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderBottom: isHubCollapsed ? 'none' : '1px solid rgba(52, 211, 153, 0.15)',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isHubCollapsed ? <ChevronRight size={15} color="#94a3b8" /> : <ChevronDown size={15} color="#34d399" />}
                    <FolderGit2 size={15} color="#34d399" />
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#f1f5f9' }}>
                      {hubName}
                    </span>
                    <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                      ({Object.keys(projectsMap).length} proyectos • {hubTotal} tareas)
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '60px', height: '4px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${hubPercent}%`, height: '100%', background: '#10b981' }} />
                    </div>
                    <span style={{ fontSize: '0.66rem', color: '#34d399', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {hubDone}/{hubTotal} ({hubPercent}%)
                    </span>
                  </div>
                </div>

                {/* Swimlanes de Proyectos */}
                {!isHubCollapsed && (
                  <div style={{ padding: '0.65rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {Object.entries(projectsMap).map(([projectName, projTasks]) => {
                      const projKey = `${hubName}::${projectName}`;
                      const isProjCollapsed = collapsedProjects.has(projKey);
                      const pTotal = projTasks.length;
                      const pDone = projTasks.filter((t) => t.completed).length;
                      const pPercent = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0;
                      const theme = projTasks[0]?.theme || resolveProjectTheme(projectName, customizations);

                      const pTodo = [];
                      const pFocus = [];
                      const pCompleted = [];
                      projTasks.forEach((t) => {
                        if (t.completed) pCompleted.push(t);
                        else if (t.priority === 'high' || t.dueDate) pFocus.push(t);
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
                          focusTasks={pFocus}
                          doneTasks={pCompleted}
                          onToggleTask={onToggle}
                          onSelectTask={onSelectTask}
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
          Object.entries(tasksByProject).map(([projectName, projTasks]) => {
            const isProjCollapsed = collapsedProjects.has(projectName);
            const pTotal = projTasks.length;
            const pDone = projTasks.filter((t) => t.completed).length;
            const pPercent = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0;
            const theme = projTasks[0]?.theme || resolveProjectTheme(projectName, customizations);

            const pTodo = [];
            const pFocus = [];
            const pCompleted = [];
            projTasks.forEach((t) => {
              if (t.completed) pCompleted.push(t);
              else if (t.priority === 'high' || t.dueDate) pFocus.push(t);
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
                focusTasks={pFocus}
                doneTasks={pCompleted}
                onToggleTask={onToggle}
                onSelectTask={onSelectTask}
              />
            );
          })
        )}
      </div>
    );
  }

  /* Sub-modo B: 3 Columnas Globales (agrupadas con badges por Proyecto) */
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
        count={kanbanColumns.todo.length}
        tasks={kanbanColumns.todo}
        onToggle={onToggle}
        onSelectTask={onSelectTask}
        headerColor="var(--text-high)"
        accentColor="rgba(148, 163, 184, 0.3)"
        emptyMessage="Sin tareas en cola"
      />

      <KanbanColumn
        title="🔥 En Foco / Urgente"
        count={kanbanColumns.focus.length}
        tasks={kanbanColumns.focus}
        onToggle={onToggle}
        onSelectTask={onSelectTask}
        headerColor="#fbbf24"
        accentColor="rgba(245, 158, 11, 0.4)"
        highlight
        emptyMessage="Sin tareas urgentes en foco"
      />

      <KanbanColumn
        title="✅ Completadas"
        count={kanbanColumns.done.length}
        tasks={kanbanColumns.done}
        onToggle={onToggle}
        onSelectTask={onSelectTask}
        headerColor="#34d399"
        accentColor="rgba(16, 185, 129, 0.3)"
        emptyMessage="Aún no has completado tareas hoy"
      />
    </div>
  );
}
export default KanbanBoard;
