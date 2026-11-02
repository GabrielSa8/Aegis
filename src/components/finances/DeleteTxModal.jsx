import FinanceDeleteConfirmModal from './FinanceDeleteConfirmModal';

export default function DeleteTxModal({
  transaction,
  onClose,
  onConfirm
}) {
  if (!transaction) return null;

  return (
    <FinanceDeleteConfirmModal
      isOpen={Boolean(transaction)}
      onClose={onClose}
      onConfirm={onConfirm}
      title="¿Eliminar esta transacción?"
      description={
        <>
          Estás a punto de borrar <strong>"{transaction.description || transaction.category}"</strong> por{' '}
          <strong style={{ color: transaction.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
            ${Number(transaction.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </strong> del {transaction.date}.
        </>
      }
      confirmText="Sí, Eliminar"
    />
  );
}
