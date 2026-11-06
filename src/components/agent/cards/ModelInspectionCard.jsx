import React, { memo } from 'react';
import { Cpu, Zap, Brain, Code, Sparkles, ArrowRight } from 'lucide-react';
import { getModelsForProvider, modelDisplayName, splitIntensity } from '../slashCommandFormatters';

const MODEL_ICONS = {
  'gemini-3.8-flash-high': Zap,
  'gemini-4-argon-high': Brain,
  'claude-sonnet-5-5-high': Code,
  'claude-opus-5-5-high': Sparkles,
  'gpt-oss-120b-medium': Cpu,
  'claude-3-5-sonnet-20241022': Code,
  'claude-3-opus-20240229': Sparkles,
  'claude-3-5-haiku-20241022': Zap,
  'llama3.2': Cpu,
  'deepseek-r1': Brain,
  'mistral': Zap
};

function ModelInspectionCard({ activeModel, onSelectModel, agentType = 'agy' }) {
  const availableModels = getModelsForProvider(agentType);
  const currentModel =
    availableModels.find(
      (m) => m.id === activeModel || splitIntensity(m.id)?.base === splitIntensity(activeModel)?.base
    ) ||
    availableModels[0] || {
      id: activeModel || 'default',
      name: 'Modelo Activo',
      provider: agentType.toUpperCase(),
      desc: 'Motor en ejecución.'
    };

  const CurrentIcon = MODEL_ICONS[currentModel.id] || Zap;

  const providerTitle =
    agentType === 'claude' || agentType === 'anthropic'
      ? 'Anthropic Claude'
      : agentType === 'deepseek'
        ? 'DeepSeek (Oficial / Soberano)'
        : agentType === 'openai'
          ? 'OpenAI API'
          : agentType === 'openrouter'
            ? 'OpenRouter (Multi-Proveedor)'
            : agentType === 'ollama'
              ? 'Ollama Local (Offline)'
              : 'Google Antigravity CLI (agy)';

  return (
    <div
      style={{
        margin: '8px 0',
        borderRadius: 'var(--radius-md, 8px)',
        background: 'color-mix(in srgb, var(--bg-card) 92%, black)',
        border: '1px solid var(--border-color)',
        borderLeft: '4px solid var(--primary)',
        backdropFilter: 'blur(14px)',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.28)'
      }}
    >
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '4px',
              borderRadius: '5px',
              background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
              border: '1px solid color-mix(in srgb, var(--primary) 35%, transparent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Cpu size={14} color="var(--primary)" />
          </div>
          <div>
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--text-high)',
                letterSpacing: '0.02em',
                textTransform: 'uppercase'
              }}
            >
              Motor de IA ({providerTitle})
            </span>
            <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
              Proveedor activo configurado en Aegis
            </div>
          </div>
        </div>

        <span
          style={{
            fontSize: '0.64rem',
            fontWeight: 700,
            fontFamily: 'var(--font-mono, monospace)',
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
            border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
            color: 'var(--primary)'
          }}
        >
          [ EN LÍNEA ]
        </span>
      </div>

      {/* Modelo Activo Destacado */}
      <div
        style={{
          background: 'color-mix(in srgb, var(--primary) 8%, transparent)',
          border: '1px solid color-mix(in srgb, var(--primary) 28%, transparent)',
          borderRadius: '6px',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              padding: '6px',
              borderRadius: '6px',
              background: 'var(--primary)',
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CurrentIcon size={14} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.80rem', fontWeight: 700, color: 'var(--text-high)' }}>
                {modelDisplayName(currentModel, activeModel)}
              </span>
              <span
                style={{
                  fontSize: '0.60rem',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono, monospace)'
                }}
              >
                {currentModel.id}
              </span>
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {currentModel.desc}
            </span>
          </div>
        </div>

        <span
          style={{
            fontSize: '0.64rem',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
            border: '1px solid color-mix(in srgb, var(--primary) 35%, transparent)',
            color: 'var(--primary)',
            whiteSpace: 'nowrap'
          }}
        >
          ✓ ACTIVO
        </span>
      </div>

      {/* Catálogo de Modelos Disponibles del Proveedor */}
      {availableModels.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            Modelos Disponibles en {providerTitle}:
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {availableModels.map((m) => {
              const isCur = m.id === currentModel.id;
              const Icon = MODEL_ICONS[m.id] || Zap;

              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: '5px',
                    background: isCur
                      ? 'color-mix(in srgb, var(--primary) 10%, transparent)'
                      : 'color-mix(in srgb, var(--bg-card) 40%, transparent)',
                    border: isCur
                      ? '1px solid color-mix(in srgb, var(--primary) 30%, transparent)'
                      : '1px solid var(--border-color)',
                    transition: 'background 0.12s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon size={12} color={isCur ? 'var(--primary)' : 'var(--text-muted)'} />
                    <span style={{ fontSize: '0.74rem', fontWeight: isCur ? 700 : 500, color: 'var(--text-high)' }}>
                      {modelDisplayName(m, activeModel)}
                    </span>
                    <span
                      style={{
                        fontSize: '0.60rem',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono, monospace)'
                      }}
                    >
                      /model {m.alias}
                    </span>
                  </div>

                  {isCur ? (
                    <span style={{ fontSize: '0.62rem', color: 'var(--primary)', fontWeight: 700 }}>
                      Activo
                    </span>
                  ) : (
                    <button
                      onClick={() => onSelectModel?.(m.id)}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-high)',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '0.64rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--primary)';
                        e.currentTarget.style.color = 'var(--primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.color = 'var(--text-high)';
                      }}
                    >
                      <span>Conmutar</span>
                      <ArrowRight size={10} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pie de Página */}
      <div
        style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.64rem',
          color: 'var(--text-muted)'
        }}
      >
        <span>Escribe /model &lt;alias&gt; o usa el menú de la barra superior.</span>
        <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>/model</span>
      </div>
    </div>
  );
}

export default memo(ModelInspectionCard);
