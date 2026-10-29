import { AlertTriangle, RotateCcw } from 'lucide-react';
import ModalWrapper from '../ui/ModalWrapper';
import TacticalButton from '../ui/TacticalButton';

export default function RestoreSnapshotModal({
  snapshotId,
  onClose,
  onConfirm
}) {
  if (!snapshotId) return null;

  return (
    <ModalWrapper
      isOpen={Boolean(snapshotId)}
      onClose={onClose}
      title="Restaurar Copia"
      icon={AlertTriangle}
      maxWidth="420px"
    >
      <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <div style={{ 
            width: '52px', 
            height: '52px', 
            borderRadius: '50%', 
            background: 'rgba(251, 191, 36, 0.15)', 
            border: '1px solid rgba(251, 191, 36, 0.3)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: 'var(--warning)' 
          }}>
            <AlertTriangle size={24} />
          </div>
        </div>

        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.6rem', color: '#ffffff' }}>
          ¿Restaurar copia de respaldo?
        </h3>

        <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '1.5rem', lineHeight: '1.4' }}>
          Esto reemplazará todos tus registros, categorías y presupuestos actuales por los de esa fecha de forma irreversible.
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
            variant="primary"
            icon={RotateCcw}
            onClick={onConfirm}
            style={{ flex: 1 }}
          >
            Restaurar
          </TacticalButton>
        </div>
      </div>
    </ModalWrapper>
  );
}
