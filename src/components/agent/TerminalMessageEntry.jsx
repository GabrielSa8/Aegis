import { Check, Copy, ShieldAlert, Cpu, Clock } from 'lucide-react';
import MarkdownViewer from '../MarkdownViewer';
import ThoughtAccordion from './ThoughtAccordion';
import { parseThoughtBlocks, renderAsciiProgress } from './agentHelpers';

export default function TerminalMessageEntry({
  message: m,
  operatorName,
  expandThoughts,
  copiedId,
  onCopy,
  onPermissionResponse,
  loadingProgress
}) {
  const isUser = m.role === 'user';
  const { thoughts, cleanContent } = !isUser ? parseThoughtBlocks(m.content) : { thoughts: '', cleanContent: m.content };

  return (
    <div className="terminal-stream-entry">
      {/* Terminal Stream Header */}
      <div className="terminal-stream-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontWeight: 700,
            color: isUser ? 'var(--text-high)' : 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ color: 'var(--primary)', fontWeight: 800 }}>&gt;</span>
            <span>[{isUser ? `OPERADOR · ${(operatorName || 'DEFAULT').toUpperCase()}` : 'AEGIS COPILOT'}]</span>
          </span>

          {m.context && (
            <span style={{
              fontSize: '0.62rem',
              padding: '1px 6px',
              borderRadius: '3px',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              📂 {m.context}
            </span>
          )}

          {!isUser && (
            <span style={{
              fontSize: '0.62rem',
              padding: '1px 6px',
              borderRadius: '3px',
              background: m.effort === 'high' ? 'color-mix(in srgb, var(--primary) 15%, transparent)' : 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-color)',
              color: m.effort === 'high' ? 'var(--primary)' : 'var(--text-muted)'
            }}>
              {m.effort === 'high' ? '🧠 PROFUNDO' : '⚡ FLASH'}
            </span>
          )}

          {!isUser && (
            <span style={{
              fontSize: '0.62rem',
              padding: '1px 6px',
              borderRadius: '3px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              background: m.isError 
                ? 'rgba(239, 68, 68, 0.15)' 
                : m.loading 
                  ? 'color-mix(in srgb, var(--primary) 15%, transparent)' 
                  : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${m.isError ? 'var(--danger)' : m.loading ? 'var(--primary)' : 'var(--border-color)'}`,
              color: m.isError ? 'var(--danger)' : m.loading ? 'var(--primary)' : 'var(--text-muted)'
            }}>
              {m.isError ? '[ ERROR ]' : m.loading ? '[ RUNNING ]' : '[  OK  ]'}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{m.timestamp}</span>
          {!isUser && m.content && (
            <button
              onClick={() => onCopy(cleanContent || m.content, m.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Copiar respuesta"
            >
              {copiedId === m.id ? <Check size={12} color="var(--primary)" /> : <Copy size={12} />}
            </button>
          )}
        </div>
      </div>

      {/* Terminal Stream Body */}
      <div className={`terminal-stream-body ${isUser ? 'user-body' : 'assistant-body'}`}>
        {/* Pensamiento si existe */}
        {!isUser && thoughts ? (
          <ThoughtAccordion thoughts={thoughts} defaultOpen={expandThoughts} />
        ) : null}

        {/* Tarjeta de Permiso Interactivo CLI (Human-in-the-loop) */}
        {!isUser && m.permissionPrompt && (
          <div style={{
            margin: '6px 0',
            padding: '8px 12px',
            background: 'rgba(234, 179, 8, 0.08)',
            border: '1px solid rgba(234, 179, 8, 0.35)',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-mono)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#facc15', fontWeight: 700, fontSize: '0.74rem' }}>
              <ShieldAlert size={14} color="#facc15" />
              <span>[ ⚠️ PERMISO REQUERIDO: EJECUCIÓN CLI ]</span>
            </div>
            <p style={{ margin: '6px 0', fontSize: '0.74rem', color: 'var(--text-high)', whiteSpace: 'pre-wrap' }}>
              {m.permissionPrompt}
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button
                onClick={() => onPermissionResponse(m.id, 'y')}
                className="btn btn-primary"
                style={{ padding: '3px 10px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <span>Permitir</span>
                <kbd className="tactical-kbd">↵</kbd>
              </button>
              <button
                onClick={() => onPermissionResponse(m.id, 'n')}
                className="btn btn-secondary"
                style={{ padding: '3px 10px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <span>Denegar</span>
                <kbd className="tactical-kbd">Esc</kbd>
              </button>
            </div>
          </div>
        )}

        {/* Contenido / Markdown */}
        {isUser ? (
          <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-high)', fontWeight: 500 }}>
            {m.content}
          </div>
        ) : cleanContent ? (
          <>
            <MarkdownViewer content={cleanContent} />
            {m.loading && (
              <span className="terminal-blinking-cursor" style={{ marginLeft: '4px', fontSize: '0.9rem' }}>
                █
              </span>
            )}
          </>
        ) : m.loading ? (
          /* Bloque Terminal de Progreso ASCII + Líquido */
          <div className="terminal-progress-block">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="terminal-blinking-cursor">▶</span>
                <span style={{ color: 'var(--text-high)', fontWeight: 600 }}>
                  {m.statusText || 'Iniciando agente y montando contexto...'}
                </span>
              </div>
              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
                {loadingProgress}%
              </span>
            </div>
            <div className="terminal-ascii-bar">
              &gt; {renderAsciiProgress(loadingProgress, 20)} {loadingProgress}%
            </div>
            <div className="liquid-progress-container" style={{ height: '4px' }}>
              <div className="liquid-progress-fill" style={{ width: `${loadingProgress}%` }}>
                <div className="liquid-progress-shimmer" />
              </div>
            </div>
          </div>
        ) : null}

        {/* Telemetría y Tokens al finalizar */}
        {!isUser && !m.loading && (m.totalTokens || m.duration) && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '8px',
            paddingTop: '4px',
            fontSize: '0.64rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)'
          }}>
            <span>└─</span>
            {m.totalTokens && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Cpu size={11} color="var(--primary)" />
                {m.totalTokens.toLocaleString()} tokens
              </span>
            )}
            {m.duration && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={11} />
                {m.duration.toFixed(1)}s
              </span>
            )}
            {m.totalTokens && m.duration && m.duration > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.8 }}>
                ⚡ {(m.totalTokens / m.duration).toFixed(0)} tok/s
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
