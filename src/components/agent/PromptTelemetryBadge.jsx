import { memo } from 'react';
import { Sparkles } from 'lucide-react';

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
 * Detecta si el modelo activo es pesado/profundo y el prompt es trivial
 */
export function checkEfficiencyHint(prompt = '', activeModel = '', effectiveEffort = 'low') {
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
      reason: 'Prompt corto para un modelo profundo. Flash responde más rápido y ahorra cuota.'
    };
  }
  return null;
}

function PromptTelemetryBadge({
  prompt = '',
  explicitRefsCount = 0,
  activeModel = '',
  effectiveEffort = 'low',
  onSwitchToFlash
}) {
  const chars = prompt.length;
  const tokens = estimateTokens(prompt, explicitRefsCount);
  const hint = checkEfficiencyHint(prompt, activeModel, effectiveEffort);

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
