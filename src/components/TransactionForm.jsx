/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useState, useEffect, memo } from 'react';
import { Check, Trash2, X, Edit3, Settings } from 'lucide-react';
import { getCategories, addCategory, updateCategory, deleteCategory } from '../utils/storage';

function TransactionForm({ selectedDate, onTransactionSave, editingTransaction, onCancelEdit, onCategoriesChange }) {
  const [type, setType] = useState('expense'); // 'income' | 'expense'
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Débito');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(selectedDate);
  
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  
  // Estados para administración de categorías
  const [showManager, setShowManager] = useState(false);
  const [editingCatName, setEditingCatName] = useState('');
  const [newCatEditValue, setNewCatEditValue] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const resetForm = (notifyCancel = true) => {
    setAmount('');
    setCategory('');
    setPaymentMethod('Débito');
    setDescription('');
    setDate(selectedDate);
    if (notifyCancel && editingTransaction && onCancelEdit) {
      onCancelEdit();
    }
  };

  // Cargar categorías disponibles
  useEffect(() => {
    const loadCategories = async () => {
      setCategories(await getCategories());
    };
    loadCategories();
  }, []);

  // Sincronizar fecha seleccionada en el calendario
  useEffect(() => {
    if (!editingTransaction) {
      setDate(selectedDate);
    }
  }, [selectedDate, editingTransaction]);

  // Manejar edición de transacción existente
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setCategory(editingTransaction.category);
      setPaymentMethod(editingTransaction.paymentMethod || 'Débito');
      setDescription(editingTransaction.description || '');
      setDate(editingTransaction.date);
    } else {
      resetForm(false);
    }
  }, [editingTransaction]);

  // Crear categoría personalizada en vivo
  const handleAddCategory = async (e) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (name) {
      const updated = await addCategory(name);
      setCategories(updated);
      setCategory(name);
      newCategoryName && setNewCategoryName('');
      setShowAddCategory(false);
      if (onCategoriesChange) {
        await onCategoriesChange();
      }
    }
  };

  // Guardar cambios al editar categoría
  const handleSaveEditCategory = async (oldName) => {
    const newName = newCatEditValue.trim();
    if (newName && newName !== oldName) {
      const updated = await updateCategory(oldName, newName);
      setCategories(updated);
      if (category === oldName) {
        setCategory(newName);
      }
      setEditingCatName('');
      if (onCategoriesChange) {
        await onCategoriesChange();
      }
    }
  };

  // Confirmar y eliminar categoría sin depender de window.confirm
  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    const catName = categoryToDelete;
    setCategoryToDelete(null);
    const updated = await deleteCategory(catName);
    setCategories(updated);
    if (category === catName) {
      setCategory('Otros');
    }
    if (onCategoriesChange) {
      await onCategoriesChange();
    }
  };

  // Enviar formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      alert('Por favor ingresa un monto válido mayor a 0.');
      return;
    }

    const finalCategory = category || safeCategories[0] || '';
    if (!finalCategory) {
      alert('Por favor selecciona una categoría.');
      return;
    }

    const transactionData = {
      ...(editingTransaction ? { id: editingTransaction.id } : {}),
      date,
      amount: parsedAmount,
      type,
      category: finalCategory,
      paymentMethod,
      description: description.trim(),
    };

    onTransactionSave(transactionData);
    resetForm();
  };

  // Filtrar categorías según tipo (ej. "Ingresos" si es tipo ingreso)
  const filteredCategories = categories.filter(cat => {
    if (!cat) return false;
    if (type === 'income') {
      return (
        cat.toLowerCase().includes('ingreso') ||
        cat.toLowerCase().includes('sueldo') ||
        cat.toLowerCase().includes('venta') ||
        cat.toLowerCase().includes('otros') ||
        cat.toLowerCase().includes('inversión') ||
        cat.toLowerCase().includes('bono') ||
        cat.toLowerCase().includes('freelance') ||
        cat.toLowerCase().includes('comisi') ||
        cat === category // Permite siempre la categoría activa o recién creada
      );
    } else {
      return !cat.toLowerCase().includes('ingresos (sueldo/ventas)') && !cat.toLowerCase().includes('sueldo');
    }
  });

  const safeCategories = filteredCategories.length > 0
    ? filteredCategories
    : (categories.length > 0 ? categories : ['General']);

  const selectedCategory = category || safeCategories[0] || '';

  const themeClass = type === 'income' ? 'success' : 'danger';

  return (
    <div className="form-container glass">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
          {editingTransaction ? '✏️ Editar Registro' : '📝 Añadir Transacción'}
        </h3>
        {editingTransaction && (
          <button onClick={resetForm} className="btn btn-secondary btn-icon" style={{ width: '32px', height: '32px' }} title="Cancelar Edición">
            <X size={16} />
          </button>
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
              <button type="button" onClick={handleAddCategory} className="btn btn-primary btn-icon" style={{ height: '42px', width: '42px' }}>
                <Check size={18} />
              </button>
            </div>
          ) : (
            <select
              value={selectedCategory}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              {safeCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}
        </div>

        {/* Método de Pago */}
        <div className="form-group">
          <label>Método de Pago</label>
          <div className="btn-toggle-group" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            {['Efectivo', 'Débito', 'Crédito'].map(method => (
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
        <button type="submit" className={`btn btn-primary`} style={{ width: '100%', background: `var(--${themeClass}-grad)`, boxShadow: `0 4px 12px var(--${themeClass}-glow)` }}>
          <Check size={18} />
          {editingTransaction ? 'Actualizar Registro' : 'Registrar Dinero'}
        </button>
      </form>

      {/* ⚙️ MODAL MANEJADOR DE CATEGORÍAS */}
      {showManager && (
        <div className="modal-overlay">
          <div className="modal-content glass" style={{ minWidth: '320px' }}>
            <div className="modal-header">
              <h3>⚙️ Administrar Categorías</h3>
              <button type="button" onClick={() => setShowManager(false)} className="btn btn-secondary btn-icon" style={{ width: '32px', height: '32px' }} title="Cerrar">
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '1.2rem', lineHeight: '1.25rem' }}>
                Renombra o elimina tus categorías. Al borrar una categoría, todos sus gastos se reclasificarán a <strong>"Otros"</strong> automáticamente.
              </p>
              <div className="category-manager-list">
                {categories.map(cat => (
                  <div key={cat} className="category-manager-item">
                    {editingCatName === cat ? (
                      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                        <input
                          type="text"
                          value={newCatEditValue}
                          onChange={(e) => setNewCatEditValue(e.target.value)}
                          style={{ flex: 1, padding: '4px 8px', height: '32px', fontSize: '0.9rem' }}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditCategory(cat)}
                          className="btn btn-primary"
                          style={{ padding: '0 10px', height: '32px' }}
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCatName('')}
                          className="btn btn-secondary"
                          style={{ padding: '0 10px', height: '32px' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{cat}</span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => { setEditingCatName(cat); setNewCatEditValue(cat); }}
                            className="btn btn-secondary btn-icon"
                            style={{ width: '30px', height: '30px', padding: 0 }}
                            title="Renombrar"
                            disabled={cat === 'Otros' || cat === 'Ingresos (Sueldo/Ventas)'}
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCategoryToDelete(cat)}
                            className="btn btn-secondary btn-icon delete"
                            style={{ width: '30px', height: '30px', padding: 0 }}
                            title="Eliminar"
                            disabled={cat === 'Otros' || cat === 'Ingresos (Sueldo/Ventas)'}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ MODAL DE CONFIRMACIÓN DE BORRADO DE CATEGORÍA */}
      {categoryToDelete && (
        <div className="modal-overlay" style={{ zIndex: 1300 }}>
          <div className="modal-content glass" style={{ minWidth: '320px', maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
                <Trash2 size={24} />
              </div>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', color: '#ffffff' }}>
              ¿Eliminar categoría?
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '1.5rem', lineHeight: '1.3' }}>
              ¿Deseas eliminar <strong>"{categoryToDelete}"</strong>? Todos sus registros y presupuestos se reasignarán a <strong>"Otros"</strong> automáticamente.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.6rem 1rem' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteCategory}
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.6rem 1rem', background: 'var(--danger-grad)' }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(TransactionForm);
