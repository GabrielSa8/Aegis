import { useMemo, useState } from 'react';
import MermaidRenderer from './MermaidRenderer';
import { 
  Copy, 
  Check, 
  FileText, 
  Quote, 
  Info, 
  Lightbulb, 
  Sparkles, 
  AlertTriangle, 
  AlertOctagon, 
  Bug, 
  CheckCircle2, 
  HelpCircle, 
  ListTree,
  CheckSquare,
  Square,
  Hash,
  Calendar,
  Layers,
  Link2
} from 'lucide-react';

// Parseo e inspección de YAML Frontmatter (estilo Obsidian)
function parseFrontmatter(rawMarkdown) {
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

function FrontmatterCard({ frontmatter, onTagClick }) {
  if (!frontmatter) return null;

  return (
    <div style={{
      marginBottom: '1.25rem',
      padding: '0.75rem 1rem',
      borderRadius: 'var(--radius-md)',
      background: 'rgba(0, 0, 0, 0.35)',
      border: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      fontSize: '0.75rem'
    }}>
      {/* Cabecera de Metadatos */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        {frontmatter.tipo && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#10b981',
            fontWeight: 700,
            textTransform: 'uppercase',
            fontSize: '0.65rem'
          }}>
            <Layers size={11} />
            {frontmatter.tipo}
          </span>
        )}

        {frontmatter.estado && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'rgba(217, 119, 6, 0.15)',
            color: '#fbbf24',
            fontWeight: 600,
            fontSize: '0.65rem'
          }}>
            <CheckCircle2 size={11} />
            {frontmatter.estado}
          </span>
        )}

        {frontmatter.fecha_actualizacion && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            color: 'var(--text-muted)',
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)'
          }}>
            <Calendar size={11} />
            {frontmatter.fecha_actualizacion}
          </span>
        )}

        {frontmatter.aliases && frontmatter.aliases.length > 0 && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            color: 'var(--text-muted)',
            fontSize: '0.68rem'
          }}>
            <Link2 size={11} />
            {frontmatter.aliases.join(', ')}
          </span>
        )}
      </div>

      {/* Tags Interactivos */}
      {frontmatter.tags && frontmatter.tags.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '5px' }}>
          {frontmatter.tags.map((tag) => (
            <span
              key={tag}
              onClick={() => onTagClick && onTagClick(tag)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '2px 7px',
                borderRadius: '4px',
                background: 'rgba(168, 85, 247, 0.12)',
                color: '#c084fc',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                cursor: onTagClick ? 'pointer' : 'default',
                transition: 'var(--transition)'
              }}
              title={`Filtrar por #${tag}`}
            >
              <Hash size={10} />
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Configuraciones visuales para Callouts / Admonitions de Obsidian
const CALLOUT_CONFIGS = {
  quote: {
    title: 'CITA',
    color: '#c084fc',
    bg: 'rgba(168, 85, 247, 0.08)',
    border: 'rgba(168, 85, 247, 0.35)',
    icon: Quote
  },
  cite: {
    title: 'CITA',
    color: '#c084fc',
    bg: 'rgba(168, 85, 247, 0.08)',
    border: 'rgba(168, 85, 247, 0.35)',
    icon: Quote
  },
  note: {
    title: 'NOTA',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.08)',
    border: 'rgba(56, 189, 248, 0.35)',
    icon: Info
  },
  info: {
    title: 'INFORMACIÓN',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.08)',
    border: 'rgba(56, 189, 248, 0.35)',
    icon: Info
  },
  todo: {
    title: 'TODO',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.08)',
    border: 'rgba(56, 189, 248, 0.35)',
    icon: Info
  },
  tip: {
    title: 'CONSEJO',
    color: '#34d399',
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.35)',
    icon: Lightbulb
  },
  hint: {
    title: 'PISTA',
    color: '#34d399',
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.35)',
    icon: Lightbulb
  },
  important: {
    title: 'IMPORTANTE',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.4)',
    icon: Sparkles
  },
  warning: {
    title: 'ADVERTENCIA',
    color: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.08)',
    border: 'rgba(251, 191, 36, 0.35)',
    icon: AlertTriangle
  },
  caution: {
    title: 'PRECAUCIÓN',
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.08)',
    border: 'rgba(249, 115, 22, 0.35)',
    icon: AlertTriangle
  },
  attention: {
    title: 'ATENCIÓN',
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.08)',
    border: 'rgba(249, 115, 22, 0.35)',
    icon: AlertTriangle
  },
  danger: {
    title: 'PELIGRO',
    color: '#f87171',
    bg: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(239, 68, 68, 0.35)',
    icon: AlertOctagon
  },
  error: {
    title: 'ERROR',
    color: '#f87171',
    bg: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(239, 68, 68, 0.35)',
    icon: AlertOctagon
  },
  failure: {
    title: 'FALLO',
    color: '#f87171',
    bg: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(239, 68, 68, 0.35)',
    icon: AlertOctagon
  },
  bug: {
    title: 'BUG',
    color: '#f43f5e',
    bg: 'rgba(244, 63, 94, 0.08)',
    border: 'rgba(244, 63, 94, 0.35)',
    icon: Bug
  },
  success: {
    title: 'ÉXITO',
    color: '#34d399',
    bg: 'rgba(52, 211, 153, 0.08)',
    border: 'rgba(52, 211, 153, 0.35)',
    icon: CheckCircle2
  },
  check: {
    title: 'VERIFICADO',
    color: '#34d399',
    bg: 'rgba(52, 211, 153, 0.08)',
    border: 'rgba(52, 211, 153, 0.35)',
    icon: CheckCircle2
  },
  done: {
    title: 'COMPLETADO',
    color: '#34d399',
    bg: 'rgba(52, 211, 153, 0.08)',
    border: 'rgba(52, 211, 153, 0.35)',
    icon: CheckCircle2
  },
  question: {
    title: 'PREGUNTA',
    color: '#60a5fa',
    bg: 'rgba(96, 165, 250, 0.08)',
    border: 'rgba(96, 165, 250, 0.35)',
    icon: HelpCircle
  },
  help: {
    title: 'AYUDA',
    color: '#60a5fa',
    bg: 'rgba(96, 165, 250, 0.08)',
    border: 'rgba(96, 165, 250, 0.35)',
    icon: HelpCircle
  },
  faq: {
    title: 'FAQ',
    color: '#60a5fa',
    bg: 'rgba(96, 165, 250, 0.08)',
    border: 'rgba(96, 165, 250, 0.35)',
    icon: HelpCircle
  },
  example: {
    title: 'EJEMPLO',
    color: '#c084fc',
    bg: 'rgba(192, 132, 252, 0.08)',
    border: 'rgba(192, 132, 252, 0.35)',
    icon: ListTree
  }
};

