import React from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import {
  useTasks,
  TasksHeader,
  TasksListView,
  KanbanBoard,
  FocusMatrix,
  CustomizerModal
} from './tasks';

export default function TasksView() {
  const {
    loading,
    refreshing,
    customizations,
    matrixConfig,
    updateMatrixQuadrant,
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
  } = useTasks();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.65rem', overflowY: 'auto' }}>
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
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 10px auto', color: '#10b981' }} />
          <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>Cargando tareas estructuradas desde la Bóveda...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(20, 26, 24, 0.7) 0%, rgba(14, 18, 17, 0.8) 100%)',
            border: '1px solid rgba(52, 211, 153, 0.15)',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center',
            padding: '3.5rem 1rem',
            color: 'var(--text-muted)'
          }}
        >
          <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 10px auto', opacity: 0.8 }} />
          <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-high)' }}>
            No hay tareas en esta vista
          </p>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.76rem' }}>
            Todas las tareas coinciden como completadas o el filtro actual (Hub/Proyecto) no contiene tareas pendientes.
          </p>
        </div>
      ) : viewMode === 'list' ? (
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
        />
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
        />
      ) : (
        <FocusMatrix
          matrixConfig={matrixConfig}
          q1Data={q1Data}
          q2Data={q2Data}
          q3Data={q3Data}
          q4Data={q4Data}
          updateMatrixQuadrant={updateMatrixQuadrant}
          activeHubs={activeHubs}
          availableProjects={availableProjects}
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
