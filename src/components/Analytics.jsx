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

export default function Analytics({ transactions, selectedDate }) {
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  // Obtener rango del periodo financiero para la fecha seleccionada
  const { startDate, endDate } = getFinancialMonthRange(selectedDate);

  // --- 1. PROCESAR DATOS PARA EL GRÁFICO DE DONA (GASTOS POR CATEGORÍA DEL MES SELECCIONADO) ---
  const monthlyExpenses = safeTransactions.filter(t => {
    return t.type === 'expense' && isDateInRange(t.date, startDate, endDate);
  });

  const expenseByCategory = {};
  monthlyExpenses.forEach(t => {
    const amt = Number(t.amount) || 0;
    const cat = t.category || 'Otros';
    expenseByCategory[cat] = (expenseByCategory[cat] || 0) + amt;
  });

  const doughnutLabels = Object.keys(expenseByCategory);
  const doughnutDataValues = Object.values(expenseByCategory);

  const doughnutData = {
    labels: doughnutLabels,
    datasets: [
      {
        data: doughnutDataValues,
        backgroundColor: getCategoryColors(doughnutLabels.length),
        borderColor: 'rgba(11, 15, 25, 0.9)',
        borderWidth: 2,
        hoverBackgroundColor: getCategoryHoverColors(doughnutLabels.length),
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#d1d5db',
          font: {
            family: 'Outfit',
            size: 11,
          },
          boxWidth: 12,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const val = context.raw || 0;
            const total = doughnutDataValues.reduce((a, b) => a + b, 0);
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
            return ` $${val.toLocaleString(undefined, { minimumFractionDigits: 2 })} (${pct}%)`;
          },
        },
      },
    },
  };

  // --- 2. PROCESAR DATOS PARA EL GRÁFICO DE BARRAS ANUAL (EVOLUCIÓN MENSUAL) ---
  const yearlyIncomes = Array(12).fill(0);
  const yearlyExpenses = Array(12).fill(0);

  // Obtener el año financiero activo para el periodo seleccionado
  const { financialYear: activeFinancialYear } = getFinancialMonthRange(selectedDate);

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

  const barData = {
    labels: MONTH_SHORT_NAMES,
    datasets: [
      {
        label: 'Ingresos (+)',
        data: yearlyIncomes,
        backgroundColor: '#10b981', // Emerald
        borderRadius: 4,
        borderWidth: 0,
      },
      {
        label: 'Gastos (-)',
        data: yearlyExpenses,
        backgroundColor: '#f43f5e', // Rose/Coral
        borderRadius: 4,
        borderWidth: 0,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#d1d5db',
          font: {
            family: 'Outfit',
            size: 12,
            weight: '500',
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#9ca3af',
          font: { family: 'Outfit' },
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#9ca3af',
          font: { family: 'Outfit' },
          callback: (value) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        },
      },
    },
  };

  // --- 3. PROCESAR DATOS PARA EL GRÁFICO DE MÉTODOS DE PAGO ---
  const expenseByMethod = { 'Efectivo': 0, 'Débito': 0, 'Crédito': 0 };
  monthlyExpenses.forEach(t => {
    const method = t.paymentMethod || 'Débito';
    expenseByMethod[method] = (expenseByMethod[method] || 0) + (Number(t.amount) || 0);
  });

  const methodLabels = Object.keys(expenseByMethod);
  const methodDataValues = Object.values(expenseByMethod);

  const methodData = {
    labels: methodLabels,
    datasets: [
      {
        data: methodDataValues,
        backgroundColor: getMethodColors(methodLabels.length),
        borderColor: 'rgba(11, 15, 25, 0.9)',
        borderWidth: 2,
        hoverBackgroundColor: getMethodHoverColors(methodLabels.length),
      },
    ],
  };

  const methodOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#d1d5db',
          font: {
            family: 'Outfit',
            size: 11,
          },
          boxWidth: 12,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const val = context.raw || 0;
            const total = methodDataValues.reduce((a, b) => a + b, 0);
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
            return ` $${val.toLocaleString(undefined, { minimumFractionDigits: 2 })} (${pct}%)`;
          },
        },
      },
    },
  };

  const hasExpenses = doughnutDataValues.length > 0;

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
