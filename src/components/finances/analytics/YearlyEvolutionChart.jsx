import React from 'react';
import { Bar } from 'react-chartjs-2';
import { BarChart3 } from 'lucide-react';

export default function YearlyEvolutionChart({
  activeFinancialYear,
  barData,
  barOptions
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '0.25rem', flexShrink: 0 }}>
        <BarChart3 size={12} style={{ color: 'var(--primary)' }} />
        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-high)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Evolución Mensual ({activeFinancialYear})
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0, position: 'relative', width: '100%', height: '100%' }}>
        <Bar data={barData} options={barOptions} />
      </div>
    </div>
  );
}
export { YearlyEvolutionChart };
