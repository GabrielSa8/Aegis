import { memo } from 'react';
import { Check, X, Settings } from 'lucide-react';
import {
  useTransactionForm,
  CategoryManagerModal,
  DeleteCategoryConfirmModal
} from './finances/form';
import TacticalButton from './ui/TacticalButton';

function TransactionForm({
  selectedDate,
  onTransactionSave,
  editingTransaction,
  onCancelEdit,
  onCategoriesChange
}) {
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
    selectedCategory,
    themeClass
  } = useTransactionForm({
    selectedDate,
    onTransactionSave,
    editingTransaction,
    onCancelEdit,
    onCategoriesChange
  });

  return (
    <div className="form-container glass">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
          {editingTransaction ? '✏️ Editar Registro' : '📝 Añadir Transacción'}
        </h3>
        {editingTransaction && (
          <TacticalButton
            variant="secondary"
            size="sm"
            icon={X}
            onClick={() => resetForm()}
            title="Cancelar Edición"
            style={{ width: '32px', height: '32px', padding: 0 }}
          />
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Selector de Tipo (Ingreso / Gasto) */}
        <div className="form-group">
          <label>Tipo de Transacción</label>
          <div className="btn-toggle-group">
            <button
              type="button"
              className={`btn-toggle ${type === 'income' ? 'active income' : ''}`}
              onClick={() => { setType('income'); setCategory(''); }}
            >
              Ingreso (+)
            </button>
            <button
              type="button"
              className={`btn-toggle ${type === 'expense' ? 'active expense' : ''}`}
              onClick={() => { setType('expense'); setCategory(''); }}
            >
              Gasto (-)
            </button>
          </div>
        </div>

        {/* Monto y Fecha */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="amount">Monto ($)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontWeight: 600 }}>$</span>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ paddingLeft: '28px' }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="date">Fecha</label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Categoría */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ margin: 0 }}>Categoría</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setShowAddCategory(!showAddCategory)}
                style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
              >
                {showAddCategory ? 'Cancelar' : '+ Crear'}
              </button>
              <button
                type="button"
                onClick={() => setShowManager(true)}
                style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}
              >
                <Settings size={12} />
                <span>Gestionar</span>
              </button>
            </div>
          </div>

          {showAddCategory ? (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Ej. Cuidado Personal"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategory(e);
                  }
                }}
                autoFocus
              />
              <TacticalButton
                variant="primary"
                icon={Check}
                onClick={handleAddCategory}
                style={{ height: '42px', width: '42px', padding: 0 }}
              />
            </div>
          ) : (
            <select
              value={selectedCategory}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              {safeCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}
        </div>

        {/* Método de Pago */}
        <div className="form-group">
          <label>Método de Pago</label>
          <div className="btn-toggle-group" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            {['Efectivo', 'Débito', 'Crédito'].map((method) => (
              <button
                key={method}
                type="button"
                className={`btn-toggle ${paymentMethod === method ? `active ${themeClass} ${type}-${method}` : ''}`}
                onClick={() => setPaymentMethod(method)}
                style={{ fontSize: '0.85rem' }}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        {/* Descripción */}
        <div className="form-group" style={{ marginBottom: '1.8rem' }}>
          <label htmlFor="description">Detalle / Notas (Opcional)</label>
          <textarea
            id="description"
            rows="2"
            placeholder="Ej. Súper semanal, Café, Pago de luz..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Botón Guardar */}
        <TacticalButton
          type="submit"
          variant="primary"
          icon={Check}
          style={{ 
            width: '100%', 
            background: `var(--${themeClass}-grad)`, 
            boxShadow: `0 4px 12px var(--${themeClass}-glow)` 
          }}
        >
          {editingTransaction ? 'Actualizar Registro' : 'Registrar Dinero'}
        </TacticalButton>
      </form>

      {/* ⚙️ MODAL MANEJADOR DE CATEGORÍAS */}
      <CategoryManagerModal
        isOpen={showManager}
        onClose={() => setShowManager(false)}
        categories={categories}
        editingCatName={editingCatName}
        setEditingCatName={setEditingCatName}
        newCatEditValue={newCatEditValue}
        setNewCatEditValue={setNewCatEditValue}
        onSaveEditCategory={handleSaveEditCategory}
        onSelectDeleteCategory={setCategoryToDelete}
      />

      {/* ⚠️ MODAL DE CONFIRMACIÓN DE BORRADO DE CATEGORÍA */}
      <DeleteCategoryConfirmModal
        categoryToDelete={categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={confirmDeleteCategory}
      />
    </div>
  );
}

export default memo(TransactionForm);
