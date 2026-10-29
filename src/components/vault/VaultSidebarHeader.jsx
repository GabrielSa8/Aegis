import React from 'react';
import {
  FileText,
  Sparkles,
  Search,
  X,
  Filter,
  FilePlus,
  FolderPlus,
  ChevronsDown,
  ChevronsUp,
  RefreshCw,
  PanelLeftClose
} from 'lucide-react';

export function VaultSidebarHeader({
  searchMode,
  setSearchMode,
  searchTerm,
  setSearchTerm,
  selectedHub,
  setSelectedHub,
  vaultHubs,
  expandAll,
  collapseAll,
  loadVaultData,
  refreshing,
  setShowSidebar,
  setShowNewNoteModal,
  setShowNewFolderModal
}) {
  return (
    <div
      style={{
        padding: '0.5rem 0.65rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}
    >
      {/* Selector de Modo de Búsqueda */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4px',
          background: 'rgba(0,0,0,0.3)',
          padding: '2px',
          borderRadius: '6px'
        }}
      >
        <button
          type="button"
          onClick={() => setSearchMode('title')}
          style={{
            padding: '3px 6px',
            fontSize: '0.66rem',
            fontWeight: 600,
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            background: searchMode === 'title' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
            color: searchMode === 'title' ? '#34d399' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            transition: 'var(--transition)'
          }}
        >
          <FileText size={11} />
          <span>Títulos</span>
        </button>
        <button
          type="button"
          onClick={() => setSearchMode('fulltext')}
          style={{
            padding: '3px 6px',
            fontSize: '0.66rem',
            fontWeight: 600,
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            background: searchMode === 'fulltext' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
            color: searchMode === 'fulltext' ? '#c084fc' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            transition: 'var(--transition)'
          }}
        >
          <Sparkles size={11} />
          <span>Búsqueda Profunda</span>
        </button>
      </div>

      {/* Input de Búsqueda */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '4px 8px'
        }}
      >
        <Search size={13} color="var(--text-muted)" />
        <input
          type="text"
          placeholder={searchMode === 'fulltext' ? 'Buscar en contenido (Rust)...' : 'Buscar nota por título...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-high)',
            fontSize: '0.75rem',
            width: '100%'
          }}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Selector de Hub */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Filter size={11} color="var(--text-muted)" />
        <select
          value={selectedHub}
          onChange={(e) => setSelectedHub(e.target.value)}
          style={{ fontSize: '0.68rem', padding: '3px 20px 3px 6px', width: '100%' }}
        >
          <option value="Todos">Todos los Hubs</option>
          {vaultHubs.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
      </div>

      {/* Acciones Rápidas (+ Nota, + Carpeta, Expandir/Colapsar) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0 0 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => setShowNewNoteModal(true)}
            title="Crear nueva nota con plantilla"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#34d399',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '0.64rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <FilePlus size={11} />
            <span>Nota</span>
          </button>

          <button
            onClick={() => setShowNewFolderModal(true)}
            title="Crear nueva carpeta"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '0.64rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <FolderPlus size={11} />
            <span>Carpeta</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <button
            onClick={expandAll}
            title="Expandir todas las carpetas"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '2px 4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <ChevronsDown size={12} />
          </button>
          <button
            onClick={collapseAll}
            title="Colapsar todas las carpetas"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '2px 4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <ChevronsUp size={12} />
          </button>
          <button
            onClick={loadVaultData}
            disabled={refreshing}
            title="Recargar notas de la Bóveda"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              padding: '2px 4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <div style={{ width: '1px', height: '10px', background: 'var(--border-color)', margin: '0 2px' }} />
          <button
            onClick={() => setShowSidebar(false)}
            title="Ocultar explorador de carpetas (Ctrl + B)"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '2px 4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <PanelLeftClose size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
