import { useState, useEffect, useRef } from 'react';

/**
 * Hook para suavizar el flujo de texto en tiempo real (fluid typewriter rAF)
 * Cuando 'isStreaming' está activo, el texto se interpola progresivamente
 * en vez de saltar de golpe con cada delta recibido de Rust.
 */
export function useSmoothStream(fullContent = '', isStreaming = false) {
  const [displayedContent, setDisplayedContent] = useState(fullContent);
  const targetContentRef = useRef(fullContent);
  targetContentRef.current = fullContent;
  
  const currentLenRef = useRef(fullContent.length);

  useEffect(() => {
    // Si no está transmitiendo, sincronizar directamente sin delay
    if (!isStreaming) {
      setDisplayedContent(fullContent);
      currentLenRef.current = fullContent.length;
      return;
    }

    let rafId = null;

    const tick = () => {
      const target = targetContentRef.current || '';
      const cur = currentLenRef.current;

      if (cur < target.length) {
        // Calcular ritmo de avance adaptable:
        // Si el buffer acumulado es grande (ej. > 80 caracteres pendientes), acelerar para no atrasarse.
        const pending = target.length - cur;
        const step = pending > 120 ? 8 : pending > 40 ? 4 : pending > 15 ? 2 : 1;
        const nextLen = Math.min(cur + step, target.length);
        
        currentLenRef.current = nextLen;
        setDisplayedContent(target.slice(0, nextLen));
      }

      if (isStreaming || currentLenRef.current < (targetContentRef.current || '').length) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isStreaming, fullContent]);

  return displayedContent;
}
