import React from 'react';
import { RefreshCw } from 'lucide-react';
import VaultTreeNode from './VaultTreeNode';
import { VaultSidebarHeader } from './VaultSidebarHeader';
import { VaultFullTextResults } from './VaultFullTextResults';

/**
 * VaultSidebar — Explorador de árbol de carpetas Obsidian, selector de Hubs
 * y motor de búsqueda profunda Full-Text.
 */
export function VaultSidebar({
  searchMode,
  setSearchMode,
  searchTerm,
  setSearchTerm,
  selectedHub,
  setSelectedHub,
  vaultHubs,
  tree,
  expandedFolders,
  toggleFolder,
  expandAll,
  collapseAll,
  loadVaultData,
  refreshing,
  setShowSidebar,
  setShowNewNoteModal,
  setShowNewFolderModal,
  loading,
  filteredNotes,
  fullTextResults,
  searchingFullText,
  notes,
  activeNote,
  loadNote
}) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden'
      }}
    >
      {/* Barra de Búsqueda y Filtros Modular */}
      <VaultSidebarHeader
        searchMode={searchMode}
        setSearchMode={setSearchMode}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedHub={selectedHub}
        setSelectedHub={setSelectedHub}
        vaultHubs={vaultHubs}
        expandAll={expandAll}
        collapseAll={collapseAll}
        loadVaultData={loadVaultData}
        refreshing={refreshing}
        setShowSidebar={setShowSidebar}
        setShowNewNoteModal={setShowNewNoteModal}
        setShowNewFolderModal={setShowNewFolderModal}
      />

      {/* Vista Central: Árbol o Búsqueda Profunda */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.4rem 0.35rem' }}>
        {searchMode === 'fulltext' ? (
          <VaultFullTextResults
            fullTextResults={fullTextResults}
            searchingFullText={searchingFullText}
            searchTerm={searchTerm}
            notes={notes}
            activeNote={activeNote}
            loadNote={loadNote}
          />
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <RefreshCw size={16} className="animate-spin" style={{ margin: '0 auto 6px auto' }} />
            <span>Cargando carpetas...</span>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            No se encontraron notas
          </div>
        ) : (
          <VaultTreeNode
            node={tree}
            expandedFolders={expandedFolders}
            toggleFolder={toggleFolder}
            activeNote={activeNote}
            loadNote={loadNote}
          />
        )}
      </div>
    </div>
  );
}

export default VaultSidebar;
