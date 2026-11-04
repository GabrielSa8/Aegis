import { useState, useRef, useEffect, memo } from 'react';
import { ChevronDown, Check, Zap, Brain, Code, Sparkles, Cpu } from 'lucide-react';
import {
  getModelsForProvider,
  INTENSITIES,
  splitIntensity,
  getIntensityLevel,
  withIntensity,
  modelDisplayName
} from './slashCommandFormatters';

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

function ModelSelectorDropdown({
  activeModel,
  onSelectModel,
  onSetEffortMode,
  agentType = 'agy',
  onInjectSystemMessage,
  activeContext
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Cerrar al hacer clic fuera del componente
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const availableModels = getModelsForProvider(agentType);
  if (!availableModels || availableModels.length === 0) return null;

  const currentModel =
    availableModels.find(
      (m) => m.id === activeModel || splitIntensity(m.id)?.base === splitIntensity(activeModel)?.base
    ) ||
    availableModels[0];

  const CurrentIcon = MODEL_ICONS[currentModel.id] || Zap;

  const handleSelect = (model) => {
    const lvl = getIntensityLevel(activeModel);
    onSelectModel?.(lvl ? withIntensity(model.id, lvl) : model.id);
    if (model.effort && onSetEffortMode) {
      onSetEffortMode(model.effort);
    }
    setIsOpen(false);

    onInjectSystemMessage?.({
      id: 'sys_model_select_' + Date.now(),
      role: 'assistant',
      content:
        `> [!NOTE] Motor de IA Actualizado\n` +
        `> ### ⚡ Motor Activo: \`${model.name}\`\n` +
        `> - **Identificador:** \`${model.id}\`\n` +
        `> - **Proveedor:** \`${model.provider}\`\n` +
        `> - **Especialidad:** ${model.desc}\n` +
        `> - **Estado:** \`[ LISTO PARA EJECUCIÓN ]\``,
      context: activeContext?.label || 'General',
      timestamp: 'Ahora'
    });
  };

  const intensity = getIntensityLevel(activeModel);
  const displayName = (m) => modelDisplayName(m, activeModel);

  const providerLabel =
    agentType === 'claude' || agentType === 'anthropic'
      ? 'Anthropic Claude'
      : agentType === 'deepseek'
        ? 'DeepSeek (API)'
        : agentType === 'openai'
          ? 'OpenAI'
          : agentType === 'openrouter'
            ? 'OpenRouter'
            : agentType === 'ollama'
              ? 'Ollama Local'
              : 'Google Antigravity';

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`header-tactical-toggle ${isOpen ? 'is-active' : ''}`}
        title={`Motor de IA activo: ${displayName(currentModel)} (${currentModel.provider})`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          fontWeight: 600,
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-color)',
          padding: '4px 8px',
          borderRadius: 'var(--radius-sm, 6px)',
          cursor: 'pointer',
          color: 'var(--text-high)',
          fontSize: '0.74rem'
        }}
      >
        <CurrentIcon size={13} color="var(--primary)" />
        <span>{currentModel.shortLabel}</span>
        {intensity && (
          <span style={{ color: 'var(--primary)', fontSize: '0.66rem', textTransform: 'uppercase' }}>
            {intensity}
          </span>
        )}
        <ChevronDown
          size={11}
          style={{
            opacity: 0.7,
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease'
          }}
        />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 1000,
            minWidth: '280px',
            background: 'color-mix(in srgb, var(--bg-card) 95%, black)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md, 8px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
            padding: '6px',
            backdropFilter: 'blur(14px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
        >
          <div
            style={{
              padding: '4px 8px 6px 8px',
              borderBottom: '1px solid var(--border-color)',
              fontSize: '0.66rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              letterSpacing: '0.04em',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>Motor de IA ({providerLabel})</span>
            <span style={{ color: 'var(--primary)' }}>{availableModels.length} Disponibles</span>
          </div>

          {availableModels.map((m) => {
            const isSelected = m.id === currentModel.id;
            const Icon = MODEL_ICONS[m.id] || Zap;

            return (
              <div
                key={m.id}
                onClick={() => handleSelect(m)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 8px',
                  borderRadius: 'var(--radius-sm, 6px)',
                  background: isSelected
                    ? 'color-mix(in srgb, var(--primary) 12%, transparent)'
                    : 'transparent',
                  cursor: 'pointer',
                  border: isSelected
                    ? '1px solid color-mix(in srgb, var(--primary) 30%, transparent)'
                    : '1px solid transparent',
                  transition: 'background 0.12s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'color-mix(in srgb, var(--bg-card) 50%, transparent)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <div
                    style={{
                      padding: '4px',
                      borderRadius: '4px',
                      background: isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.06)',
                      color: isSelected ? '#000' : 'var(--text-high)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '1px'
                    }}
                  >
                    <Icon size={12} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: isSelected ? 700 : 500,
                          color: 'var(--text-high)'
                        }}
                      >
                        {displayName(m)}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', lineHeight: '1.2' }}>
                      {m.desc}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <Check size={14} color="var(--primary)" style={{ flexShrink: 0, marginLeft: '6px' }} />
                )}
              </div>
            );
          })}

          {intensity && (
            <div
              style={{
                marginTop: '4px',
                padding: '6px 8px 2px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Intensidad
              </span>
              <div style={{ display: 'flex', gap: '3px' }}>
                {INTENSITIES.map((i) => {
                  const on = i.level === intensity;
                  return (
                    <button
                      key={i.level}
                      data-intensity={i.level}
                      onClick={() => onSelectModel?.(withIntensity(activeModel, i.level))}
                      style={{
                        padding: '3px 10px',
                        fontSize: '0.7rem',
                        fontWeight: on ? 700 : 500,
                        borderRadius: 'var(--radius-sm, 6px)',
                        cursor: 'pointer',
                        color: on ? '#000' : 'var(--text-high)',
                        background: on ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      {i.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(ModelSelectorDropdown);
