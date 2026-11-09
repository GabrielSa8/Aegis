/**
 * Pure helpers for Agent terminal streaming and thoughts parsing
 */

export function renderAsciiProgress(percent, length = 18) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const filled = Math.round((clamped / 100) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

export function parseThoughtBlocks(rawContent) {
  if (!rawContent) return { thoughts: '', cleanContent: '', activeSkills: [] };

  const thoughtRegex = /<(?:thought|thinking|think)>([\s\S]*?)<\/(?:thought|thinking|think)>/gi;
  const thoughts = [];
  let match;
  while ((match = thoughtRegex.exec(rawContent)) !== null) {
    const text = match[1].trim();
    if (text) thoughts.push(text);
  }

  // Si hay un bloque de pensamiento que todavía se está transmitiendo en vivo
  let cleanContent = rawContent.replace(thoughtRegex, '');
  const lastOpenIndex = Math.max(
    cleanContent.lastIndexOf('<thought>'),
    cleanContent.lastIndexOf('<thinking>'),
    cleanContent.lastIndexOf('<think>')
  );
  const lastCloseIndex = Math.max(
    cleanContent.lastIndexOf('</thought>'),
    cleanContent.lastIndexOf('</thinking>'),
    cleanContent.lastIndexOf('</think>')
  );

  if (lastOpenIndex > lastCloseIndex) {
    const openBlock = cleanContent.slice(lastOpenIndex);
    const openText = openBlock.replace(/^<(?:thought|thinking|think)>/i, '').trim();
    if (openText) thoughts.push(openText);
    cleanContent = cleanContent.slice(0, lastOpenIndex);
  }

  const joinedThoughts = thoughts.join('\n\n');
  const skillsMap = new Map();

  // 1. Skills montadas en el workspace del contexto activo
  const mountedRe = /\[Skills Montadas:\s*([^\]]+)\]/g;
  let mMatch;
  while ((mMatch = mountedRe.exec(joinedThoughts)) !== null) {
    for (const raw of mMatch[1].split(',')) {
      const s = raw.trim();
      if (s && !skillsMap.has(s)) skillsMap.set(s, false);
    }
  }

  // 2. Skills cuyo SKILL.md fue leído/invocado en el turno
  const readRe = /\[Skill Leída:\s*([^\]]+)\]/g;
  let rMatch;
  while ((rMatch = readRe.exec(joinedThoughts)) !== null) {
    const s = rMatch[1].trim();
    if (s) skillsMap.set(s, true);
  }

  const pathRe = /\/skills\/([a-zA-Z0-9_-]+)\/SKILL\.md/g;
  let pMatch;
  while ((pMatch = pathRe.exec(joinedThoughts)) !== null) {
    skillsMap.set(pMatch[1], true);
  }

  const activeSkills = Array.from(skillsMap.entries()).map(([name, read]) => ({ name, read }));

  return {
    thoughts: joinedThoughts,
    cleanContent: cleanContent.trim(),
    activeSkills
  };
}

export function reduceStreamChunk(msg, chunk) {
  if (chunk.event_type === 'init') {
    return {
      ...msg,
      statusText: chunk.content || 'Montando contexto y preparando modelo...',
      loading: true
    };
  }
  if (chunk.event_type === 'delta') {
    let currentStatus = msg.statusText;
    if (
      chunk.step_type === 'thinking' ||
      chunk.content.includes('<thought>') ||
      chunk.content.includes('<thinking>') ||
      chunk.content.includes('<think>')
    ) {
      currentStatus = '🧠 Razonando proceso técnico...';
    } else if (
      chunk.step_type === 'tool' ||
      chunk.step_type === 'tool_call' ||
      chunk.content.includes('⚙️ [Herramienta')
    ) {
      currentStatus = '⚙️ Ejecutando herramienta de sistema...';
    } else if (msg.content && msg.content.length > 30) {
      currentStatus = '⚡ Transmitiendo respuesta...';
    }

    return {
      ...msg,
      content: (msg.content || '') + chunk.content,
      statusText: currentStatus,
      loading: true
    };
  }
  if (chunk.event_type === 'permission') {
    return {
      ...msg,
      permissionPrompt: chunk.content,
      statusText: '⚠️ Esperando confirmación de permiso...',
      loading: true
    };
  }
  if (chunk.event_type === 'done') {
    return {
      ...msg,
      loading: false,
      permissionPrompt: null,
      statusText: null,
      duration: chunk.duration_seconds,
      totalTokens: chunk.total_tokens,
      inputTokens: chunk.input_tokens,
      outputTokens: chunk.output_tokens
    };
  }
  if (chunk.event_type === 'error') {
    return {
      ...msg,
      content: (msg.content ? msg.content + '\n\n' : '') + `⚠️ [Error]: ${chunk.content}`,
      loading: false,
      permissionPrompt: null,
      statusText: null,
      isError: true
    };
  }
  return msg;
}

export function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 45) return 'Ahora';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `hace ${diffMin}m`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `hace ${diffHour}h`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return 'Ayer';
  if (diffDay < 7) return `hace ${diffDay}d`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
