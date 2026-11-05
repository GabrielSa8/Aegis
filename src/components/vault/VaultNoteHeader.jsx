import React from 'react';
import {
  PanelLeftOpen,
  CheckCircle2,
  Link2,
  Check,
  Eye,
  Edit3,
  Save,
  Trash2
} from 'lucide-react';
import { TacticalButton } from '../ui/TacticalButton';

/**
 * VaultNoteHeader — Barra de herramientas de la nota activa en Bóveda Obsidian.
 * Cero hardcoded hex colors, 100% variables semánticas de tema.
 */
export function VaultNoteHeader({
  activeNote,
  showSidebar,
  setShowSidebar,
  saveSuccess,
  copiedLink,
  handleCopyWikiLink,
  isEditing,
  handleToggleEdit,
  saving,
  handleSave,
  handleDeleteActiveNote,
  handleRenameActiveNote
}) {
  if (!activeNote) return null;

  return (
    <div className="vault-note-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        {!showSidebar && (
          <button
            onClick={() => setShowSidebar(true)}
            title="Mostrar explorador de carpetas (Ctrl + B)"
            aria-label="Mostrar explorador de carpetas"
            className="vault-btn vault-btn-icon"
          >
            <PanelLeftOpen size={15} />
          </button>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <h3
              style={{
                fontSize: '0.92rem',
                fontWeight: 800,
                color: 'var(--text-high)',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {activeNote.title}
            </h3>
            {handleRenameActiveNote && (
              <button
                onClick={handleRenameActiveNote}
                title="Renombrar título de nota"
                aria-label="Renombrar nota"
                className="vault-btn vault-btn-icon"
              >
                <Edit3 size={13} />
              </button>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.66rem',
              color: 'var(--text-muted)',
              marginTop: '2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            <span>{activeNote.hub}</span>
            <span>•</span>
            <code style={{ color: 'var(--text-muted)' }}>{activeNote.relative_path}</code>
          </div>
        </div>
      </div>

      <div className="vault-note-header-actions">
        {saveSuccess && (
          <span
            style={{
              fontSize: '0.72rem',
              color: 'var(--primary)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <CheckCircle2 size={13} />
            <span className="vault-btn-label">Guardado</span>
          </span>
        )}

        {/* Copiar enlace Wiki [[Nota]] */}
        <button
          onClick={handleCopyWikiLink}
          title="Copiar enlace [[WikiLink]]"
          aria-label="Copiar WikiLink"
          className={`vault-btn ${copiedLink ? 'is-active' : ''}`}
        >
          {copiedLink ? <Check size={12} /> : <Link2 size={12} />}
          <span className="vault-btn-label">{copiedLink ? 'Copiado' : '[[Wiki]]'}</span>
        </button>

        {/* Toggle Vista / Edición */}
        <button
          onClick={handleToggleEdit}
          title={isEditing ? 'Cambiar a Vista Lectura' : 'Editar nota en Markdown'}
          aria-label={isEditing ? 'Vista Lectura' : 'Editar'}
          className={`vault-btn ${isEditing ? 'is-active' : ''}`}
        >
          {isEditing ? <Eye size={13} /> : <Edit3 size={13} />}
          <span className="vault-btn-label">{isEditing ? 'Lectura' : 'Editar'}</span>
        </button>

        {/* Botón Guardar */}
        <TacticalButton
          variant="primary"
          size="sm"
          icon={Save}
          loading={saving}
          onClick={handleSave}
          title="Guardar cambios (Ctrl + S)"
          aria-label="Guardar cambios"
          style={{ fontSize: '0.72rem', padding: '4px 9px' }}
        >
          <span className="vault-btn-label">{saving ? 'Guardando...' : 'Guardar'}</span>
        </TacticalButton>

        {/* Botón Eliminar Nota */}
        <button
          onClick={handleDeleteActiveNote}
          title="Eliminar nota definitivamente"
          aria-label="Eliminar nota"
          className="vault-btn vault-btn-icon vault-btn-danger"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export default VaultNoteHeader;
