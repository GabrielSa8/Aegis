import { useMemo } from 'react';
import { getFinancialMonthRange, isDateInRange } from '../../../utils/storage';

export function useDashboardMetrics(transactions, selectedDate, cutoffDay) {
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  // Obtener rango del periodo financiero para la fecha seleccionada
  const { startDate, endDate } = useMemo(() => {
    return getFinancialMonthRange(selectedDate, cutoffDay);
  }, [selectedDate, cutoffDay]);

  // Cálculos consolidados y memoizados en un solo recorrido O(N)
  const metrics = useMemo(() => {
    const validSelectedDate = selectedDate || new Date().toISOString().split('T')[0];
    const currentDate = new Date(validSelectedDate + 'T12:00:00');

    let totalIncome = 0;
    let totalExpense = 0;
    let totalCreditAccumulated = 0;
    const expenseByCategory = {};
    const monthlyTxs = [];

    for (let i = 0; i < safeTransactions.length; i++) {
      const t = safeTransactions[i];
      if (!isDateInRange(t.date, startDate, endDate)) continue;

      monthlyTxs.push(t);
      const amt = Number(t.amount) || 0;

      if (t.type === 'income') {
        totalIncome += amt;
      } else {
        totalExpense += amt;
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + amt;
        if (t.paymentMethod === 'Crédito') {
          totalCreditAccumulated += amt;
        }
      }
    }

    const netBalance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    const timeDiff = endDate.getTime() - currentDate.getTime();
    const rawDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    const daysRemaining = isNaN(rawDays) ? 0 : Math.max(0, rawDays);

    return {
      monthlyTxs,
      totalIncome,
      totalExpense,
      netBalance,
      savingsRate,
      totalCreditAccumulated,
      daysRemaining,
      expenseByCategory
    };
  }, [safeTransactions, startDate, endDate, selectedDate]);

  return {
    startDate,
    endDate,
    metrics
  };
}
