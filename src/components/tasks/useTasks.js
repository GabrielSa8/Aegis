import { useState, useEffect, useMemo, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  STORAGE_CUSTOM_KEY,
  parseTask,
  resolveProjectTheme
} from './taskHelpers';
import { useTaskGroups } from './useTaskGroups';

let _cachedTasks = null;

export function useTasks() {
  const [tasks, setTasks] = useState(() => _cachedTasks || []);
  const [loading, setLoading] = useState(() => !_cachedTasks);
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

  // Filtros dinámicos
  const [selectedHub, setSelectedHub] = useState('Todos');
  const [selectedProject, setSelectedProject] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'focus', 'completed'
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
      _cachedTasks = res || [];
      setTasks(_cachedTasks);
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

  const handleSetStatus = async (task, newStatus) => {
    const isCompleted = newStatus === 'done';
    const oldStatus = task.status;
    const oldCompleted = task.completed;
    const filePath = task.file_path || task.filePath;
    const lineNumber = task.line_number || task.lineNumber;

    if (!filePath || !lineNumber) {
      console.warn('handleSetStatus: filePath o lineNumber no encontrados en la tarea', task);
      return;
    }

    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus, completed: isCompleted } : t))
    );

    setSelectedTask((prev) =>
      prev && prev.id === task.id ? { ...prev, status: newStatus, completed: isCompleted } : prev
    );

    try {
      await invoke('set_vault_task_status', {
        filePath,
        lineNumber,
        status: newStatus
      });
    } catch (err) {
      console.error('Error al actualizar estado de tarea:', err);
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: oldStatus, completed: oldCompleted } : t))
      );
    }
  };

  const handleToggle = async (task) => {
    const targetStatus = task.completed || task.status === 'done' ? 'todo' : 'done';
    await handleSetStatus(task, targetStatus);
  };

  const handleAddTask = async (filePath, text) => {
    try {
      await invoke('add_vault_task', { filePath, text });
      await fetchTasks();
    } catch (err) {
      console.error('Error al agregar nueva tarea:', err);
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
      if (statusFilter === 'pending' && (t.status !== 'todo' || t.completed)) return false;
      if (statusFilter === 'in_progress' && t.status !== 'in_progress') return false;
      if (statusFilter === 'completed' && (!t.completed && t.status !== 'done')) return false;
      if (statusFilter === 'focus' && (t.completed || (t.priority !== 'high' && !t.dueDate))) return false;

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

  // Derivación de estadísticas, jerarquías y kanban en hook desacoplado
  const {
    stats,
    tasksHierarchy,
    tasksByProject,
    tasksByHub,
    kanbanColumns
  } = useTaskGroups({
    parsedTasks,
    filteredTasks
  });

  return {
    tasks,
    loading,
    refreshing,
    error,
    customizations,
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
    handleSetStatus,
    handleAddTask,
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
    kanbanColumns
  };
}
