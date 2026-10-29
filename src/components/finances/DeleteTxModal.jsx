import { Trash2 } from 'lucide-react';
import ModalWrapper from '../ui/ModalWrapper';
import TacticalButton from '../ui/TacticalButton';

export default function DeleteTxModal({
  transaction,
  onClose,
  onConfirm
}) {
  if (!transaction) return null;

  return (
    <ModalWrapper
      isOpen={Boolean(transaction)}
      onClose={onClose}
      title="Eliminar Registro"
      icon={Trash2}
      maxWidth="420px"
    >
      <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <div style={{ 
            width: '52px', 
            height: '52px', 
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

        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.6rem', color: '#ffffff' }}>
          ¿Eliminar esta transacción?
        </h3>

        <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '1.5rem', lineHeight: '1.4' }}>
          Estás a punto de borrar <strong>"{transaction.description || transaction.category}"</strong> por{' '}
          <strong style={{ color: transaction.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
            ${Number(transaction.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </strong> del {transaction.date}.
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
            Sí, Eliminar
          </TacticalButton>
        </div>
      </div>
    </ModalWrapper>
  );
}
