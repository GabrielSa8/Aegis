import React from 'react';
import { RefreshCw, BookOpen, PanelLeftOpen } from 'lucide-react';
import MarkdownViewer from '../MarkdownViewer';

/**
 * VaultNoteEditor — Área de visualización y edición en vivo de Markdown
 * con integración de MarkdownViewer, gestión de tareas y enlaces Wiki.
 */
export function VaultNoteEditor({
  activeNote,
  loadingNote,
  isEditing,
  noteContent,
  setNoteContent,
  viewerContainerRef,
  textareaRef,
  handleToggleTaskInNote,
  handleNavigateNote,
  handleTagClick,
  showSidebar,
  setShowSidebar
}) {
  if (!activeNote) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--text-muted)',
          gap: '10px'
        }}
      >
        {!showSidebar && (
          <button
            onClick={() => setShowSidebar(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: 600
            }}
          >
            <PanelLeftOpen size={14} />
            <span>Abrir Explorador de Bóveda</span>
          </button>
        )}
        <BookOpen size={36} color="var(--border-color)" />
        <span style={{ fontSize: '0.82rem' }}>Selecciona una nota para comenzar</span>
      </div>
    );
  }

  return (
    <div
      ref={viewerContainerRef}
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: isEditing ? 'hidden' : 'auto',
        padding: isEditing ? '0.75rem' : '1.25rem'
      }}
    >
      {loadingNote ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-muted)',
            gap: '8px'
          }}
        >
          <RefreshCw size={18} className="animate-spin" />
          <span>Leyendo nota...</span>
        </div>
      ) : isEditing ? (
        <textarea
          ref={textareaRef}
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          style={{
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            color: 'var(--text-high)',
            fontFamily: 'monospace',
            fontSize: '0.82rem',
            lineHeight: '1.5',
            resize: 'none',
            outline: 'none',
            overflowY: 'auto'
          }}
        />
      ) : (
        <MarkdownViewer
          content={noteContent}
          onToggleTask={handleToggleTaskInNote}
          onNavigateNote={handleNavigateNote}
          onTagClick={handleTagClick}
        />
      )}
    </div>
  );
}

export default VaultNoteEditor;
