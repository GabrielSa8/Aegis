import { useMemo } from 'react';

/**
 * Custom Hook para derivar agrupaciones y jerarquías (Lista y Kanban)
 * manteniendo useTasks.js estrictamente por debajo de 250 líneas.
 */
export function useTaskGroups({
  parsedTasks,
  filteredTasks
}) {
  // Estadísticas globales
  const stats = useMemo(() => {
    const total = parsedTasks.length;
    const completed = parsedTasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const highPriority = parsedTasks.filter((t) => !t.completed && t.priority === 'high').length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, pending, completed, highPriority, percent };
  }, [parsedTasks]);

  // Jerarquía dinámica: Hub -> Proyecto -> Tareas
  const tasksHierarchy = useMemo(() => {
    const hierarchy = {};
    filteredTasks.forEach((t) => {
      if (!hierarchy[t.hub]) hierarchy[t.hub] = {};
      if (!hierarchy[t.hub][t.project]) hierarchy[t.hub][t.project] = [];
      hierarchy[t.hub][t.project].push(t);
    });
    return hierarchy;
  }, [filteredTasks]);

  // Agrupación directa por Proyecto: Proyecto -> Tareas
  const tasksByProject = useMemo(() => {
    const map = {};
    filteredTasks.forEach((t) => {
      if (!map[t.project]) map[t.project] = [];
      map[t.project].push(t);
    });
    return map;
  }, [filteredTasks]);

  // Agrupación directa por Hub: Hub -> Tareas
  const tasksByHub = useMemo(() => {
    const map = {};
    filteredTasks.forEach((t) => {
      if (!map[t.hub]) map[t.hub] = [];
      map[t.hub].push(t);
    });
    return map;
  }, [filteredTasks]);

  // Agrupación para Tablero Kanban (3 columnas globales)
  const kanbanColumns = useMemo(() => {
    const todo = [];
    const focus = [];
    const done = [];

    filteredTasks.forEach((t) => {
      if (t.completed) {
        done.push(t);
      } else if (t.priority === 'high' || t.dueDate) {
        focus.push(t);
      } else {
        todo.push(t);
      }
    });

    return { todo, focus, done };
  }, [filteredTasks]);

  return {
    stats,
    tasksHierarchy,
    tasksByProject,
    tasksByHub,
    kanbanColumns
  };
}
