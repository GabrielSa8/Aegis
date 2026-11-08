import { memo, useMemo } from 'react';
import { Sparkles, Shield } from 'lucide-react';

/**
 * Estima tokens de forma heurística para texto en español/código (~3.8 caracteres por token en promedio)
 */
export function estimateTokens(text = '', explicitRefsCount = 0) {
  if (!text && !explicitRefsCount) return 0;
  const rawChars = text.length;
  const baseTokens = Math.ceil(rawChars / 3.8);
  const refTokens = explicitRefsCount * 25;
  return baseTokens + refTokens;
}

/**
 * Simulación ligera en vivo del Router por Paso del Harness Aegis (L1 ⇄ L2 ⇄ L3)
 */
export function computeLiveHarnessRoute(prompt = '') {
  const trimmed = (prompt || '').trim();
  if (!trimmed) return null;

  const segments = [];
  for (const line of trimmed.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('```')) continue;
    if (
      t.length > 5 &&
      (t.startsWith('- ') ||
        t.startsWith('* ') ||
        (/^\d+[.)]\s/.test(t)))
    ) {
      segments.push(t);
    }
  }

  if (segments.length === 0) {
    const parts = trimmed.split(/\s+(?:luego|después|despues|finalmente|y luego)\s+/i);
    for (const p of parts) {
      if (p.trim()) segments.push(p.trim());
    }
  }
  if (segments.length === 0) segments.push(trimmed);

  const classify = (seg) => {
    const low = seg
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    if (
      /arquitectura|architecture|refactor|seguridad|security|concurrencia|deadlock|optimiza|migra|p2p|benchmark|causa raiz|root cause|auditoria|audita|vulnerabilidad|sincronizacion/.test(low) ||
      seg.length > 550
    ) {
      return 'L3';
    }
    if (
      /lista|muestra|lee |formato|traduce|renombra|explica brevemente|resumen|resume|commit|imprime|dime |que es |cual es /.test(low) &&
      !/implementa|crea |construye|corrige|fix|integra|valida|calcula|desarrolla|programa|escribe una prueba|escribe un test|arregla|repara|soluciona|ponle|quitale|cambiale|haz que |no sirve|no funciona|no jala|se traba|se rompe|sale error/.test(low) &&
      seg.length <= 160
    ) {
      return 'L1';
    }
    if (
      /implementa|crea |construye|componente|endpoint|test|prueba|funcion|hook|sql|query|corrige|fix|bug|integra|logica|modal|valida|calcula|handler|arregla|repara|soluciona|ponle|quitale|cambiale|modificale|agregale|haz que |hacer que |no sirve|no funciona|no jala|no anda|se traba|se rompe|se cierra|no carga|no guarda|sale error|me da error|tiene un fallo|esta roto/.test(low) ||
      seg.length > 160
    ) {
      return 'L2';
    }
    return 'L1';
  };

  const badges = segments.slice(0, 5).map((s, idx) => ({
    step: idx + 1,
    badge: classify(s)
  }));

  const routeLabel =
    badges.length === 1
      ? `Nivel ${badges[0].badge} (${badges[0].badge === 'L1' ? 'Flash' : badges[0].badge === 'L2' ? 'Balanceado' : 'Profundo'})`
      : badges.map((b) => `P${b.step}:${b.badge}`).join(' ⇄ ');

  return { badges, routeLabel };
}

/**
 * Detecta si el modelo activo es pesado/profundo y el prompt es trivial
 */
export function checkEfficiencyHint(prompt = '', activeModel = '', effectiveEffort = 'low') {
  if (effectiveEffort === 'auto') return null;
  const modelSafe = typeof activeModel === 'string' ? activeModel : '';
  const trimmed = (prompt || '').trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const isHeavyModel =
    effectiveEffort === 'high' ||
    /argon|opus|pro/i.test(modelSafe) ||
    (modelSafe.endsWith('-high') && !modelSafe.includes('flash'));

  const isTrivial = wordCount > 0 && wordCount <= 7 && !trimmed.includes('\n') && !trimmed.includes('{') && !trimmed.includes('@');

  if (isHeavyModel && isTrivial) {
    return {
      suggestFlash: true,
      reason: 'Prompt corto para un modelo profundo. Flash o Auto Harness responden más rápido y ahorran cuota.'
    };
  }
  return null;
}

function PromptTelemetryBadge({
  prompt = '',
  explicitRefsCount = 0,
  activeModel = '',
  effectiveEffort = 'auto',
  onSwitchToFlash
}) {
  const chars = prompt.length;
  const tokens = estimateTokens(prompt, explicitRefsCount);
  const hint = checkEfficiencyHint(prompt, activeModel, effectiveEffort);
  const harnessRoute = useMemo(
    () => (effectiveEffort === 'auto' ? computeLiveHarnessRoute(prompt) : null),
    [prompt, effectiveEffort]
  );

  if (chars === 0 && explicitRefsCount === 0) return null;

  return (
    <div
      className="prompt-telemetry-badge-container"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '0 4px',
        fontSize: '0.62rem',
        color: 'var(--text-muted)',
        userSelect: 'none'
      }}
    >
      {harnessRoute && (
        <div
          title="Aegis Adaptive Harness: Ruta de niveles detectada por paso + Poda ACI + Caché KV"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm, 4px)',
            background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
            border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
            color: 'var(--primary)',
            fontFamily: 'monospace',
            fontWeight: 600
          }}
        >
          <Shield size={10} />
          <span>Harness: {harnessRoute.routeLabel}</span>
        </div>
      )}

      {hint && (
        <div
          title={hint.reason}
          onClick={onSwitchToFlash}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm, 4px)',
            background: 'color-mix(in srgb, var(--warning) 12%, transparent)',
            border: '1px solid color-mix(in srgb, var(--warning) 30%, transparent)',
            color: 'var(--warning)',
            cursor: onSwitchToFlash ? 'pointer' : 'default',
            transition: 'all 0.15s ease'
          }}
        >
          <Sparkles size={10} />
          <span>Optimizar con Flash</span>
        </div>
      )}

      <span
        style={{
          fontFamily: 'monospace',
          letterSpacing: '0.02em',
          opacity: 0.8
        }}
      >
        ~{tokens} tokens · {chars} chars
      </span>
    </div>
  );
}

export default memo(PromptTelemetryBadge);
