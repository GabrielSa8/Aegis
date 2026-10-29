import { FileText } from 'lucide-react';

/**
 * Parseo e inspección de YAML Frontmatter (estilo Obsidian)
 */
export function parseFrontmatter(rawMarkdown) {
  if (!rawMarkdown) return { frontmatter: null, content: '' };

  const fmMatch = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(rawMarkdown);
  if (!fmMatch) {
    return { frontmatter: null, content: rawMarkdown };
  }

  const rawYaml = fmMatch[1];
  const bodyContent = rawMarkdown.slice(fmMatch[0].length);

  const parsed = {
    tags: [],
    aliases: [],
    tipo: null,
    estado: null,
    fecha_actualizacion: null,
    extra: {}
  };

  const lines = rawYaml.split(/\r?\n/);
  let currentKey = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (trimmed.startsWith('- ') && currentKey) {
      const val = trimmed.slice(2).trim().replace(/^["']|["']$/g, '');
      if (currentKey === 'tags' || currentKey === 'tag') {
        parsed.tags.push(val);
      } else if (currentKey === 'aliases' || currentKey === 'alias') {
        parsed.aliases.push(val);
      } else {
        if (!Array.isArray(parsed.extra[currentKey])) {
          parsed.extra[currentKey] = [];
        }
        parsed.extra[currentKey].push(val);
      }
      continue;
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim().toLowerCase();
      const rawVal = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
      currentKey = key;

      if (key === 'tags' || key === 'tag') {
        if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
          const list = rawVal.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
          parsed.tags.push(...list);
        } else if (rawVal) {
          parsed.tags.push(rawVal);
        }
      } else if (key === 'aliases' || key === 'alias') {
        if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
          const list = rawVal.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
          parsed.aliases.push(...list);
        } else if (rawVal) {
          parsed.aliases.push(rawVal);
        }
      } else if (key === 'tipo') {
        parsed.tipo = rawVal;
      } else if (key === 'estado') {
        parsed.estado = rawVal;
      } else if (key === 'fecha_actualizacion' || key === 'fecha' || key === 'date') {
        parsed.fecha_actualizacion = rawVal;
      } else if (rawVal) {
        parsed.extra[key] = rawVal;
      }
    }
  }

  const hasMeta = parsed.tags.length > 0 || parsed.aliases.length > 0 || parsed.tipo || parsed.estado || parsed.fecha_actualizacion || Object.keys(parsed.extra).length > 0;

  return {
    frontmatter: hasMeta ? parsed : null,
    content: bodyContent
  };
}

/**
 * Formateo en línea: negritas (**), código (`), y enlaces wiki Obsidian [[Nota]]
 */
export function formatInline(str, onNavigateNote) {
  if (!str) return str;

  const tokenRegex = /(\[\[.*?\]\]|`.*?`|\*\*.*?\*\*)/g;
  const parts = str.split(tokenRegex);

  return parts.map((part, i) => {
    if (!part) return null;

    if (part.startsWith('[[') && part.endsWith(']]')) {
      const inner = part.slice(2, -2);
      const [target, alias] = inner.split('|');
      const displayText = alias || target;

      return (
        <span
          key={i}
          onClick={() => onNavigateNote && onNavigateNote(target)}
          style={{
            color: '#34d399',
            textDecoration: 'underline',
            textUnderlineOffset: '3px',
            cursor: 'pointer',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px'
          }}
          title={`Abrir nota: ${target}`}
        >
          <FileText size={11} />
          {displayText}
        </span>
      );
    }

    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={i}
          style={{
            background: 'rgba(255, 255, 255, 0.07)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '1px 5px',
            borderRadius: '4px',
            fontSize: '0.76rem',
            fontFamily: 'monospace',
            color: '#a7f3d0'
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={i} style={{ color: 'var(--text-high)', fontWeight: 700 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    return part;
  });
}
