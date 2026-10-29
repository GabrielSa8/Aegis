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

export const MONTH_SHORT_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export const CATEGORY_COLORS = [
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

export const CATEGORY_HOVER_COLORS = [
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

export const METHOD_COLORS = ['#fbbf24', '#3b82f6', '#a855f7'];
export const METHOD_HOVER_COLORS = ['#d97706', '#2563eb', '#9333ea'];

export const getCategoryColors = (count) => Array.from({ length: count }, (_, i) => CATEGORY_COLORS[i % CATEGORY_COLORS.length]);
export const getCategoryHoverColors = (count) => Array.from({ length: count }, (_, i) => CATEGORY_HOVER_COLORS[i % CATEGORY_HOVER_COLORS.length]);
export const getMethodColors = (count) => Array.from({ length: count }, (_, i) => METHOD_COLORS[i % METHOD_COLORS.length]);
export const getMethodHoverColors = (count) => Array.from({ length: count }, (_, i) => METHOD_HOVER_COLORS[i % METHOD_HOVER_COLORS.length]);
