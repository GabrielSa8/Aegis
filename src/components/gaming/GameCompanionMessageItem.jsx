import React from 'react';
import { Bot, User, Copy, Check, BookmarkPlus, Loader2 } from 'lucide-react';
import MarkdownViewer from '../MarkdownViewer';

export default function GameCompanionMessageItem({
  message,
  copiedId,
  savedId,
  onCopy,
  onSaveToObsidian
}) {
  const isUser = message.role === 'user';
  const isCopied = copiedId === message.id;
  const isSaved = savedId === message.id;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      width: '100%'
    }}>
      {/* Header del Mensaje */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.66rem',
        color: 'var(--text-muted)'
      }}>
        {!isUser && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: 'var(--primary)',
            fontWeight: 700
          }}>
            <Bot size={13} />
            <span>Companion</span>
          </div>
        )}

        {isUser && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: 'var(--accent)',
            fontWeight: 700
          }}>
            <User size={13} />
            <span>Tú</span>
          </div>
        )}

        <span>{message.timestamp}</span>

        {message.quickActionTitle && (
          <span style={{
            padding: '1px 5px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.58rem',
            background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
            color: 'var(--primary)',
            border: '1px solid var(--primary)'
          }}>
            {message.quickActionTitle}
          </span>
        )}
      </div>

      {/* Contenedor del Mensaje */}
      <div style={{
        maxWidth: isUser ? '85%' : '100%',
        padding: '8px 12px',
        borderRadius: 'var(--radius-sm)',
        background: isUser
          ? 'color-mix(in srgb, var(--primary) 12%, var(--bg-card))'
          : 'color-mix(in srgb, var(--bg-card) 95%, black)',
        border: `1px solid ${isUser ? 'color-mix(in srgb, var(--primary) 40%, transparent)' : 'var(--border-color)'}`,
        color: 'var(--text-high)',
        fontSize: '0.78rem',
        lineHeight: '1.45',
        position: 'relative',
        boxShadow: isUser ? 'none' : '0 2px 8px rgba(0,0,0,0.2)'
      }}>
        {isUser ? (
          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {message.content}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {message.loading && !message.content ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-muted)',
                fontSize: '0.72rem',
                padding: '6px 0'
              }}>
                <Loader2 size={14} className="spin" color="var(--primary)" />
                <span>Consultando tácticas y optimización para el juego...</span>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', fontSize: '0.76rem' }}>
                <MarkdownViewer content={message.content} />
              </div>
            )}

            {/* Barra de Acciones del Asistente */}
            {!message.loading && message.content && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '8px',
                marginTop: '6px',
                paddingTop: '6px',
                borderTop: '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)'
              }}>
                <button
                  type="button"
                  onClick={() => onCopy(message.content, message.id)}
                  title="Copiar texto"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: isCopied ? 'var(--primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.64rem',
                    padding: '2px 4px'
                  }}
                >
                  {isCopied ? <Check size={12} /> : <Copy size={12} />}
                  <span>{isCopied ? 'Copiado' : 'Copiar'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSaveToObsidian(message.id, message.content, message.quickActionTitle)}
                  title="Guardar en bitácora de Obsidian"
                  style={{
                    background: isSaved ? 'var(--primary-glow)' : 'transparent',
                    border: '1px solid',
                    borderColor: isSaved ? 'var(--primary)' : 'var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: isSaved ? 'var(--primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.64rem',
                    padding: '2px 6px'
                  }}
                >
                  <BookmarkPlus size={12} />
                  <span>{isSaved ? 'Guardado en Bóveda' : 'Guardar en Obsidian'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
