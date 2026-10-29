/**
 * devopsHelpers.js — Funciones puras y formatters para telemetría DevOps.
 * Respeta la Doctrina Aegis: cero hardcode, diseño modular y portable.
 */

/**
 * Retorna estilos y configuración visual según el código de estado de Git.
 * @param {string} status Código git status corto (??, M, A, D, etc.)
 */
export function getStatusBadgeConfig(status) {
  if (status === '??') {
    return { color: '#fb923c', bg: 'rgba(251, 146, 60, 0.15)', label: 'Untracked' };
  }
  if (status.includes('M')) {
    return { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', label: 'Modified' };
  }
  if (status.includes('A')) {
    return { color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)', label: 'Added' };
  }
  if (status.includes('D')) {
    return { color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)', label: 'Deleted' };
  }
  return { color: 'var(--text-muted, #94a3b8)', bg: 'rgba(255, 255, 255, 0.05)', label: status };
}

/**
 * Retorna color y fondo para una línea de git diff unificado.
 * @param {string} line Línea de texto del diff
 */
export function getDiffLineStyle(line) {
  if (line.startsWith('+') && !line.startsWith('+++')) {
    return {
      color: '#34d399',
      bg: 'rgba(16, 185, 129, 0.1)'
    };
  }
  if (line.startsWith('-') && !line.startsWith('---')) {
    return {
      color: '#f87171',
      bg: 'rgba(239, 68, 68, 0.1)'
    };
  }
  if (line.startsWith('@@')) {
    return {
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.07)'
    };
  }
  if (line.startsWith('diff --git') || line.startsWith('index ')) {
    return {
      color: '#c084fc',
      bg: 'rgba(168, 85, 247, 0.05)'
    };
  }
  return {
    color: '#94a3b8',
    bg: 'transparent'
  };
}
