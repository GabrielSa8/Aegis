import { useState, useMemo } from 'react';
import MermaidRenderer from './MermaidRenderer';
import ArtifactDrawerModal from './agent/ArtifactDrawerModal';
import {
  parseFrontmatter,
  formatInline,
  FrontmatterCard,
  CalloutCard,
  CodeBlock,
  DiffBlock,
  StepsBlock,
  MarkdownTable,
  TaskCheckboxItem
} from './markdown';

export default function MarkdownViewer({ content, onNavigateNote, onToggleTask, onTagClick }) {
  const [activeArtifact, setActiveArtifact] = useState(null);
  const { frontmatter, content: cleanContent } = useMemo(() => parseFrontmatter(content), [content]);

  // Desglosar contenido en bloques (código vs mermaid vs texto regular)
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
      } else if (lang === 'diff') {
        result.push({
          type: 'diff',
          code,
          startIndex: match.index
        });
      } else if (lang === 'steps' || lang === 'timeline' || lang === 'plan') {
        result.push({
          type: 'steps',
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
            borderLeft: '3px solid var(--primary)',
            background: 'color-mix(in srgb, var(--primary) 8%, transparent)',
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
          <TaskCheckboxItem
            key={`task-${blockIdx}-${i}`}
            taskText={taskText}
            isDone={isDone}
            indentLevel={indentLevel}
            lineNum={lineNum}
            onToggleTask={onToggleTask}
            onNavigateNote={onNavigateNote}
          />
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

      // Tablas Markdown GFM (| ... |)
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const tableLines = [];
        const tableStartIdx = i;
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableLines.push(lines[i].trim());
          i++;
        }

        if (tableLines.length >= 2) {
          elements.push(
            <MarkdownTable
              key={`tbl-${blockIdx}-${tableStartIdx}`}
              tableLines={tableLines}
              onNavigateNote={onNavigateNote}
            />
          );
          continue;
        } else {
          i = tableStartIdx;
        }
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
          return <MermaidRenderer key={`mermaid-${idx}`} chart={seg.code} onExpand={setActiveArtifact} />;
        }

        if (seg.type === 'diff') {
          return <DiffBlock key={`diff-${idx}`} code={seg.code} onExpand={setActiveArtifact} />;
        }

        if (seg.type === 'steps') {
          return <StepsBlock key={`steps-${idx}`} code={seg.code} />;
        }

        if (seg.type === 'code') {
          return (
            <CodeBlock
              key={`code-${idx}`}
              code={seg.code}
              lang={seg.lang}
              onExpand={setActiveArtifact}
            />
          );
        }

        return renderTextSegment(seg, idx);
      })}

      {/* Drawer / Modal Flotante de Artefactos (Fase 1.3) */}
      <ArtifactDrawerModal
        isOpen={Boolean(activeArtifact)}
        onClose={() => setActiveArtifact(null)}
        artifact={activeArtifact}
      />
    </div>
  );
}
