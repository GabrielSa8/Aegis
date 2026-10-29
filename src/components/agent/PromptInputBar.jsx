import { Send, RefreshCw } from 'lucide-react';

export default function PromptInputBar({
  prompt,
  onChangePrompt,
  onSubmit,
  loading,
  activeContextLabel,
  effortMode
}) {
  return (
    <div className="terminal-input-bar">
      <div className="terminal-prompt-chevron">
        <span>&gt;</span>
      </div>

      <input
        type="text"
        value={prompt}
        onChange={(e) => onChangePrompt(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !loading && onSubmit()}
        placeholder={
          loading
            ? 'Agente ejecutando instrucción...'
            : `[${activeContextLabel} · ${effortMode === 'high' ? 'Profundo' : 'Flash'}] Instrucción para el agente...`
        }
        disabled={loading}
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--text-high)',
          fontSize: '0.86rem',
          fontFamily: 'inherit'
        }}
      />

      <span className="terminal-blinking-cursor" style={{ marginRight: '6px' }}>█</span>

      <button
        onClick={() => onSubmit()}
        disabled={loading || !prompt.trim()}
        className="btn btn-primary"
        style={{
          padding: '5px 14px',
          fontSize: '0.74rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        {loading ? (
          <>
            <RefreshCw size={12} className="spin" />
            <span>Ejecutando...</span>
          </>
        ) : (
          <>
            <Send size={12} />
            <span>Enviar</span>
            <kbd className="tactical-kbd" style={{ background: 'rgba(0, 0, 0, 0.25)', color: 'inherit', border: 'none', boxShadow: 'none' }}>↵</kbd>
          </>
        )}
      </button>
    </div>
  );
}
