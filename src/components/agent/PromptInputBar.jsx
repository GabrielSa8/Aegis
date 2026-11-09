import { useState, useEffect, useRef } from 'react';
import { Send, Square, Paperclip } from 'lucide-react';
import { useAttachments, appendAttachmentRefs } from './useAttachments';
import AttachmentStrip from './AttachmentStrip';
import ReferenceBadgeStrip from './ReferenceBadgeStrip';
import PromptTelemetryBadge from './PromptTelemetryBadge';
import PromptQuickToolbar from './PromptQuickToolbar';
import { usePromptHistory } from './usePromptHistory';
import { useSlashCommands } from './useSlashCommands';
import SlashCommandPalette from './SlashCommandPalette';
import PromptOverlay from './PromptOverlay';
import { resolvePromptReferences } from './promptReferences';
import { tokenize, removeRange } from './promptTokens';

export default function PromptInputBar({
  prompt,
  onChangePrompt,
  onSubmit,
  onStop,
  loading,
  activeContextLabel,
  effortMode,
  inputRef,
  onShortcutMacro,
  onClearHistory,
  onSetEffortMode,
  messages,
  activeContext,
  contexts = [],
  onSelectContext,
  onSaveContexts,
  currentSessionId,
  activeModel,
  onSelectModel,
  agentType,
  onInjectSystemMessage
}) {
  const {
    isOpen: isSlashOpen,
    filteredCommands: slashCommands,
    selectedIndex: slashIndex,
    executeCommand: executeSlashCommand,
    handleSlashKeyDown
  } = useSlashCommands({
    prompt,
    onChangePrompt,
    onClearHistory,
    effortMode,
    onSetEffortMode,
    messages,
    activeContext,
    contexts,
    onSelectContext,
    onSaveContexts,
    currentSessionId,
    onSubmitPrompt: onSubmit,
    activeModel,
    onSelectModel,
    agentType,
    onInjectSystemMessage
  });

  const {
    history,
    historyIndex,
    matchCount,
    matchPosition,
    recordPrompt,
    handleHistoryKeyDown,
    resetHistoryIndex
  } = usePromptHistory(prompt, onChangePrompt, inputRef);

  // Ajuste elástico de altura según contenido multilínea (base mínima 28px para trazos descendentes)
  useEffect(() => {
    if (inputRef && inputRef.current) {
      inputRef.current.style.height = 'auto';
      const scrollH = inputRef.current.scrollHeight;
      inputRef.current.style.height = `${Math.min(Math.max(scrollH, 28), 160)}px`;
    }
  }, [prompt, inputRef]);

  const fileInputRef = useRef(null);
  const [explicitRefs, setExplicitRefs] = useState([]);
  const [promptEffortOverride, setPromptEffortOverride] = useState(null);

  // Esfuerzo efectivo: si hay override local aplica solo a este prompt, si no hereda el global de la sesión
  const effectiveEffort = promptEffortOverride || effortMode || 'low';

  const {
    attachments,
    dragOver,
    addFiles,
    removeAttachment,
    clearAttachments,
    handlePaste,
    uploadAll
  } = useAttachments(activeContext?.id);

  useEffect(() => {
    if (!loading || !onStop) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onStop();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [loading, onStop]);

  const handleSubmit = async (customText) => {
    const textToSend = customText !== undefined ? customText : prompt;
    const trimmed = textToSend.trim();
    if ((!trimmed && !attachments.length && !explicitRefs.length) || loading) return;

    // Si es un slash command (ej: /model, /model claude, /usage, etc.)
    if (trimmed.startsWith('/') && !trimmed.includes('\n')) {
      recordPrompt(trimmed);
      executeSlashCommand(trimmed);
      return;
    }

    if (trimmed) recordPrompt(trimmed);
    let finalText = trimmed || 'Analiza las referencias y adjuntos adjuntos.';

    // Anexar referencias seleccionadas como chips al texto para el backend
    if (explicitRefs.length) {
      finalText = `${finalText} ${explicitRefs.map((r) => r.value).join(' ')}`.trim();
      setExplicitRefs([]);
    }

    // Resolver menciones dinámicas (@vault:, @file:, @context:) y variables ({{clip}}, {{diff}})
    try {
      finalText = await resolvePromptReferences(finalText, activeContext);
    } catch (refErr) {
      console.warn('Error resolviendo referencias en prompt:', refErr);
    }

    if (attachments.length) {
      try {
        finalText = appendAttachmentRefs(finalText, await uploadAll());
        clearAttachments();
      } catch (err) {
        console.error('Error subiendo adjuntos:', err);
        return;
      }
    }

    // Reset del override por prompt al enviar
    const effortForThisSend = effectiveEffort;
    setPromptEffortOverride(null);

    onSubmit(finalText, effortForThisSend);
  };

  const handleKeyDown = (e) => {
    // 1. Slash command palette tiene prioridad si está abierto
    if (handleSlashKeyDown(e)) {
      return;
    }

    // 2. Navegación en historial por prefijo (↑ / ↓ / Escape)
    if (handleHistoryKeyDown(e)) {
      return;
    }

    // 3. Enter sin Shift envía la instrucción
    if (e.key === 'Enter' && !e.shiftKey && !loading) {
      e.preventDefault();
      if (prompt.trim() || attachments.length || explicitRefs.length) {
        handleSubmit();
      }
      return;
    }

    // 4. Atajos Ctrl + 1..9 para disparar macros desde el input
    if (e.ctrlKey && !e.altKey && e.key >= '1' && e.key <= '9') {
      const idx = parseInt(e.key, 10) - 1;
      if (onShortcutMacro) {
        e.preventDefault();
        onShortcutMacro(idx, e.shiftKey);
      }
    }
  };

  const inlineTokens = tokenize(prompt).filter((t) => t.type !== 'text');
  const allRefTokens = [...explicitRefs, ...inlineTokens];

  const handleRemoveRefToken = (tok) => {
    if (explicitRefs.some((r) => r === tok || (r.value === tok.value && r.arg === tok.arg))) {
      setExplicitRefs((prev) => prev.filter((r) => r !== tok && !(r.value === tok.value && r.arg === tok.arg)));
      return;
    }
    const nextPrompt = removeRange(prompt, tok.start, tok.end);
    onChangePrompt(nextPrompt);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleAddExplicitRef = (refToken) => {
    setExplicitRefs((prev) => {
      if (prev.some((r) => r.value === refToken.value)) return prev;
      return [...prev, refToken];
    });
  };

  const isMultiline = prompt.includes('\n');

  return (
    <div
      className="terminal-input-bar"
      style={
        dragOver
          ? { outline: '2px dashed var(--primary)', outlineOffset: '-2px', flexWrap: 'wrap' }
          : { flexWrap: 'wrap' }
      }
    >
      <AttachmentStrip attachments={attachments} onRemove={removeAttachment} />
      <ReferenceBadgeStrip tokens={allRefTokens} onRemoveToken={handleRemoveRefToken} />
      {/* 🔮 Menú Flotante de Slash Commands (/) */}
      {isSlashOpen && (
        <SlashCommandPalette
          commands={slashCommands}
          selectedIndex={slashIndex}
          onSelectCommand={executeSlashCommand}
        />
      )}

      <div className="terminal-prompt-chevron" title="Prompt">
        <span>❯</span>
      </div>

      <PromptOverlay
        prompt={prompt}
        onChangePrompt={(val) => {
          if (historyIndex !== -1) {
            resetHistoryIndex();
          }
          onChangePrompt(val);
        }}
        inputRef={inputRef}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={
          loading
            ? 'Agente ejecutando instrucción...'
            : `[${activeContextLabel} · ${effectiveEffort === 'high' ? 'Profundo' : 'Flash'}] Escribe / para comandos o tu instrucción...`
        }
        disabled={loading}
        activeContext={activeContext}
        contexts={contexts}
        onSelectContext={onSelectContext}
        onAddReference={handleAddExplicitRef}
      />

      <div className="terminal-input-actions">
        <PromptTelemetryBadge
          prompt={prompt}
          explicitRefsCount={allRefTokens.length}
          activeModel={activeModel}
          effectiveEffort={effectiveEffort}
          onSwitchToFlash={() => {
            setPromptEffortOverride('low');
          }}
        />

        {historyIndex !== -1 && (
          <span
            className="terminal-multiline-hint"
            style={{ color: 'var(--primary)', borderColor: 'rgba(17, 174, 122, 0.35)' }}
            title="Navegando historial filtrado (Escape para volver al borrador)"
          >
            <span>↑↓</span>
            <span style={{ fontSize: '0.62rem' }}>
              {matchPosition}/{matchCount}
            </span>
          </span>
        )}

        {isMultiline && historyIndex === -1 && (
          <span className="terminal-multiline-hint">
            <kbd className="tactical-kbd" style={{ fontSize: '0.54rem', padding: '1px 3px' }}>
              Shift
            </kbd>
            <span>+</span>
            <kbd className="tactical-kbd" style={{ fontSize: '0.54rem', padding: '1px 3px' }}>
              ↵
            </kbd>
          </span>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />

        <PromptQuickToolbar
          onAttachClick={() => fileInputRef.current?.click()}
          effectiveEffort={effectiveEffort}
          isOverride={promptEffortOverride !== null}
          onToggleOverride={() => {
            // Alterna solo para este prompt. Si ya tiene override opuesto vuelve al default de la sesión
            if (promptEffortOverride === null) {
              setPromptEffortOverride(effortMode === 'high' ? 'low' : 'high');
            } else {
              setPromptEffortOverride(null);
            }
          }}
          loading={loading}
        />

        <button
          onClick={() => (loading ? onStop?.() : handleSubmit())}
          disabled={!loading && !prompt.trim() && !attachments.length}
          className="terminal-send-btn"
          style={loading ? { borderColor: 'var(--danger)', color: 'var(--danger)' } : undefined}
          title={loading ? 'Interrumpir (Esc)' : isMultiline ? 'Enviar instrucción (Enter)' : 'Enviar instrucción'}
        >
          {loading ? (
            <>
              <Square size={12} />
              <span className="send-btn-label">Detener</span>
              <kbd className="tactical-kbd send-btn-kbd">Esc</kbd>
            </>
          ) : (
            <>
              <Send size={12} />
              <span className="send-btn-label">Enviar</span>
              <kbd className="tactical-kbd send-btn-kbd">↵</kbd>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
