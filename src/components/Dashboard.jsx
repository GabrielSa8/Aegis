import { useState, useEffect, useMemo, memo } from 'react';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Edit2, Check, X, CreditCard } from 'lucide-react';
import { getBudgets, saveBudget, getCategories, getFinancialMonthRange, isDateInRange } from '../utils/storage';

function Dashboard({ 
  transactions, 
  selectedDate, 
  onBudgetChange, 
  showBudgets = true, 
  showStats = true 
}) {
  const [budgets, setBudgets] = useState({});
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [tempBudget, setTempBudget] = useState('');

  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  // Cargar presupuestos y categorías al iniciar o cuando cambia el conteo de transacciones
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      const [b, c] = await Promise.all([getBudgets(), getCategories()]);
      if (isMounted) {
        setBudgets(b || {});
        setCategories(c || []);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [safeTransactions.length]);

  // Obtener rango del periodo financiero para la fecha seleccionada
  const { startDate, endDate } = useMemo(() => {
    return getFinancialMonthRange(selectedDate);
  }, [selectedDate]);

  // Cálculos consolidados y memoizados en un solo recorrido O(N)
  const metrics = useMemo(() => {
    const validSelectedDate = selectedDate || new Date().toISOString().split('T')[0];
    const currentDate = new Date(validSelectedDate + 'T12:00:00');

    let totalIncome = 0;
    let totalExpense = 0;
    let totalCreditAccumulated = 0;
    const expenseByCategory = {};
    const monthlyTxs = [];

    for (let i = 0; i < safeTransactions.length; i++) {
      const t = safeTransactions[i];
      if (!isDateInRange(t.date, startDate, endDate)) continue;

      monthlyTxs.push(t);
      const amt = Number(t.amount) || 0;

      if (t.type === 'income') {
        totalIncome += amt;
      } else {
        totalExpense += amt;
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + amt;
        if (t.paymentMethod === 'Crédito') {
          totalCreditAccumulated += amt;
        }
      }
    }

    const netBalance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    const timeDiff = endDate.getTime() - currentDate.getTime();
    const rawDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    const daysRemaining = isNaN(rawDays) ? 0 : Math.max(0, rawDays);

    return {
      monthlyTxs,
      totalIncome,
      totalExpense,
      netBalance,
      savingsRate,
      totalCreditAccumulated,
      daysRemaining,
      expenseByCategory
    };
  }, [safeTransactions, startDate, endDate, selectedDate]);

  const {
    totalIncome,
    totalExpense,
    netBalance,
    savingsRate,
    totalCreditAccumulated,
    daysRemaining,
    expenseByCategory
  } = metrics;

  // Guardar cambio de presupuesto
  const handleSaveBudget = async (cat) => {
    const amt = parseFloat(tempBudget);
    if (!isNaN(amt) && amt >= 0) {
      const updated = await saveBudget(cat, amt);
      setBudgets(updated);
      if (onBudgetChange) {
        await onBudgetChange();
      }
    }
    setEditingCategory(null);
    setTempBudget('');
  };

  return (
    <div>
      {/* 📊 TARJETAS RESUMEN DE FINANZAS */}
      {showStats && (
        <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', marginBottom: showBudgets ? '2rem' : '0' }}>
          <div className="stat-card glass balance">
            <div className="stat-card-title">
              <span>Balance Neto</span>
              <Wallet size={16} style={{ color: 'var(--primary)' }} />
            </div>
            <div className="stat-card-value" style={{ color: netBalance >= 0 ? '#ffffff' : 'var(--danger)' }}>
              {netBalance >= 0 ? '+' : ''}${netBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '4px' }}>
              Ciclo financiero (Neto)
            </div>
          </div>

          <div className="stat-card glass income">
            <div className="stat-card-title">
              <span>Ingresos</span>
              <TrendingUp size={16} style={{ color: 'var(--success)' }} />
            </div>
            <div className="stat-card-value" style={{ color: 'var(--success)' }}>
              +${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '4px' }}>
              Entradas del ciclo
            </div>
          </div>

          <div className="stat-card glass expense">
            <div className="stat-card-title">
              <span>Gastos</span>
              <TrendingDown size={16} style={{ color: 'var(--danger)' }} />
            </div>
            <div className="stat-card-value" style={{ color: 'var(--danger)' }}>
              -${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '4px' }}>
              Salidas del ciclo
            </div>
          </div>

          {/* Nueva Tarjeta: Acumulado de Tarjeta de Crédito (Corte el 22) */}
          <div className="stat-card glass" style={{ borderLeft: '4px solid #a855f7' }}>
            <div className="stat-card-title">
              <span>Acumulado Tarjeta</span>
              <CreditCard size={16} style={{ color: '#a855f7' }} />
            </div>
            <div className="stat-card-value" style={{ color: '#a855f7' }}>
              ${totalCreditAccumulated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '4px', lineHeight: '1.2rem' }}>
              Ciclo: {startDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} al {endDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
              <br />
              <span style={{ color: daysRemaining <= 5 ? 'var(--danger)' : '#a855f7', fontWeight: '700' }}>
                {daysRemaining} {daysRemaining === 1 ? 'día' : 'días'} para el corte
              </span>
            </div>
          </div>

          <div className="stat-card glass savings">
            <div className="stat-card-title">
              <span>Tasa de Ahorro</span>
              <PiggyBank size={16} style={{ color: 'var(--warning)' }} />
            </div>
            <div className="stat-card-value" style={{ color: savingsRate >= 0 ? 'var(--warning)' : '#f3f4f6' }}>
              {savingsRate.toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '4px' }}>
              {netBalance >= 0 ? 'Ahorro sobre ingresos' : 'Déficit sobre ingresos'}
            </div>
          </div>
        </div>
      )}

      {/* 🎯 SECCIÓN DE PRESUPUESTOS POR CATEGORÍA */}
      {showBudgets && (
        <div className="glass" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1.2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
            🎯 Presupuestos del Ciclo (Control de Límites)
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '4px' }}>
            Gasto acumulado del ciclo activo: {startDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} al {endDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
          </p>
        </div>
        
        <div className="budget-grid">
          {(Array.isArray(categories) ? categories : [])
            .filter(cat => cat && typeof cat === 'string' && !cat.toLowerCase().includes('ingreso') && !cat.toLowerCase().includes('sueldo'))
            .map(cat => {
              const expenseAmount = expenseByCategory[cat] || 0;
              const budgetAmount = budgets[cat] || 0;
              const isEditing = editingCategory === cat;
              
              const rawPct = budgetAmount > 0 ? (expenseAmount / budgetAmount) * 100 : 0;
              const barWidth = Math.min(rawPct, 100);

              // Estilo de barra según porcentaje de gasto
              let barColor = 'var(--primary)';
              if (rawPct >= 90) barColor = 'var(--danger)';
              else if (rawPct >= 75) barColor = 'var(--warning)';
              else if (rawPct > 0) barColor = 'var(--success)';

              return (
                <div key={cat} className="budget-card glass" style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '1.25rem' }}>
                  <div className="budget-title">
                    <span style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }} title={cat}>
                      {cat}
                    </span>
                    
                    {isEditing ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          placeholder="$"
                          value={tempBudget}
                          onChange={(e) => setTempBudget(e.target.value)}
                          style={{ width: '70px', padding: '2px 4px', fontSize: '0.8rem', height: '24px' }}
                          autoFocus
                        />
                        <button onClick={() => handleSaveBudget(cat)} style={{ background: 'transparent', border: 'none', color: 'var(--success)', cursor: 'pointer' }}>
                          <Check size={14} />
                        </button>
                        <button onClick={() => setEditingCategory(null)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                          {budgetAmount > 0 ? `$${budgetAmount}` : 'Sin límite'}
                        </span>
                        <button
                          onClick={() => { setEditingCategory(cat); setTempBudget(budgetAmount || ''); }}
                          style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
                          title="Establecer Límite"
                        >
                          <Edit2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar"
                      style={{ width: `${barWidth}%`, backgroundColor: barColor }}
                    />
                  </div>

                  <div className="budget-footer">
                    <span>Gastado: ${expenseAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    {budgetAmount > 0 && (
                      <span style={{ color: rawPct >= 100 ? 'var(--danger)' : '#9ca3af', fontWeight: rawPct >= 100 ? 'bold' : 'normal' }}>
                        {rawPct.toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
      )}
    </div>
  );
}

export default memo(Dashboard);
