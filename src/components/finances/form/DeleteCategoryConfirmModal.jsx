import FinanceDeleteConfirmModal from '../FinanceDeleteConfirmModal';

export default function DeleteCategoryConfirmModal({
  categoryToDelete,
  onClose,
  onConfirm
}) {
  if (!categoryToDelete) return null;

  return (
    <FinanceDeleteConfirmModal
      isOpen={Boolean(categoryToDelete)}
      onClose={onClose}
      onConfirm={onConfirm}
      title="¿Eliminar categoría?"
      description={
        <>
          ¿Deseas eliminar la categoría <strong>"{categoryToDelete}"</strong>? Todos sus registros y presupuestos se reasignarán a <strong>"Otros"</strong> automáticamente.
        </>
      }
      confirmText="Eliminar Categoría"
    />
  );
}
