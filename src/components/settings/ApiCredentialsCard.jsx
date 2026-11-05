import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { KeyRound, Check, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';

const PROVIDER_METAS = [
  {
    id: 'deepseek',
    name: 'DeepSeek API',
    envKey: 'DEEPSEEK_API_KEY',
    desc: 'DeepSeek V3 y R1 con razonamiento de frontera a coste ultra-eficiente.',
    link: 'https://platform.deepseek.com/api_keys'
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    envKey: 'ANTHROPIC_API_KEY',
    desc: 'Claude 3.5 Sonnet, Haiku y Opus para ingeniería de precisión.',
    link: 'https://console.anthropic.com/settings/keys'
  },
  {
    id: 'openai',
    name: 'OpenAI API',
    envKey: 'OPENAI_API_KEY',
    desc: 'GPT-4o, GPT-4o Mini y modelos de razonamiento formal o3.',
    link: 'https://platform.openai.com/api-keys'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter API',
    envKey: 'OPENROUTER_API_KEY',
    desc: 'Enrutador universal multi-cloud con fallback a múltiples proveedores.',
    link: 'https://openrouter.ai/keys'
  }
];

export default function ApiCredentialsCard({ onOpenExternal }) {
  const [credentials, setCredentials] = useState({});
  const [inputs, setInputs] = useState({});
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const loadCredentials = async () => {
    try {
      const data = await invoke('get_api_credentials');
      setCredentials(data || {});
    } catch (e) {
      console.error('Error cargando credenciales IA:', e);
    }
  };

  useEffect(() => {
    loadCredentials();
  }, []);

  const handleSave = async (providerId) => {
    const rawVal = inputs[providerId] || '';
    setLoading(true);
    setStatusMsg(null);
    try {
      await invoke('save_provider_api_key', {
        providerId,
        apiKey: rawVal
      });
      await loadCredentials();
      setInputs((prev) => ({ ...prev, [providerId]: '' }));
      setStatusMsg({ id: providerId, text: 'Guardado con éxito' });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      setStatusMsg({ id: providerId, text: 'Error: ' + err, isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
      padding: '14px 16px',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <KeyRound size={15} color="var(--primary)" />
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-high)' }}>
            Autenticación Soberana y API Keys
          </span>
        </div>
        <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
          Almacenamiento local soberano ($XDG_CONFIG_HOME)
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {PROVIDER_METAS.map((prov) => {
          const cred = credentials[prov.id] || { isSet: false, maskedKey: '', source: 'none' };
          const isEnv = cred.source === 'env';
          return (
            <div
              key={prov.id}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'color-mix(in srgb, var(--bg-main) 40%, transparent)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-high)' }}>
                    {prov.name}
                  </span>
                  {cred.isSet ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontSize: '0.62rem',
                      fontWeight: 600,
                      color: 'var(--primary)',
                      background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
                      padding: '1px 5px',
                      borderRadius: '4px'
                    }}>
                      <ShieldCheck size={10} />
                      {isEnv ? 'Detectada en ENV' : 'Activa en Aegis'}
                    </span>
                  ) : (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontSize: '0.62rem',
                      color: 'var(--text-muted)',
                      background: 'color-mix(in srgb, var(--border-color) 30%, transparent)',
                      padding: '1px 5px',
                      borderRadius: '4px'
                    }}>
                      No configurada
                    </span>
                  )}
                </div>

                {prov.link && onOpenExternal && (
                  <button
                    onClick={() => onOpenExternal(prov.link)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.64rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                    title="Obtener API Key en la consola oficial"
                  >
                    Consola <ExternalLink size={10} />
                  </button>
                )}
              </div>

              <div className="settings-input-action-row" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="password"
                  placeholder={cred.isSet ? `Key activa (${cred.maskedKey})` : `Pegar ${prov.envKey}...`}
                  value={inputs[prov.id] ?? ''}
                  onChange={(e) => setInputs({ ...inputs, [prov.id]: e.target.value })}
                  style={{
                    flex: 1,
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    padding: '6px 8px'
                  }}
                />
                <button
                  onClick={() => handleSave(prov.id)}
                  disabled={loading}
                  className="settings-save-key-btn"
                  style={{
                    background: 'var(--primary)',
                    color: 'var(--bg-main)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 12px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Check size={12} />
                  Guardar
                </button>
              </div>

              {statusMsg && statusMsg.id === prov.id && (
                <div style={{
                  fontSize: '0.64rem',
                  color: statusMsg.isError ? 'var(--danger)' : 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {statusMsg.isError ? <AlertCircle size={10} /> : <Check size={10} />}
                  {statusMsg.text}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
