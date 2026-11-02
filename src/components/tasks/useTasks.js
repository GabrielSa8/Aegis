import { useState, useEffect, useMemo, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  STORAGE_CUSTOM_KEY,
  STORAGE_MATRIX_KEY,
  parseTask,
  resolveProjectTheme
} from './taskHelpers';
import { useTaskGroups } from './useTaskGroups';

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

  // Tareas enriquecidas con metadatos, temas dinámicos y resolución de dependencias bloqueantes
  const parsedTasks = useMemo(() => {
    const rawParsed = tasks.map((t) => parseTask(t, customizations));

    // Mapa de tareas por ID explícito (customId) y por id sintético / texto limpio
    const tasksById = new Map();
    const tasksByCleanText = new Map();

    rawParsed.forEach((t) => {
      if (t.customId) tasksById.set(t.customId.toLowerCase(), t);
      if (t.id) tasksById.set(t.id.toLowerCase(), t);
      const cleanKey = t.cleanText.toLowerCase().trim();
      if (!tasksByCleanText.has(cleanKey)) {
        tasksByCleanText.set(cleanKey, t);
      }
    });

    // Resolver dependencias dependsOn
    return rawParsed.map((t) => {
      if (!t.dependsOn) {
        return { ...t, isBlocked: false, blockingTask: null };
      }

      const depKey = t.dependsOn.toLowerCase().trim();
      const parentTask = tasksById.get(depKey) || tasksByCleanText.get(depKey) || null;

      // Está bloqueada si existe tarea padre y no está completada
      const isBlocked = parentTask ? !parentTask.completed : true;

      return {
        ...t,
        isBlocked,
        blockingTask: parentTask
      };
    });
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

  // Estado del Drawer Inspector Táctico de Tarea
  const [selectedTask, setSelectedTask] = useState(null);

  // Derivación de estadísticas, jerarquías, kanban y cuadrantes en hook desacoplado
  const {
    stats,
    tasksHierarchy,
    tasksByProject,
    tasksByHub,
    kanbanColumns,
    q1Data,
    q2Data,
    q3Data,
    q4Data
  } = useTaskGroups({
    parsedTasks,
    filteredTasks,
    matrixConfig,
    activeHubs,
    availableProjects,
    customizations
  });

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
    selectedTask,
    setSelectedTask,
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
