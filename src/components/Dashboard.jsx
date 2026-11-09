import React, { useState, useEffect, memo } from 'react';
import { getBudgets, getCategories } from '../utils/storage';
import {
  useDashboardMetrics,
  TelemetryStatsGrid,
  BudgetCategoriesGrid
} from './finances/dashboard';

function Dashboard({
  transactions,
  selectedDate,
  cutoffDay,
  onBudgetChange,
  showBudgets = true,
  showStats = true
}) {
  const [budgets, setBudgets] = useState({});
  const [categories, setCategories] = useState([]);

  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  // Cargar presupuestos y categorías al iniciar o cuando cambia el conteo de transacciones
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      const [b, c] = await Promise.all([getBudgets(), getCategories()]);
      if (isMounted) {
        setBudgets(b || {});
        setCategories(c || []);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [safeTransactions.length]);

  const { startDate, endDate, metrics } = useDashboardMetrics(safeTransactions, selectedDate, cutoffDay);

  return (
    <div>
      {/* 📊 TELEMETRÍA NORDIC COMPACT */}
      {showStats && (
        <TelemetryStatsGrid
          metrics={metrics}
          showBudgets={showBudgets}
          transactions={safeTransactions}
          selectedDate={selectedDate}
          cutoffDay={cutoffDay}
        />
      )}

      {/* 🎯 SECCIÓN DE PRESUPUESTOS POR CATEGORÍA */}
      {showBudgets && (
        <BudgetCategoriesGrid
          categories={categories}
          setCategories={setCategories}
          budgets={budgets}
          setBudgets={setBudgets}
          expenseByCategory={metrics.expenseByCategory}
          startDate={startDate}
          endDate={endDate}
          onBudgetChange={onBudgetChange}
        />
      )}
    </div>
  );
}

export default memo(Dashboard);
