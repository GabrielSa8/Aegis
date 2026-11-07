import { useEffect, useRef, useState, memo } from 'react';
import { Maximize2 } from 'lucide-react';

let mermaidPromise = null;
function getMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((m) => m.default || m);
  }
  return mermaidPromise;
}

function getThemePalette() {
  if (typeof window === 'undefined') {
    return {
      primary: '#10b981',
      bgCard: '#161a19',
      bgMain: '#0f1211',
      textHigh: '#f3f4f6',
      borderColor: '#242b29'
    };
  }

  const styles = getComputedStyle(document.documentElement);
  return {
    primary: styles.getPropertyValue('--primary').trim() || '#10b981',
    bgCard: styles.getPropertyValue('--bg-card').trim() || '#161a19',
    bgMain: styles.getPropertyValue('--bg-main').trim() || '#0f1211',
    textHigh: styles.getPropertyValue('--text-high').trim() || '#f3f4f6',
    borderColor: styles.getPropertyValue('--border-color').trim() || '#242b29'
  };
}

async function configureMermaid(mermaidInstance) {
  const palette = getThemePalette();

  mermaidInstance.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: {
      darkMode: true,
      background: palette.bgMain,
      mainBkg: palette.bgCard,
      primaryColor: palette.bgCard,
      primaryTextColor: palette.textHigh,
      primaryBorderColor: palette.primary,
      lineColor: palette.primary,
      secondaryColor: palette.bgMain,
      tertiaryColor: palette.bgCard,
      nodeBorder: palette.primary,
      clusterBkg: palette.bgMain,
      clusterBorder: palette.borderColor,
      titleColor: palette.primary,
      edgeLabelBackground: palette.bgMain,
      fontFamily: 'var(--font-mono, monospace)',
      fontSize: '12px'
    },
    securityLevel: 'loose',
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: 'basis'
    }
  });
}

function MermaidRenderer({ chart, onExpand }) {
  const containerRef = useRef(null);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    configureMermaid();
    let isMounted = true;

    const renderChart = async () => {
      if (!chart || !chart.trim()) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const mermaid = await getMermaid();
        configureMermaid(mermaid);
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
      <div
        style={{
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(0, 0, 0, 0.2)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
          textAlign: 'center',
          margin: '0.75rem 0'
        }}
      >
        Renderizando diagrama...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '0.85rem',
          borderRadius: 'var(--radius-md)',
          background: 'color-mix(in srgb, var(--danger) 8%, transparent)',
          border: '1px solid color-mix(in srgb, var(--danger) 25%, transparent)',
          color: 'var(--danger)',
          fontSize: '0.75rem',
          margin: '0.75rem 0'
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: '4px' }}>
          ⚠️ Error en sintaxis del diagrama Mermaid
        </div>
        <pre
          style={{
            margin: 0,
            whiteSpace: 'pre-wrap',
            fontFamily: 'var(--font-mono, monospace)',
            opacity: 0.85
          }}
        >
          {chart}
        </pre>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        margin: '1rem 0'
      }}
    >
      {onExpand && (
        <button
          onClick={() => onExpand({ type: 'mermaid', content: chart, title: 'Diagrama Mermaid' })}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            background: 'color-mix(in srgb, var(--bg-card) 90%, transparent)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            fontSize: '0.65rem',
            cursor: 'pointer',
            zIndex: 2,
            transition: 'all 0.15s ease'
          }}
          title="Expandir diagrama a pantalla completa (Esc)"
        >
          <Maximize2 size={11} color="var(--primary)" />
          <span>Expandir</span>
        </button>
      )}

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
          border: '1px solid color-mix(in srgb, var(--primary) 25%, transparent)',
          overflowX: 'auto',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
        }}
      />
    </div>
  );
}

export default memo(MermaidRenderer);
