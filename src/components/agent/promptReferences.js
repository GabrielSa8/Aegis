import { invoke } from '@tauri-apps/api/core';
import { tokenize } from './promptTokens';
import { interpolateMacroText } from './macroHelpers';

const VAULT_NOTE_LIMIT = 20000;
const DIFF_LIMIT = 8000;

let vaultNotesPromise = null;

/** Notas de la Bóveda (cacheadas; se reintenta si falla) */
export function getVaultNotes() {
  if (!vaultNotesPromise) {
    vaultNotesPromise = invoke('get_vault_notes').catch((e) => {
      vaultNotesPromise = null;
      throw e;
    });
  }
  return vaultNotesPromise;
}

const joinPath = (base, rel) => `${(base || '').replace(/\/+$/, '')}/${rel}`;

/**
 * Resuelve las referencias del prompt antes de enviarlo al agente:
 * - @vault: inyecta el contenido de la nota
 * - @file: anexa la ruta absoluta para que el agente la lea
 * - {{diff}} / {{clip}}: se sustituyen por su contenido
 */
export async function resolvePromptReferences(text, activeContext = {}) {
  const tokens = tokenize(text);
  const hasWork = tokens.some((t) => t.type !== 'text');
  if (!hasWork) return text;

  const vaultBlocks = [];
  const filePaths = [];
  let result = text;

  if (tokens.some((t) => t.kind === 'diff')) {
    let diff = '[Git diff no disponible]';
    try {
      const details = await invoke('get_git_repo_details', { path: activeContext?.path || '.' });
      diff = details?.diff?.trim() ? details.diff.slice(0, DIFF_LIMIT) : '[Sin cambios pendientes]';
    } catch {
      /* se conserva el texto de respaldo */
    }
    result = result.replace(/\{\{diff\}\}/gi, `\n\`\`\`diff\n${diff}\n\`\`\`\n`);
  }

  for (const t of tokens) {
    if (t.kind === 'vault') {
      try {
        const notes = await getVaultNotes();
        const note = notes.find((n) => n.relative_path === t.arg || n.title === t.arg);
        if (!note) throw new Error('nota no encontrada');
        const body = (await invoke('read_vault_note', { path: note.path })).slice(0, VAULT_NOTE_LIMIT);
        vaultBlocks.push(`[Nota de la Bóveda: ${note.relative_path}]\n\`\`\`md\n${body}\n\`\`\``);
      } catch (e) {
        vaultBlocks.push(`[Nota de la Bóveda no disponible: ${t.arg} (${e})]`);
      }
    } else if (t.kind === 'file') {
      filePaths.push(joinPath(activeContext?.path, t.arg));
    }
  }

  result = await interpolateMacroText(result, activeContext);
  if (filePaths.length) {
    result += `\n\n[Archivos referenciados — léelos desde estas rutas]\n${filePaths.map((p) => `- ${p}`).join('\n')}`;
  }
  if (vaultBlocks.length) result += `\n\n${vaultBlocks.join('\n\n')}`;
  return result;
}
