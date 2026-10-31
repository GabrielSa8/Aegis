import { memo } from 'react';
import { Check, Copy, ShieldAlert } from 'lucide-react';
import MarkdownViewer from '../MarkdownViewer';
import ThoughtAccordion from './ThoughtAccordion';
import { parseThoughtBlocks, renderAsciiProgress } from './agentHelpers';
import { UsageQuotaCard, ModelInspectionCard, CreditsCard, SkillsCard } from './cards';
import { useSmoothStream } from './useSmoothStream';

function TerminalMessageEntry({
  message: m,
  operatorName,
  expandThoughts,
  copiedId,
  onCopy,
  onPermissionResponse,
  loadingProgress,
  onSelectModel
}) {
  const isUser = m.role === 'user';
  const isStreaming = Boolean(!isUser && m.loading);

  // Suavizado dinámico de la respuesta mediante interpolación líquida rAF
  const smoothContent = useSmoothStream(m.content, isStreaming);

  const { thoughts, cleanContent } = !isUser
    ? parseThoughtBlocks(smoothContent)
    : { thoughts: '', cleanContent: m.content };

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

          {!isUser && (
            <span className={`zen-meta-status ${m.isError ? 'status-err' : m.loading ? 'status-run' : 'status-ok'}`}>
              {m.isError ? 'err' : m.loading ? 'run' : 'ok'}
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
