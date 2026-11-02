/**
 * Bus mínimo para ejecutar macros desde fuera del AgentView (ej. Omnibar).
 * Si AgentView no está montado, la orden queda pendiente hasta que consuma.
 */
const EVENT = 'aegis:run-macro';
const STORAGE_KEY = 'aegis_quick_macros';
let pending = null;

export function loadMacros(fallback = []) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return Array.isArray(saved) ? saved : fallback;
  } catch {
    return fallback;
  }
}

export function queueMacro(macro, send = false) {
  pending = { macro, send };
  window.dispatchEvent(new CustomEvent(EVENT));
  if (send) {
    window.dispatchEvent(new CustomEvent('aegis:switch-tab', { detail: { tab: 'agent' } }));
  }
}

export function consumePendingMacro() {
  const p = pending;
  pending = null;
  return p;
}

export function onMacroQueued(handler) {
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
