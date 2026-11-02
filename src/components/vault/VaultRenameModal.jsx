import React, { useState, useEffect, useRef } from 'react';
import { Edit3 } from 'lucide-react';
import ModalWrapper from '../ui/ModalWrapper';
import TacticalButton from '../ui/TacticalButton';

/**
 * VaultRenameModal — Modal táctico para renombrar notas o carpetas en la Bóveda Obsidian.
 * Cero hardcoded hex colors, 100% variables semánticas.
 */
export function VaultRenameModal({
  isOpen,
  onClose,
  onSubmit,
  item
}) {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && item) {
      const initialName = item.type === 'note'
        ? (item.title || item.relativePath?.split('/').pop()?.replace(/\.md$/, '') || '')
        : (item.name || item.path?.split('/').pop() || '');
      setNewName(initialName);
      setError('');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const isFolder = item.type === 'folder';

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const clean = newName.trim();
    if (!clean) {
      setError('El nombre no puede estar vacío');
      return;
    }
    if (clean.includes('/') || clean.includes('\\')) {
      setError('El nombre no puede contener barras diagonales');
      return;
    }
    onSubmit(item, clean);
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={isFolder ? 'Renombrar Carpeta' : 'Renombrar Nota'}
      icon={Edit3}
      maxWidth="420px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              marginBottom: '6px'
            }}
          >
            {isFolder ? 'Nuevo nombre de carpeta' : 'Nuevo título de nota'}
          </label>
          <input
            ref={inputRef}
            type="text"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              if (error) setError('');
            }}
            placeholder={isFolder ? 'Ej. Documentación' : 'Ej. Mi Nueva Nota'}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'color-mix(in srgb, var(--bg-card) 90%, transparent)',
              border: error ? '1px solid var(--danger)' : '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-high)',
              fontSize: '0.85rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          {error && (
            <div style={{ color: 'var(--danger)', fontSize: '0.72rem', marginTop: '4px' }}>
              {error}
            </div>
          )}
        </div>

        <div
          style={{
            padding: '6px 10px',
            background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            fontFamily: 'monospace',
            wordBreak: 'break-all'
          }}
        >
          Ruta actual: {item.relativePath || item.path}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <TacticalButton variant="secondary" onClick={onClose}>
            Cancelar
          </TacticalButton>
          <TacticalButton variant="primary" type="submit" icon={Edit3}>
            Guardar Nombre
          </TacticalButton>
        </div>
      </form>
    </ModalWrapper>
  );
}

export default VaultRenameModal;
