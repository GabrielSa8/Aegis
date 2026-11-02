import React from 'react';
import { Trash2 } from 'lucide-react';
import ModalWrapper from '../ui/ModalWrapper';
import TacticalButton from '../ui/TacticalButton';

/**
 * VaultDeleteModal — Modal de confirmación táctico para eliminación definitiva
 * de notas y carpetas en la Bóveda Obsidian.
 * Cero hardcoded hex colors, 100% tokens de tema táctico de Aegis.
 */
export function VaultDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  item
}) {
  if (!isOpen || !item) return null;

  const isFolder = item.type === 'folder';
  const itemName = item.title || item.name || 'Elemento seleccionado';

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={isFolder ? '¿Eliminar carpeta permanentemente?' : '¿Eliminar nota permanentemente?'}
      icon={Trash2}
      maxWidth="430px"
    >
      <div style={{ textAlign: 'center', padding: '0.4rem 0 0.2rem 0' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'color-mix(in srgb, var(--danger) 15%, transparent)',
              border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--danger)',
              boxShadow: '0 0 24px color-mix(in srgb, var(--danger) 20%, transparent)'
            }}
          >
            <Trash2 size={24} />
          </div>
        </div>

        <h3
          style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            marginBottom: '0.5rem',
            color: 'var(--text-high)',
            letterSpacing: '-0.01em'
          }}
        >
          {isFolder ? '¿Eliminar carpeta y su contenido?' : '¿Eliminar nota de la Bóveda?'}
        </h3>

        <div
          style={{
            fontSize: '0.84rem',
            color: 'var(--text-muted)',
            marginBottom: '1rem',
            lineHeight: '1.45'
          }}
        >
          Estás a punto de borrar definitivamente{' '}
          <strong style={{ color: 'var(--text-high)' }}>"{itemName}"</strong>.
          {isFolder && (
            <div style={{ marginTop: '4px', color: 'var(--danger)', fontWeight: 600 }}>
              Todas las notas y subcarpetas dentro de esta ruta serán eliminadas.
            </div>
          )}
        </div>

        <div
          style={{
            marginBottom: '1.4rem',
            padding: '0.6rem 0.8rem',
            background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.74rem',
            color: 'var(--text-muted)',
            textAlign: 'left',
            fontFamily: 'monospace',
            wordBreak: 'break-all'
          }}
        >
          {item.path || item.relativePath}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <TacticalButton
            variant="secondary"
            onClick={onClose}
            style={{ flex: 1 }}
          >
            Cancelar
          </TacticalButton>
          <TacticalButton
            variant="danger"
            icon={Trash2}
            onClick={onConfirm}
            style={{ flex: 1 }}
          >
            Eliminar Permanentemente
          </TacticalButton>
        </div>
      </div>
    </ModalWrapper>
  );
}

export default VaultDeleteModal;
