import React, { useRef, useEffect } from 'react';
import { Send, Square, Bot, Sparkles, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import TacticalButton from '../ui/TacticalButton';
import TacticalBadge from '../ui/TacticalBadge';
import { useGameCompanion } from './useGameCompanion';
import GameCompanionQuickActions from './GameCompanionQuickActions';
import GameCompanionMessageItem from './GameCompanionMessageItem';

export default function GameCompanionTab({ gameId, gameTitle, isSteam }) {
  const {
    context,
    contextLoading,
    messages,
    loading,
    input,
    setInput,
    copiedId,
    savedId,
    statusNotice,
    handleSendPrompt,
    handleStopStream,
    handleCopy,
    handleSaveToObsidian
  } = useGameCompanion({ gameId, gameTitle, isSteam });

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendPrompt();
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '420px',
      gap: '8px'
    }}>
      {/* 🧭 Micro-Barra Táctica de Contexto Activo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '5px 8px',
        background: 'color-mix(in srgb, var(--bg-card) 85%, black)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-color)',
        fontSize: '0.68rem',
        flexWrap: 'wrap',
        gap: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={12} color="var(--primary)" />
          <span style={{ fontWeight: 700, color: 'var(--text-high)' }}>
            Contexto: {gameTitle}
          </span>
          <TacticalBadge variant={isSteam ? 'primary' : 'neutral'} size="xs">
            {isSteam ? 'Steam' : 'Custom'}
          </TacticalBadge>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
          {context?.obsidian_note_exists ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--primary)' }}>
              <FileText size={11} /> Bóveda vinculada
            </span>
          ) : (
            <span>Sin nota previa</span>
          )}
          <span>•</span>
          <span>N150 (UHD)</span>
          {context?.gamemode_active && (
            <TacticalBadge variant="success" size="xs">GameMode ON</TacticalBadge>
          )}
        </div>
      </div>

      {/* ⚡ Notificación de Estado / Guardado */}
      {statusNotice && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          background: 'color-mix(in srgb, var(--primary) 15%, var(--bg-card))',
          border: '1px solid var(--primary)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.68rem',
          color: 'var(--text-high)'
        }}>
          <CheckCircle2 size={12} color="var(--primary)" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* 🎯 Acciones Rápidas */}
      <GameCompanionQuickActions
        onSelectAction={handleSendPrompt}
        disabled={loading || contextLoading}
      />

      {/* 💬 Historial de Conversación */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '6px 4px',
        border: '1px solid color-mix(in srgb, var(--border-color) 60%, transparent)',
        borderRadius: 'var(--radius-sm)',
        background: 'color-mix(in srgb, var(--bg-card) 60%, black)'
      }}>
        {messages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '8px',
            color: 'var(--text-muted)',
            textAlign: 'center',
            padding: '1rem'
          }}>
            <Bot size={28} color="var(--primary)" />
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)' }}>
              Game Companion Táctico
            </div>
            <p style={{ fontSize: '0.70rem', maxWidth: '380px', margin: 0 }}>
              Consulta builds óptimas, guías directas para tus logros pendientes o ajustes gráficos optimizados para Intel N150 sin salir del juego.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <GameCompanionMessageItem
              key={msg.id}
              message={msg}
              copiedId={copiedId}
              savedId={savedId}
              onCopy={handleCopy}
              onSaveToObsidian={handleSaveToObsidian}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ⌨️ Entrada de Prompt */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'var(--bg-card)',
        padding: '4px 6px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-color)'
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={loading ? 'El asistente está respondiendo...' : 'Escribe tu consulta táctica o de optimización...'}
          disabled={loading || contextLoading}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-high)',
            fontSize: '0.75rem',
            padding: '4px'
          }}
        />

        {loading ? (
          <TacticalButton
            variant="danger"
            size="xs"
            icon={Square}
            onClick={handleStopStream}
            style={{ height: '26px' }}
          >
            Detener
          </TacticalButton>
        ) : (
          <TacticalButton
            variant="primary"
            size="xs"
            icon={Send}
            disabled={!input.trim() || contextLoading}
            onClick={() => handleSendPrompt()}
            style={{ height: '26px' }}
          >
            Enviar
          </TacticalButton>
        )}
      </div>
    </div>
  );
}
