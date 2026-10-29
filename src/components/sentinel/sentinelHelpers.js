export function formatUptime(sec) {
  if (!sec) return '0m';
  const days = Math.floor(sec / 86400);
  const hrs = Math.floor((sec % 86400) / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  if (days > 0) return `${days}d ${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

export function getStatusBadgeConfig(badge) {
  switch (badge) {
    case 'CRITICAL':
      return { 
        text: 'Crítico / Throttling', 
        color: '#ef4444', 
        bg: 'rgba(239, 68, 68, 0.15)', 
        border: 'rgba(239, 68, 68, 0.35)' 
      };
    case 'ATTENTION':
      return { 
        text: 'Atención Requerida', 
        color: '#f59e0b', 
        bg: 'rgba(245, 158, 11, 0.15)', 
        border: 'rgba(245, 158, 11, 0.35)' 
      };
    default:
      return { 
        text: 'Sistema Óptimo', 
        color: '#10b981', 
        bg: 'rgba(16, 185, 129, 0.12)', 
        border: 'rgba(16, 185, 129, 0.3)' 
      };
  }
}

export function getThermalState(cpuTempCelsius) {
  const temp = cpuTempCelsius || 45;
  if (temp >= 82) return { label: 'Alerta / Throttling', color: '#ef4444' };
  if (temp >= 72) return { label: 'Carga Sostenida', color: '#f59e0b' };
  if (temp >= 55) return { label: 'Operación Nominal', color: '#38bdf8' };
  return { label: 'Reposo / Frío', color: '#10b981' };
}
