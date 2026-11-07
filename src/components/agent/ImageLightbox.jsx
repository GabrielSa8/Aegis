import { useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ZoomIn, ZoomOut, Maximize, X } from 'lucide-react';

const MIN = 0.1;
const MAX = 8;

const pillStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '5px 10px',
  background: 'color-mix(in srgb, var(--bg-card) 85%, transparent)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-full, 9999px)',
  color: 'var(--text-high)',
  cursor: 'pointer',
  fontSize: '0.7rem'
};

/** Lightbox 100vw×100vh con pan/zoom directo a GPU (refs + RAF, cero re-renders). */
export default function ImageLightbox({ src, alt = '', onClose }) {
  const containerRef = useRef(null);
  const layerRef = useRef(null);
  const labelRef = useRef(null);
  const t = useRef({ x: 0, y: 0, z: 1 });
  const drag = useRef(null);
  const raf = useRef(null);

  const apply = useCallback(() => {
    if (raf.current) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = null;
      const { x, y, z } = t.current;
      if (layerRef.current) layerRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${z})`;
      if (labelRef.current) labelRef.current.textContent = `${Math.round(z * 100)}%`;
    });
  }, []);

  const zoomBy = useCallback((factor, cx = 0, cy = 0) => {
    const cur = t.current;
    const z = Math.min(MAX, Math.max(MIN, cur.z * factor));
    const k = z / cur.z;
    t.current = { x: cx - (cx - cur.x) * k, y: cy - (cy - cur.y) * k, z };
    apply();
  }, [apply]);

  const reset = useCallback(() => {
    t.current = { x: 0, y: 0, z: 1 };
    apply();
  }, [apply]);

  useEffect(() => {
    const el = containerRef.current;
    const onWheel = (e) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === '+' || e.key === '=') zoomBy(1.25);
      else if (e.key === '-') zoomBy(1 / 1.25);
      else if (e.key === '0') reset();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    return () => {
      el.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [zoomBy, reset, onClose]);

  const onPointerDown = (e) => {
    drag.current = { sx: e.clientX, sy: e.clientY, ox: t.current.x, oy: t.current.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    t.current.x = drag.current.ox + e.clientX - drag.current.sx;
    t.current.y = drag.current.oy + e.clientY - drag.current.sy;
    apply();
  };
  const onPointerUp = () => { drag.current = null; };

  return createPortal(
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDoubleClick={reset}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 11000,
        background: 'color-mix(in srgb, var(--bg-main) 97%, black)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        cursor: 'grab',
        touchAction: 'none'
      }}
    >
      <img
        ref={layerRef}
        src={src}
        alt={alt}
        draggable={false}
        style={{ maxWidth: '92vw', maxHeight: '88vh', willChange: 'transform', userSelect: 'none', borderRadius: 'var(--radius-sm, 6px)' }}
      />
      <div
        onPointerDown={(e) => e.stopPropagation()}
        style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, alignItems: 'center' }}
      >
        <button style={pillStyle} onClick={() => zoomBy(1 / 1.25)} title="Alejar (-)"><ZoomOut size={13} /></button>
        <span ref={labelRef} style={{ ...pillStyle, cursor: 'default', minWidth: 52, justifyContent: 'center' }}>100%</span>
        <button style={pillStyle} onClick={() => zoomBy(1.25)} title="Acercar (+)"><ZoomIn size={13} /></button>
        <button style={pillStyle} onClick={reset} title="Ajustar (0 / doble clic)"><Maximize size={13} /></button>
        <button style={pillStyle} onClick={onClose} title="Cerrar (Esc)"><X size={13} /> Esc</button>
      </div>
    </div>,
    document.body
  );
}
