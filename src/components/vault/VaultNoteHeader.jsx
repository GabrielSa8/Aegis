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
 * VaultNoteHeader — Barra de herramientas de la nota activa en Bóveda.
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
  handleDeleteActiveNote
}) {
  if (!activeNote) return null;

  return (
    <div
      style={{
        padding: '0.65rem 1.25rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        background: 'rgba(0, 0, 0, 0.15)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        {!showSidebar && (
          <button
            onClick={() => setShowSidebar(true)}
            title="Mostrar explorador de carpetas (Ctrl + B)"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <PanelLeftOpen size={15} />
          </button>
        )}
        <div>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-high)', margin: 0 }}>
            {activeNote.title}
          </h3>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.66rem',
              color: 'var(--text-muted)',
              marginTop: '2px'
            }}
          >
            <span>{activeNote.hub}</span>
            <span>•</span>
            <code>{activeNote.relative_path}</code>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {saveSuccess && (
          <span
            style={{
              fontSize: '0.72rem',
              color: '#34d399',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <CheckCircle2 size={13} /> Guardado
          </span>
        )}

        {/* Copiar enlace Wiki [[Nota]] */}
        <button
          onClick={handleCopyWikiLink}
          title="Copiar enlace [[WikiLink]]"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-color)',
            color: copiedLink ? '#34d399' : 'var(--text-muted)',
            fontSize: '0.7rem',
            padding: '4px 8px',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
        >
          {copiedLink ? <Check size={12} /> : <Link2 size={12} />}
          <span>{copiedLink ? 'Copiado' : '[[Wiki]]'}</span>
        </button>

        {/* Toggle Vista / Edición */}
        <button
          onClick={handleToggleEdit}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: isEditing ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
            border: isEditing ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border-color)',
            color: isEditing ? '#34d399' : 'var(--text-muted)',
            fontSize: '0.72rem',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
        >
          {isEditing ? <Eye size={13} /> : <Edit3 size={13} />}
          <span>{isEditing ? 'Vista Lectura' : 'Editar'}</span>
        </button>

        {/* Botón Guardar */}
        <TacticalButton
          variant="primary"
          size="sm"
          icon={Save}
          loading={saving}
          onClick={handleSave}
          style={{ fontSize: '0.72rem', padding: '5px 12px' }}
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </TacticalButton>

        {/* Botón Eliminar Nota */}
        <button
          onClick={handleDeleteActiveNote}
          title="Eliminar nota"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            opacity: 0.6,
            transition: 'var(--transition)'
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

export default VaultNoteHeader;
