import { Trash2 } from 'lucide-react';
import ModalWrapper from '../ui/ModalWrapper';
import TacticalButton from '../ui/TacticalButton';

/**
 * FinanceDeleteConfirmModal — Alerta modal universal y unificada de confirmación
 * de borrado para el módulo de Finanzas (Transacciones, Categorías, Cuentas, MSI, Recurrentes).
 * Cero hardcoded hex colors, 100% tokens de tema táctico de Aegis.
 */
export default function FinanceDeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Confirmar eliminación?',
  description = 'Esta acción no se puede deshacer.',
  itemDetails = null,
  confirmText = 'Eliminar',
  cancelText = 'Cancelar'
}) {
  if (!isOpen) return null;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={Trash2}
      maxWidth="420px"
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
            fontSize: '1.12rem',
            fontWeight: 800,
            marginBottom: '0.6rem',
            color: 'var(--text-high)',
            letterSpacing: '-0.01em'
          }}
        >
          {title}
        </h3>

        <div
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            marginBottom: itemDetails ? '1rem' : '1.5rem',
            lineHeight: '1.45'
          }}
        >
          {description}
        </div>

        {itemDetails && (
          <div
            style={{
              marginBottom: '1.5rem',
              padding: '0.65rem 0.85rem',
              background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              color: 'var(--text-high)',
              textAlign: 'left'
            }}
          >
            {itemDetails}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <TacticalButton
            variant="secondary"
            onClick={onClose}
            style={{ flex: 1 }}
          >
            {cancelText}
          </TacticalButton>
          <TacticalButton
            variant="danger"
            icon={Trash2}
            onClick={onConfirm}
            style={{ flex: 1 }}
          >
            {confirmText}
          </TacticalButton>
        </div>
      </div>
    </ModalWrapper>
  );
}
