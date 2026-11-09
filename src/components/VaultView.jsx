import React from 'react';
import {
  useVault,
  VaultSidebar,
  VaultNoteHeader,
  VaultNoteEditor,
  VaultBacklinksPanel,
  useVaultNetwork,
  NewNoteModal,
  NewFolderModal,
  VaultDeleteModal,
  VaultRenameModal,
  EncryptNoteModal,
  DecryptPromptModal
} from './vault';

/**
 * VaultView — Vista modular de la Bóveda Obsidian en Aegis.
 * Desarticulado en submódulos especializados con navegación en árbol, búsqueda full-text y editor en vivo.
 */
export default function VaultView() {
  const vault = useVault();
  const networkState = useVaultNetwork(vault.activeNote, vault.handleNavigateNote);

  return (
    <div className="vault-view-container">
      {/* 🧭 Lienzo Dividido: Explorador de Carpetas Desplegable (Izquierda) + Editor (Derecha) */}
      <div className={`vault-view-grid ${vault.showSidebar ? 'has-sidebar' : ''}`}>
        {/* PANEL IZQUIERDO: Árbol de Carpetas & Búsqueda Profunda */}
        {vault.showSidebar && (
          <VaultSidebar
            searchMode={vault.searchMode}
            setSearchMode={vault.setSearchMode}
            searchTerm={vault.searchTerm}
            setSearchTerm={vault.setSearchTerm}
            selectedHub={vault.selectedHub}
            setSelectedHub={vault.setSelectedHub}
            vaultHubs={vault.vaultHubs}
            tree={vault.tree}
            expandedFolders={vault.expandedFolders}
            toggleFolder={vault.toggleFolder}
            expandAll={vault.expandAll}
            collapseAll={vault.collapseAll}
            loadVaultData={vault.loadVaultData}
            refreshing={vault.refreshing}
            setShowSidebar={vault.setShowSidebar}
            setShowNewNoteModal={vault.setShowNewNoteModal}
            setShowNewFolderModal={vault.setShowNewFolderModal}
            loading={vault.loading}
            filteredNotes={vault.filteredNotes}
            fullTextResults={vault.fullTextResults}
            searchingFullText={vault.searchingFullText}
            notes={vault.notes}
            activeNote={vault.activeNote}
            loadNote={vault.loadNote}
            dragDrop={vault.dragDrop}
            onRenameItem={vault.handleRequestRename}
            onDeleteItem={vault.handleRequestDelete}
          />
        )}

        {/* PANEL DERECHO: Visor / Editor de Markdown */}
        <div
          style={{
            position: 'relative',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden'
          }}
        >
          {vault.activeNote && (
            <VaultNoteHeader
              activeNote={vault.activeNote}
              showSidebar={vault.showSidebar}
              setShowSidebar={vault.setShowSidebar}
              saveSuccess={vault.saveSuccess}
              copiedLink={vault.copiedLink}
              handleCopyWikiLink={vault.handleCopyWikiLink}
              isEditing={vault.isEditing}
              handleToggleEdit={vault.handleToggleEdit}
              saving={vault.saving}
              handleSave={vault.handleSave}
              handleDeleteActiveNote={vault.handleDeleteActiveNote}
              handleRenameActiveNote={vault.handleRenameActiveNote}
              onEncryptNote={vault.handleEncryptActiveNote}
              onDecryptNote={vault.handleDecryptActiveNote}
              onOpenEncryptModal={() => vault.setEncryptModalOpen(true)}
              onOpenDecryptModal={() => vault.setDecryptModalOpen(true)}
              encryptingNote={vault.encryptingNote}
              decryptingNote={vault.decryptingNote}
              isNoteLocked={vault.isNoteLocked}
            />
          )}

          <VaultNoteEditor
            activeNote={vault.activeNote}
            loadingNote={vault.loadingNote}
            isEditing={vault.isEditing}
            noteContent={vault.noteContent}
            setNoteContent={vault.setNoteContent}
            viewerContainerRef={vault.viewerContainerRef}
            textareaRef={vault.textareaRef}
            handleToggleTaskInNote={vault.handleToggleTaskInNote}
            handleNavigateNote={vault.handleNavigateNote}
            handleTagClick={vault.handleTagClick}
            showSidebar={vault.showSidebar}
            setShowSidebar={vault.setShowSidebar}
            isNoteLocked={vault.isNoteLocked}
            noteLockReason={vault.noteLockReason}
            onUnlockNote={vault.handleUnlockNote}
          />

          {/* 🔗 Red de Conocimiento: Panel Retráctil de Backlinks, Salientes y Micro-Grafo */}
          {vault.activeNote && (
            <VaultBacklinksPanel
              networkState={networkState}
              onNavigateNote={vault.handleNavigateNote}
            />
          )}
        </div>
      </div>

      {/* Modal: Crear Nueva Nota */}
      <NewNoteModal
        isOpen={vault.showNewNoteModal}
        onClose={() => vault.setShowNewNoteModal(false)}
        onSubmit={vault.handleCreateNoteSubmit}
        newNoteTitle={vault.newNoteTitle}
        setNewNoteTitle={vault.setNewNoteTitle}
        vaultHubs={vault.vaultHubs}
        newNoteHub={vault.newNoteHub}
        setNewNoteHub={vault.setNewNoteHub}
        newNoteSubfolderChoice={vault.newNoteSubfolderChoice}
        setNewNoteSubfolderChoice={vault.setNewNoteSubfolderChoice}
        customSubfolder={vault.customSubfolder}
        setCustomSubfolder={vault.setCustomSubfolder}
        availableSubfolders={vault.availableSubfoldersForNewNote}
        newNoteTemplate={vault.newNoteTemplate}
        setNewNoteTemplate={vault.setNewNoteTemplate}
      />

      {/* Modal: Crear Nueva Carpeta */}
      <NewFolderModal
        isOpen={vault.showNewFolderModal}
        onClose={() => vault.setShowNewFolderModal(false)}
        onSubmit={vault.handleCreateFolderSubmit}
        newFolderHub={vault.newFolderHub}
        setNewFolderHub={vault.setNewFolderHub}
        vaultHubs={vault.vaultHubs}
        newFolderParent={vault.newFolderParent}
        setNewFolderParent={vault.setNewFolderParent}
        availableSubfolders={vault.availableSubfoldersForNewFolder}
        newFolderName={vault.newFolderName}
        setNewFolderName={vault.setNewFolderName}
      />

      {/* Modal Táctico: Confirmación de Eliminación Definitiva */}
      <VaultDeleteModal
        isOpen={Boolean(vault.itemToDelete)}
        onClose={() => vault.setItemToDelete(null)}
        onConfirm={vault.handleConfirmDelete}
        item={vault.itemToDelete}
      />

      {/* Modal Táctico: Renombrado de Nota o Carpeta */}
      <VaultRenameModal
        isOpen={Boolean(vault.itemToRename)}
        onClose={() => vault.setItemToRename(null)}
        onSubmit={vault.handleConfirmRename}
        item={vault.itemToRename}
      />

      {/* Modal Táctico: Cifrado Granular de Nota (General vs Específico) */}
      <EncryptNoteModal
        isOpen={vault.encryptModalOpen}
        onClose={() => vault.setEncryptModalOpen(false)}
        noteTitle={vault.activeNote?.title}
        onConfirm={vault.handleEncryptActiveNote}
        loading={vault.encryptingNote}
      />

      {/* Modal Táctico: Solicitud de Contraseña para Descifrar Nota */}
      <DecryptPromptModal
        isOpen={vault.decryptModalOpen}
        onClose={() => vault.setDecryptModalOpen(false)}
        noteTitle={vault.activeNote?.title}
        isSpecific={vault.activeNote?.encryption_mode === 'specific'}
        onConfirm={vault.handleDecryptActiveNote}
        loading={vault.decryptingNote}
      />
    </div>
  );
}
