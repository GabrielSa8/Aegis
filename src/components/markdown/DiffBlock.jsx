import { useState, useMemo, memo } from 'react';
import { Copy, Check, GitCommit, FileCode, Plus, Minus, Maximize2 } from 'lucide-react';

function DiffBlock({ code, onExpand }) {
  const [copiedDiff, setCopiedDiff] = useState(false);
  const [copiedNewCode, setCopiedNewCode] = useState(false);

  // Parsear líneas del diff, extrayendo métricas y metadatos del archivo
  const { fileName, lines, stats } = useMemo(() => {
    if (!code) return { fileName: null, lines: [], stats: { added: 0, removed: 0 } };

    const rawLines = code.split('\n');
    let detectedFile = null;
    let addedCount = 0;
    let removedCount = 0;

    const parsed = rawLines.map((line, idx) => {
      // Detección de ruta de archivo
      if (line.startsWith('+++ b/') || line.startsWith('+++ ')) {
        detectedFile = line.replace(/^\+\+\+\s+(b\/)?/, '').trim();
      } else if (!detectedFile && (line.startsWith('--- a/') || line.startsWith('--- '))) {
        detectedFile = line.replace(/^---\s+(a\/)?/, '').trim();
      } else if (!detectedFile && line.startsWith('diff --git')) {
        const parts = line.split(' ');
        if (parts[3]) detectedFile = parts[3].replace(/^b\//, '');
      }

      // Clasificación de línea
      if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('diff --git') || line.startsWith('index ')) {
        return { type: 'meta', text: line, id: idx };
      }
      if (line.startsWith('@@')) {
        return { type: 'hunk', text: line, id: idx };
      }
      if (line.startsWith('+')) {
        addedCount++;
        return { type: 'add', text: line, id: idx };
      }
      if (line.startsWith('-')) {
        removedCount++;
        return { type: 'del', text: line, id: idx };
      }
      return { type: 'context', text: line, id: idx };
    });

    return {
      fileName: detectedFile,
      lines: parsed,
      stats: { added: addedCount, removed: removedCount }
    };
  }, [code]);

  // Copiar el diff completo
  const handleCopyDiff = () => {
    navigator.clipboard.writeText(code);
    setCopiedDiff(true);
    setTimeout(() => setCopiedDiff(false), 2000);
  };

  // Copiar solo el código nuevo resultante (+ y contexto)
  const handleCopyNewCode = () => {
    const newCode = lines
      .filter((l) => l.type === 'add' || l.type === 'context')
      .map((l) => (l.type === 'add' ? l.text.slice(1) : l.text))
      .join('\n');

    navigator.clipboard.writeText(newCode);
    setCopiedNewCode(true);
    setTimeout(() => setCopiedNewCode(false), 2000);
  };

  return (
    <div
      style={{
        background: 'var(--bg-main, #0f1211)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        margin: '0.75rem 0',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
      }}
    >
      {/* Cabecera del Diff con archivo, métricas y acciones */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          background: 'color-mix(in srgb, var(--bg-card) 90%, transparent)',
          borderBottom: '1px solid var(--border-color)',
          fontSize: '0.72rem',
          gap: '8px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {fileName ? (
            <FileCode size={13} color="var(--primary)" />
          ) : (
            <GitCommit size={13} color="var(--primary)" />
          )}
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 600,
              color: 'var(--text-high)'
            }}
          >
            {fileName || 'DIFF PATCH'}
          </span>

          {/* Badges de agregados y eliminados */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
            {stats.added > 0 && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                  background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
                  color: 'var(--primary)',
                  fontSize: '0.65rem',
                  fontWeight: 700
                }}
              >
                <Plus size={10} />
                {stats.added}
              </span>
            )}
            {stats.removed > 0 && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                  background: 'color-mix(in srgb, var(--danger) 15%, transparent)',
                  color: 'var(--danger)',
                  fontSize: '0.65rem',
                  fontWeight: 700
                }}
              >
                <Minus size={10} />
                {stats.removed}
              </span>
            )}
          </div>
        </div>

        {/* Acciones de copiado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={handleCopyNewCode}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 7px',
              background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--primary) 25%, transparent)',
              borderRadius: 'var(--radius-sm)',
              color: copiedNewCode ? 'var(--primary)' : 'var(--text-high)',
              cursor: 'pointer',
              fontSize: '0.65rem',
              fontWeight: 500
            }}
            title="Copiar solo líneas agregadas y contexto"
          >
            {copiedNewCode ? <Check size={11} /> : <Copy size={11} />}
            <span>{copiedNewCode ? 'Código nuevo copiado' : 'Copiar nuevo'}</span>
          </button>

          <button
            onClick={handleCopyDiff}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 7px',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: copiedDiff ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.65rem'
            }}
            title="Copiar diff completo"
          >
            {copiedDiff ? <Check size={11} /> : <Copy size={11} />}
            <span>{copiedDiff ? 'Diff copiado' : 'Diff'}</span>
          </button>

          {onExpand && (
            <button
              onClick={() => onExpand({ type: 'diff', content: code, title: fileName ? `Diff: ${fileName}` : 'Parche Diff' })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '3px 6px',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.65rem'
              }}
              title="Expandir a pantalla completa (Esc)"
            >
              <Maximize2 size={11} color="var(--primary)" />
            </button>
          )}
        </div>
      </div>

      {/* Visor de líneas con colores semánticos */}
      <pre
        style={{
          margin: 0,
          padding: '0.5rem 0',
          overflowX: 'auto',
          fontSize: '0.74rem',
          fontFamily: 'var(--font-mono, monospace)',
          lineHeight: '1.45',
          background: 'transparent'
        }}
      >
        {lines.map((l) => {
          let lineBg = 'transparent';
          let textColor = 'var(--text-high)';
          let borderLeft = '3px solid transparent';
          let signColor = 'var(--text-muted)';

          if (l.type === 'add') {
            lineBg = 'color-mix(in srgb, var(--primary) 12%, transparent)';
            textColor = 'color-mix(in srgb, var(--primary) 90%, white)';
            borderLeft = '3px solid var(--primary)';
            signColor = 'var(--primary)';
          } else if (l.type === 'del') {
            lineBg = 'color-mix(in srgb, var(--danger) 14%, transparent)';
            textColor = 'color-mix(in srgb, var(--danger) 85%, white)';
            borderLeft = '3px solid var(--danger)';
            signColor = 'var(--danger)';
          } else if (l.type === 'hunk') {
            lineBg = 'color-mix(in srgb, var(--border-color) 40%, transparent)';
            textColor = 'color-mix(in srgb, var(--primary) 65%, var(--text-muted))';
            borderLeft = '3px solid color-mix(in srgb, var(--primary) 40%, transparent)';
          } else if (l.type === 'meta') {
            textColor = 'var(--text-muted)';
          }

          return (
            <div
              key={l.id}
              style={{
                display: 'flex',
                background: lineBg,
                borderLeft,
                padding: '1px 12px',
                minWidth: 'max-content'
              }}
            >
              <span
                style={{
                  width: '18px',
                  userSelect: 'none',
                  color: signColor,
                  fontWeight: l.type === 'add' || l.type === 'del' ? 700 : 400
                }}
              >
                {l.type === 'add' ? '+' : l.type === 'del' ? '-' : l.type === 'hunk' ? '@@' : ' '}
              </span>
              <span style={{ color: textColor, whiteSpace: 'pre' }}>
                {l.type === 'add' || l.type === 'del' ? l.text.slice(1) : l.text}
              </span>
            </div>
          );
        })}
      </pre>
    </div>
  );
}

export default memo(DiffBlock);
