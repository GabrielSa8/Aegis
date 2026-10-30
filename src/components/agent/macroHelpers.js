/**
 * Helpers y utilidades tácticas para resolución de variables dinámicas en macros
 * Soporta variables: {{clip}}, {{diff}}, {{nota}}, {{cwd}}
 */

const VAR_REGEX = /\{\{(clip|diff|nota|cwd)\}\}/gi;

/**
 * Catálogo de variables dinámicas soportadas por el motor de macros
 */
export const AVAILABLE_VARIABLES = [
  { id: 'clip', tag: '{{clip}}', label: 'Portapapeles', desc: 'Contenido actual del portapapeles del sistema' },
  { id: 'diff', tag: '{{diff}}', label: 'Git Diff', desc: 'Git diff unificado del repositorio activo' },
  { id: 'nota', tag: '{{nota}}', label: 'Nota Activa', desc: 'Última nota de Obsidian referenciada' },
  { id: 'cwd', tag: '{{cwd}}', label: 'Ruta CWD', desc: 'Ruta del contexto o repositorio actual' }
];

/**
 * Extrae lista única de variables dinámicas presentes en el texto del macro
 * @param {string} text 
 * @returns {string[]} Lista de nombres de variable detectados (ej: ['clip', 'diff'])
 */
export function getMacroVariables(text) {
  if (!text || typeof text !== 'string') return [];
  const matches = text.match(VAR_REGEX);
  if (!matches) return [];
  const vars = matches.map((m) => m.replace(/[{}]/g, '').toLowerCase());
  return Array.from(new Set(vars));
}

/**
 * Resuelve e interpola variables dinámicas asíncronas en el texto del macro
 * @param {string} text Texto del macro con variables tipo {{clip}}
 * @param {Object} context Contexto activo (ej. path, label)
 * @returns {Promise<string>} Texto con las variables sustituidas
 */
export async function interpolateMacroText(text, context = {}) {
  if (!text || typeof text !== 'string') return '';
  let result = text;

  // {{clip}} - Portapapeles del sistema
  if (/\{\{clip\}\}/i.test(result)) {
    try {
      if (navigator?.clipboard?.readText) {
        const clipText = await navigator.clipboard.readText();
        result = result.replace(/\{\{clip\}\}/gi, clipText?.trim() || '[Portapapeles vacío]');
      } else {
        result = result.replace(/\{\{clip\}\}/gi, '[Portapapeles no disponible]');
      }
    } catch {
      result = result.replace(/\{\{clip\}\}/gi, '[Error leyendo portapapeles]');
    }
  }

  // {{cwd}} - Directorio de trabajo / ruta del contexto activo
  if (/\{\{cwd\}\}/i.test(result)) {
    const cwd = context?.path || '';
    result = result.replace(/\{\{cwd\}\}/gi, cwd || '[Directorio no especificado]');
  }

  // {{nota}} - Última nota de Obsidian referenciada
  if (/\{\{nota\}\}/i.test(result)) {
    try {
      const lastNote = localStorage.getItem('aegis_last_active_note');
      result = result.replace(/\{\{nota\}\}/gi, lastNote ? `Nota: ${lastNote}` : '[Nota activa en Bóveda]');
    } catch {
      result = result.replace(/\{\{nota\}\}/gi, '[Nota activa en Bóveda]');
    }
  }

  return result;
}
