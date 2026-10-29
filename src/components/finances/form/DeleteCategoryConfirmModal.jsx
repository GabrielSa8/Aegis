import { Trash2 } from 'lucide-react';
import ModalWrapper from '../../ui/ModalWrapper';
import TacticalButton from '../../ui/TacticalButton';

export default function DeleteCategoryConfirmModal({
  categoryToDelete,
  onClose,
  onConfirm
}) {
  if (!categoryToDelete) return null;

  return (
    <ModalWrapper
      isOpen={Boolean(categoryToDelete)}
      onClose={onClose}
      title="Eliminar Categoría"
      icon={Trash2}
      maxWidth="380px"
    >
      <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '50%', 
            background: 'rgba(244, 63, 94, 0.15)', 
            border: '1px solid rgba(244, 63, 94, 0.3)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: 'var(--danger)' 
          }}>
            <Trash2 size={24} />
          </div>
        </div>

        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem', color: '#ffffff' }}>
          ¿Eliminar categoría?
        </h3>

        <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginBottom: '1.5rem', lineHeight: '1.3' }}>
          ¿Deseas eliminar <strong>"{categoryToDelete}"</strong>? Todos sus registros y presupuestos se reasignarán a <strong>"Otros"</strong> automáticamente.
        </p>

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
            Eliminar
          </TacticalButton>
        </div>
      </div>
    </ModalWrapper>
  );
}