function CalloutCard({ type, customTitle, bodyLines, onNavigateNote }) {
  const normalizedType = (type || 'note').toLowerCase();
  const config = CALLOUT_CONFIGS[normalizedType] || {
    title: normalizedType.toUpperCase(),
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.35)',
    icon: Info
  };
  const IconComponent = config.icon;
  const titleText = customTitle || config.title;

  return (
    <div style={{
      margin: '10px 0',
      borderRadius: 'var(--radius-md)',
      background: config.bg,
      border: `1px solid ${config.border}`,
      borderLeft: `4px solid ${config.color}`,
      padding: '10px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)'
    }}>
      {/* Cabecera del Callout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <IconComponent size={16} color={config.color} />
        <span style={{
          fontSize: '0.84rem',
          fontWeight: 700,
          color: config.color,
          letterSpacing: '0.02em',
          textTransform: customTitle ? 'none' : 'uppercase'
        }}>
          {titleText}
        </span>
      </div>

      {/* Cuerpo del Callout */}
      {bodyLines.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          fontSize: '0.82rem',
          color: 'var(--text-high)',
          lineHeight: '1.5',
          fontStyle: normalizedType === 'quote' || normalizedType === 'cite' ? 'italic' : 'normal',
          paddingLeft: '24px'
        }}>
          {bodyLines.map((bLine, bIdx) => {
            if (!bLine.trim()) return <div key={bIdx} style={{ height: '4px' }} />;
            return (
              <p key={bIdx} style={{ margin: 0 }}>
                {formatInline(bLine, onNavigateNote)}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MarkdownViewer({ content, onNavigateNote, onToggleTask, onTagClick }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const { frontmatter, content: cleanContent } = useMemo(() => parseFrontmatter(content), [content]);

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Desglosar contenido en bloques (código vs texto regular)
  const segments = useMemo(() => {
    if (!cleanContent) return [];

    const result = [];
    const codeBlockRegex = /```([a-zA-Z0-9_\-]+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(cleanContent)) !== null) {
      if (match.index > lastIndex) {
        result.push({
          type: 'text',
          content: cleanContent.slice(lastIndex, match.index),
          startIndex: lastIndex
        });
      }

      const lang = (match[1] || '').trim().toLowerCase();
      const code = match[2];

      if (lang === 'mermaid') {
        result.push({
          type: 'mermaid',
          code,
          startIndex: match.index
        });
      } else {
        result.push({
          type: 'code',
          lang,
          code,
          startIndex: match.index
        });
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < cleanContent.length) {
      result.push({
        type: 'text',
        content: cleanContent.slice(lastIndex),
        startIndex: lastIndex
      });
    }

    return result;
  }, [cleanContent]);

  // Formateador de texto Markdown que agrupa Callouts y bloques multilínea
  const renderTextSegment = (seg, blockIdx) => {
    const textBlock = seg.content;
    const frontmatterOffset = content && cleanContent && content.length > cleanContent.length
      ? content.slice(0, content.length - cleanContent.length).split('\n').length - 1
      : 0;
    const segStartLine = cleanContent.slice(0, seg.startIndex || 0).split('\n').length + frontmatterOffset;
    const lines = textBlock.split('\n');
    const elements = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Detección de Callout estilo Obsidian (> [!QUOTE], > [!NOTE], o [!QUOTE], !QUOTE)
      const calloutDirectMatch = trimmed.match(/^(?:>\s*)?\[!([a-zA-Z0-9_\-]+)\](?:\s*(.*))?$/i) ||
                                 trimmed.match(/^(?:>\s*)?!([a-zA-Z0-9_\-]+)(?:\s*(.*))?$/i);

      if (calloutDirectMatch) {
        const type = calloutDirectMatch[1].toLowerCase();
        const customTitle = calloutDirectMatch[2]?.trim();
        const bodyLines = [];
        i++;

        // Recolectar líneas subsiguientes del callout (que inicien con > o con indentación)
        while (i < lines.length) {
          const nextTrimmed = lines[i].trim();
          if (nextTrimmed.startsWith('>')) {
            bodyLines.push(nextTrimmed.replace(/^>\s?/, ''));
            i++;
          } else if (lines[i].startsWith('    ') || lines[i].startsWith('\t')) {
            bodyLines.push(lines[i].trim());
            i++;
          } else if (!nextTrimmed) {
            // Línea vacía: verificar si la siguiente aún pertenece al callout
            if (i + 1 < lines.length && lines[i + 1].trim().startsWith('>')) {
              bodyLines.push('');
              i++;
            } else {
              break;
            }
          } else {
            break;
          }
        }

        elements.push(
          <CalloutCard
            key={`callout-${blockIdx}-${i}`}
            type={type}
            customTitle={customTitle}
            bodyLines={bodyLines}
            onNavigateNote={onNavigateNote}
          />
        );
        continue;
      }

      // Citas estándar (> texto sin [!TIPO])
      if (trimmed.startsWith('>')) {
        const quoteLines = [];
        while (i < lines.length && (lines[i].trim().startsWith('>') || !lines[i].trim())) {
          if (lines[i].trim().startsWith('>')) {
            quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
          } else {
            quoteLines.push('');
          }
          i++;
        }

        elements.push(
          <blockquote key={`quote-${blockIdx}-${i}`} style={{
            margin: '6px 0',
            padding: '8px 14px',
            borderLeft: '3px solid #10b981',
            background: 'rgba(16, 185, 129, 0.05)',
            borderRadius: '0 8px 8px 0',
            color: 'var(--text-high)',
            fontSize: '0.82rem',
            fontStyle: 'italic',
            lineHeight: '1.5'
          }}>
            {quoteLines.map((qLine, qIdx) => (
              <p key={qIdx} style={{ margin: '2px 0' }}>
                {formatInline(qLine, onNavigateNote)}
              </p>
            ))}
          </blockquote>
        );
        continue;
      }

      // Encabezados
      if (trimmed.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${blockIdx}-${i}`} style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-high)', margin: '14px 0 6px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
            {trimmed.slice(2)}
          </h1>
        );
        i++;
        continue;
      }
      if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${blockIdx}-${i}`} style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-high)', margin: '16px 0 4px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '4px' }}>
            {trimmed.slice(3)}
          </h2>
        );
        i++;
        continue;
      }
      if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${blockIdx}-${i}`} style={{ fontSize: '0.98rem', fontWeight: 700, color: '#34d399', margin: '12px 0 2px 0' }}>
            {trimmed.slice(4)}
          </h3>
        );
        i++;
        continue;
      }

      // Checkboxes de Obsidian interactivos
      const taskMatch = line.match(/^(\s*)-\s*\[([ xX])\](?:\s+(.*)|\s*)$/);
      if (taskMatch) {
        const indentSpaces = taskMatch[1].length;
        const indentLevel = Math.floor(indentSpaces / 2);
        const isDone = taskMatch[2].toLowerCase() === 'x';
        const taskText = taskMatch[3] || '';
        const lineNum = segStartLine + i;

        elements.push(
          <div
            key={`task-${blockIdx}-${i}`}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              fontSize: '0.84rem',
              margin: '3px 0',
              paddingLeft: indentLevel > 0 ? `${indentLevel * 1.25}rem` : 0,
              lineHeight: '1.5'
            }}
          >
            <button
              type="button"
              onClick={() => onToggleTask && onToggleTask(lineNum, isDone)}
              disabled={!onToggleTask}
              title={onToggleTask ? (isDone ? 'Desmarcar tarea' : 'Marcar tarea como completada') : undefined}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '2px',
                margin: 0,
                borderRadius: '4px',
                cursor: onToggleTask ? 'pointer' : 'default',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDone ? '#10b981' : 'var(--text-muted)',
                transition: 'color 0.15s ease, transform 0.1s ease, background 0.15s ease',
                outline: 'none',
                flexShrink: 0,
                marginTop: '1px'
              }}
              onMouseEnter={(e) => {
                if (onToggleTask) {
                  e.currentTarget.style.color = '#34d399';
                  e.currentTarget.style.transform = 'scale(1.15)';
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (onToggleTask) {
                  e.currentTarget.style.color = isDone ? '#10b981' : 'var(--text-muted)';
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {isDone ? <CheckSquare size={16} /> : <Square size={16} />}
            </button>
            <span
              style={{
                flex: 1,
                textDecoration: isDone ? 'line-through' : 'none',
                color: isDone ? 'var(--text-muted)' : 'var(--text-high)',
                opacity: isDone ? 0.65 : 1,
                transition: 'color 0.15s ease, opacity 0.15s ease'
              }}
            >
              {formatInline(taskText, onNavigateNote)}
            </span>
          </div>
        );
        i++;
        continue;
      }

      // Elementos de lista
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        elements.push(
          <li key={`li-${blockIdx}-${i}`} style={{ fontSize: '0.82rem', color: 'var(--text-high)', marginLeft: '1.25rem', listStyleType: 'disc' }}>
            {formatInline(trimmed.slice(2), onNavigateNote)}
          </li>
        );
        i++;
        continue;
      }

      // Separador horizontal
      if (trimmed === '---' || trimmed === '***') {
        elements.push(<hr key={`hr-${blockIdx}-${i}`} style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '14px 0' }} />);
        i++;
        continue;
      }

      // Línea vacía
      if (!trimmed) {
        elements.push(<div key={`sp-${blockIdx}-${i}`} style={{ height: '6px' }} />);
        i++;
        continue;
      }

      // Párrafo estándar
      elements.push(
        <p key={`p-${blockIdx}-${i}`} style={{ margin: '2px 0', fontSize: '0.82rem', lineHeight: '1.6', color: 'var(--text-high)' }}>
          {formatInline(line, onNavigateNote)}
        </p>
      );
      i++;
    }

    return (
      <div key={`text-${blockIdx}`} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {elements}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
      {frontmatter && <FrontmatterCard frontmatter={frontmatter} onTagClick={onTagClick} />}
      {segments.map((seg, idx) => {
        if (seg.type === 'mermaid') {
          return <MermaidRenderer key={`mermaid-${idx}`} chart={seg.code} />;
        }

        if (seg.type === 'code') {
          const isCopied = copiedIndex === idx;
          return (
            <div key={`code-${idx}`} style={{
              background: '#0a0d0c',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              margin: '0.5rem 0'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 10px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderBottom: '1px solid var(--border-color)',
                fontSize: '0.68rem',
                color: 'var(--text-muted)'
              }}>
                <span style={{ fontWeight: 600, textTransform: 'uppercase' }}>{seg.lang || 'code'}</span>
                <button
                  onClick={() => handleCopy(seg.code, idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'transparent',
                    border: 'none',
                    color: isCopied ? '#34d399' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.65rem'
                  }}
                >
                  {isCopied ? <Check size={12} /> : <Copy size={12} />}
                  <span>{isCopied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
              <pre style={{
                margin: 0,
                padding: '0.85rem',
                overflowX: 'auto',
                fontSize: '0.78rem',
                fontFamily: 'monospace',
                lineHeight: '1.5',
                color: '#e2e8f0'
              }}>
                {seg.code}
              </pre>
            </div>
          );
        }

        return renderTextSegment(seg, idx);
      })}
    </div>
  );
}

// Formateo en línea: negritas (**), código (`), y enlaces wiki Obsidian [[Nota]]
function formatInline(str, onNavigateNote) {
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
