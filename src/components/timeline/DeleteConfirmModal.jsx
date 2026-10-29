import React from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';
import ModalWrapper from '../ui/ModalWrapper';
import TacticalButton from '../ui/TacticalButton';

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm
}) {
  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmar Eliminación"
      icon={AlertCircle}
      maxWidth="380px"
    >
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <AlertCircle size={32} style={{ color: 'var(--danger)', margin: '0 auto 4px auto' }} />
        <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#fff' }}>¿Eliminar este hito del cronograma?</h4>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
          Esta acción no se puede deshacer en la base de datos local SQLite.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <TacticalButton
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Cancelar
          </TacticalButton>
          <TacticalButton
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={onConfirm}
          >
            Eliminar
          </TacticalButton>
        </div>
      </div>
    </ModalWrapper>
  );
}
