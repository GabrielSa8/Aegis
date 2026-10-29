import { useMemo } from 'react';
import { getFinancialMonthRange, isDateInRange } from '../../../utils/storage';
import {
  MONTH_SHORT_NAMES,
  getCategoryColors,
  getCategoryHoverColors,
  getMethodColors,
  getMethodHoverColors
} from './analyticsConstants';

export function useAnalyticsData(transactions, selectedDate) {
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  // Obtener rango del periodo financiero para la fecha seleccionada
  const { startDate, endDate, financialYear: activeFinancialYear } = useMemo(() => {
    return getFinancialMonthRange(selectedDate);
  }, [selectedDate]);

  // --- 1. PROCESAR DATOS PARA EL GRÁFICO DE DONA ---
  const { doughnutData, hasExpenses } = useMemo(() => {
    const monthlyExpenses = safeTransactions.filter((t) => {
      return t.type === 'expense' && isDateInRange(t.date, startDate, endDate);
    });

    const expenseByCategory = {};
    monthlyExpenses.forEach((t) => {
      const amt = Number(t.amount) || 0;
      const cat = t.category || 'Otros';
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + amt;
    });

    const labels = Object.keys(expenseByCategory);
    const dataValues = Object.values(expenseByCategory);

    return {
      doughnutData: {
        labels,
        datasets: [
          {
            data: dataValues,
            backgroundColor: getCategoryColors(labels.length),
            borderColor: 'rgba(11, 15, 25, 0.9)',
            borderWidth: 2,
            hoverBackgroundColor: getCategoryHoverColors(labels.length),
          },
        ],
      },
      hasExpenses: dataValues.length > 0
    };
  }, [safeTransactions, startDate, endDate]);

  const doughnutOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#d1d5db',
          font: { family: 'inherit', size: 11 },
          boxWidth: 12,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const val = context.raw || 0;
            return ` $${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
          },
        },
      },
    },
  }), []);

  // --- 2. PROCESAR DATOS PARA EL GRÁFICO DE BARRAS ANUAL ---
  const barData = useMemo(() => {
    const yearlyIncomes = Array(12).fill(0);
    const yearlyExpenses = Array(12).fill(0);

    safeTransactions.forEach((t) => {
      if (!t.date) return;
      const { financialMonth, financialYear } = getFinancialMonthRange(t.date);
      const amt = Number(t.amount) || 0;
      if (financialYear === activeFinancialYear) {
        if (t.type === 'income') {
          yearlyIncomes[financialMonth] += amt;
        } else {
          yearlyExpenses[financialMonth] += amt;
        }
      }
    });

    return {
      labels: MONTH_SHORT_NAMES,
      datasets: [
        {
          label: 'Ingresos (+)',
          data: yearlyIncomes,
          backgroundColor: '#10b981',
          borderRadius: 6,
          borderWidth: 0,
        },
        {
          label: 'Gastos (-)',
          data: yearlyExpenses,
          backgroundColor: '#f43f5e',
          borderRadius: 6,
          borderWidth: 0,
        },
      ],
    };
  }, [safeTransactions, activeFinancialYear]);

  const barOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#d1d5db',
          font: { family: 'inherit', size: 12, weight: '500' },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#9ca3af', font: { family: 'inherit' } },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#9ca3af',
          font: { family: 'inherit' },
          callback: (value) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        },
      },
    },
  }), []);

  // --- 3. PROCESAR DATOS PARA EL GRÁFICO DE MÉTODOS DE PAGO ---
  const methodData = useMemo(() => {
    const expenseByMethod = { 'Efectivo': 0, 'Débito': 0, 'Crédito': 0 };
    safeTransactions.forEach((t) => {
      if (t.type === 'expense' && isDateInRange(t.date, startDate, endDate)) {
        const method = t.paymentMethod || 'Débito';
        expenseByMethod[method] = (expenseByMethod[method] || 0) + (Number(t.amount) || 0);
      }
    });

    const labels = Object.keys(expenseByMethod);
    const dataValues = Object.values(expenseByMethod);

    return {
      labels,
      datasets: [
        {
          data: dataValues,
          backgroundColor: getMethodColors(labels.length),
          borderColor: 'rgba(11, 15, 25, 0.9)',
          borderWidth: 2,
          hoverBackgroundColor: getMethodHoverColors(labels.length),
        },
      ],
    };
  }, [safeTransactions, startDate, endDate]);

  const methodOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#d1d5db',
          font: { family: 'inherit', size: 11 },
          boxWidth: 12,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const val = context.raw || 0;
            return ` $${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
          },
        },
      },
    },
  }), []);

  return {
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
  };
}
