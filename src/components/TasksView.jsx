import React from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import {
  useTasks,
  TasksHeader,
  TasksListView,
  KanbanBoard,
  CustomizerModal,
  TaskInspectorDrawer
} from './tasks';

export default function TasksView() {
  const {
    loading,
    refreshing,
    customizations,
    showCustomizer,
    setShowCustomizer,
    selectedHub,
    setSelectedHub,
    selectedProject,
    setSelectedProject,
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
    hubs,
    availableProjects,
    filteredTasks,
    selectedTask,
    setSelectedTask,
    stats,
    tasksHierarchy,
    tasksByProject,
    tasksByHub,
    kanbanColumns
  } = useTasks();

  return (
    <div className="tasks-view-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.65rem', overflowY: 'auto' }}>
      {/* 🧭 Cockpit Header Modular */}
      <TasksHeader
        stats={stats}
        setShowCustomizer={setShowCustomizer}
        refreshing={refreshing}
        fetchTasks={fetchTasks}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedHub={selectedHub}
        setSelectedHub={setSelectedHub}
        hubs={hubs}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        availableProjects={availableProjects}
        customizations={customizations}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        viewMode={viewMode}
        setViewMode={setViewMode}
        kanbanLayout={kanbanLayout}
        setKanbanLayout={setKanbanLayout}
      />

      {/* 🧭 Área Principal de Vistas */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 10px auto', color: 'var(--primary)' }} />
          <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>Cargando tareas estructuradas desde la Bóveda...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center',
            padding: '3.5rem 1rem',
            color: 'var(--text-muted)',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          <CheckCircle2 size={36} color="var(--primary)" style={{ margin: '0 auto 10px auto', opacity: 0.8 }} />
          <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-high)' }}>
            No hay tareas en esta vista
          </p>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.76rem' }}>
            Todas las tareas coinciden como completadas o el filtro actual (Hub/Proyecto) no contiene tareas pendientes.
          </p>
        </div>
      ) : viewMode === 'kanban' ? (
        <KanbanBoard
          kanbanLayout={kanbanLayout}
          groupBy={groupBy}
          tasksHierarchy={tasksHierarchy}
          tasksByProject={tasksByProject}
          collapsedHubs={collapsedHubs}
          toggleHubCollapse={toggleHubCollapse}
          collapsedProjects={collapsedProjects}
          toggleProjectCollapse={toggleProjectCollapse}
          kanbanColumns={kanbanColumns}
          customizations={customizations}
          onToggle={handleToggle}
          onSelectTask={setSelectedTask}
        />
      ) : (
        <TasksListView
          groupBy={groupBy}
          tasksHierarchy={tasksHierarchy}
          tasksByProject={tasksByProject}
          tasksByHub={tasksByHub}
          collapsedHubs={collapsedHubs}
          toggleHubCollapse={toggleHubCollapse}
          collapsedProjects={collapsedProjects}
          toggleProjectCollapse={toggleProjectCollapse}
          customizations={customizations}
          onToggle={handleToggle}
          onSelectTask={setSelectedTask}
        />
      )}

      {/* 🧭 Inspector Táctico Lateral de Tarea */}
      {selectedTask && (
        <TaskInspectorDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onToggle={handleToggle}
        />
      )}

      {/* 🎨 Modal de personalización universal de proyectos & hubs */}
      {showCustomizer && (
        <CustomizerModal
          projects={availableProjects.filter((p) => p !== 'Todos')}
          customizations={customizations}
          onSave={handleSaveCustomizations}
          onClose={() => setShowCustomizer(false)}
        />
      )}
    </div>
  );
}
