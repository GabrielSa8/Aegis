import { useState, useEffect, useMemo, useRef } from 'react';
import { getCategories, addCategory, updateCategory, deleteCategory } from '../../../utils/storage';

export function useTransactionForm({
  selectedDate,
  onTransactionSave,
  editingTransaction,
  onCancelEdit,
  onCategoriesChange
}) {
  const [type, setType] = useState('expense'); // 'income' | 'expense'
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Débito');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(selectedDate);
  const prevSelectedDateRef = useRef(selectedDate);
  
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
    // La fecha seleccionada se preserva hasta que el usuario la cambie explícitamente
    if (notifyCancel && editingTransaction && onCancelEdit) {
      onCancelEdit();
    }
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategories(await getCategories());
      } catch (err) {
        console.error('Error cargando categorías:', err);
      }
    };
    loadCategories();
  }, []);

  // Solo sincronizar fecha con selectedDate si el padre cambió explícitamente (ej. navegación en calendario externo)
  useEffect(() => {
    if (prevSelectedDateRef.current !== selectedDate) {
      prevSelectedDateRef.current = selectedDate;
      if (!editingTransaction) {
        setDate(selectedDate);
      }
    }
  }, [selectedDate, editingTransaction]);

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

  const handleAddCategory = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const name = newCategoryName.trim();
    if (name) {
      const updated = await addCategory(name);
      setCategories(updated);
      setCategory(name);
      setNewCategoryName('');
      setShowAddCategory(false);
      if (onCategoriesChange) {
        await onCategoriesChange();
      }
    }
  };

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

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
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
          cat === category
        );
      } else {
        return !cat.toLowerCase().includes('ingresos (sueldo/ventas)') && !cat.toLowerCase().includes('sueldo');
      }
    });
  }, [categories, type, category]);

  const safeCategories = useMemo(() => {
    if (filteredCategories.length > 0) return filteredCategories;
    if (categories.length > 0) return categories;
    return ['General'];
  }, [filteredCategories, categories]);

  const selectedCategory = category || safeCategories[0] || '';
  const themeClass = type === 'income' ? 'success' : 'danger';

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

  return {
    type,
    setType,
    amount,
    setAmount,
    category,
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
  };
}
