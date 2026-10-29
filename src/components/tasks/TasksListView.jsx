import { FolderGit2, ChevronDown, ChevronRight } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { resolveProjectTheme } from './taskHelpers';

export function TasksListView({
  groupBy,
  tasksHierarchy,
  tasksByProject,
  tasksByHub,
  collapsedHubs,
  toggleHubCollapse,
  collapsedProjects,
  toggleProjectCollapse,
  customizations,
  onToggle
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {groupBy === 'hub_project' ? (
        /* Jerárquico: Hub > Proyecto > Tareas */
        Object.entries(tasksHierarchy).map(([hubName, projectsMap]) => {
          const isHubCollapsed = collapsedHubs.has(hubName);
          const allHubTasks = Object.values(projectsMap).flat();
          const hubTotal = allHubTasks.length;
          const hubDone = allHubTasks.filter((t) => t.completed).length;
          const hubPercent = hubTotal > 0 ? Math.round((hubDone / hubTotal) * 100) : 0;
          const projectCount = Object.keys(projectsMap).length;

          return (
            <div
              key={hubName}
              style={{
                background: 'linear-gradient(180deg, rgba(22, 28, 25, 0.8) 0%, rgba(15, 19, 18, 0.9) 100%)',
                border: '1px solid rgba(52, 211, 153, 0.2)',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 4px 14px rgba(0,0,0,0.25)'
              }}
            >
              {/* Cabecera del Hub */}
              <div
                onClick={() => toggleHubCollapse(hubName)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.95rem',
                  background: 'rgba(255, 255, 255, 0.025)',
                  borderBottom: isHubCollapsed ? 'none' : '1px solid rgba(52, 211, 153, 0.15)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isHubCollapsed ? <ChevronRight size={15} color="#94a3b8" /> : <ChevronDown size={15} color="#34d399" />}
                  <FolderGit2 size={15} color="#34d399" />
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-high)' }}>
                    {hubName}
                  </span>
                  <span
                    style={{
                      fontSize: '0.64rem',
                      color: 'var(--text-muted)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      padding: '1px 6px',
                      borderRadius: '4px'
                    }}
                  >
                    {projectCount} {projectCount === 1 ? 'proyecto' : 'proyectos'} • {hubTotal} tareas
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '70px', height: '5px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${hubPercent}%`, height: '100%', background: '#10b981', transition: 'width 0.3s ease' }} />
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#34d399', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {hubDone}/{hubTotal} ({hubPercent}%)
                  </span>
                </div>
              </div>

              {/* Bloques de Proyectos dentro del Hub */}
              {!isHubCollapsed && (
                <div style={{ padding: '0.6rem 0.8rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {Object.entries(projectsMap).map(([projectName, projTasks]) => {
                    const projKey = `${hubName}::${projectName}`;
                    const isProjCollapsed = collapsedProjects.has(projKey);
                    const pTotal = projTasks.length;
                    const pDone = projTasks.filter((t) => t.completed).length;
                    const pPercent = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0;
                    const theme = projTasks[0]?.theme || resolveProjectTheme(projectName, customizations);

                    return (
                      <div
                        key={projectName}
                        style={{
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: `1px solid ${theme.border}`,
                          borderRadius: '6px',
                          overflow: 'hidden'
                        }}
                      >
                        {/* Cabecera del Proyecto */}
                        <div
                          onClick={() => toggleProjectCollapse(projKey)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.45rem 0.75rem',
                            background: theme.bg,
                            borderBottom: isProjCollapsed ? 'none' : `1px solid ${theme.border}`,
                            cursor: 'pointer',
                            userSelect: 'none'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {isProjCollapsed ? <ChevronRight size={13} color="#94a3b8" /> : <ChevronDown size={13} color={theme.color} />}
                            <span style={{ fontSize: '0.85rem' }}>{theme.icon}</span>
                            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: theme.color, letterSpacing: '0.02em' }}>
                              {projectName}
                            </span>
                            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                              ({pTotal} {pTotal === 1 ? 'tarea' : 'tareas'})
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '50px', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ width: `${pPercent}%`, height: '100%', background: theme.color, transition: 'width 0.3s ease' }} />
                            </div>
                            <span style={{ fontSize: '0.64rem', color: theme.color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                              {pDone}/{pTotal}
                            </span>
                          </div>
                        </div>

                        {/* Tareas del Proyecto */}
                        {!isProjCollapsed && (
                          <div style={{ padding: '0.4rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {projTasks.map((task) => (
                              <TaskCard key={task.id} task={task} onToggle={onToggle} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      ) : groupBy === 'project' ? (
        /* Plano por Proyecto directo */
        Object.entries(tasksByProject).map(([projectName, projTasks]) => {
          const isProjCollapsed = collapsedProjects.has(projectName);
          const pTotal = projTasks.length;
          const pDone = projTasks.filter((t) => t.completed).length;
          const pPercent = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0;
          const theme = projTasks[0]?.theme || resolveProjectTheme(projectName, customizations);

          return (
            <div
              key={projectName}
              style={{
                background: 'rgba(0, 0, 0, 0.35)',
                border: `1px solid ${theme.border}`,
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              <div
                onClick={() => toggleProjectCollapse(projectName)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.55rem 0.85rem',
                  background: theme.bg,
                  borderBottom: isProjCollapsed ? 'none' : `1px solid ${theme.border}`,
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isProjCollapsed ? <ChevronRight size={14} color="#94a3b8" /> : <ChevronDown size={14} color={theme.color} />}
                  <span style={{ fontSize: '0.9rem' }}>{theme.icon}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: theme.color }}>
                    {projectName}
                  </span>
                  <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                    ({pTotal} tareas)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '60px', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${pPercent}%`, height: '100%', background: theme.color }} />
                  </div>
                  <span style={{ fontSize: '0.66rem', color: theme.color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {pDone}/{pTotal} ({pPercent}%)
                  </span>
                </div>
              </div>

              {!isProjCollapsed && (
                <div style={{ padding: '0.45rem 0.65rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {projTasks.map((task) => (
                    <TaskCard key={task.id} task={task} onToggle={onToggle} />
                  ))}
                </div>
              )}
            </div>
          );
        })
      ) : (
        /* Plano por Hub directo */
        Object.entries(tasksByHub).map(([hubName, hubTasks]) => {
          const isCollapsed = collapsedHubs.has(hubName);
          const hubTotal = hubTasks.length;
          const hubDone = hubTasks.filter((t) => t.completed).length;
          const hubPercent = hubTotal > 0 ? Math.round((hubDone / hubTotal) * 100) : 0;

          return (
            <div
              key={hubName}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden'
              }}
            >
              <div
                onClick={() => toggleHubCollapse(hubName)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.55rem 0.85rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderBottom: isCollapsed ? 'none' : '1px solid var(--border-color)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} color="#34d399" />}
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-high)' }}>
                    {hubName}
                  </span>
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                    ({hubTasks.length} tareas)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '60px', height: '4px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${hubPercent}%`, height: '100%', background: '#10b981' }} />
                  </div>
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {hubDone}/{hubTotal} ({hubPercent}%)
                  </span>
                </div>
              </div>

              {!isCollapsed && (
                <div style={{ padding: '0.4rem 0.6rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {hubTasks.map((task) => (
                    <TaskCard key={task.id} task={task} onToggle={onToggle} />
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
export default TasksListView;
