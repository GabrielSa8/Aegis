import {
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Flame,
  LayoutGrid,
  ListTodo,
  Kanban,
  FolderGit2,
  Layers,
  Boxes,
  Palette
} from 'lucide-react';
import { TacticalButton, TabsBar } from './ui';
import {
  useTasks,
  PomodoroWidget,
  TasksListView,
  KanbanBoard,
  FocusMatrix,
  CustomizerModal
} from './tasks';

const VIEW_TABS = [
  { id: 'list', label: 'Lista', icon: ListTodo },
  { id: 'kanban', label: 'Kanban', icon: Kanban },
  { id: 'matrix', label: 'Matriz', icon: LayoutGrid }
];

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
      {/* 🧭 Cockpit Header: HUD de Métricas + Pomodoro Táctico + Filtros Granulares */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          background: 'linear-gradient(180deg, rgba(20, 26, 24, 0.95) 0%, rgba(14, 18, 17, 0.98) 100%)',
          border: '1px solid rgba(52, 211, 153, 0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '0.55rem 0.85rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              padding: '3px 10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <Layers size={12} color="#94a3b8" />
              <span>Total:</span>
              <strong style={{ color: '#f1f5f9', fontFamily: 'var(--font-mono)' }}>{stats.total}</strong>
            </div>

            <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: '#38bdf8' }}>
              <Clock size={12} color="#38bdf8" />
              <span>En Cola:</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{stats.pending}</strong>
            </div>

            <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: '#fbbf24' }}>
              <Flame size={12} color="#fbbf24" />
              <span>En Foco:</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{stats.highPriority}</strong>
            </div>

            <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: '#34d399' }}>
              <CheckCircle2 size={12} color="#34d399" />
              <span>Completadas:</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>
                {stats.completed} ({stats.percent}%)
              </strong>
            </div>
          </div>

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
                background: 'rgba(0, 0, 0, 0.35)',
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
              <FolderGit2 size={12} color="#34d399" />
              <select
                value={selectedHub}
                onChange={(e) => setSelectedHub(e.target.value)}
                style={{
                  fontSize: '0.7rem',
                  padding: '3px 18px 3px 6px',
                  borderRadius: '4px',
                  background: '#131716',
                  color: '#e2e8f0',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer'
                }}
                title="Filtrar por Hub Maestro"
              >
                {hubs.map((h) => (
                  <option key={h} value={h} style={{ background: '#131716', color: '#e2e8f0' }}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Proyecto Granular Dinámico */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Boxes size={12} color="#38bdf8" />
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                style={{
                  fontSize: '0.7rem',
                  padding: '3px 18px 3px 6px',
                  borderRadius: '4px',
                  background: '#131716',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
                title="Filtrar por Proyecto específico"
              >
                {availableProjects.map((p) => (
                  <option key={p} value={p} style={{ background: '#131716', color: '#e2e8f0' }}>
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
                  background: 'rgba(0, 0, 0, 0.4)',
                  color: '#34d399',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                <option value="hub_project" style={{ background: '#131716', color: '#e2e8f0' }}>Hub &gt; Proyecto</option>
                <option value="project" style={{ background: '#131716', color: '#e2e8f0' }}>Solo Proyectos</option>
                <option value="hub" style={{ background: '#131716', color: '#e2e8f0' }}>Solo Hubs</option>
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
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '2px'
                }}
              >
                <button
                  type="button"
                  onClick={() => setKanbanLayout('swimlanes')}
                  style={{
                    background: kanbanLayout === 'swimlanes' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                    border: kanbanLayout === 'swimlanes' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                    color: kanbanLayout === 'swimlanes' ? '#38bdf8' : 'var(--text-muted)',
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
                    background: kanbanLayout === 'columns' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                    border: kanbanLayout === 'columns' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                    color: kanbanLayout === 'columns' ? '#38bdf8' : 'var(--text-muted)',
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

      {/* 🎨 MODAL DE PERSONALIZACIÓN UNIVERSAL DE PROYECTOS & HUBS */}
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
