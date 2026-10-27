import { useState } from 'react';
import { Send, Sparkles, Terminal, FolderGit2, CheckCircle2, Shield, RefreshCw } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

export default function AgentView() {
  const [selectedContext, setSelectedContext] = useState('TADU');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Aegis Copilot listo. Contexto activo: TADÚ Platform. ¿Qué tarea ejecutamos?',
      timestamp: 'Ahora'
    }
  ]);

  const contexts = [
    { id: 'TADU', label: 'TADÚ (AWS SAM)', path: '/home/zabrielsa/Proyects/projects/TADU' },
    { id: 'MELI', label: 'Operaciones MELI', path: '/home/zabrielsa/Documentos/Obsidian Vault/01 Operaciones MELI' },
    { id: 'Granja', label: 'Granja (Android)', path: '/home/zabrielsa/Proyects/projects/granja' },
    { id: 'Vault', label: 'Bóveda BrainIA', path: '/home/zabrielsa/Documentos/Obsidian Vault' },
    { id: 'Aegis', label: 'Aegis Cockpit', path: '/home/zabrielsa/Proyects/projects/Aegis' }
  ];

  const quickMacros = [
    { label: 'Auditar Git & Tests', text: 'Revisa status de git y compuertas de test locales sin usar git add -A.' },
    { label: 'Resumen de Bitácora', text: 'Lee la bitácora de proyectos y resume el estado del Hito 1.' },
    { label: 'Generar Flashcards AWS', text: 'Analiza la última nota de estudio de AWS y genera 5 flashcards atómicas.' },
    { label: 'SOP Ambulancia MELI', text: 'Consulta el MOC de MELI y extrae el protocolo operativo de ambulancias.' }
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
      // Invocación a Tauri Core
      const reply = await invoke('ping');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `[Contexto: ${selectedContext}]\nEjecutando comando en segundo plano...\n\nRespuesta del núcleo: ${reply}\n\nTarea recibida: "${textToSend}"`,
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
      {/* Context Selector Chips */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.25rem',
        background: 'rgba(17, 24, 39, 0.7)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginRight: '6px' }}>
            Enrutador:
          </span>
          {contexts.map((ctx) => (
            <button
              key={ctx.id}
              onClick={() => setSelectedContext(ctx.id)}
              style={{
                fontSize: '0.75rem',
                padding: '5px 12px',
                borderRadius: '8px',
                background: selectedContext === ctx.id ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                border: selectedContext === ctx.id ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                color: selectedContext === ctx.id ? '#c7d2fe' : '#94a3b8',
                cursor: 'pointer',
                fontWeight: selectedContext === ctx.id ? 700 : 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap'
              }}
            >
              <FolderGit2 size={13} />
              {ctx.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#10b981' }}>
          <CheckCircle2 size={14} />
          <span>Caveman Full</span>
        </div>
      </div>

      {/* Message Stream Viewport */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        background: 'rgba(11, 15, 25, 0.6)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-lg)',
              background: m.role === 'user' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(17, 24, 39, 0.85)',
              border: m.role === 'user' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: m.role === 'user' ? '#a5b4fc' : '#818cf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {m.role === 'user' ? 'Tú (Gabriel)' : 'Aegis Copilot'}
                {m.context && <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.1)', color: '#cbd5e1' }}>{m.context}</span>}
              </span>
              <span style={{ fontSize: '0.65rem', color: '#64748b' }}>{m.timestamp}</span>
            </div>
            <div style={{ fontSize: '0.9rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', color: '#f1f5f9' }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', padding: '0.75rem 1rem', background: 'rgba(17, 24, 39, 0.85)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.85rem' }}>
            <RefreshCw size={14} className="spin" />
            <span>Consultando núcleo local...</span>
          </div>
        )}
      </div>

      {/* Quick Macros */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', padding: '2px 0' }}>
        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Macros:</span>
        {quickMacros.map((macro, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(macro.text)}
            style={{
              fontSize: '0.7rem',
              padding: '4px 10px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#cbd5e1',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
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
        gap: '10px',
        background: 'rgba(17, 24, 39, 0.85)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '0.5rem 0.75rem'
      }}>
        <Terminal size={18} color="#6366f1" />
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={`Escribe instrucción para el agente (Contexto: ${selectedContext})...`}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#ffffff',
            fontSize: '0.9rem',
            fontFamily: 'inherit'
          }}
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !prompt.trim()}
          style={{
            background: 'var(--primary-grad)',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 14px',
            color: '#fff',
            cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !prompt.trim() ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            fontWeight: 600
          }}
        >
          <Send size={14} />
          <span>Enviar</span>
        </button>
      </div>
    </div>
  );
}
