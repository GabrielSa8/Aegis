import React from 'react';
import { Package, Trash2 } from 'lucide-react';
import { ModalWrapper, TacticalButton } from '../ui';

/**
 * ModpackDeleteModal — Modal táctico unificado de confirmación para eliminar Modpacks.
 * Cero hardcoded colors, 100% variables de tema de Aegis.
 */
export function ModpackDeleteModal({
  isOpen,
  onClose,
  modpack,
  onConfirmDelete
}) {
  if (!isOpen || !modpack) return null;

  const skillCount = Array.isArray(modpack.skills) ? modpack.skills.length : 0;

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="420px">
      <div style={{ textAlign: 'center', padding: '0.4rem 0 0.2rem 0' }}>
        {/* Icono Táctico de Advertencia */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'color-mix(in srgb, var(--danger, #ef4444) 15%, transparent)',
              border: '1px solid color-mix(in srgb, var(--danger, #ef4444) 30%, transparent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--danger, #f87171)',
              boxShadow: '0 0 24px color-mix(in srgb, var(--danger, #ef4444) 20%, transparent)'
            }}
          >
            <Trash2 size={24} />
          </div>
        </div>

        {/* Título */}
        <h3
          style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            marginBottom: '0.4rem',
            color: 'var(--text-high)',
            letterSpacing: '-0.01em'
          }}
        >
          ¿Eliminar Modpack?
        </h3>

        {/* Descripción */}
        <div
          style={{
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            marginBottom: '0.9rem',
            lineHeight: '1.4'
          }}
        >
          Esta acción eliminará el modpack de tu arsenal de meta-skills. Las habilidades individuales seguirán intactas en el sistema.
        </div>

        {/* Detalle del Modpack a eliminar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0.6rem 0.8rem',
            background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.2rem',
            textAlign: 'left'
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-xs)',
              background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Package size={15} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-high)', display: 'block' }}>
              {modpack.name}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              {skillCount} {skillCount === 1 ? 'skill agrupada' : 'skills agrupadas'} {modpack.role ? `• ${modpack.role}` : ''}
            </span>
          </div>
        </div>

        {/* Botones Tácticos Cancelar / Confirmar */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <TacticalButton
            type="button"
            variant="secondary"
            onClick={onClose}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Cancelar
          </TacticalButton>
          <TacticalButton
            type="button"
            variant="danger"
            icon={<Trash2 size={13} />}
            onClick={() => onConfirmDelete(modpack.id)}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Eliminar
          </TacticalButton>
        </div>
      </div>
    </ModalWrapper>
  );
}

export default ModpackDeleteModal;
