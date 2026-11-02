import React, { useState } from 'react';
import { Edit2, Check, X, Sliders } from 'lucide-react';
import { saveBudget } from '../../../utils/storage';
import { ManageBudgetsModal } from './ManageBudgetsModal';

export function BudgetCategoriesGrid({
  categories,
  setCategories,
  budgets,
  setBudgets,
  expenseByCategory,
  startDate,
  endDate,
  onBudgetChange
}) {
  const [editingCategory, setEditingCategory] = useState(null);
  const [tempBudget, setTempBudget] = useState('');
  const [showManageModal, setShowManageModal] = useState(false);

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
    <div style={{ padding: '0.2rem 0', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      {/* Cabecera Táctica con Botón de Gestión */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '0.45rem',
          flexWrap: 'wrap',
          gap: '0.4rem'
        }}
      >
        <div>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-high)' }}>
            🎯 Presupuestos del Ciclo
          </span>
          <p style={{ fontSize: '0.66rem', color: 'var(--text-muted)', margin: '1px 0 0 0' }}>
            Ciclo activo: {startDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} – {endDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowManageModal(true)}
          className="structure-action-btn"
          title="Abrir gestor masivo de presupuestos por categoría"
        >
          <Sliders size={12} />
          <span>Gestionar Presupuestos</span>
        </button>
      </div>

      {/* Grid de Tarjetas de Presupuesto */}
      <div className="budget-grid">
        {(Array.isArray(categories) ? categories : [])
          .filter((cat) => cat && typeof cat === 'string' && !cat.toLowerCase().includes('ingreso') && !cat.toLowerCase().includes('sueldo'))
          .map((cat) => {
            const expenseAmount = expenseByCategory[cat] || 0;
            const budgetAmount = budgets[cat] || 0;
            const isEditing = editingCategory === cat;

            const rawPct = budgetAmount > 0 ? (expenseAmount / budgetAmount) * 100 : 0;
            const barWidth = Math.min(rawPct, 100);

            // Semáforo dinámico según porcentaje de gasto
            let barColor = 'var(--primary)';
            if (rawPct >= 90) barColor = 'var(--danger)';
            else if (rawPct >= 75) barColor = 'var(--warning)';
            else if (rawPct > 0) barColor = 'var(--success)';

            return (
              <div
                key={cat}
                className="budget-card"
                style={{
                  background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md, 8px)',
                  padding: '0.75rem 0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div className="budget-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--text-high)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '120px'
                    }}
                    title={cat}
                  >
                    {cat}
                  </span>

                  {isEditing ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <div className="budget-inline-edit-wrapper">
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>$</span>
                        <input
                          type="number"
                          placeholder="0"
                          value={tempBudget}
                          onChange={(e) => setTempBudget(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveBudget(cat);
                            if (e.key === 'Escape') setEditingCategory(null);
                          }}
                          className="budget-inline-input"
                          autoFocus
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSaveBudget(cat)}
                        className="budget-edit-btn confirm"
                        title="Guardar límite"
                      >
                        <Check size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCategory(null)}
                        className="budget-edit-btn cancel"
                        title="Cancelar edición"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {budgetAmount > 0 ? `$${budgetAmount.toLocaleString()}` : 'Sin límite'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory(cat);
                          setTempBudget(budgetAmount || '');
                        }}
                        className="budget-edit-btn"
                        title="Establecer o ajustar límite"
                        aria-label={`Editar presupuesto de ${cat}`}
                      >
                        <Edit2 size={11} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="progress-bar-bg" style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div
                    className="progress-bar"
                    style={{
                      width: `${barWidth}%`,
                      height: '100%',
                      backgroundColor: barColor,
                      borderRadius: '2px',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>

                <div className="budget-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.64rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Gastado: ${expenseAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  {budgetAmount > 0 && (
                    <span
                      style={{
                        color: rawPct >= 100 ? 'var(--danger)' : 'var(--text-muted)',
                        fontWeight: rawPct >= 100 ? 800 : 600,
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      {rawPct.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* Modal Masivo de Gestión de Presupuestos */}
      <ManageBudgetsModal
        isOpen={showManageModal}
        onClose={() => setShowManageModal(false)}
        categories={categories}
        setCategories={setCategories}
        budgets={budgets}
        setBudgets={setBudgets}
        expenseByCategory={expenseByCategory}
        onBudgetChange={onBudgetChange}
      />
    </div>
  );
}
