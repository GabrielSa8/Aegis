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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.65rem',
      ...(fillHeight ? { flex: 1, minHeight: 0 } : {})
    }}>
      {/* 🧭 Barra Superior de Filtros y Control de Flota */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '0 2px'
      }}>
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
              style={{
                background: statusFilter === 'all' ? 'var(--bg-card)' : 'transparent',
                color: statusFilter === 'all' ? 'var(--primary)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '4px',
                padding: '2px 7px',
                fontSize: '0.62rem',
                fontWeight: statusFilter === 'all' ? 700 : 500,
                cursor: 'pointer'
              }}
            >
              Todos ({repos.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('dirty')}
              style={{
                background: statusFilter === 'dirty' ? 'var(--bg-card)' : 'transparent',
                color: statusFilter === 'dirty' ? 'var(--warning)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '4px',
                padding: '2px 7px',
                fontSize: '0.62rem',
                fontWeight: statusFilter === 'dirty' ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              {dirtyCount > 0 && <AlertCircle size={10} />}
              <span>Con cambios ({dirtyCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('sync')}
              style={{
                background: statusFilter === 'sync' ? 'var(--bg-card)' : 'transparent',
                color: statusFilter === 'sync' ? 'var(--accent)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '4px',
                padding: '2px 7px',
                fontSize: '0.62rem',
                fontWeight: statusFilter === 'sync' ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              {syncCount > 0 && <ArrowUp size={10} />}
              <span>Desincronizados ({syncCount})</span>
            </button>
          </div>
        </div>

        {/* Buscador de Repos, Selector de Vista y Botón Añadir */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              style={{
                background: viewMode === 'cards' ? 'var(--bg-card)' : 'transparent',
                color: viewMode === 'cards' ? 'var(--primary)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '4px',
                padding: '2px 6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.62rem'
              }}
              title="Vista de Tarjetas Densas"
            >
              <LayoutGrid size={11} />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleViewMode('table')}
              style={{
                background: viewMode === 'table' ? 'var(--bg-card)' : 'transparent',
                color: viewMode === 'table' ? 'var(--primary)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '4px',
                padding: '2px 6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.62rem'
              }}
              title="Vista de Tabla Táctica"
            >
              <List size={11} />
              <span>Tabla</span>
            </button>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px 6px'
          }}>
            <Search size={11} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Filtrar repositorios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-high)',
                fontSize: '0.68rem',
                width: '130px'
              }}
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
            + Añadir / Crear
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 390px))',
          gap: '0.65rem',
          ...(fillHeight ? { flex: 1, overflowY: 'auto', minHeight: 0 } : {})
        }}>
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
