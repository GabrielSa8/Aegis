import { useState, useEffect } from 'react';
import { 
  getPaymentMethods, 
  savePaymentMethod, 
  deletePaymentMethod,
  getMsiPlans, 
  saveMsiPlan, 
  payMsiInstallment, 
  deleteMsiPlan,
  getRecurringExpenses, 
  saveRecurringExpense, 
  approveRecurringExpense, 
  deleteRecurringExpense 
} from '../../../utils/storage';

const INITIAL_ACCOUNT_FORM = {
  name: '',
  type: 'debit',
  color: '#004481',
  cutoffDay: '',
  paymentDay: '',
  balance: '',
  creditLimit: ''
};

const INITIAL_MSI_FORM = {
  description: '',
  paymentMethod: 'nu_credito',
  totalAmount: '',
  totalInstallments: 6,
  remainingInstallments: 6,
  monthlyAmount: '',
  startDate: new Date().toISOString().split('T')[0],
  nextDueDate: '',
  category: 'Educación & Certs'
};

const INITIAL_RECURRING_FORM = {
  description: '',
  amount: '',
  category: 'Servicios (Luz, Internet, etc.)',
  paymentMethod: 'bbva_debito',
  frequency: 'monthly',
  dueDay: 10,
  autoApprove: false
};

