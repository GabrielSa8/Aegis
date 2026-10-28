import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Calendar, 
  Check, 
  Plus, 
  Trash2, 
  Sparkles, 
  Repeat, 
  Clock, 
  X,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
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
} from '../utils/storage';

export default function AccountsMsiView({ onTransactionCreated }) {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [msiPlans, setMsiPlans] = useState([]);
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showMsiModal, setShowMsiModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);

  // Formularios
  const [accountForm, setAccountForm] = useState({
    name: '',
    type: 'debit',
    color: '#004481',
    cutoffDay: '',
    paymentDay: '',
    balance: '',
    creditLimit: ''
  });

  const [msiForm, setMsiForm] = useState({
    description: '',
    paymentMethod: 'nu_credito',
    totalAmount: '',
    totalInstallments: 6,
    remainingInstallments: 6,
    monthlyAmount: '',
    startDate: new Date().toISOString().split('T')[0],
    nextDueDate: '',
    category: 'Educación & Certs'
  });

  const [recurringForm, setRecurringForm] = useState({
    description: '',
    amount: '',
    category: 'Servicios (Luz, Internet, etc.)',
    paymentMethod: 'bbva_debito',
    frequency: 'monthly',
    dueDay: 10,
    autoApprove: false
  });

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
    setAccountForm({
      name: '',
      type: 'debit',
      color: '#004481',
      cutoffDay: '',
      paymentDay: '',
      balance: '',
      creditLimit: ''
    });
  };

  const handleDeleteAccount = async (id) => {
    if (!confirm('¿Eliminar esta cuenta/tarjeta?')) return;
    const updated = await deletePaymentMethod(id);
    setPaymentMethods(updated);
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
    setMsiForm({
      description: '',
      paymentMethod: 'nu_credito',
      totalAmount: '',
      totalInstallments: 6,
      remainingInstallments: 6,
      monthlyAmount: '',
      startDate: new Date().toISOString().split('T')[0],
      nextDueDate: '',
      category: 'Educación & Certs'
    });
  };

  const handlePayInstallment = async (id) => {
    const updated = await payMsiInstallment(id);
    setMsiPlans(updated);
    if (onTransactionCreated) {
      onTransactionCreated();
    }
  };

  const handleDeleteMsi = async (id) => {
    if (!confirm('¿Eliminar este plan MSI?')) return;
    const updated = await deleteMsiPlan(id);
    setMsiPlans(updated);
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
    setRecurringForm({
      description: '',
      amount: '',
      category: 'Servicios (Luz, Internet, etc.)',
      paymentMethod: 'bbva_debito',
      frequency: 'monthly',
      dueDay: 10,
      autoApprove: false
    });
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

  const handleDeleteRecurring = async (id) => {
    if (!confirm('¿Eliminar este gasto recurrente?')) return;
    const updated = await deleteRecurringExpense(id);
    setRecurringExpenses(updated);
  };

  const todayDay = new Date().getDate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 💳 SECCIÓN 1: CUENTAS Y TARJETAS SOBERANAS */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={16} color="#10b981" />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-high)' }}>
              Cuentas & Tarjetas Registradas
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              • Débito, Crédito y Billeteras
            </span>
          </div>

          <button
            onClick={() => setShowAccountModal(true)}
            className="btn btn-secondary"
            style={{ padding: '3px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Plus size={12} />
            <span>Agregar Cuenta</span>
          </button>
        </div>

        {/* Grid de Cuentas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '8px'
        }}>
          {paymentMethods.map((pm) => {
            const isCredit = pm.type === 'credit';
            return (
              <div
                key={pm.id}
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: `1px solid ${isCredit ? 'rgba(168, 85, 247, 0.3)' : 'var(--border-color)'}`,
                  borderLeft: `4px solid ${pm.color || (isCredit ? '#a855f7' : '#10b981')}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)' }}>
                    {pm.name}
                  </span>
                  <button
                    onClick={() => handleDeleteAccount(pm.id)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                    title="Eliminar método"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {isCredit ? 'Límite Crédito' : 'Saldo'}
                  </span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: isCredit ? '#c084fc' : '#10b981', fontFamily: 'var(--font-mono)' }}>
                    ${(isCredit ? pm.creditLimit || 0 : pm.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {isCredit && (pm.cutoffDay || pm.paymentDay) && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.62rem',
                    color: 'var(--text-muted)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    paddingTop: '4px'
                  }}>
                    {pm.cutoffDay && <span>Corte: Día {pm.cutoffDay}</span>}
                    {pm.paymentDay && <span>Límite pago: Día {pm.paymentDay}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 📦 SECCIÓN 2: PLANES MESES SIN INTERESES (MSI) */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} color="#c084fc" />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-high)' }}>
              Compromisos & Meses Sin Intereses (MSI)
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              • Control de amortización y cuotas restantes
            </span>
          </div>

          <button
            onClick={() => setShowMsiModal(true)}
            className="btn btn-secondary"
            style={{ padding: '3px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Plus size={12} />
            <span>Nuevo Plan MSI</span>
          </button>
        </div>

        {msiPlans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            No hay planes MSI activos.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {msiPlans.map((plan) => {
              const paidInstallments = plan.totalInstallments - plan.remainingInstallments;
              const progressPct = (paidInstallments / plan.totalInstallments) * 100;
              const isCompleted = plan.remainingInstallments === 0;

              return (
                <div
                  key={plan.id}
                  style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-high)' }}>
                        {plan.description}
                      </span>
                      <span style={{
                        fontSize: '0.62rem',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        background: 'rgba(168, 85, 247, 0.15)',
                        color: '#c084fc',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {plan.paymentMethod}
                      </span>
                      {isCompleted && (
                        <span style={{
                          fontSize: '0.62rem',
                          padding: '1px 6px',
                          borderRadius: '3px',
                          background: 'rgba(16, 185, 129, 0.2)',
                          color: '#a7f3d0'
                        }}>
                          Liquidado
                        </span>
                      )}
                    </div>

                    {/* Barra de progreso de amortización */}
                    <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        flex: 1,
                        height: '5px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${progressPct}%`,
                          height: '100%',
                          background: isCompleted ? '#10b981' : '#c084fc',
                          borderRadius: '3px',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {paidInstallments}/{plan.totalInstallments} cuotas
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#e9d5ff', fontFamily: 'var(--font-mono)' }}>
                        ${plan.monthlyAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}/mes
                      </div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                        Total: ${plan.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    {!isCompleted && (
                      <button
                        onClick={() => handlePayInstallment(plan.id)}
                        className="btn btn-primary"
                        style={{ padding: '4px 10px', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        title="Registra el gasto de la mensualidad en SQLite y descuenta 1 cuota"
                      >
                        <Zap size={11} />
                        <span>Pagar Cuota</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteMsi(plan.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                      title="Eliminar plan"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ⏰ SECCIÓN 3: GASTOS RECURRENTES Y SERVICIOS FIJOS */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Repeat size={16} color="#f59e0b" />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-high)' }}>
              Programador de Gastos Fijos & Servicios
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              • Aprobación rápida con 1-click
            </span>
          </div>

          <button
            onClick={() => setShowRecurringModal(true)}
            className="btn btn-secondary"
            style={{ padding: '3px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Plus size={12} />
            <span>Nuevo Gasto Fijo</span>
          </button>
        </div>

        {recurringExpenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            No hay gastos fijos programados.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
            {recurringExpenses.map((rec) => {
              const currentMonthStr = new Date().toISOString().slice(0, 7);
              const isPaidThisMonth = rec.lastPaidDate && rec.lastPaidDate.startsWith(currentMonthStr);
              const daysDiff = rec.dueDay - todayDay;
              
              let dueBadge = { text: `Vence día ${rec.dueDay}`, bg: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)' };
              if (isPaidThisMonth) {
                dueBadge = { text: '✅ Pagado este ciclo', bg: 'rgba(16, 185, 129, 0.15)', color: '#a7f3d0' };
              } else if (daysDiff === 0) {
                dueBadge = { text: '⚠️ Vence hoy', bg: 'rgba(239, 68, 68, 0.2)', color: '#f87171' };
              } else if (daysDiff > 0 && daysDiff <= 3) {
                dueBadge = { text: `En ${daysDiff} días`, bg: 'rgba(245, 158, 11, 0.2)', color: '#fde68a' };
              }

              return (
                <div
                  key={rec.id}
                  style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-high)' }}>
                      {rec.description}
                    </span>
                    <span style={{
                      fontSize: '0.62rem',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      background: dueBadge.bg,
                      color: dueBadge.color,
                      fontWeight: 700
                    }}>
                      {dueBadge.text}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {rec.category}
                    </span>
                    <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
                      ${rec.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '4px',
                    paddingTop: '6px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.04)'
                  }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      Método: {rec.paymentMethod}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {!isPaidThisMonth && (
                        <button
                          onClick={() => handleApproveRecurring(rec.id)}
                          className="btn btn-secondary"
                          style={{
                            padding: '2px 8px',
                            fontSize: '0.65rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#10b981',
                            borderColor: 'rgba(16, 185, 129, 0.3)'
                          }}
                          title="Crea la transacción en SQLite y marca como pagado"
                        >
                          <Check size={11} />
                          <span>Aprobar Pago</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteRecurring(rec.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                        title="Eliminar gasto fijo"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL NUEVA CUENTA */}
      {showAccountModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '380px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-high)' }}>
                Agregar Cuenta o Tarjeta
              </span>
              <button
                onClick={() => setShowAccountModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Nombre de Cuenta / Tarjeta</label>
                <input
                  type="text"
                  required
                  placeholder="ej. BBVA Oro, Nu Débito..."
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.8rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tipo</label>
                  <select
                    value={accountForm.type}
                    onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })}
                    style={{ fontSize: '0.75rem', padding: '6px 26px 6px 10px' }}
                  >
                    <option value="debit">Débito</option>
                    <option value="credit">Crédito</option>
                    <option value="cash">Efectivo</option>
                    <option value="crypto">Cripto</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Color Identificador</label>
                  <input
                    type="color"
                    value={accountForm.color}
                    onChange={(e) => setAccountForm({ ...accountForm, color: e.target.value })}
                    style={{ width: '100%', height: '32px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {accountForm.type === 'credit' ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Día de Corte</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="ej. 5"
                        value={accountForm.cutoffDay}
                        onChange={(e) => setAccountForm({ ...accountForm, cutoffDay: e.target.value })}
                        style={{ width: '100%', padding: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.8rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Día Límite de Pago</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="ej. 25"
                        value={accountForm.paymentDay}
                        onChange={(e) => setAccountForm({ ...accountForm, paymentDay: e.target.value })}
                        style={{ width: '100%', padding: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.8rem' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Límite de Crédito ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="ej. 25000"
                      value={accountForm.creditLimit}
                      onChange={(e) => setAccountForm({ ...accountForm, creditLimit: e.target.value })}
                      style={{ width: '100%', padding: '6px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.8rem' }}
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Saldo Inicial ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="ej. 5000"
                    value={accountForm.balance}
                    onChange={(e) => setAccountForm({ ...accountForm, balance: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.8rem' }}
                  />
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}>
                Guardar Cuenta
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVO MSI */}
      {showMsiModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '380px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-high)' }}>
                Nuevo Plan a Meses Sin Intereses
              </span>
              <button
                onClick={() => setShowMsiModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveMsi} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Descripción del Bien / Compra</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Monitor USB-C, Laptop..."
                  value={msiForm.description}
                  onChange={(e) => setMsiForm({ ...msiForm, description: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.8rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Monto Total ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="3600"
                    value={msiForm.totalAmount}
                    onChange={(e) => setMsiForm({ ...msiForm, totalAmount: e.target.value })}
                    style={{ width: '100%', padding: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.8rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Plazo (Meses)</label>
                  <input
                    type="number"
                    min="2"
                    max="48"
                    required
                    value={msiForm.totalInstallments}
                    onChange={(e) => setMsiForm({ ...msiForm, totalInstallments: e.target.value, remainingInstallments: e.target.value })}
                    style={{ width: '100%', padding: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tarjeta Utilizada</label>
                <select
                  value={msiForm.paymentMethod}
                  onChange={(e) => setMsiForm({ ...msiForm, paymentMethod: e.target.value })}
                  style={{ fontSize: '0.75rem', padding: '6px 26px 6px 10px' }}
                >
                  {paymentMethods.map((pm) => (
                    <option key={pm.id} value={pm.name}>{pm.name}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}>
                Registrar Plan MSI
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVO GASTO FIJO */}
      {showRecurringModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '380px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-high)' }}>
                Programar Gasto Fijo / Servicio
              </span>
              <button
                onClick={() => setShowRecurringModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveRecurring} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Descripción</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Internet 300MB, Renta, Spotify..."
                  value={recurringForm.description}
                  onChange={(e) => setRecurringForm({ ...recurringForm, description: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.8rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Monto ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="650"
                    value={recurringForm.amount}
                    onChange={(e) => setRecurringForm({ ...recurringForm, amount: e.target.value })}
                    style={{ width: '100%', padding: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.8rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Día de Vencimiento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={recurringForm.dueDay}
                    onChange={(e) => setRecurringForm({ ...recurringForm, dueDay: e.target.value })}
                    style={{ width: '100%', padding: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Método de Pago Habitual</label>
                <select
                  value={recurringForm.paymentMethod}
                  onChange={(e) => setRecurringForm({ ...recurringForm, paymentMethod: e.target.value })}
                  style={{ fontSize: '0.75rem', padding: '6px 26px 6px 10px' }}
                >
                  {paymentMethods.map((pm) => (
                    <option key={pm.id} value={pm.name}>{pm.name}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}>
                Guardar Gasto Fijo
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
