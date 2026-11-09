import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { PieChart } from 'lucide-react';

export default function CategoryExpenseChart({
  doughnutData,
  doughnutOptions,
  hasExpenses
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        padding: '0.45rem 0.65rem',
        background: 'color-mix(in srgb, var(--surface-panel, var(--bg-card)) 40%, transparent)',
        borderRadius: 'var(--radius-sm, 6px)',
        border: '1px solid var(--border-color, rgba(255,255,255,0.06))',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '0.25rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <PieChart size={12} style={{ color: 'var(--accent, var(--primary))' }} />
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-high)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Por Categoría
          </span>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, position: 'relative', width: '100%', height: '100%' }}>
        {hasExpenses ? (
          <Doughnut data={doughnutData} options={doughnutOptions} />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-muted)', gap: '4px', textAlign: 'center', padding: '0.5rem' }}>
            <PieChart size={20} style={{ opacity: 0.3 }} />
            <span style={{ fontSize: '0.68rem' }}>Sin gastos en el ciclo</span>
          </div>
        )}
      </div>
    </div>
  );
}
export { CategoryExpenseChart };
