export function formatUptime(sec) {
  if (!sec) return '0m';
  const days = Math.floor(sec / 86400);
  const hrs = Math.floor((sec % 86400) / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  if (days > 0) return `${days}d ${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

export function formatRateKbs(kbs) {
  if (!kbs || kbs <= 0) return '0.0 KB/s';
  if (kbs >= 1024) {
    return `${(kbs / 1024).toFixed(2)} MB/s`;
  }
  return `${kbs.toFixed(1)} KB/s`;
}

export function getStatusBadgeConfig(badge) {
  switch (badge) {
    case 'CRITICAL':
      return { 
        text: 'Crítico / Throttling', 
        color: 'var(--danger)', 
        bg: 'color-mix(in srgb, var(--danger) 15%, transparent)', 
        border: 'color-mix(in srgb, var(--danger) 35%, transparent)' 
      };
    case 'ATTENTION':
      return { 
        text: 'Atención Requerida', 
        color: 'var(--warning)', 
        bg: 'color-mix(in srgb, var(--warning) 15%, transparent)', 
        border: 'color-mix(in srgb, var(--warning) 35%, transparent)' 
      };
    default:
      return { 
        text: 'Sistema Óptimo', 
        color: 'var(--primary)', 
        bg: 'color-mix(in srgb, var(--primary) 12%, transparent)', 
        border: 'color-mix(in srgb, var(--primary) 30%, transparent)' 
      };
  }
}

export function getThermalState(cpuTempCelsius) {
  const temp = cpuTempCelsius || 45;
  if (temp >= 82) return { label: 'Alerta / Throttling', color: 'var(--danger)' };
  if (temp >= 72) return { label: 'Carga Sostenida', color: 'var(--warning)' };
  if (temp >= 55) return { label: 'Operación Nominal', color: 'var(--accent)' };
  return { label: 'Reposo / Frío', color: 'var(--primary)' };
}
