import { useState, useEffect, useMemo, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  STORAGE_CUSTOM_KEY,
  STORAGE_MATRIX_KEY,
  parseTask,
  resolveQuadrantData,
  resolveProjectTheme
} from './taskHelpers';

export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Personalizaciones de usuario en localStorage
  const [customizations, setCustomizations] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_CUSTOM_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (_) {
      return {};
    }
  });

  // Configuración de los 4 Cuadrantes de la Matriz (100% personalizable por usuario)
  const [matrixConfig, setMatrixConfig] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_MATRIX_KEY);
      return stored ? JSON.parse(stored) : { q1: 'auto_1', q2: 'auto_2', q3: 'auto_3', q4: 'auto_4' };
    } catch (_) {
      return { q1: 'auto_1', q2: 'auto_2', q3: 'auto_3', q4: 'auto_4' };
    }
  });

  const updateMatrixQuadrant = (quadrantKey, newTarget) => {
    setMatrixConfig((prev) => {
      const next = { ...prev, [quadrantKey]: newTarget };
      try {
        localStorage.setItem(STORAGE_MATRIX_KEY, JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  // Filtros dinámicos
  const [selectedHub, setSelectedHub] = useState('Todos');
  const [selectedProject, setSelectedProject] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('pending'); // 'all', 'pending', 'completed'
  const [searchQuery, setSearchQuery] = useState('');

  // Agrupador: 'hub_project' (Jerárquico: Hub > Proyecto), 'project' (Directo por Proyecto), 'hub' (Directo por Hub)
  const [groupBy, setGroupBy] = useState('hub_project');

  // Modos de Vista: 'list', 'kanban', 'matrix'
  const [viewMode, setViewMode] = useState('list');
  const [kanbanLayout, setKanbanLayout] = useState('swimlanes'); // 'swimlanes' | 'columns'

  // Secciones colapsadas
  const [collapsedHubs, setCollapsedHubs] = useState(() => new Set());
  const [collapsedProjects, setCollapsedProjects] = useState(() => new Set());

  // Modal de Personalización
  const [showCustomizer, setShowCustomizer] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      const res = await invoke('get_vault_tasks');
      setTasks(res || []);
    } catch (err) {
      console.error('Error cargando tareas de la Bóveda:', err);
      setError(String(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleSaveCustomizations = (newCustoms) => {
    setCustomizations(newCustoms);
    try {
      localStorage.setItem(STORAGE_CUSTOM_KEY, JSON.stringify(newCustoms));
    } catch (_) {}
  };

  const handleToggle = async (task) => {
    const targetState = !task.completed;

    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: targetState } : t))
    );

    try {
      await invoke('toggle_vault_task', {
        filePath: task.file_path,
        lineNumber: task.line_number,
        completed: targetState
      });
    } catch (err) {
      console.error('Error al conmutar tarea en Obsidian:', err);
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: !targetState } : t))
      );
    }
  };

  const toggleHubCollapse = (hub) => {
    setCollapsedHubs((prev) => {
      const next = new Set(prev);
      if (next.has(hub)) next.delete(hub);
      else next.add(hub);
      return next;
    });
  };

  const toggleProjectCollapse = (projKey) => {
    setCollapsedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projKey)) next.delete(projKey);
      else next.add(projKey);
      return next;
    });
  };

  // Tareas enriquecidas con metadatos y temas dinámicos
  const parsedTasks = useMemo(() => {
    return tasks.map((t) => parseTask(t, customizations));
  }, [tasks, customizations]);

  // Lista dinámica de Hubs descubiertos en la bóveda
  const hubs = useMemo(() => {
    const set = new Set();
    tasks.forEach((t) => {
      if (t.hub) set.add(t.hub);
    });
    return ['Todos', ...Array.from(set).sort()];
  }, [tasks]);

  const activeHubs = useMemo(() => hubs.filter((h) => h !== 'Todos'), [hubs]);

  // Lista dinámica de Proyectos descubiertos en la bóveda
  const availableProjects = useMemo(() => {
    const set = new Set();
    parsedTasks.forEach((t) => {
      if (t.project) set.add(t.project);
    });
    return ['Todos', ...Array.from(set).sort()];
  }, [parsedTasks]);

  // Tareas filtradas por Hub, Proyecto, Estado y Búsqueda
  const filteredTasks = useMemo(() => {
    return parsedTasks.filter((t) => {
      if (selectedHub !== 'Todos' && t.hub !== selectedHub) return false;
      if (selectedProject !== 'Todos' && t.project !== selectedProject) return false;
      if (statusFilter === 'pending' && t.completed) return false;
      if (statusFilter === 'completed' && !t.completed) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesText = t.cleanText.toLowerCase().includes(q) || t.text.toLowerCase().includes(q);
        const matchesFile = t.file_name.toLowerCase().includes(q);
        const matchesHub = t.hub.toLowerCase().includes(q);
        const matchesProject = t.project.toLowerCase().includes(q);
        const matchesTag = t.tags.some((tag) => tag.toLowerCase().includes(q));
        if (!matchesText && !matchesFile && !matchesHub && !matchesProject && !matchesTag) return false;
      }

      return true;
    });
  }, [parsedTasks, selectedHub, selectedProject, statusFilter, searchQuery]);

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

  // Datos resueltos de los 4 Cuadrantes de la Matriz Adaptable
  const q1Data = useMemo(() => resolveQuadrantData(matrixConfig.q1, filteredTasks, activeHubs, availableProjects, customizations), [matrixConfig.q1, filteredTasks, activeHubs, availableProjects, customizations]);
  const q2Data = useMemo(() => resolveQuadrantData(matrixConfig.q2, filteredTasks, activeHubs, availableProjects, customizations), [matrixConfig.q2, filteredTasks, activeHubs, availableProjects, customizations]);
  const q3Data = useMemo(() => resolveQuadrantData(matrixConfig.q3, filteredTasks, activeHubs, availableProjects, customizations), [matrixConfig.q3, filteredTasks, activeHubs, availableProjects, customizations]);
  const q4Data = useMemo(() => resolveQuadrantData(matrixConfig.q4, filteredTasks, activeHubs, availableProjects, customizations), [matrixConfig.q4, filteredTasks, activeHubs, availableProjects, customizations]);

  return {
    tasks,
    loading,
    refreshing,
    error,
    customizations,
    matrixConfig,
    updateMatrixQuadrant,
    showCustomizer,
    setShowCustomizer,
    selectedHub,
    setSelectedHub,
    selectedProject,
    setSelectedProject,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    groupBy,
    setGroupBy,
    viewMode,
    setViewMode,
    kanbanLayout,
    setKanbanLayout,
    collapsedHubs,
    collapsedProjects,
    fetchTasks,
    handleSaveCustomizations,
    handleToggle,
    toggleHubCollapse,
    toggleProjectCollapse,
    parsedTasks,
    hubs,
    activeHubs,
    availableProjects,
    filteredTasks,
    stats,
    tasksHierarchy,
    tasksByProject,
    tasksByHub,
    kanbanColumns,
    q1Data,
    q2Data,
    q3Data,
    q4Data
  };
}
