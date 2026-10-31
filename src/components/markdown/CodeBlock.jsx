import { useState, memo } from 'react';
import { Copy, Check, Maximize2 } from 'lucide-react';

function CodeBlock({ code, lang, onExpand }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      background: 'var(--bg-main, #0f1211)',
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
        <span style={{ fontWeight: 600, textTransform: 'uppercase' }}>{lang || 'code'}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'transparent',
              border: 'none',
              color: copied ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.65rem'
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>

          {onExpand && (
            <button
              onClick={() => onExpand({ type: 'code', content: code, lang, title: `Código: ${lang || 'raw'}` })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '2px 5px',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.65rem'
              }}
              title="Expandir código a pantalla completa (Esc)"
            >
              <Maximize2 size={11} color="var(--primary)" />
            </button>
          )}
        </div>
      </div>
      <pre style={{
        margin: 0,
        padding: '0.85rem',
        overflowX: 'auto',
        fontSize: '0.78rem',
        fontFamily: 'monospace',
        lineHeight: '1.5',
        color: 'var(--text-high)'
      }}>
        {code}
      </pre>
    </div>
  );
}

export default memo(CodeBlock);
