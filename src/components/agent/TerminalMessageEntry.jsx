import { memo, useMemo } from 'react';
import { Check, Copy, ShieldAlert, Coins } from 'lucide-react';
import MarkdownViewer from '../MarkdownViewer';
import ThoughtAccordion from './ThoughtAccordion';
import { parseThoughtBlocks, renderAsciiProgress } from './agentHelpers';
import { UsageQuotaCard, ModelInspectionCard, CreditsCard, SkillsCard, CortexCard } from './cards';
import { useSmoothStream } from './useSmoothStream';
import { isPayPerTokenProvider, calculateTokenCostUsd, formatUsdCost } from './pricingModels';

function TerminalMessageEntry({
  message: m,
  operatorName,
  expandThoughts,
  copiedId,
  onCopy,
  onPermissionResponse,
  loadingProgress,
  onSelectModel,
  agentType,
  activeModel
}) {
  const isUser = m.role === 'user';
  const isStreaming = Boolean(!isUser && m.loading);

  // Suavizado dinámico de la respuesta mediante interpolación líquida rAF
  const smoothContent = useSmoothStream(m.content, isStreaming);

  const { thoughts, cleanContent, activeSkills = [] } = !isUser
    ? parseThoughtBlocks(smoothContent)
    : { thoughts: '', cleanContent: m.content, activeSkills: [] };

  // Telemetría financiera táctica: solo para proveedores con API de pago por token
  const costTelemetry = useMemo(() => {
    if (isUser || !isPayPerTokenProvider(agentType)) return null;

    const inTk = m.inputTokens || (m.totalTokens ? Math.round(m.totalTokens * 0.75) : 0);
    const outTk = m.outputTokens || (m.totalTokens ? Math.round(m.totalTokens * 0.25) : 0);
    const totalTk = m.totalTokens || (inTk + outTk);

    if (totalTk <= 0) return null;

    const costUsd = calculateTokenCostUsd(agentType, activeModel, inTk, outTk);
    const formattedCost = formatUsdCost(costUsd);

    return {
      totalTk,
      inTk,
      outTk,
      costUsd,
      formattedCost
    };
  }, [isUser, agentType, activeModel, m.totalTokens, m.inputTokens, m.outputTokens]);

  return (
    <div className={`zen-stream-entry ${isUser ? 'is-user' : 'is-assistant'}`}>
      {/* Gutter lateral: Timestamp + Glifo de actor */}
      <div className="zen-gutter">
        <span className="zen-gutter-time">{m.timestamp || '--:--'}</span>
        <span className="zen-gutter-glyph">
          {isUser ? '❯' : '◈'}
        </span>
      </div>

      {/* Contenido principal del flujo */}
      <div className="zen-entry-main">
        {/* Línea de invocación minimalista */}
        <div className="zen-entry-meta">
          <span className="zen-meta-actor">
            {isUser ? (operatorName || 'OPERADOR').toLowerCase() : 'aegis'}
          </span>

          {m.context && (
            <span className="zen-meta-tag">
              @{m.context.toLowerCase()}
            </span>
          )}

          {!isUser && m.effort && (
            <span className="zen-meta-tag zen-tag-effort">
              {m.effort === 'high' ? 'profundo' : 'flash'}
            </span>
          )}

          {!isUser &&
            activeSkills.map((sk) => (
              <span
                key={sk.name}
                className="zen-meta-tag"
                title={
                  sk.read
                    ? `Skill activa y leída (SKILL.md aplicado): ${sk.name}`
                    : `Skill disponible en el perfil de contexto: ${sk.name}`
                }
                style={{
                  color: sk.read ? 'var(--primary)' : 'var(--text-muted)',
                  borderColor: sk.read
                    ? 'color-mix(in srgb, var(--primary) 45%, transparent)'
                    : 'var(--border-color)',
                  background: sk.read
                    ? 'color-mix(in srgb, var(--primary) 12%, transparent)'
                    : 'transparent',
                  fontWeight: sk.read ? 700 : 500
                }}
              >
                🧩 {sk.name}{sk.read ? ' ✓' : ''}
              </span>
            ))}

          {!isUser && (
            <span className={`zen-meta-status ${m.isError ? 'status-err' : m.loading ? 'status-run' : 'status-ok'}`}>
              {m.isError ? 'err' : m.loading ? 'run' : 'ok'}
            </span>
          )}

          {/* Telemetría financiera en vivo (exclusiva para APIs de pago por token) */}
          {!isUser && costTelemetry && costTelemetry.formattedCost && (
            <span
              className="zen-meta-tag"
              title={`Consumo Facturable: ${costTelemetry.totalTk.toLocaleString()} tokens (${costTelemetry.inTk.toLocaleString()} in | ${costTelemetry.outTk.toLocaleString()} out) · Costo estimado: $${costTelemetry.costUsd.toFixed(5)} USD`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                color: 'var(--accent, #38bdf8)',
                borderColor: 'color-mix(in srgb, var(--accent, #38bdf8) 40%, transparent)',
                background: 'color-mix(in srgb, var(--accent, #38bdf8) 12%, transparent)',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.66rem',
                fontWeight: 700,
                letterSpacing: '0.02em',
                padding: '1px 6px'
              }}
            >
              <Coins size={10} color="currentColor" />
              <span>{costTelemetry.formattedCost}</span>
            </span>
          )}

          {/* Acción rápida de copiado sutil */}
          {!isUser && m.content && (
            <button
              onClick={() => onCopy(cleanContent || m.content, m.id)}
              className="zen-copy-action"
              title="Copiar respuesta"
            >
              {copiedId === m.id ? <Check size={11} color="var(--primary)" /> : <Copy size={11} />}
            </button>
          )}
        </div>

        {/* Cuerpo del contenido estructurado con árbol guía */}
        <div className="zen-entry-body">
          {/* Pensamiento y herramientas en árbol colapsable */}
          {!isUser && thoughts ? (
            <div className="zen-sub-tree">
              <ThoughtAccordion thoughts={thoughts} defaultOpen={expandThoughts} />
            </div>
          ) : null}

          {/* Tarjeta de permiso interactiva si aplica */}
          {!isUser && m.permissionPrompt && (
            <div className="zen-permission-card">
              <div className="zen-permission-title">
                <ShieldAlert size={13} color="var(--warning)" />
                <span>Permiso requerido para ejecución</span>
              </div>
              <p className="zen-permission-text">{m.permissionPrompt}</p>
              <div className="zen-permission-actions">
                <button
                  onClick={() => onPermissionResponse(m.id, 'y')}
                  className="zen-btn-confirm"
                >
                  <span>Permitir</span>
                  <kbd className="tactical-kbd">↵</kbd>
                </button>
                <button
                  onClick={() => onPermissionResponse(m.id, 'n')}
                  className="zen-btn-deny"
                >
                  <span>Cancelar</span>
                  <kbd className="tactical-kbd">Esc</kbd>
                </button>
              </div>
            </div>
          )}

          {/* Renderizado de tarjetas especializadas del proveedor */}
          {!isUser && m.cardType === 'usage' && (
            <UsageQuotaCard cardData={m.cardData} />
          )}

          {!isUser && m.cardType === 'model' && (
            <ModelInspectionCard cardData={m.cardData} onSelectModel={onSelectModel} />
          )}

          {!isUser && m.cardType === 'credits' && (
            <CreditsCard cardData={m.cardData} />
          )}

          {!isUser && m.cardType === 'skills' && (
            <SkillsCard cardData={m.cardData} />
          )}

          {!isUser && m.cardType === 'cortex' && (
            <CortexCard cardData={m.cardData} />
          )}

          {/* Barra de progreso de inferencia durante ejecución */}
          {!isUser && m.loading && (
            <div className="zen-running-progress">
              <div className="zen-progress-status">
                <span className="zen-status-pulse"></span>
                <span>{m.statusText || 'Procesando instrucción...'}</span>
                {loadingProgress > 0 && <span className="zen-percent">{loadingProgress}%</span>}
              </div>
              <div className="zen-ascii-bar">
                {renderAsciiProgress(loadingProgress)}
              </div>
            </div>
          )}

          {/* Texto / Markdown de la instrucción o respuesta con cursor líquido */}
          {cleanContent && (
            <div className={`zen-text-content ${isUser ? 'zen-user-text' : 'zen-assistant-text'}`}>
              {isUser ? (
                <div className="zen-prompt-raw">{cleanContent}</div>
              ) : (
                <div className="zen-markdown-wrapper">
                  <MarkdownViewer content={cleanContent} />
                  {isStreaming && (
                    <span className="zen-cursor-caret" title="Transmitiendo...">
                      ▊
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(TerminalMessageEntry);
