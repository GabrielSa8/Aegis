import { useEffect } from 'react';
import { Send, RefreshCw } from 'lucide-react';

export default function PromptInputBar({
  prompt,
  onChangePrompt,
  onSubmit,
  loading,
  activeContextLabel,
  effortMode,
  inputRef,
  onShortcutMacro
}) {
  // Ajuste elástico de altura según contenido multilínea
  useEffect(() => {
    if (inputRef && inputRef.current) {
      inputRef.current.style.height = 'auto';
      const scrollH = inputRef.current.scrollHeight;
      inputRef.current.style.height = `${Math.min(Math.max(scrollH, 22), 160)}px`;
    }
  }, [prompt, inputRef]);

  const handleKeyDown = (e) => {
    // Enter sin Shift envía la instrucción
    if (e.key === 'Enter' && !e.shiftKey && !loading) {
      e.preventDefault();
      if (prompt.trim()) {
        onSubmit();
      }
      return;
    }

    // Atajos Ctrl + 1..9 para disparar macros desde el input
    if (e.ctrlKey && !e.altKey && e.key >= '1' && e.key <= '9') {
      const idx = parseInt(e.key, 10) - 1;
      if (onShortcutMacro) {
        e.preventDefault();
        onShortcutMacro(idx, e.shiftKey);
      }
    }
  };

  const isMultiline = prompt.includes('\n');

  return (
    <div className="terminal-input-bar">
      <div className="terminal-prompt-chevron" title="Prompt">
        <span>❯</span>
      </div>

      <textarea
        ref={inputRef}
        rows={1}
        value={prompt}
        onChange={(e) => onChangePrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          loading
            ? 'Agente ejecutando instrucción...'
            : `[${activeContextLabel} · ${effortMode === 'high' ? 'Profundo' : 'Flash'}] Instrucción para el agente...`
        }
        disabled={loading}
        className="terminal-prompt-textarea custom-scrollbar"
      />

      <div className="terminal-input-actions">
        {isMultiline && (
          <span className="terminal-multiline-hint">
            <kbd className="tactical-kbd" style={{ fontSize: '0.54rem', padding: '1px 3px' }}>Shift</kbd>
            <span>+</span>
            <kbd className="tactical-kbd" style={{ fontSize: '0.54rem', padding: '1px 3px' }}>↵</kbd>
          </span>
        )}

        <button
          onClick={() => onSubmit()}
          disabled={loading || !prompt.trim()}
          className="terminal-send-btn"
          title={isMultiline ? 'Enviar instrucción (Enter)' : 'Enviar instrucción'}
        >
          {loading ? (
            <>
              <RefreshCw size={12} className="spin" />
              <span className="send-btn-label">Ejecutando...</span>
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
