import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

// Inicialización de Mermaid con el tema Nordic Slate & Moss
let isInitialized = false;

function initMermaid() {
  if (isInitialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: {
      darkMode: true,
      background: '#131716',
      mainBkg: '#1b2220',
      primaryColor: '#1b2220',
      primaryTextColor: '#e2e8f0',
      primaryBorderColor: 'rgba(16, 185, 129, 0.5)',
      lineColor: '#34d399',
      secondaryColor: '#17201d',
      tertiaryColor: '#0f1211',
      nodeBorder: '#10b981',
      clusterBkg: '#131816',
      clusterBorder: 'rgba(16, 185, 129, 0.3)',
      titleColor: '#34d399',
      edgeLabelBackground: '#131716',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '13px'
    },
    securityLevel: 'loose',
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: 'basis'
    }
  });
  isInitialized = true;
}

export default function MermaidRenderer({ chart }) {
  const containerRef = useRef(null);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initMermaid();
    let isMounted = true;

    const renderChart = async () => {
      if (!chart || !chart.trim()) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const uniqueId = 'mermaid_' + Math.random().toString(36).substring(2, 9);
        const { svg: renderedSvg } = await mermaid.render(uniqueId, chart.trim());
        if (isMounted) {
          setSvg(renderedSvg);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error renderizando Mermaid:', err);
        if (isMounted) {
          setError(String(err));
          setLoading(false);
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (loading) {
    return (
      <div style={{
        padding: '1.25rem',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(0, 0, 0, 0.2)',
        border: '1px solid var(--border-color)',
        color: 'var(--text-muted)',
        fontSize: '0.75rem',
        textAlign: 'center',
        margin: '0.75rem 0'
      }}>
        Renderizando diagrama táctico...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '0.85rem',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        color: '#f87171',
        fontSize: '0.75rem',
        margin: '0.75rem 0'
      }}>
        <div style={{ fontWeight: 700, marginBottom: '4px' }}>⚠️ Error en sintaxis del diagrama Mermaid</div>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', opacity: 0.8 }}>
          {chart}
        </pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: svg }}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '1.25rem',
        background: 'rgba(0, 0, 0, 0.25)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        margin: '1rem 0',
        overflowX: 'auto',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
      }}
    />
  );
}
