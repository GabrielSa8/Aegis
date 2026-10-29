import React, { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { saveBudget } from '../../../utils/storage';

export function BudgetCategoriesGrid({
  categories,
  budgets,
  setBudgets,
  expenseByCategory,
  startDate,
  endDate,
  onBudgetChange
}) {
  const [editingCategory, setEditingCategory] = useState(null);
  const [tempBudget, setTempBudget] = useState('');

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
          .filter((cat) => cat && typeof cat === 'string' && !cat.toLowerCase().includes('ingreso') && !cat.toLowerCase().includes('sueldo'))
          .map((cat) => {
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
                        onClick={() => {
                          setEditingCategory(cat);
                          setTempBudget(budgetAmount || '');
                        }}
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
  );
}
