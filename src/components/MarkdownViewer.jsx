import { useMemo, useState } from 'react';
import MermaidRenderer from './MermaidRenderer';
import { Copy, Check, FileText } from 'lucide-react';

export default function MarkdownViewer({ content, onNavigateNote }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Desglosar contenido en bloques (código vs texto regular)
  const segments = useMemo(() => {
    if (!content) return [];

    const result = [];
    const codeBlockRegex = /```([a-zA-Z0-9_\-]+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Texto previo al bloque de código
      if (match.index > lastIndex) {
        result.push({
          type: 'text',
          content: content.slice(lastIndex, match.index)
        });
      }

      const lang = (match[1] || '').trim().toLowerCase();
      const code = match[2];

      if (lang === 'mermaid') {
        result.push({
          type: 'mermaid',
          code
        });
      } else {
        result.push({
          type: 'code',
          lang,
          code
        });
      }

      lastIndex = match.index + match[0].length;
    }

    // Texto restante después del último bloque
    if (lastIndex < content.length) {
      result.push({
        type: 'text',
        content: content.slice(lastIndex)
      });
    }

    return result;
  }, [content]);

  // Formateador de texto Markdown básico (encabezados, negritas, links wiki [[Nota]], listas)
  const renderTextSegment = (textBlock, blockIdx) => {
    const lines = textBlock.split('\n');

    return (
      <div key={`text-${blockIdx}`} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {lines.map((line, lIdx) => {
          const trimmed = line.trim();

          // Encabezados
          if (trimmed.startsWith('# ')) {
            return (
              <h1 key={lIdx} style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-high)', margin: '12px 0 6px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                {trimmed.slice(2)}
              </h1>
            );
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h2 key={lIdx} style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-high)', margin: '14px 0 4px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '4px' }}>
                {trimmed.slice(3)}
              </h2>
            );
          }
          if (trimmed.startsWith('### ')) {
            return (
              <h3 key={lIdx} style={{ fontSize: '0.98rem', fontWeight: 700, color: '#34d399', margin: '10px 0 2px 0' }}>
                {trimmed.slice(4)}
              </h3>
            );
          }

          // Citas
          if (trimmed.startsWith('> ')) {
            return (
              <blockquote key={lIdx} style={{
                margin: '4px 0',
                padding: '6px 12px',
                borderLeft: '3px solid #10b981',
                background: 'rgba(16, 185, 129, 0.05)',
                borderRadius: '0 6px 6px 0',
                color: 'var(--text-muted)',
                fontSize: '0.82rem'
              }}>
                {trimmed.slice(2)}
              </blockquote>
            );
          }

          // Checkboxes de Obsidian
          if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('- [x] ') || trimmed.startsWith('- [X] ')) {
            const isDone = trimmed.startsWith('- [x] ') || trimmed.startsWith('- [X] ');
            const taskText = trimmed.replace(/^-\s*\[[ xX]\]\s*/, '');
            return (
              <div key={lIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', margin: '2px 0' }}>
                <span style={{ color: isDone ? '#10b981' : 'var(--text-muted)', fontWeight: 700 }}>
                  {isDone ? '☑' : '☐'}
                </span>
                <span style={{ textDecoration: isDone ? 'line-through' : 'none', color: isDone ? 'var(--text-muted)' : 'var(--text-high)' }}>
                  {formatInline(taskText, onNavigateNote)}
                </span>
              </div>
            );
          }

          // Elemento de lista estándar
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return (
              <li key={lIdx} style={{ fontSize: '0.82rem', color: 'var(--text-high)', marginLeft: '1.25rem', listStyleType: 'disc' }}>
                {formatInline(trimmed.slice(2), onNavigateNote)}
              </li>
            );
          }

          // Separador horizontal
          if (trimmed === '---' || trimmed === '***') {
            return <hr key={lIdx} style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '14px 0' }} />;
          }

          // Línea vacía
          if (!trimmed) {
            return <div key={lIdx} style={{ height: '6px' }} />;
          }

          // Párrafo estándar
          return (
            <p key={lIdx} style={{ margin: '2px 0', fontSize: '0.82rem', lineHeight: '1.6', color: 'var(--text-high)' }}>
              {formatInline(line, onNavigateNote)}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
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

        return renderTextSegment(seg.content, idx);
      })}
    </div>
  );
}

// Formateo en línea: negritas (**), código (`), y enlaces wiki Obsidian [[Nota]]
function formatInline(str, onNavigateNote) {
  if (!str) return str;

  // Regex combinada para enlaces wiki [[...]], código inline `...`, y negritas **...**
  const tokenRegex = /(\[\[.*?\]\]|`.*?`|\*\*.*?\*\*)/g;
  const parts = str.split(tokenRegex);

  return parts.map((part, i) => {
    if (!part) return null;

    // Enlace tipo Wiki [[Nota]] o [[Nota|Alias]]
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

    // Código en línea `...`
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

    // Negrita **...**
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
