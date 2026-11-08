import { useMemo } from 'react';

/**
 * Custom Hook para derivar agrupaciones y jerarquías (Lista y Kanban)
 * manteniendo useTasks.js estrictamente modular.
 */
export function useTaskGroups({
  parsedTasks,
  filteredTasks
}) {
  // Estadísticas globales
  const stats = useMemo(() => {
    const total = parsedTasks.length;
    const completed = parsedTasks.filter((t) => t.status === 'done' || t.completed).length;
    const inProgress = parsedTasks.filter((t) => t.status === 'in_progress').length;
    const pending = parsedTasks.filter((t) => t.status === 'todo' && !t.completed).length;
    const highPriority = parsedTasks.filter((t) => !t.completed && (t.priority === 'high' || t.dueDate)).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, pending, inProgress, completed, highPriority, percent };
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

  // Ordenador táctico para priorizar tareas de alta prioridad o vencimiento próximo
  const sortTasks = (arr) => {
    return [...arr].sort((a, b) => {
      const pMap = { high: 0, medium: 1, normal: 2, low: 3 };
      const pDiff = (pMap[a.priority] ?? 2) - (pMap[b.priority] ?? 2);
      if (pDiff !== 0) return pDiff;
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });
  };

  // Agrupación para Tablero Kanban (3 columnas oficiales: Por Hacer, En Proceso, Hecho)
  const kanbanColumns = useMemo(() => {
    const todo = [];
    const inProgress = [];
    const done = [];

    filteredTasks.forEach((t) => {
      if (t.status === 'done' || t.completed) {
        done.push(t);
      } else if (t.status === 'in_progress') {
        inProgress.push(t);
      } else {
        todo.push(t);
      }
    });

    return {
      todo: sortTasks(todo),
      inProgress: sortTasks(inProgress),
      done: sortTasks(done)
    };
  }, [filteredTasks]);

  return {
    stats,
    tasksHierarchy,
    tasksByProject,
    tasksByHub,
    kanbanColumns
  };
}
