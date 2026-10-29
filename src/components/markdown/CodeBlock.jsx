import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
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
        <span style={{ fontWeight: 600, textTransform: 'uppercase' }}>{lang || 'code'}</span>
        <button
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'transparent',
            border: 'none',
            color: copied ? '#34d399' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.65rem'
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? 'Copiado' : 'Copiar'}</span>
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
        {code}
      </pre>
    </div>
  );
}
