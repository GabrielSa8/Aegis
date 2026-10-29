export const NORDIC_PALETTE = [
  '#34d399', '#38bdf8', '#818cf8', '#a78bfa', '#f472b6',
  '#fbbf24', '#fb923c', '#4ade80', '#2dd4bf', '#a3e635'
];

export const DEFAULT_DOMAINS = {
  work: { label: 'Trabajo & Operaciones', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' },
  software: { label: 'Software & Dev', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)' },
  certs: { label: 'Estudios & Certs', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' },
  personal: { label: 'Personal & Ocio', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.3)' }
};

export const PRIORITY_BADGES = {
  high: { label: 'Alta', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  medium: { label: 'Media', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  low: { label: 'Baja', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)' }
};

export const resolveDomainConfig = (domain) => {
  if (DEFAULT_DOMAINS[domain]) return DEFAULT_DOMAINS[domain];
  if (!domain) return { label: 'General', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.3)' };
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = (hash << 5) - hash + domain.charCodeAt(i);
    hash |= 0;
  }
  const color = NORDIC_PALETTE[Math.abs(hash) % NORDIC_PALETTE.length];
  return {
    label: domain.charAt(0).toUpperCase() + domain.slice(1),
    color,
    bg: `${color}1f`,
    border: `${color}4d`
  };
};

export const getRelativeDaysLabel = (targetDateStr, todayStr) => {
  if (targetDateStr === todayStr) return { text: 'Hoy', color: '#10b981' };
  const d1 = new Date(todayStr);
  const d2 = new Date(targetDateStr);
  const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
  if (diffDays === 1) return { text: 'Mañana', color: '#38bdf8' };
  if (diffDays === -1) return { text: 'Ayer', color: '#9ca3af' };
  if (diffDays > 1) return { text: `En ${diffDays} días`, color: '#60a5fa' };
  return { text: `Hace ${Math.abs(diffDays)} días`, color: '#9ca3af' };
};
