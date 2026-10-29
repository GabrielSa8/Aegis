import React from 'react';
import { Bar } from 'react-chartjs-2';
import { BarChart3 } from 'lucide-react';

export function YearlyEvolutionChart({
  activeFinancialYear,
  barData,
  barOptions
}) {
  return (
    <div className="chart-card glass" style={{ gridColumn: 'span 1' }}>
      <div className="chart-title">
        <span>Evolución Anual ({activeFinancialYear})</span>
        <BarChart3 size={18} style={{ color: 'var(--primary)' }} />
      </div>
      <div style={{ flex: 1, position: 'relative', minHeight: '220px' }}>
        <Bar data={barData} options={barOptions} />
      </div>
    </div>
  );
}
