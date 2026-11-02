import React from 'react';
import {
  RefreshCw,
  Search,
  LayoutGrid,
  ListTodo,
  Kanban,
  FolderGit2,
  Boxes,
  Palette
} from 'lucide-react';
import { TacticalButton, TabsBar } from '../ui';
import { PomodoroWidget } from './PomodoroWidget';
import { TasksHudStats } from './TasksHudStats';

const VIEW_TABS = [
  { id: 'list', label: 'Lista', icon: ListTodo },
  { id: 'kanban', label: 'Kanban', icon: Kanban },
  { id: 'matrix', label: 'Matriz', icon: LayoutGrid }
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
  groupBy,
  setGroupBy,
  viewMode,
  setViewMode,
  kanbanLayout,
  setKanbanLayout
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '0.55rem 0.85rem',
        boxShadow: 'var(--shadow-lg)',
        flexShrink: 0
      }}
    >
      {/* Fila 1: HUD Stats + Pomodoro Widget + Personalizador + Refrescar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}
      >
        {/* HUD de Métricas */}
        <TasksHudStats stats={stats} />

        {/* Pomodoro HUD Widget + Personalizador + Refrescar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PomodoroWidget />

          <TacticalButton
            variant="secondary"
            size="xs"
            icon={Palette}
            onClick={() => setShowCustomizer(true)}
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
            title="Volver a escanear notas de la Bóveda"
          >
            Escanear
          </TacticalButton>
        </div>
      </div>

      {/* Fila 2: Buscador + Filtros por Hub/Proyecto + Conmutador de Agrupación + Selector de Vistas */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.6rem',
          flexWrap: 'wrap'
        }}
      >
        {/* Izquierda: Buscador + Filtro Hub + Filtro Proyecto */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '1 1 380px', flexWrap: 'wrap' }}>
          <div
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
            <Search size={12} color="var(--text-muted)" />
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

          {/* Selector de Hub Dinámico */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <FolderGit2 size={12} color="var(--primary)" />
            <select
              value={selectedHub}
              onChange={(e) => setSelectedHub(e.target.value)}
              style={{
                fontSize: '0.7rem',
                padding: '3px 18px 3px 6px',
                borderRadius: '4px',
                background: 'var(--bg-card)',
                color: 'var(--text-high)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer'
              }}
              title="Filtrar por Hub Maestro"
            >
              {hubs.map((h) => (
                <option key={h} value={h} style={{ background: 'var(--bg-card)', color: 'var(--text-high)' }}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Proyecto Granular Dinámico */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Boxes size={12} color="var(--accent)" />
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              style={{
                fontSize: '0.7rem',
                padding: '3px 18px 3px 6px',
                borderRadius: '4px',
                background: 'var(--bg-card)',
                color: 'var(--accent)',
                border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
                cursor: 'pointer',
                fontWeight: 600
              }}
              title="Filtrar por Proyecto específico"
            >
              {availableProjects.map((p) => (
                <option key={p} value={p} style={{ background: 'var(--bg-card)', color: 'var(--text-high)' }}>
                  {p === 'Todos' ? 'Todos los Proyectos' : p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Derecha: Agrupador + Conmutador de Vistas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Agrupar:
            </span>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              style={{
                fontSize: '0.68rem',
                padding: '3px 16px 3px 6px',
                borderRadius: '4px',
                background: 'var(--bg-card)',
                color: 'var(--primary)',
                border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              <option value="hub_project" style={{ background: 'var(--bg-card)', color: 'var(--text-high)' }}>Hub &gt; Proyecto</option>
              <option value="project" style={{ background: 'var(--bg-card)', color: 'var(--text-high)' }}>Solo Proyectos</option>
              <option value="hub" style={{ background: 'var(--bg-card)', color: 'var(--text-high)' }}>Solo Hubs</option>
            </select>
          </div>

          {/* Conmutador de Vistas (Lista / Kanban / Matriz) */}
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
