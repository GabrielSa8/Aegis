import React from 'react';
import {
  FileText,
  Sparkles,
  Search,
  X,
  FilePlus,
  FolderPlus,
  ChevronsDown,
  ChevronsUp,
  RefreshCw,
  PanelLeftClose
} from 'lucide-react';
import VaultHubDropdown from './VaultHubDropdown';

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
          className={`vault-search-mode-btn ${searchMode === 'title' ? 'is-active-primary' : ''}`}
        >
          <FileText size={11} />
          <span className="vault-sidebar-btn-label">Títulos</span>
        </button>
        <button
          type="button"
          onClick={() => setSearchMode('fulltext')}
          className={`vault-search-mode-btn ${searchMode === 'fulltext' ? 'is-active-secondary' : ''}`}
        >
          <Sparkles size={11} />
          <span className="vault-sidebar-btn-label">Búsqueda Profunda</span>
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
      <VaultHubDropdown
        value={selectedHub}
        onChange={setSelectedHub}
        hubs={vaultHubs}
      />

      {/* Acciones Rápidas (+ Nota, + Carpeta, Expandir/Colapsar) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0 0 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => setShowNewNoteModal(true)}
            title="Crear nueva nota con plantilla"
            className="vault-sidebar-quick-btn primary"
          >
            <FilePlus size={11} />
            <span className="vault-sidebar-btn-label">Nota</span>
          </button>

          <button
            onClick={() => setShowNewFolderModal(true)}
            title="Crear nueva carpeta"
            className="vault-sidebar-quick-btn secondary"
          >
            <FolderPlus size={11} />
            <span className="vault-sidebar-btn-label">Carpeta</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <button
            onClick={expandAll}
            title="Expandir todas las carpetas"
            className="vault-sidebar-icon-btn"
          >
            <ChevronsDown size={12} />
          </button>
          <button
            onClick={collapseAll}
            title="Colapsar todas las carpetas"
            className="vault-sidebar-icon-btn"
          >
            <ChevronsUp size={12} />
          </button>
          <button
            onClick={loadVaultData}
            disabled={refreshing}
            title="Recargar notas de la Bóveda"
            className="vault-sidebar-icon-btn"
          >
            <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <div style={{ width: '1px', height: '10px', background: 'var(--border-color)', margin: '0 2px' }} />
          <button
            onClick={() => setShowSidebar(false)}
            title="Ocultar explorador de carpetas (Ctrl + B)"
            className="vault-sidebar-icon-btn"
          >
            <PanelLeftClose size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
