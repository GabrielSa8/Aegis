import React from 'react';
import { RefreshCw, FolderDown } from 'lucide-react';
import VaultTreeNode from './VaultTreeNode';
import { VaultSidebarHeader } from './VaultSidebarHeader';
import { VaultFullTextResults } from './VaultFullTextResults';

/**
 * VaultSidebar — Explorador de árbol de carpetas Obsidian, selector de Hubs,
 * motor de búsqueda profunda Full-Text y zona de soltado Drag & Drop.
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
  loadNote,
  dragDrop,
  onRenameItem,
  onDeleteItem
}) {
  return (
    <aside
      className="vault-sidebar-aside"
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

      {/* Notificación táctil de reorganización Drag & Drop */}
      {dragDrop?.feedback && (
        <div
          style={{
            padding: '5px 10px',
            margin: '4px 8px 0 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.7rem',
            fontWeight: 600,
            background: dragDrop.feedback.type === 'success'
              ? 'color-mix(in srgb, var(--primary) 15%, transparent)'
              : 'color-mix(in srgb, var(--error, #ef4444) 15%, transparent)',
            color: dragDrop.feedback.type === 'success' ? 'var(--primary)' : 'var(--error, #ef4444)',
            border: `1px solid ${dragDrop.feedback.type === 'success' ? 'var(--primary)' : 'var(--error, #ef4444)'}`,
            textAlign: 'center',
            animation: 'fadeIn 0.2s ease-in-out'
          }}
        >
          {dragDrop.feedback.message}
        </div>
      )}

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
          <>
            {/* Zona táctica de soltado a la Raíz de la Bóveda */}
            {dragDrop?.draggedItem && (
              <div
                onDragOver={(e) => dragDrop.handleDragOver(e, '')}
                onDragLeave={(e) => dragDrop.handleDragLeave(e, '')}
                onDrop={(e) => dragDrop.handleDrop(e, '')}
                style={{
                  padding: '6px 10px',
                  margin: '2px 4px 6px 4px',
                  borderRadius: 'var(--radius-md)',
                  border: dragDrop.dragOverTarget === '' && dragDrop.isDropAllowed
                    ? '1px dashed var(--primary)'
                    : '1px dashed var(--border-color)',
                  background: dragDrop.dragOverTarget === '' && dragDrop.isDropAllowed
                    ? 'color-mix(in srgb, var(--primary) 14%, transparent)'
                    : 'color-mix(in srgb, var(--bg-card) 90%, transparent)',
                  color: dragDrop.dragOverTarget === '' && dragDrop.isDropAllowed
                    ? 'var(--primary)'
                    : 'var(--text-muted)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'var(--transition)'
                }}
              >
                <FolderDown size={13} />
                <span>Soltar en la Raíz de la Bóveda</span>
              </div>
            )}

            <VaultTreeNode
              node={tree}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              activeNote={activeNote}
              loadNote={loadNote}
              dragDrop={dragDrop}
              onRenameItem={onRenameItem}
              onDeleteItem={onDeleteItem}
            />
          </>
        )}
      </div>
    </aside>
  );
}

export default VaultSidebar;
