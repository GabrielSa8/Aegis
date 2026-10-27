import { useState } from 'react';
import { Send, Terminal, FolderGit2, CheckCircle2, Shield, RefreshCw } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

export default function AgentView() {
  const [selectedContext, setSelectedContext] = useState('TADU');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Aegis Copilot en línea. Entorno táctico Nordic Slate & Moss activo. ¿Qué tarea ejecutamos?',
      timestamp: 'Ahora'
    }
  ]);

  const contexts = [
    { id: 'TADU', label: 'TADÚ (SAM)', path: '/home/zabrielsa/Proyects/projects/TADU' },
    { id: 'MELI', label: 'MELI Hub', path: '/home/zabrielsa/Documentos/Obsidian Vault/01 Operaciones MELI' },
    { id: 'Granja', label: 'Granja (Kotlin)', path: '/home/zabrielsa/Proyects/projects/granja' },
    { id: 'Vault', label: 'BrainIA', path: '/home/zabrielsa/Documentos/Obsidian Vault' },
    { id: 'Aegis', label: 'Aegis Core', path: '/home/zabrielsa/Proyects/projects/Aegis' }
  ];

  const quickMacros = [
    { label: 'Auditar Git TADÚ', text: 'Revisa status de git y compuertas de test locales sin usar git add -A.' },
    { label: 'Resumen Bitácora', text: 'Lee la bitácora de proyectos y resume el estado del Hito 1.' },
    { label: 'Flashcards AWS', text: 'Analiza la última nota de estudio de AWS y genera 5 flashcards atómicas.' },
    { label: 'SOP Ambulancias', text: 'Consulta el MOC de MELI y extrae el protocolo operativo de ambulancias.' }
  ];

  const handleSend = async (customPrompt) => {
    const textToSend = customPrompt || prompt;
    if (!textToSend.trim()) return;

    const userMsg = {
      role: 'user',
      content: textToSend,
      context: selectedContext,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setPrompt('');
    setLoading(true);

    try {
      const reply = await invoke('ping');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `[Contexto: ${selectedContext}]\nEjecución en segundo plano...\n\nNúcleo local: ${reply}\n\nInstrucción procesada: "${textToSend}"`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error al comunicar con Aegis Core: ${err}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: '0.75rem' }}>
      {/* Context Router Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.6rem 1rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '4px' }}>
            Contexto:
          </span>
          {contexts.map((ctx) => (
            <button
              key={ctx.id}
              onClick={() => setSelectedContext(ctx.id)}
              style={{
                fontSize: '0.72rem',
                padding: '5px 12px',
                borderRadius: 'var(--radius-md)',
                background: selectedContext === ctx.id ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                border: selectedContext === ctx.id ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                color: selectedContext === ctx.id ? 'var(--text-high)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: selectedContext === ctx.id ? 700 : 500,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
                transition: 'var(--transition)'
              }}
            >
              <FolderGit2 size={12} color={selectedContext === ctx.id ? '#10b981' : '#788882'} />
              {ctx.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: '#10b981' }}>
          <CheckCircle2 size={13} />
          <span>Modo Caveman</span>
        </div>
      </div>

      {/* Message Viewport */}
      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        background: 'var(--bg-main)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem'
      }}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              padding: '0.85rem 1.15rem',
              borderRadius: 'var(--radius-lg)',
              background: m.role === 'user' ? '#1c2220' : 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              boxShadow: 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: m.role === 'user' ? '#a7f3d0' : '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {m.role === 'user' ? 'Tú (Gabriel)' : 'Aegis Copilot'}
                {m.context && <span style={{ fontSize: '0.6rem', padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)' }}>{m.context}</span>}
              </span>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{m.timestamp}</span>
            </div>
            <div style={{ fontSize: '0.85rem', lineHeight: '1.45', whiteSpace: 'pre-wrap', color: 'var(--text-high)', fontFamily: m.role === 'assistant' ? 'var(--font-mono)' : 'inherit' }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', padding: '0.6rem 0.85rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            <RefreshCw size={12} className="spin" />
            <span>Consultando núcleo local...</span>
          </div>
        )}
      </div>

      {/* Quick Macros */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', padding: '2px 0', flexShrink: 0 }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Macros:</span>
        {quickMacros.map((macro, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(macro.text)}
            style={{
              fontSize: '0.68rem',
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-high)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'var(--transition)'
            }}
          >
            {macro.label}
          </button>
        ))}
      </div>

      {/* Input Box */}
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
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={`Instrucción para el agente (Contexto: ${selectedContext})...`}
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
          <Send size={12} />
          <span>Enviar</span>
        </button>
      </div>
    </div>
  );
}
