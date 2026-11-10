import { invoke } from '@tauri-apps/api/core';
import { loadStoredModpacks } from '../devops/devopsHelpers';

const BASE_CORE_SKILLS = [
  'caveman',
  'superpowers',
  'ponytail',
  'input-filter-optimization'
];

/**
 * Ponderación y filtrado quirúrgico de skills para evitar token bloat.
 * Techo estricto: máximo 8 a 10 skills de alta densidad.
 */
export function inferSkillsFromText(text = '', query = '', noteTitle = '', relativePath = '') {
  const q = (query || '').toLowerCase();
  const title = (noteTitle || '').toLowerCase();
  const rel = (relativePath || '').toLowerCase();
  const lowerText = (text || '').toLowerCase();

  // 1. Detección de Dominios Exclusivos (Blindaje contra contaminación cruzada)
  const isTadu = q.includes('tadu') || title.includes('tadu') || rel.includes('tadu');
  const isAndroid =
    q.includes('android') ||
    q.includes('granja') ||
    title.includes('android') ||
    title.includes('granja') ||
    rel.includes('granja');
  const isAcademics =
    rel.includes('04 estudios') ||
    q.includes('estudio') ||
    q.includes('anki') ||
    q.includes('certificacion') ||
    title.includes('certific');

  // A. Dominio exclusivo TADÚ (AWS SAM, DynamoDB, Python 3.12)
  if (isTadu) {
    return [
      ...BASE_CORE_SKILLS,
      'tadu-backend',
      'clean-code-security',
      'tdd-practitioner',
      'codebase-design',
      'triage',
      'caveman-commit',
      'git-guardrails-claude-code'
    ]; // 11 skills especializadas
  }

  // B. Dominio exclusivo Android / Granja (Kotlin, Jetpack Compose)
  if (isAndroid) {
    return [
      ...BASE_CORE_SKILLS,
      'jetpack-compose-patterns',
      'clean-code-security',
      'tdd-practitioner',
      'caveman-commit'
    ]; // 8 skills especializadas
  }

  // C. Dominio exclusivamente Académico / Repaso Spaced Repetition
  if (isAcademics && !q.includes('backend') && !q.includes('react')) {
    return [
      ...BASE_CORE_SKILLS,
      'obsidian-vault-architect',
      'feynman-technique-mentor',
      'spaced-repetition-generator'
    ]; // 7 skills especializadas
  }

  // 2. Sistema de Puntuación por Stack Tecnológico
  const scores = {
    frontend: 0,
    backend: 0,
    architecture: 0
  };

  const scoreTerm = (term, weight) => {
    if (title.includes(term) || q.includes(term)) return weight * 10;
    const firstBlock = lowerText.slice(0, 600);
    if (firstBlock.includes(term)) return weight * 4;
    const matches = lowerText.split(term).length - 1;
    return Math.min(matches, 5) * weight;
  };

  // Palabras clave Frontend (UI/UX, React, Tauri, TS, CSS)
  const frontTerms = [
    'react', 'vite', 'tauri', 'typescript', 'ts', 'css', 'tailwind',
    'ui', 'ux', 'componentes', 'interfaz', 'frontend', 'impeccable'
  ];
  frontTerms.forEach((t) => { scores.frontend += scoreTerm(t, 2); });

  // Palabras clave Backend (API, Cloud, DynamoDB, Python, etc.)
  const backTerms = [
    'backend', 'python', 'fastapi', 'django', 'aws', 'sam',
    'lambda', 'dynamodb', 'sql', 'postgres', 'endpoint', 'servidor'
  ];
  backTerms.forEach((t) => { scores.backend += scoreTerm(t, 2); });

  // Palabras clave Arquitectura / Deep Modules
  const archTerms = [
    'arquitectura', 'deep module', 'refactor', 'tdd', 'clean code',
    'seguridad', 'vulnerabilidad', 'modular'
  ];
  archTerms.forEach((t) => { scores.architecture += scoreTerm(t, 2); });

  // 3. Selección Quirúrgica según Stack Dominante
  const selected = new Set(BASE_CORE_SKILLS);

  // Perfil Frontend / Desktop (Aegis, Vite, React)
  if (scores.frontend >= 8 || q.includes('aegis') || title.includes('aegis')) {
    selected.add('frontend-design');
    selected.add('impeccable');
    selected.add('react-ts-performance');
    selected.add('clean-code-security');
    selected.add('codebase-design');
    selected.add('caveman-commit');
    return Array.from(selected); // 10 skills óptimas
  }

  // Perfil Backend / Cloud API
  if (scores.backend >= 8) {
    selected.add('clean-code-security');
    selected.add('tdd-practitioner');
    selected.add('codebase-design');
    selected.add('triage');
    selected.add('caveman-commit');
    return Array.from(selected); // 9 skills óptimas
  }

  // Perfil Ingeniería General (Fallback)
  selected.add('clean-code-security');
  selected.add('codebase-design');
  selected.add('triage');
  selected.add('caveman-commit');

  return Array.from(selected);
}

