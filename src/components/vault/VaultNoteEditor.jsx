import React, { useState } from 'react';
import { RefreshCw, BookOpen, PanelLeftOpen, Lock, Unlock, Eye, EyeOff } from 'lucide-react';
import MarkdownViewer from '../MarkdownViewer';
import { TacticalButton } from '../ui/TacticalButton';

/**
 * VaultNoteEditor — Área de visualización y edición en vivo de Markdown
 * con soporte de Cifrado Granular AES-256-GCM, gestión de tareas y enlaces Wiki.
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
  setShowSidebar,
  isNoteLocked = false,
  noteLockReason = null,
  onUnlockNote
}) {
  const [unlockPassword, setUnlockPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState(null);

  const handleUnlockSubmit = async (e) => {
    e?.preventDefault();
    if (!unlockPassword.trim() || unlocking) return;
    setUnlocking(true);
    setUnlockError(null);
    const res = await onUnlockNote?.(unlockPassword);
    if (!res?.success) {
      setUnlockError(res?.error || 'Contraseña incorrecta');
    } else {
      setUnlockPassword('');
    }
    setUnlocking(false);
  };

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
              color: 'var(--primary)',
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
      {isNoteLocked ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '16px',
            textAlign: 'center',
            padding: '24px'
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'color-mix(in srgb, var(--warning, #d97706) 14%, transparent)',
              border: '1px solid color-mix(in srgb, var(--warning, #d97706) 45%, transparent)',
              boxShadow: '0 0 20px color-mix(in srgb, var(--warning, #d97706) 20%, transparent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--warning, #d97706)'
            }}
          >
            <Lock size={26} />
          </div>

          <div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-high)' }}>
              {noteLockReason === 'specific'
                ? 'Nota Cifrada con Contraseña Específica'
                : 'Nota Cifrada con Clave Maestra (AES-256)'}
            </h4>
            <p style={{ margin: 0, fontSize: '0.80rem', color: 'var(--text-muted)', maxWidth: '380px', lineHeight: 1.4 }}>
              {noteLockReason === 'specific'
                ? 'Esta nota tiene una clave secreta independiente. Ingrésala para descifrar en memoria.'
                : 'El contenido está protegido en disco (.md.enc). Ingresa tu Contraseña Maestra de Aegis para descifrar en memoria.'}
            </p>
          </div>

          <form
            onSubmit={handleUnlockSubmit}
            style={{
              display: 'flex',
              gap: '8px',
              width: '100%',
              maxWidth: '320px',
              marginTop: '4px'
            }}
          >
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={noteLockReason === 'specific' ? 'Contraseña específica...' : 'Contraseña Maestra...'}
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 32px 7px 10px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm, 6px)',
                  color: 'var(--text-high)',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
            <TacticalButton
              variant="primary"
              size="sm"
              icon={Unlock}
              loading={unlocking}
              onClick={handleUnlockSubmit}
            >
              Descifrar
            </TacticalButton>
          </form>

          {unlockError && (
            <span style={{ color: 'var(--danger)', fontSize: '0.74rem' }}>
              {unlockError}
            </span>
          )}
        </div>
      ) : loadingNote ? (
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
