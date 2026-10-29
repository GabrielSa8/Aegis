import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { PieChart } from 'lucide-react';

export function CategoryExpenseChart({
  startDate,
  endDate,
  doughnutData,
  doughnutOptions,
  hasExpenses
}) {
  return (
    <div className="chart-card glass">
      <div className="chart-title">
        <div>
          <span>Gastos por Categoría</span>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px', fontWeight: 'normal' }}>
            Ciclo: {startDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} al {endDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
          </p>
        </div>
        <PieChart size={18} style={{ color: 'var(--primary)' }} />
      </div>
      <div style={{ flex: 1, position: 'relative', minHeight: '220px' }}>
        {hasExpenses ? (
          <Doughnut data={doughnutData} options={doughnutOptions} />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#9ca3af', gap: '0.5rem', textAlign: 'center', marginTop: '3rem' }}>
            <p style={{ fontSize: '0.95rem' }}>No hay gastos registrados en este ciclo.</p>
            <p style={{ fontSize: '0.8rem' }}>Haz clic en un día del calendario para ingresar gastos.</p>
          </div>
        )}
      </div>
    </div>
  );
}
