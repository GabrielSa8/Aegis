import { useState, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Check, FileCode, GitCompare, Share2, X } from 'lucide-react';
import MermaidInteractiveCanvas from './MermaidInteractiveCanvas';
import { DiffBlock, CodeBlock } from '../markdown';

function ArtifactDrawerModal({ isOpen, onClose, artifact }) {
  const [copied, setCopied] = useState(false);

  // Escucha global de teclado (Esc para salir instantáneamente)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !artifact) return null;

  const { type, content, lang, title } = artifact;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getHeaderIcon = () => {
    if (type === 'mermaid') return <Share2 size={15} color="var(--primary)" />;
    if (type === 'diff') return <GitCompare size={15} color="var(--primary)" />;
    return <FileCode size={15} color="var(--primary)" />;
  };

  const getTitle = () => {
    if (title) return title;
    if (type === 'mermaid') return 'DIAGRAMA MERMAID';
    if (type === 'diff') return 'AUDITOR DE DIFF GIT';
    return `INSPECTOR DE CÓDIGO (${(lang || 'TEXT').toUpperCase()})`;
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'var(--bg-main, #0f1211)',
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        animation: 'fadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Barra de Mando Flotante Superior (Dynamic Island Style) */}
      <div
        style={{
          position: 'absolute',
          top: '14px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '6px 14px',
          background: 'color-mix(in srgb, var(--bg-card) 96%, black)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-full, 9999px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 1px var(--primary)',
          zIndex: 100,
          maxWidth: '92vw'
        }}
      >
        {/* Identificador del artefacto */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {getHeaderIcon()}
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--text-high)',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap'
            }}
          >
            {getTitle()}
          </span>
        </div>

        <div style={{ width: '1px', height: '16px', background: 'var(--border-color)' }} />

        {/* Acciones principales */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
              border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
              borderRadius: 'var(--radius-full, 9999px)',
              color: copied ? 'var(--primary)' : 'var(--text-high)',
              cursor: 'pointer',
              fontSize: '0.68rem',
              fontWeight: 600,
              transition: 'all 0.15s ease'
            }}
            title="Copiar contenido al portapapeles"
          >
            {copied ? <Check size={12} color="var(--primary)" /> : <Copy size={12} />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>

          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              background: 'color-mix(in srgb, var(--border-color) 40%, transparent)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-full, 9999px)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.68rem',
              fontWeight: 500,
              transition: 'all 0.15s ease'
            }}
            title="Cerrar lienzo (Esc)"
          >
            <X size={12} />
            <kbd
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.6rem',
                padding: '1px 4px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-high)'
              }}
            >
              Esc
            </kbd>
          </button>
        </div>
      </div>

      {/* Superficie 100% Viewport: Lienzo infinito para Mermaid o Visualizador Ancho para Diff/Code */}
      <div
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          overflow: type === 'mermaid' ? 'hidden' : 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {type === 'mermaid' && (
          <MermaidInteractiveCanvas chart={content} />
        )}

        {type === 'diff' && (
          <div
            style={{
              maxWidth: '1350px',
              width: '100%',
              margin: '0 auto',
              padding: '4.5rem 1.5rem 2rem 1.5rem'
            }}
          >
            <DiffBlock code={content} />
          </div>
        )}

        {type === 'code' && (
          <div
            style={{
              maxWidth: '1350px',
              width: '100%',
              margin: '0 auto',
              padding: '4.5rem 1.5rem 2rem 1.5rem'
            }}
          >
            <CodeBlock code={content} lang={lang} />
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default memo(ArtifactDrawerModal);
