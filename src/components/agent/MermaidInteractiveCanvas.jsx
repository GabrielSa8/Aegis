import { useState, useRef, useEffect, memo, useCallback } from 'react';
import mermaid from 'mermaid';
import { ZoomIn, ZoomOut, RotateCcw, Maximize, Hand } from 'lucide-react';

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

function MermaidInteractiveCanvas({ chart }) {
  const containerRef = useRef(null);
  const layerRef = useRef(null);
  const zoomLabelRef = useRef(null);

  const [svgContent, setSvgContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado mutable en refs para CERO re-renders durante interacción continua (60/120fps direct GPU)
  const transformRef = useRef({ x: 0, y: 0, zoom: 1 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const rafIdRef = useRef(null);

  // Aplicación directa del transform al elemento del DOM por GPU
  const applyTransform = useCallback(() => {
    if (!layerRef.current) return;
    const { x, y, zoom } = transformRef.current;
    layerRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${zoom})`;

    if (zoomLabelRef.current) {
      zoomLabelRef.current.textContent = `${Math.round(zoom * 100)}%`;
    }
  }, []);

  const scheduleUpdate = useCallback(() => {
    if (rafIdRef.current) return;
    rafIdRef.current = requestAnimationFrame(() => {
      applyTransform();
      rafIdRef.current = null;
    });
  }, [applyTransform]);

  // Renderizar SVG con Mermaid
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const renderSvg = async () => {
      try {
        const palette = getThemePalette();
        mermaid.initialize({
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
            fontSize: '13px'
          },
          securityLevel: 'loose',
          flowchart: { useMaxWidth: false, htmlLabels: true, curve: 'basis' }
        });

        const uniqueId = 'canvas_mermaid_' + Math.random().toString(36).substring(2, 9);
        const { svg } = await mermaid.render(uniqueId, chart.trim());

        if (isMounted) {
          // Limpiar restricciones duras de SVG para libre escalabilidad
          const sanitizedSvg = svg.replace(/max-width:\s*[^;"]+;?/gi, '');
          setSvgContent(sanitizedSvg);
          setLoading(false);

          // Resetear transformación inicial
          transformRef.current = { x: 0, y: 0, zoom: 1 };
          requestAnimationFrame(() => applyTransform());
        }
      } catch (err) {
        if (isMounted) {
          setError(String(err));
          setLoading(false);
        }
      }
    };

    renderSvg();
    return () => {
      isMounted = false;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [chart, applyTransform]);

  // Manejo de Zoom con rueda del ratón (React handler + listener nativo para redundancia)
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const current = transformRef.current;
    current.zoom = Math.max(0.15, Math.min(5.0, Number((current.zoom * zoomFactor).toFixed(3))));
    scheduleUpdate();
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheelNative = (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      const current = transformRef.current;
      current.zoom = Math.max(0.15, Math.min(5.0, Number((current.zoom * zoomFactor).toFixed(3))));
      scheduleUpdate();
    };

    container.addEventListener('wheel', onWheelNative, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheelNative);
    };
  }, [loading, scheduleUpdate]);

  // Manejo de Arrastre nativo por puntero
  const handlePointerDown = (e) => {
    if (e.button !== 0) return; // Solo clic primario
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { x: transformRef.current.x, y: transformRef.current.y };

    if (containerRef.current) {
      containerRef.current.style.cursor = 'grabbing';
      containerRef.current.setPointerCapture?.(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    transformRef.current.x = panStartRef.current.x + dx;
    transformRef.current.y = panStartRef.current.y + dy;

    scheduleUpdate();
  };

  const handlePointerUp = (e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab';
      containerRef.current.releasePointerCapture?.(e.pointerId);
    }
  };

  // Botones de acción del HUD
  const handleZoomDelta = (factor) => {
    const current = transformRef.current;
    current.zoom = Math.max(0.15, Math.min(5.0, Number((current.zoom * factor).toFixed(3))));
    scheduleUpdate();
  };

  const handleReset = () => {
    transformRef.current = { x: 0, y: 0, zoom: 1 };
    scheduleUpdate();
  };

  const handleFit = () => {
    transformRef.current = { x: 0, y: 0, zoom: 1.4 };
    scheduleUpdate();
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '520px',
        overflow: 'hidden',
        userSelect: 'none',
        cursor: 'grab',
        touchAction: 'none',
        background: 'var(--bg-main, #0f1211)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* HUD Flotante de Controles */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'color-mix(in srgb, var(--bg-card) 94%, black)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-full, 9999px)',
          padding: '4px 10px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
          zIndex: 10
        }}
      >
        <button
          onClick={() => handleZoomDelta(0.85)}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-high)', cursor: 'pointer', padding: '3px' }}
          title="Alejar"
        >
          <ZoomOut size={14} />
        </button>

        <span
          ref={zoomLabelRef}
          style={{
            fontSize: '0.7rem',
            fontFamily: 'var(--font-mono, monospace)',
            minWidth: '42px',
            textAlign: 'center',
            color: 'var(--primary)',
            fontWeight: 700
          }}
        >
          100%
        </span>

        <button
          onClick={() => handleZoomDelta(1.18)}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-high)', cursor: 'pointer', padding: '3px' }}
          title="Acercar"
        >
          <ZoomIn size={14} />
        </button>

        <div style={{ width: '1px', height: '14px', background: 'var(--border-color)', margin: '0 2px' }} />

        <button
          onClick={handleFit}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '3px' }}
          title="Ajustar tamaño (140%)"
        >
          <Maximize size={14} />
        </button>

        <button
          onClick={handleReset}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '3px' }}
          title="Restablecer (100% centrado)"
        >
          <RotateCcw size={13} />
        </button>
      </div>

      {/* Indicador táctico */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          background: 'color-mix(in srgb, var(--bg-card) 85%, transparent)',
          padding: '3px 8px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid color-mix(in srgb, var(--border-color) 60%, transparent)',
          pointerEvents: 'none',
          zIndex: 10
        }}
      >
        <Hand size={11} color="var(--primary)" />
        <span>Arrastra para mover · Rueda o botones para zoom</span>
      </div>

      {/* Estado de carga */}
      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', zIndex: 5 }}>
          Compilando lienzo interactivo...
        </div>
      )}

      {/* Estado de error */}
      {error && (
        <div style={{ position: 'absolute', inset: 0, padding: '1rem', color: 'var(--danger)', fontSize: '0.8rem', zIndex: 5 }}>
          <b>Error en sintaxis Mermaid:</b>
          <pre style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{chart}</pre>
        </div>
      )}

      {/* Capa Acelerada por GPU (Zero Repaint / Direct DOM Transform) */}
      <div
        ref={layerRef}
        style={{
          transformOrigin: 'center center',
          transform: 'translate3d(0px, 0px, 0) scale(1)',
          willChange: 'transform',
          display: loading ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem'
        }}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    </div>
  );
}

export default memo(MermaidInteractiveCanvas);
