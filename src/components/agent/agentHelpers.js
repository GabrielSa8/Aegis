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
  if (!rawContent) return { thoughts: '', cleanContent: '' };

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

  return {
    thoughts: thoughts.join('\n\n'),
    cleanContent: cleanContent.trim()
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
      content: (msg.content ? msg.content + '\n\n' : '') + `⚠️ [Error agy]: ${chunk.content}`,
      loading: false,
      permissionPrompt: null,
      statusText: null,
      isError: true
    };
  }
  return msg;
}