export function useAccountsMsi(onTransactionCreated) {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [msiPlans, setMsiPlans] = useState([]);
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showMsiModal, setShowMsiModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);

  // Formularios
  const [accountForm, setAccountForm] = useState(INITIAL_ACCOUNT_FORM);
  const [msiForm, setMsiForm] = useState(INITIAL_MSI_FORM);
  const [recurringForm, setRecurringForm] = useState(INITIAL_RECURRING_FORM);

  // Estado para confirmación unificada de borrado
  const [itemToDelete, setItemToDelete] = useState(null);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [methods, msi, recurring] = await Promise.all([
        getPaymentMethods(),
        getMsiPlans(),
        getRecurringExpenses()
      ]);
      setPaymentMethods(methods || []);
      setMsiPlans(msi || []);
      setRecurringExpenses(recurring || []);
    } catch (e) {
      console.error('Error cargando cuentas y MSI:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handlers Cuentas
  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (!accountForm.name.trim()) return;

    const id = `pm_${Date.now()}`;
    const newMethod = {
      id,
      name: accountForm.name.trim(),
      type: accountForm.type,
      color: accountForm.color,
      cutoffDay: accountForm.cutoffDay ? parseInt(accountForm.cutoffDay, 10) : null,
      paymentDay: accountForm.paymentDay ? parseInt(accountForm.paymentDay, 10) : null,
      balance: parseFloat(accountForm.balance) || 0,
      creditLimit: accountForm.creditLimit ? parseFloat(accountForm.creditLimit) : null
    };

    const updated = await savePaymentMethod(newMethod);
    setPaymentMethods(updated);
    setShowAccountModal(false);
    setAccountForm(INITIAL_ACCOUNT_FORM);
  };

  const handleDeleteAccount = (accountOrId) => {
    const item = (typeof accountOrId === 'object' && accountOrId !== null)
      ? accountOrId
      : paymentMethods.find((p) => p.id === accountOrId) || { id: accountOrId, name: 'esta cuenta' };
    setItemToDelete({ type: 'account', data: item });
  };

  // Handlers MSI
  const handleSaveMsi = async (e) => {
    e.preventDefault();
    if (!msiForm.description.trim() || !msiForm.totalAmount) return;

    const total = parseFloat(msiForm.totalAmount) || 0;
    const installments = parseInt(msiForm.totalInstallments, 10) || 1;
    const monthly = msiForm.monthlyAmount ? parseFloat(msiForm.monthlyAmount) : total / installments;

    const id = `msi_${Date.now()}`;
    const newPlan = {
      id,
      description: msiForm.description.trim(),
      paymentMethod: msiForm.paymentMethod,
      totalAmount: total,
      totalInstallments: installments,
      remainingInstallments: parseInt(msiForm.remainingInstallments, 10) || installments,
      monthlyAmount: Math.round(monthly * 100) / 100,
      startDate: msiForm.startDate || new Date().toISOString().split('T')[0],
      nextDueDate: msiForm.nextDueDate || new Date().toISOString().split('T')[0],
      status: 'active',
      category: msiForm.category
    };

    const updated = await saveMsiPlan(newPlan);
    setMsiPlans(updated);
    setShowMsiModal(false);
    setMsiForm(INITIAL_MSI_FORM);
  };

  const handlePayInstallment = async (id) => {
    const updated = await payMsiInstallment(id);
    setMsiPlans(updated);
    if (onTransactionCreated) {
      onTransactionCreated();
    }
  };

  const handleDeleteMsi = (planOrId) => {
    const item = (typeof planOrId === 'object' && planOrId !== null)
      ? planOrId
      : msiPlans.find((m) => m.id === planOrId) || { id: planOrId, description: 'este plan MSI' };
    setItemToDelete({ type: 'msi', data: item });
  };

  // Handlers Gastos Recurrentes
  const handleSaveRecurring = async (e) => {
    e.preventDefault();
    if (!recurringForm.description.trim() || !recurringForm.amount) return;

    const id = `rec_${Date.now()}`;
    const newItem = {
      id,
      description: recurringForm.description.trim(),
      amount: parseFloat(recurringForm.amount) || 0,
      category: recurringForm.category,
      paymentMethod: recurringForm.paymentMethod,
      frequency: recurringForm.frequency,
      dueDay: parseInt(recurringForm.dueDay, 10) || 1,
      autoApprove: recurringForm.autoApprove,
      lastPaidDate: null
    };

    const updated = await saveRecurringExpense(newItem);
    setRecurringExpenses(updated);
    setShowRecurringModal(false);
    setRecurringForm(INITIAL_RECURRING_FORM);
  };

  const handleApproveRecurring = async (id) => {
    const today = new Date().toISOString().split('T')[0];
    const newTx = await approveRecurringExpense(id, today);
    if (newTx) {
      const updated = await getRecurringExpenses();
      setRecurringExpenses(updated);
      if (onTransactionCreated) {
        onTransactionCreated();
      }
    }
  };

  const handleDeleteRecurring = (recOrId) => {
    const item = (typeof recOrId === 'object' && recOrId !== null)
      ? recOrId
      : recurringExpenses.find((r) => r.id === recOrId) || { id: recOrId, description: 'este gasto recurrente' };
    setItemToDelete({ type: 'recurring', data: item });
  };

  const handleCancelDelete = () => {
    setItemToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const { type, data } = itemToDelete;
    setItemToDelete(null);
    try {
      if (type === 'account') {
        const updated = await deletePaymentMethod(data.id);
        setPaymentMethods(updated);
      } else if (type === 'msi') {
        const updated = await deleteMsiPlan(data.id);
        setMsiPlans(updated);
      } else if (type === 'recurring') {
        const updated = await deleteRecurringExpense(data.id);
        setRecurringExpenses(updated);
      }
    } catch (err) {
      console.error('Error eliminando elemento:', err);
    }
  };

  return {
    paymentMethods,
    msiPlans,
    recurringExpenses,
    loading,
    showAccountModal,
    setShowAccountModal,
    showMsiModal,
    setShowMsiModal,
    showRecurringModal,
    setShowRecurringModal,
    accountForm,
    setAccountForm,
    msiForm,
    setMsiForm,
    recurringForm,
    setRecurringForm,
    handleSaveAccount,
    handleDeleteAccount,
    handleSaveMsi,
    handlePayInstallment,
    handleDeleteMsi,
    handleSaveRecurring,
    handleApproveRecurring,
    handleDeleteRecurring,
    itemToDelete,
    handleCancelDelete,
    handleConfirmDelete
  };
}
