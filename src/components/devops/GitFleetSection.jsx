import React, { useState, useMemo } from 'react';
import { RefreshCw, FolderPlus, Search, AlertCircle, ArrowUp, LayoutGrid, List } from 'lucide-react';
import { RepoCard } from './RepoCard';
import { RepoTableView } from './RepoTableView';
import { TacticalButton } from '../ui';

/**
 * GitFleetSection — Sección de la flota de repositorios con vista dual (Cards Densas o Tabla Táctica).
 * Cero sensación de vacío gracias a columnas proporcionales y modo tabla de alta densidad.
 */
export function GitFleetSection({
  repos = [],
  loading = false,
  onInspect,
  onFetch,
  onPull,
  onOpenInEditor,
  onRequestDelete,
  onOpenAddModal,
  actionLoading,
  fillHeight = false
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'dirty' | 'sync'
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('aegis_git_fleet_view') || 'cards';
    } catch {
      return 'cards';
    }
  });

  const handleToggleViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('aegis_git_fleet_view', mode);
    } catch {}
  };

  const dirtyCount = useMemo(() => repos.filter(r => !r.is_clean).length, [repos]);
  const syncCount = useMemo(() => repos.filter(r => (r.ahead > 0 || r.behind > 0)).length, [repos]);

  const filteredRepos = useMemo(() => {
    return repos.filter(r => {
      const matchSearch = !searchTerm.trim() ||
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.branch || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (statusFilter === 'dirty') return !r.is_clean;
      if (statusFilter === 'sync') return r.ahead > 0 || r.behind > 0;
      return true;
    });
  }, [repos, searchTerm, statusFilter]);

  return (
    <div className={`git-fleet-container ${fillHeight ? 'fill-height' : ''}`}>
      {/* 🧭 Barra Superior de Filtros y Control de Flota */}
      <div className="git-fleet-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Flota Git ({repos.length})
          </span>

          {/* Chips de Filtro Rápido */}
          <div style={{
            display: 'flex',
            background: 'color-mix(in srgb, var(--border-color) 20%, transparent)',
            padding: '2px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)'
          }}>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`git-fleet-filter-btn ${statusFilter === 'all' ? 'is-active-all' : ''}`}
            >
              <span>Todos</span>
              <span>({repos.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('dirty')}
              className={`git-fleet-filter-btn ${statusFilter === 'dirty' ? 'is-active-dirty' : ''}`}
            >
              {dirtyCount > 0 && <AlertCircle size={10} />}
              <span className="git-fleet-filter-label">Con cambios</span>
              <span>({dirtyCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('sync')}
              className={`git-fleet-filter-btn ${statusFilter === 'sync' ? 'is-active-sync' : ''}`}
            >
              {syncCount > 0 && <ArrowUp size={10} />}
              <span className="git-fleet-filter-label">Desincronizados</span>
              <span>({syncCount})</span>
            </button>
          </div>
        </div>

        {/* Buscador de Repos, Selector de Vista y Botón Añadir */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Selector de Modo de Vista (Cards vs Tabla) */}
          <div style={{
            display: 'flex',
            background: 'color-mix(in srgb, var(--border-color) 20%, transparent)',
            padding: '2px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)'
          }}>
            <button
              type="button"
              onClick={() => handleToggleViewMode('cards')}
              className={`devops-viewmode-btn ${viewMode === 'cards' ? 'is-active' : ''}`}
              title="Vista de Tarjetas Densas"
            >
              <LayoutGrid size={11} />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleViewMode('table')}
              className={`devops-viewmode-btn ${viewMode === 'table' ? 'is-active' : ''}`}
              title="Vista de Tabla Táctica"
            >
              <List size={11} />
              <span>Tabla</span>
            </button>
          </div>

          <div className="git-fleet-search-box">
            <Search size={11} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Filtrar repositorios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="git-fleet-search-input"
            />
          </div>

          <TacticalButton
            variant="secondary"
            size="xs"
            icon={<FolderPlus size={12} />}
            onClick={onOpenAddModal}
            style={{
              background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
              border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
              color: 'var(--primary)',
              fontWeight: 700
            }}
          >
            + Añadir
          </TacticalButton>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <RefreshCw size={16} className="animate-spin" style={{ margin: '0 auto 6px auto' }} />
          <span>Consultando ramas y estado de Git...</span>
        </div>
      ) : filteredRepos.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '2.5rem 1rem',
          color: 'var(--text-muted)',
          fontSize: '0.78rem',
          border: '1px dashed var(--border-color)',
          borderRadius: 'var(--radius-md)'
        }}>
          No se encontraron repositorios bajo este criterio de búsqueda o filtro.
        </div>
      ) : viewMode === 'table' ? (
        <RepoTableView
          repos={filteredRepos}
          onInspect={onInspect}
          onFetch={onFetch}
          onPull={onPull}
          onOpenInEditor={onOpenInEditor}
          onRequestDelete={onRequestDelete}
          actionLoading={actionLoading}
        />
      ) : (
        <div
          className="git-fleet-grid"
          style={fillHeight ? { flex: 1, overflowY: 'auto', minHeight: 0 } : {}}
        >
          {filteredRepos.map((repo) => (
            <RepoCard
              key={repo.id}
              repo={repo}
              onInspect={onInspect}
              onFetch={onFetch}
              onPull={onPull}
              onOpenInEditor={onOpenInEditor}
              onRequestDelete={onRequestDelete}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
}
