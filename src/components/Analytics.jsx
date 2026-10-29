import React, { memo } from 'react';
import {
  useAnalyticsData,
  CategoryExpenseChart,
  MethodExpenseChart,
  YearlyEvolutionChart
} from './finances/analytics';

function Analytics({ transactions, selectedDate }) {
  const {
    startDate,
    endDate,
    activeFinancialYear,
    doughnutData,
    hasExpenses,
    doughnutOptions,
    barData,
    barOptions,
    methodData,
    methodOptions
  } = useAnalyticsData(transactions, selectedDate);

  return (
    <div className="analytics-layout">
      {/* Gráfico 1: Dona - Distribución de Gastos */}
      <CategoryExpenseChart
        startDate={startDate}
        endDate={endDate}
        doughnutData={doughnutData}
        doughnutOptions={doughnutOptions}
        hasExpenses={hasExpenses}
      />

      {/* Gráfico 2: Dona - Gastos por Método */}
      <MethodExpenseChart
        startDate={startDate}
        endDate={endDate}
        methodData={methodData}
        methodOptions={methodOptions}
        hasExpenses={hasExpenses}
      />

      {/* Gráfico 3: Evolución Anual */}
      <YearlyEvolutionChart
        activeFinancialYear={activeFinancialYear}
        barData={barData}
        barOptions={barOptions}
      />
    </div>
  );
}

export default memo(Analytics);
