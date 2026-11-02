import React from 'react';
import FinanceDeleteConfirmModal from '../FinanceDeleteConfirmModal';

export default function StructureDeleteModal({ itemToDelete, onCancel, onConfirm }) {
  if (!itemToDelete) return null;

  const title = itemToDelete.type === 'account'
    ? '¿Eliminar cuenta o tarjeta?'
    : itemToDelete.type === 'msi'
    ? '¿Eliminar plan MSI?'
    : itemToDelete.type === 'recurring'
    ? '¿Eliminar gasto recurrente?'
    : '¿Confirmar eliminación?';

  const confirmText = itemToDelete.type === 'account'
    ? 'Eliminar Cuenta'
    : itemToDelete.type === 'msi'
    ? 'Eliminar Plan'
    : itemToDelete.type === 'recurring'
    ? 'Eliminar Gasto'
    : 'Sí, Eliminar';

  const description = itemToDelete.type === 'account' ? (
    <>
      Estás a punto de eliminar <strong>"{itemToDelete.data?.name}"</strong> ({itemToDelete.data?.type === 'credit' ? 'Crédito' : 'Débito / Efectivo'}).
      <br />
      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        Esta acción no se puede deshacer en la base de datos local SQLite.
      </span>
    </>
  ) : itemToDelete.type === 'msi' ? (
    <>
      Estás a punto de eliminar el plan <strong>"{itemToDelete.data?.description}"</strong> por un total de{' '}
      <strong style={{ color: 'var(--danger)' }}>
        ${Number(itemToDelete.data?.totalAmount || 0).toLocaleString()}
      </strong>{' '}
      ({itemToDelete.data?.totalInstallments} cuotas).
    </>
  ) : itemToDelete.type === 'recurring' ? (
    <>
      Estás a punto de eliminar el gasto <strong>"{itemToDelete.data?.description}"</strong> por{' '}
      <strong style={{ color: 'var(--danger)' }}>
        ${Number(itemToDelete.data?.amount || 0).toLocaleString()}
      </strong>{' '}
      (Corte: día {itemToDelete.data?.dueDay}).
    </>
  ) : null;

  return (
    <FinanceDeleteConfirmModal
      isOpen={Boolean(itemToDelete)}
      onClose={onCancel}
      onConfirm={onConfirm}
      title={title}
      description={description}
      confirmText={confirmText}
    />
  );
}
