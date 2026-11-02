import { useRef, useEffect } from 'react';
import { Check, X, Calendar, FileText, Zap } from 'lucide-react';
import {
  useTransactionForm,
  CategoryManagerModal,
  DeleteCategoryConfirmModal
} from '../form';
import DeckHeaderToggle from './DeckHeaderToggle';
import DeckHeroAmount from './DeckHeroAmount';
import AccountPillSelector from './AccountPillSelector';
import CategoryChipGrid from './CategoryChipGrid';
import DeckDatePicker from './DeckDatePicker';
import TacticalButton from '../../ui/TacticalButton';

export default function QuickEntryDeck({
  selectedDate,
  onTransactionSave,
  editingTransaction,
  onCancelEdit,
  onCategoriesChange
}) {
  const amountRef = useRef(null);

  const {
    type,
    setType,
    amount,
    setAmount,
    setCategory,
    paymentMethod,
    setPaymentMethod,
    description,
    setDescription,
    date,
    setDate,
    categories,
    newCategoryName,
    setNewCategoryName,
    showAddCategory,
    setShowAddCategory,
    showManager,
    setShowManager,
    editingCatName,
    setEditingCatName,
    newCatEditValue,
    setNewCatEditValue,
    categoryToDelete,
    setCategoryToDelete,
    resetForm,
    handleAddCategory,
    handleSaveEditCategory,
    confirmDeleteCategory,
    handleSubmit,
    safeCategories,
    selectedCategory
  } = useTransactionForm({
    selectedDate,
    onTransactionSave,
    editingTransaction,
    onCancelEdit,
    onCategoriesChange
  });

  // Atajo global Ctrl+N para enfocar monto
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        amountRef.current?.focus();
        amountRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-foco al editar o montar
  useEffect(() => {
    amountRef.current?.focus();
  }, [editingTransaction]);

  const isEditing = Boolean(editingTransaction);

  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        padding: '1rem',
        borderRadius: 'var(--radius-lg, 12px)',
        border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
        background: 'var(--bg-card, rgba(255,255,255,0.02))'
      }}
    >
      {/* Cabecera & Conmutador de Tipo */}
      <DeckHeaderToggle 
        isEditing={isEditing}
        type={type}
        onTypeChange={(newType) => {
          setType(newType);
          setCategory('');
        }}
      />

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Hero Input de Monto */}
        <DeckHeroAmount
          ref={amountRef}
          amount={amount}
          onChange={setAmount}
          type={type}
        />

        {/* Cuentas / Métodos de Pago */}
        <AccountPillSelector 
          value={paymentMethod} 
          onChange={setPaymentMethod} 
        />

        {/* Categorías */}
        <CategoryChipGrid
          categories={safeCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={setCategory}
          onOpenManager={() => setShowManager(true)}
        />

        {/* Concepto / Nota */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            CONCEPTO / NOTA
          </label>
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.35rem',
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-sm, 6px)',
              border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
              background: 'color-mix(in srgb, var(--bg-card) 40%, transparent)'
            }}
          >
            <FileText size={13} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Despensa, Gasolina, Pago freelance..."
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '0.75rem',
                color: 'var(--text-high)'
              }}
            />
          </div>
        </div>

        {/* Selector Táctico de Fecha */}
        <DeckDatePicker 
          value={date} 
          onChange={setDate} 
        />

        {/* Botones de Acción con Responsive Único */}
        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem' }}>
          <button
            type="submit"
            className="cockpit-submit-btn"
            style={{ flex: 1 }}
          >
            {isEditing ? (
              <Check size={16} className="cockpit-submit-icon" />
            ) : (
              <Zap size={16} className="cockpit-submit-icon" />
            )}
            <span>{isEditing ? 'Guardar Cambios (Enter)' : 'Registrar Operación (Enter)'}</span>
          </button>
          {isEditing && (
            <TacticalButton
              type="button"
              variant="secondary"
              size="md"
              icon={X}
              onClick={() => resetForm()}
              title="Cancelar Edición"
            />
          )}
        </div>
      </form>

      {/* Modal Administrador de Categorías */}
      <CategoryManagerModal
        isOpen={showManager}
        onClose={() => setShowManager(false)}
        categories={categories}
        showAddCategory={showAddCategory}
        setShowAddCategory={setShowAddCategory}
        newCategoryName={newCategoryName}
        setNewCategoryName={setNewCategoryName}
        onAddCategory={handleAddCategory}
        editingCatName={editingCatName}
        setEditingCatName={setEditingCatName}
        newCatEditValue={newCatEditValue}
        setNewCatEditValue={setNewCatEditValue}
        onSaveEditCategory={handleSaveEditCategory}
        onSelectDeleteCategory={setCategoryToDelete}
      />

      {/* Modal Confirmar Eliminación de Categoría */}
      <DeleteCategoryConfirmModal
        categoryToDelete={categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={confirmDeleteCategory}
      />
    </div>
  );
}
