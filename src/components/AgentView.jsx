import { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Terminal, 
  FolderGit2, 
  CheckCircle2, 
  RefreshCw, 
  Copy, 
  Check, 
  Trash2, 
  Cpu, 
  Clock,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export default function AgentView() {
  const [selectedContext, setSelectedContext] = useState('TADU');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const viewportRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Aegis Copilot en línea. Conectado al agente local (`agy 1.4.8`). ¿Qué tarea técnica ejecutamos?',
      context: 'Aegis',
      timestamp: 'Ahora'
    }
  ]);

  const contexts = [
    { id: 'TADU', label: 'TADÚ (SAM)', path: '/home/zabrielsa/Proyects/projects/TADU' },
    { id: 'MELI', label: 'MELI Hub', path: '/home/zabrielsa/Documentos/Obsidian Vault/01 Operaciones MELI' },
    { id: 'Granja', label: 'Granja (Kotlin)', path: '/home/zabrielsa/AndroidStudioProjects/granja' },
    { id: 'Vault', label: 'BrainIA', path: '/home/zabrielsa/Documentos/Obsidian Vault' },
    { id: 'Aegis', label: 'Aegis Core', path: '/home/zabrielsa/Proyects/projects/Aegis' }
  ];

  const quickMacros = [
    { label: 'Auditar Git TADÚ', text: 'Revisa status de git y ramas locales sin usar git add -A.' },
    { label: 'Resumen Bitácora', text: 'Lee la bitácora de proyectos en Obsidian y resume el estado del Hito 1.' },
    { label: 'Flashcards AWS', text: 'Analiza la última nota de estudio de AWS y genera 3 flashcards atómicas.' },
    { label: 'SOP Ambulancias', text: 'Consulta el MOC de MELI y resume el protocolo de ambulancias.' }
  ];

  const activeContextObj = contexts.find(c => c.id === selectedContext) || contexts[0];

  // Escuchar chunks de streaming emitidos desde Rust
  useEffect(() => {
    let unlisten;
    const setupListener = async () => {
      unlisten = await listen('agent-stream', (event) => {
        const chunk = event.payload;
        if (!chunk || !chunk.stream_id) return;

        setMessages((prev) => {
          return prev.map((msg) => {
            if (msg.id === chunk.stream_id) {
              if (chunk.event_type === 'delta') {
                return {
                  ...msg,
                  content: (msg.content || '') + chunk.content,
                  loading: true
                };
              } else if (chunk.event_type === 'done') {
                return {
                  ...msg,
                  loading: false,
                  duration: chunk.duration_seconds,
                  totalTokens: chunk.total_tokens,
                  inputTokens: chunk.input_tokens,
                  outputTokens: chunk.output_tokens
                };
              } else if (chunk.event_type === 'error') {
                return {
                  ...msg,
                  content: (msg.content ? msg.content + '\n\n' : '') + `⚠️ [Error agy]: ${chunk.content}`,
                  loading: false,
                  isError: true
                };
              }
            }
            return msg;
          });
        });

        if (chunk.event_type === 'done' || chunk.event_type === 'error') {
          setLoading(false);
        }
      });
    };

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // Auto-scroll al final en cada actualización de mensajes
  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (customPrompt) => {
    const textToSend = customPrompt || prompt;
    if (!textToSend.trim() || loading) return;

    const streamId = 'stream_' + Date.now();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: textToSend,
      context: selectedContext,
      timestamp: timeStr
    };

    const assistantPlaceholder = {
      id: streamId,
      role: 'assistant',
      content: '',
      context: selectedContext,
      timestamp: timeStr,
      loading: true
    };

    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    setPrompt('');
    setLoading(true);

    try {
      await invoke('execute_agent_prompt', {
        prompt: textToSend,
        contextPath: activeContextObj.path,
        streamId
      });
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamId
            ? {
                ...m,
                content: `Error al iniciar el agente en Aegis Core: ${err}`,
                loading: false,
                isError: true
              }
            : m
        )
      );
      setLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearHistory = () => {
    setMessages([
      {
        id: 'welcome_' + Date.now(),
        role: 'assistant',
        content: 'Historial despejado. Entorno táctico listo.',
        context: selectedContext,
        timestamp: 'Ahora'
      }
    ]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: '0.75rem' }}>
      {/* 🧭 Context Router Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.5rem 1rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        flexShrink: 0,
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        {/* Selector de carpetas de proyecto */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '4px' }}>
            Contexto:
          </span>
          {contexts.map((ctx) => {
            const isSelected = selectedContext === ctx.id;
            return (
              <button
                key={ctx.id}
                onClick={() => setSelectedContext(ctx.id)}
                style={{
                  fontSize: '0.72rem',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  color: isSelected ? 'var(--text-high)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap',
                  transition: 'var(--transition)'
                }}
              >
                <FolderGit2 size={12} color={isSelected ? '#10b981' : '#788882'} />
                <span>{ctx.label}</span>
              </button>
            );
          })}
        </div>

        {/* Estado y Limpieza */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.68rem',
            color: '#10b981',
            background: 'rgba(16, 185, 129, 0.08)',
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600
          }}>
            <CheckCircle2 size={12} />
            <span>Streaming PTY agy</span>
          </div>

          <button
            onClick={clearHistory}
            className="btn btn-secondary"
            style={{ width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Limpiar conversación"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* 💬 Message Viewport */}
      <div 
        ref={viewportRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          background: 'var(--bg-main)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              style={{
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: isUser ? '80%' : '90%',
                padding: '0.85rem 1.15rem',
                borderRadius: 'var(--radius-lg)',
                background: isUser ? '#1a221f' : 'var(--bg-card)',
                border: isUser ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-color)',
                boxShadow: 'none',
                position: 'relative'
              }}
            >
              {/* Header del Mensaje */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isUser ? '#a7f3d0' : '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isUser ? 'Gabriel' : 'Aegis Copilot'}
                  {m.context && (
                    <span style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)' }}>
                      {m.context}
                    </span>
                  )}
                </span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{m.timestamp}</span>
                  {!isUser && m.content && (
                    <button
                      onClick={() => copyToClipboard(m.content, m.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                      title="Copiar respuesta"
                    >
                      {copiedId === m.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Contenido */}
              <div style={{
                fontSize: '0.86rem',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                color: 'var(--text-high)',
                fontFamily: isUser ? 'inherit' : 'var(--font-mono)'
              }}>
                {m.content}
                {m.loading && (
                  <span style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '14px',
                    marginLeft: '4px',
                    background: '#10b981',
                    verticalAlign: 'middle',
                    animation: 'pulse 1s infinite'
                  }} />
                )}
              </div>

              {/* Telemetría y Tokens al finalizar */}
              {!isUser && !m.loading && (m.totalTokens || m.duration) && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: '8px',
                  paddingTop: '6px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {m.totalTokens && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Cpu size={10} color="#10b981" />
                      {m.totalTokens.toLocaleString()} tokens
                    </span>
                  )}
                  {m.duration && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={10} />
                      {m.duration.toFixed(1)}s
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ⚡ Quick Macros */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', padding: '2px 0', flexShrink: 0 }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Macros:</span>
        {quickMacros.map((macro, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(macro.text)}
            disabled={loading}
            style={{
              fontSize: '0.68rem',
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-high)',
              cursor: loading ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              transition: 'var(--transition)',
              opacity: loading ? 0.5 : 1
            }}
          >
            {macro.label}
          </button>
        ))}
      </div>

      {/* ⌨️ Input Command Box */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '0.5rem 0.8rem',
        flexShrink: 0,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
      }}>
        <Terminal size={16} color="#10b981" />
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend()}
          placeholder={loading ? 'Agente ejecutando en segundo plano...' : `Instrucción para el agente (Contexto: ${selectedContext})...`}
          disabled={loading}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-high)',
            fontSize: '0.85rem',
            fontFamily: 'inherit'
          }}
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !prompt.trim()}
          style={{
            background: 'var(--primary-grad)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '7px 14px',
            color: '#fff',
            cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !prompt.trim() ? 0.4 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.75rem',
            fontWeight: 600,
            transition: 'var(--transition)'
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
            </>
          )}
        </button>
      </div>
    </div>
  );
}