/**
 * Extrae una ruta de workspace sugerida si la nota contiene referencias a carpetas
 */
export function extractWorkspacePathFromText(text = '') {
  const pathMatch = text.match(/(?:\/home\/[^\s\)\"`]+|~\/[^\s\)\"`]+)/);
  if (pathMatch) {
    const rawPath = pathMatch[0].trim().replace(/[.,;:]$/, '');
    if (!rawPath.includes('.obsidian') && !rawPath.includes('Obsidian Vault')) {
      return rawPath;
    }
  }
  return '';
}

/**
 * Resuelve o crea un Contexto analizando la Bóveda de Obsidian con poda anti-bloat
 */
export async function resolveOrCreateProjectContext(themeQuery, existingContexts = []) {
  const clean = (themeQuery || '').trim();
  const q = clean.toLowerCase();

  if (!q) {
    return { error: 'Debes especificar un tema o proyecto. Ej: `/context tadu` o `/context list`' };
  }

  // 1. Verificar si ya existe en la lista de contextos
  const existing = existingContexts.find(
    (c) =>
      c.id.toLowerCase() === q ||
      c.label.toLowerCase() === q ||
      c.id.toLowerCase() === `ctx_${q.replace(/[^a-z0-9]/g, '_')}` ||
      c.label.toLowerCase().includes(q)
  );

  // Si existe pero está contaminado (> 11 skills), procedemos a re-afilarlo
  const isBloated = existing && (existing.skills || []).length > 11;
  if (existing && !isBloated) {
    return { action: 'switch', context: existing };
  }

  // 2. Introspección en la Bóveda de Obsidian
  let sourceNote = null;
  let noteContent = '';

  try {
    const notes = await invoke('get_vault_notes');
    if (Array.isArray(notes) && notes.length > 0) {
      const ranked = notes.filter(
        (n) => n.title.toLowerCase().includes(q) || n.relative_path.toLowerCase().includes(q)
      );

      ranked.sort((a, b) => {
        const aIsProj = a.relative_path.includes('02 Proyectos') ? 1 : 0;
        const bIsProj = b.relative_path.includes('02 Proyectos') ? 1 : 0;
        return bIsProj - aIsProj;
      });

      if (ranked.length > 0) {
        sourceNote = ranked[0];
        try {
          noteContent = await invoke('read_vault_note', { path: sourceNote.path });
        } catch {
          noteContent = '';
        }
      }
    }
  } catch (err) {
    console.warn('Aegis Context Resolver: No se pudo leer notas de Bóveda:', err);
  }

  // 3. Inferir skills quirúrgicas (máximo 8-10 skills)
  const skills = inferSkillsFromText(
    noteContent,
    clean,
    sourceNote?.title || '',
    sourceNote?.relative_path || ''
  );
  const detectedPath = extractWorkspacePathFromText(noteContent) || existing?.path || '';
  const label = existing?.label || sourceNote?.title || (clean.charAt(0).toUpperCase() + clean.slice(1));
  const contextId = existing?.id || `ctx_${clean.replace(/[^a-z0-9]/g, '_')}`;

  const tunedContext = {
    id: contextId,
    label,
    path: detectedPath,
    effort: 'auto',
    skills
  };

  return {
    action: existing ? 'update' : 'create',
    context: tunedContext,
    sourceNote
  };
}

/**
 * Resuelve o crea un Modpack de skills analizando la Bóveda con poda anti-bloat
 */
export async function resolveOrCreateProjectModpack(themeQuery) {
  const clean = (themeQuery || '').trim();
  const q = clean.toLowerCase();

  if (!q) {
    return { error: 'Debes especificar un tema para el modpack. Ej: `/pack tadu`' };
  }

  let savedModpacks = [];
  try {
    savedModpacks = loadStoredModpacks();
  } catch {}

  const existingPack = savedModpacks.find(
    (m) =>
      m.id.toLowerCase() === q ||
      m.name.toLowerCase() === q ||
      m.id.toLowerCase() === `pack_${q.replace(/[^a-z0-9]/g, '_')}` ||
      m.name.toLowerCase().includes(q)
  );

  const isBloated = existingPack && (existingPack.skills || []).length > 11;
  if (existingPack && !isBloated) {
    return { action: 'activate', modpack: existingPack };
  }

  let sourceNote = null;
  let noteContent = '';

  try {
    const notes = await invoke('get_vault_notes');
    if (Array.isArray(notes) && notes.length > 0) {
      const match = notes.find(
        (n) => n.title.toLowerCase().includes(q) || n.relative_path.toLowerCase().includes(q)
      );
      if (match) {
        sourceNote = match;
        try {
          noteContent = await invoke('read_vault_note', { path: match.path });
        } catch {}
      }
    }
  } catch (err) {
    console.warn('Aegis Modpack Resolver: No se pudo consultar Bóveda:', err);
  }

  const skills = inferSkillsFromText(
    noteContent,
    clean,
    sourceNote?.title || '',
    sourceNote?.relative_path || ''
  );
  const packId = existingPack?.id || `pack_${clean.replace(/[^a-z0-9]/g, '_')}`;
  const packName = existingPack?.name || (sourceNote?.title ? `Pack ${sourceNote.title}` : `Pack ${clean.toUpperCase()}`);

  const tunedPack = {
    id: packId,
    name: packName,
    description: sourceNote
      ? `Auto-generado desde ${sourceNote.relative_path} (${skills.length} skills optimizadas)`
      : `Modpack temático para ${clean} (${skills.length} skills optimizadas)`,
    enabled: true,
    skills,
    disabledSubSkills: [],
    isCustom: true
  };

  return {
    action: existingPack ? 'update' : 'create',
    modpack: tunedPack,
    sourceNote
  };
}

/**
 * Formateador de la Guía Interactiva (/help)
 */
export function formatHelpCommandResponse(agentType = 'agy') {
  return `### 🧭 Guía de Comandos Rápidos (/slash) en Aegis

Escribe \`/\` en la caja de prompt para autocompletar o ejecuta directamente:

| Comando | Función Principal | Ámbito |
|---|---|---|
| \`/usage\` | Consulta telemetría y límites reales (5h y semanal) de tu cuenta | Proveedor / Cuota |
| \`/compact\` | Comprime quirúrgicamente el historial para liberar tokens y memoria | Contexto |
| \`/model [id]\` | Inspecciona o conmuta el modelo en vivo (\`flash\`, \`pro\`, \`sonnet\`, etc.) | Motor IA |
| \`/intensity [nivel]\` | Ajusta esfuerzo o razonamiento (\`low\`, \`mid\`, \`high\`) | Motor IA |
| \`/context <tema>\` | Conmuta o auto-crea un contexto analizando Bóveda y repos | Proyecto |
| \`/context list\` | Lista todos los contextos persistentes y sus skills activas | Proyecto |
| \`/pack <tema>\` | Activa o auto-ensambla un modpack de skills adaptado al stack | Habilidades |
| \`/clip\` | Pega el contenido de tu portapapeles en el prompt | Entrada |
| \`/diff\` | Inyecta los cambios git sin confirmar del workspace activo | Código |
| \`/cortex\` | Telemetría de hábitos de uso (0 tokens) y propuestas evolutivas | Agente |
| \`/clear\` | Limpia el historial visual de mensajes en la sesión actual | Sesión |

> [!TIP]
> **Auto-Contexto Lean:** Puedes escribir \`/context tadu\` o \`/context aegis\`. Aegis leerá la nota del proyecto en tu Bóveda, inferirá el stack y asignará un set quirúrgico de 8 a 10 skills sin saturar la ventana de contexto.`;
}

/**
 * Formateador de lista de contextos (/context list)
 */
export function formatContextListResponse(contexts = [], activeId = '') {
  const items = contexts.map((c) => {
    const isAct = c.id === activeId ? ' **(Activo actualmente)**' : '';
    const skillsSummary = (c.skills || []).slice(0, 5).join(' · ');
    const more = (c.skills || []).length > 5 ? ` *(+${c.skills.length - 5} más)*` : '';
    return `- **${c.label}** (\`${c.id}\`)${isAct}\n  - Workspace: \`${c.path || 'Global'}\`\n  - Skills (${(c.skills || []).length}): \`${skillsSummary}${more}\``;
  });

  return `> [!NOTE] Contextos Persistentes Registrados (${contexts.length})\n\n${items.join('\n\n')}\n\n*Usa \`/context <nombre>\` para conmutar o crear uno nuevo.*`;
}

/**
 * Formateador de conmutación de contexto
 */
export function formatContextSwitchResponse(ctx) {
  const skillsCount = (ctx.skills || []).length;
  return `> [!NOTE] Contexto Conmutado: **${ctx.label}**\n\n- **Identificador:** \`${ctx.id}\`\n- **Workspace:** \`${ctx.path || 'Global'}\`\n- **Habilidades Activas:** ${skillsCount} skills vinculadas.\n- **Nivel Cognitivo:** \`${ctx.effort || 'auto'}\`\n\n*El agente ha enfocado su espacio de trabajo en este contexto.*`;
}

/**
 * Formateador de nuevo contexto creado
 */
export function formatContextCreatedResponse(ctx, sourceNote) {
  const src = sourceNote ? `Bóveda de Obsidian (\`${sourceNote.relative_path}\`)` : 'Análisis heurístico de stack';
  const skillsList = (ctx.skills || []).map((s) => `\`${s}\``).join(' · ');

  return `> [!IMPORTANT] Contexto Optimizado (Lean): **${ctx.label}**\n\n- **Fuente:** ${src}\n- **Workspace:** \`${ctx.path || 'Global'}\`\n- **Skills Quirúrgicas (${ctx.skills.length}):**\n  ${skillsList}\n\n*Guardado persistentemente y activado (cero token bloat).*`;
}

/**
 * Formateador de modpack conmutado
 */
export function formatModpackSwitchResponse(pack) {
  return `> [!NOTE] Modpack Activado en Agente: **${pack.name}**\n\n- **Habilidades Inyectadas:** ${pack.skills.length} skills activas.\n- **Descripción:** ${pack.description || 'Sin descripción'}\n\n*El subárbol \`.agents/skills\` ha sido sincronizado.*`;
}

/**
 * Formateador de nuevo modpack creado
 */
export function formatModpackCreatedResponse(pack, sourceNote) {
  const src = sourceNote ? `Bóveda de Obsidian (\`${sourceNote.relative_path}\`)` : 'Análisis heurístico';
  const skillsList = pack.skills.map((s) => `\`${s}\``).join(' · ');

  return `> [!IMPORTANT] Modpack Ensamblado (Lean): **${pack.name}**\n\n- **Fuente:** ${src}\n- **Skills (${pack.skills.length}):**\n  ${skillsList}\n\n*Guardado en DevOps y activado en el Agente.*`;
}
