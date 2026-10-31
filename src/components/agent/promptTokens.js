/** Tokenizador puro de referencias (@vault: @file: @context:) y variables ({{clip}} {{diff}}) del prompt */

export const MENTION_KINDS = [
  { kind: 'vault', desc: 'Inyectar una nota de la Bóveda', icon: 'BookOpen' },
  { kind: 'file', desc: 'Adjuntar un archivo del workspace activo', icon: 'FileText' },
  { kind: 'context', desc: 'Alternar el perfil de contexto del agente', icon: 'Brain' }
];

const TOKEN_SOURCE = '@(vault|file|context):("[^"]*"|[^\\s"]+)|\\{\\{(clip|diff)\\}\\}';

/** Divide el texto en segmentos { type: 'text'|'ref'|'var', value, start, end, kind, arg } */
export function tokenize(text = '') {
  const re = new RegExp(TOKEN_SOURCE, 'g');
  const out = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) out.push({ type: 'text', value: text.slice(last, m.index), start: last, end: m.index });
    const end = m.index + m[0].length;
    if (m[1]) {
      out.push({ type: 'ref', value: m[0], start: m.index, end, kind: m[1], arg: m[2].replace(/^"|"$/g, '') });
    } else {
      out.push({ type: 'var', value: m[0], start: m.index, end, kind: m[3], arg: '' });
    }
    last = end;
  }
  if (last < text.length) out.push({ type: 'text', value: text.slice(last), start: last, end: text.length });
  return out;
}

/** Referencias y variables (sin texto plano) */
export const getTokens = (text) => tokenize(text).filter((t) => t.type !== 'text');

/** Detecta la mención en edición justo antes del cursor. null si no hay */
export function getActiveMention(text, caret) {
  const before = text.slice(0, caret);
  const m = /(^|\s)@([a-z]*)(?::("?)([^\s"]*))?$/.exec(before);
  if (!m) return null;
  const start = before.length - (m[0].length - m[1].length);
  const partial = m[2];
  if (!m[0].includes(':')) return { stage: 'kind', start, end: caret, query: partial };
  const kind = MENTION_KINDS.find((k) => k.kind === partial)?.kind;
  if (!kind) return null;
  return { stage: 'arg', kind, start, end: caret, query: m[4] || '' };
}

/** Token canónico (con comillas si la ruta tiene espacios) */
export function formatReference(kind, arg) {
  return /\s/.test(arg) ? `@${kind}:"${arg}"` : `@${kind}:${arg}`;
}

/** Elimina un rango del texto colapsando el espacio sobrante */
export function removeRange(text, start, end) {
  return (text.slice(0, start) + text.slice(end)).replace(/ {2,}/g, ' ');
}

/** Si el cursor está pegado al final de un token, devuelve ese token (borrado atómico con Backspace) */
export function getTokenEndingAt(text, caret) {
  return getTokens(text).find((t) => t.end === caret) || null;
}
