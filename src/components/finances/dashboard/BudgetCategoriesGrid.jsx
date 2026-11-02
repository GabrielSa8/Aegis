import React, { useState } from 'react';
import { Sliders } from 'lucide-react';
import { saveBudget } from '../../../utils/storage';
import { ManageBudgetsModal } from './ManageBudgetsModal';
import { BudgetWaterCard } from './BudgetWaterCard';

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
  const [showManageModal, setShowManageModal] = useState(false);

  const handleSaveBudget = async (cat, amt) => {
    if (!isNaN(amt) && amt >= 0) {
      const updated = await saveBudget(cat, amt);
      setBudgets(updated);
      if (onBudgetChange) {
        await onBudgetChange();
      }
    }
  };

  const validCategories = (Array.isArray(categories) ? categories : [])
    .filter((cat) => cat && typeof cat === 'string' && !cat.toLowerCase().includes('ingreso') && !cat.toLowerCase().includes('sueldo'));

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

      {/* Grid de Tarjetas de Presupuesto Verticales con Agua Diferenciada */}
      <div className="budget-grid">
        {validCategories.map((cat, idx) => (
          <BudgetWaterCard
            key={cat}
            cat={cat}
            index={idx}
            expenseAmount={expenseByCategory[cat] || 0}
            budgetAmount={budgets[cat] || 0}
            onSaveBudget={handleSaveBudget}
          />
        ))}
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
