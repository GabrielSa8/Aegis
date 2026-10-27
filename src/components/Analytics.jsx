import { useMemo, memo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { BarChart3, PieChart, CreditCard } from 'lucide-react';
import { getFinancialMonthRange, isDateInRange } from '../utils/storage';

// Registrar componentes de Chart.js
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const MONTH_SHORT_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// Colores sofisticados HSL para las categorías de gastos
const CATEGORY_COLORS = [
  '#f43f5e', // Rose
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#fbbf24', // Amber
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#f97316', // Orange
  '#a855f7', // Purple
  '#6b7280', // Gray
];

const CATEGORY_HOVER_COLORS = [
  '#e11d48',
  '#2563eb',
  '#059669',
  '#d97706',
  '#7c3aed',
  '#0891b2',
  '#db2777',
  '#ea580c',
  '#9333ea',
  '#4b5563',
];

// Colores dedicados para Efectivo (Amber), Débito (Blue), Crédito (Purple)
const METHOD_COLORS = ['#fbbf24', '#3b82f6', '#a855f7'];
const METHOD_HOVER_COLORS = ['#d97706', '#2563eb', '#9333ea'];

const getCategoryColors = (count) => Array.from({ length: count }, (_, i) => CATEGORY_COLORS[i % CATEGORY_COLORS.length]);
const getCategoryHoverColors = (count) => Array.from({ length: count }, (_, i) => CATEGORY_HOVER_COLORS[i % CATEGORY_HOVER_COLORS.length]);
const getMethodColors = (count) => Array.from({ length: count }, (_, i) => METHOD_COLORS[i % METHOD_COLORS.length]);
const getMethodHoverColors = (count) => Array.from({ length: count }, (_, i) => METHOD_HOVER_COLORS[i % METHOD_HOVER_COLORS.length]);

function Analytics({ transactions, selectedDate }) {
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  // Obtener rango del periodo financiero para la fecha seleccionada
  const { startDate, endDate, financialYear: activeFinancialYear } = useMemo(() => {
    return getFinancialMonthRange(selectedDate);
  }, [selectedDate]);

  // --- 1. PROCESAR DATOS PARA EL GRÁFICO DE DONA ---
  const { doughnutData, hasExpenses } = useMemo(() => {
    const monthlyExpenses = safeTransactions.filter(t => {
      return t.type === 'expense' && isDateInRange(t.date, startDate, endDate);
    });

    const expenseByCategory = {};
    monthlyExpenses.forEach(t => {
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

    safeTransactions.forEach(t => {
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
    safeTransactions.forEach(t => {
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

  return (
    <div className="analytics-layout">
      {/* Gráfico 1: Dona - Distribución de Gastos */}
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

      {/* Gráfico 2: Dona - Gastos por Método */}
      <div className="chart-card glass">
        <div className="chart-title">
          <div>
            <span>Gastos por Método</span>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px', fontWeight: 'normal' }}>
              Ciclo: {startDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} al {endDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
            </p>
          </div>
          <CreditCard size={18} style={{ color: 'var(--primary)' }} />
        </div>
        <div style={{ flex: 1, position: 'relative', minHeight: '220px' }}>
          {hasExpenses ? (
            <Doughnut data={methodData} options={methodOptions} />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#9ca3af', gap: '0.5rem', textAlign: 'center', marginTop: '3rem' }}>
              <p style={{ fontSize: '0.95rem' }}>No hay gastos registrados en este ciclo.</p>
              <p style={{ fontSize: '0.8rem' }}>Añade tus registros con métodos de pago específicos.</p>
            </div>
          )}
        </div>
      </div>

      {/* Gráfico 3: Evolución Anual */}
      <div className="chart-card glass" style={{ gridColumn: 'span 1' }}>
        <div className="chart-title">
          <span>Evolución Anual ({activeFinancialYear})</span>
          <BarChart3 size={18} style={{ color: 'var(--primary)' }} />
        </div>
        <div style={{ flex: 1, position: 'relative', minHeight: '220px' }}>
          <Bar data={barData} options={barOptions} />
        </div>
      </div>
    </div>
  );
}

export default memo(Analytics);
