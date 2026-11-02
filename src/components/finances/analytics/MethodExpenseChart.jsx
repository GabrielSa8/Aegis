import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { CreditCard } from 'lucide-react';

export function MethodExpenseChart({
  startDate,
  endDate,
  methodData,
  methodOptions,
  hasExpenses
}) {
  const hasData = Boolean(hasExpenses && methodData?.labels?.length > 0);

  return (
    <div className="chart-card glass">
      <div className="chart-title">
        <div>
          <span>Gastos por Método</span>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #9ca3af)', marginTop: '2px', fontWeight: 'normal' }}>
            Ciclo: {startDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} al {endDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
          </p>
        </div>
        <CreditCard size={18} style={{ color: 'var(--primary)' }} />
      </div>
      <div style={{ flex: 1, position: 'relative', minHeight: '220px' }}>
        {hasData ? (
          <Doughnut data={methodData} options={methodOptions} />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-muted, #9ca3af)', gap: '0.5rem', textAlign: 'center', marginTop: '3rem' }}>
            <p style={{ fontSize: '0.95rem' }}>No hay gastos registrados en este ciclo.</p>
            <p style={{ fontSize: '0.8rem' }}>Añade tus registros con métodos de pago específicos.</p>
          </div>
        )}
      </div>
    </div>
  );
}
