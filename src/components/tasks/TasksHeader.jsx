import React from 'react';
import {
  RefreshCw,
  Search,
  ListTodo,
  Kanban,
  Palette
} from 'lucide-react';
import { TacticalButton, TabsBar } from '../ui';
import { PomodoroWidget } from './PomodoroWidget';
import { TasksHudStats } from './TasksHudStats';
import TaskHubDropdown from './TaskHubDropdown';
import TaskProjectDropdown from './TaskProjectDropdown';
import TaskGroupByDropdown from './TaskGroupByDropdown';

const VIEW_TABS = [
  { id: 'list', label: 'Lista', icon: ListTodo },
  { id: 'kanban', label: 'Kanban', icon: Kanban }
];

export function TasksHeader({
  stats,
  setShowCustomizer,
  refreshing,
  fetchTasks,
  searchQuery,
  setSearchQuery,
  selectedHub,
  setSelectedHub,
  hubs,
  selectedProject,
  setSelectedProject,
  availableProjects,
  customizations = {},
  groupBy,
  setGroupBy,
  viewMode,
  setViewMode,
  kanbanLayout,
  setKanbanLayout,
  statusFilter,
  setStatusFilter
}) {
  return (
    <div
      className="tasks-header-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.55rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '0.6rem 0.85rem',
        boxShadow: 'var(--shadow-lg)',
        flexShrink: 0
      }}
    >
      {/* Fila 1: HUD Stats + Pomodoro Widget + Personalizador + Refrescar */}
      <div
        className="tasks-header-row-top"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}
      >
        {/* HUD de Métricas Interactivo con Filtro Rápido */}
        <TasksHudStats
          stats={stats}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        {/* Pomodoro HUD Widget + Personalizador + Refrescar */}
        <div className="tasks-header-actions-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <PomodoroWidget />

          <TacticalButton
            variant="secondary"
            size="xs"
            icon={Palette}
            onClick={() => setShowCustomizer(true)}
            className="tasks-action-btn"
            title="Personalizar iconos y colores para tus proyectos y hubs"
          >
            Personalizar
          </TacticalButton>

          <TacticalButton
            variant="terminal"
            size="xs"
            icon={RefreshCw}
            loading={refreshing}
            onClick={fetchTasks}
            className="tasks-action-btn"
            title="Volver a escanear notas de la Bóveda"
          >
            Escanear
          </TacticalButton>
        </div>
      </div>

      {/* Fila 2: Buscador + Filtros por Hub/Proyecto + Conmutador de Agrupación + Selector de Vistas */}
      <div
        className="tasks-header-row-filters"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.6rem',
          flexWrap: 'wrap'
        }}
      >
        {/* Izquierda: Buscador + Filtro Hub + Filtro Proyecto */}
        <div className="tasks-filter-group-left" style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '1 1 380px', flexWrap: 'wrap' }}>
          <div
            className="tasks-search-box"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flex: '1 1 140px',
              background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '3px 8px'
            }}
          >
            <Search size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Buscar tareas, proyectos o #tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-high)',
                fontSize: '0.74rem',
                width: '100%'
              }}
            />
          </div>

          {/* Selector de Hub Dinámico con Frosted Glass y Resiliencia */}
          <TaskHubDropdown
            value={selectedHub}
            onChange={setSelectedHub}
            hubs={hubs}
          />

          {/* Selector de Proyecto Granular Dinámico con Frosted Glass */}
          <TaskProjectDropdown
            value={selectedProject}
            onChange={setSelectedProject}
            projects={availableProjects}
            customizations={customizations}
          />
        </div>

        {/* Derecha: Agrupador + Conmutador de Vistas */}
        <div className="tasks-filter-group-right" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Selector Táctico de Agrupación */}
          <TaskGroupByDropdown
            value={groupBy}
            onChange={setGroupBy}
          />

          {/* Conmutador de Vistas (Lista / Kanban) */}
          <TabsBar
            items={VIEW_TABS}
            activeTab={viewMode}
            onChange={setViewMode}
            variant="pills"
            size="sm"
          />

          {/* Sub-conmutador de diseño Kanban */}
          {viewMode === 'kanban' && (
            <div
              className="tasks-kanban-layout-switch"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '2px'
              }}
            >
              <button
                type="button"
                onClick={() => setKanbanLayout('swimlanes')}
                className={`task-layout-btn ${kanbanLayout === 'swimlanes' ? 'is-active' : ''}`}
                style={{
                  background: kanbanLayout === 'swimlanes' ? 'color-mix(in srgb, var(--accent) 18%, transparent)' : 'transparent',
                  border: kanbanLayout === 'swimlanes' ? '1px solid color-mix(in srgb, var(--accent) 40%, transparent)' : '1px solid transparent',
                  color: kanbanLayout === 'swimlanes' ? 'var(--accent)' : 'var(--text-muted)',
                  padding: '3px 7px',
                  borderRadius: '4px',
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Swimlanes por Proyecto"
              >
                Swimlanes
              </button>
              <button
                type="button"
                onClick={() => setKanbanLayout('columns')}
                className={`task-layout-btn ${kanbanLayout === 'columns' ? 'is-active' : ''}`}
                style={{
                  background: kanbanLayout === 'columns' ? 'color-mix(in srgb, var(--accent) 18%, transparent)' : 'transparent',
                  border: kanbanLayout === 'columns' ? '1px solid color-mix(in srgb, var(--accent) 40%, transparent)' : '1px solid transparent',
                  color: kanbanLayout === 'columns' ? 'var(--accent)' : 'var(--text-muted)',
                  padding: '3px 7px',
                  borderRadius: '4px',
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="3 Columnas Globales"
              >
                3 Columnas
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
