import { useState, useEffect, useMemo } from 'react';
import { saveBudget, deleteBudget, addCategory, deleteCategory } from '../../../utils/storage';

/**
 * useManageBudgets — Custom Hook que encapsula la lógica soberana de
 * creación, eliminación y ajuste de presupuestos por categoría.
 */
export function useManageBudgets({
  isOpen,
  onClose,
  categories = [],
  setCategories,
  budgets = {},
  setBudgets,
  expenseByCategory = {},
  onBudgetChange
}) {
  const [localBudgets, setLocalBudgets] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatLimit, setNewCatLimit] = useState('');
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [formError, setFormError] = useState('');

  // Sincronizar estado local al abrir modal
  useEffect(() => {
    if (isOpen) {
      setLocalBudgets({ ...(budgets || {}) });
      setSearchTerm('');
      setNewCatName('');
      setNewCatLimit('');
      setDeletingCategory(null);
      setFormError('');
    }
  }, [isOpen, budgets]);

  // Filtrar categorías que no sean ingresos
  const validCategories = useMemo(() => {
    return (Array.isArray(categories) ? categories : []).filter(
      (cat) => cat && typeof cat === 'string' &&
        !cat.toLowerCase().includes('ingreso') &&
        !cat.toLowerCase().includes('sueldo')
    );
  }, [categories]);

  const filteredCategories = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return validCategories;
    return validCategories.filter((cat) => cat.toLowerCase().includes(q));
  }, [validCategories, searchTerm]);

  const handleBudgetChange = (cat, val) => {
    const num = Math.max(0, parseFloat(val) || 0);
    setLocalBudgets((prev) => ({
      ...prev,
      [cat]: isNaN(num) ? 0 : num
    }));
  };

  const handleQuickAdd = (cat, amount) => {
    const current = parseFloat(localBudgets[cat]) || 0;
    handleBudgetChange(cat, current + amount);
  };

  const handleResetCategory = (cat) => {
    setLocalBudgets((prev) => ({
      ...prev,
      [cat]: 0
    }));
  };

  // Crear nuevo apartado / categoría
  const handleCreateApartado = async (e) => {
    if (e) e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) {
      setFormError('Ingresa un nombre para el apartado');
      return;
    }
    if (validCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setFormError('Ese apartado ya existe');
      return;
    }
    setFormError('');
    setIsSaving(true);

    try {
      const updatedCats = await addCategory(trimmed);
      if (setCategories) setCategories(updatedCats);

      const limitNum = parseFloat(newCatLimit);
      let updatedBudgets = { ...localBudgets };
      if (!isNaN(limitNum) && limitNum >= 0) {
        updatedBudgets = await saveBudget(trimmed, limitNum);
        setLocalBudgets(updatedBudgets);
        if (setBudgets) setBudgets(updatedBudgets);
      }

      if (onBudgetChange) await onBudgetChange();
      setNewCatName('');
      setNewCatLimit('');
    } catch (err) {
      console.error('[useManageBudgets] Error creando apartado:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Eliminar apartado / categoría
  const handleDeleteApartado = async (catName) => {
    setIsSaving(true);
    try {
      const updatedCats = await deleteCategory(catName);
      if (setCategories) setCategories(updatedCats);

      await deleteBudget(catName);
      const updatedBudgets = { ...localBudgets };
      delete updatedBudgets[catName];
      setLocalBudgets(updatedBudgets);
      if (setBudgets) setBudgets(updatedBudgets);

      if (onBudgetChange) await onBudgetChange();
      setDeletingCategory(null);
    } catch (err) {
      console.error('[useManageBudgets] Error eliminando apartado:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Guardar todos los límites modificados
  const handleSaveAllLimits = async () => {
    setIsSaving(true);
    try {
      let updated = { ...localBudgets };
      for (const cat of validCategories) {
        const amt = parseFloat(localBudgets[cat]) || 0;
        updated = await saveBudget(cat, amt);
      }
      if (setBudgets) setBudgets(updated);
      if (onBudgetChange) await onBudgetChange();
      onClose();
    } catch (err) {
      console.error('[useManageBudgets] Error guardando presupuestos:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Métricas agregadas
  const totalAllocated = useMemo(() => {
    return validCategories.reduce((acc, cat) => acc + (parseFloat(localBudgets[cat]) || 0), 0);
  }, [validCategories, localBudgets]);

  const totalExpenses = useMemo(() => {
    return validCategories.reduce((acc, cat) => acc + (expenseByCategory[cat] || 0), 0);
  }, [validCategories, expenseByCategory]);

  const activeLimitsCount = useMemo(() => {
    return validCategories.filter((cat) => (parseFloat(localBudgets[cat]) || 0) > 0).length;
  }, [validCategories, localBudgets]);

  return {
    localBudgets,
    searchTerm,
    setSearchTerm,
    isSaving,
    newCatName,
    setNewCatName,
    newCatLimit,
    setNewCatLimit,
    deletingCategory,
    setDeletingCategory,
    formError,
    setFormError,
    validCategories,
    filteredCategories,
    handleBudgetChange,
    handleQuickAdd,
    handleResetCategory,
    handleCreateApartado,
    handleDeleteApartado,
    handleSaveAllLimits,
    totalAllocated,
    totalExpenses,
    activeLimitsCount
  };
}
