import React, { memo } from 'react';
import { Activity, Clock, ShieldCheck, Zap, Brain, Sparkles, ExternalLink } from 'lucide-react';
import { openUrl } from '@tauri-apps/plugin-opener';

const FAMILY_ICONS = {
  'Gemini Models': Zap,
  'Claude and GPT models': Sparkles,
  'Gemini 4 Argon': Brain
};

const FAMILY_BADGES = {
  'Gemini Models': 'Flash & Low Latency',
  'Claude and GPT models': 'Sonnet & Open-Weights',
  'Gemini 4 Argon': 'Razonamiento Profundo'
};

const PROVIDER_LABELS = {
  agy: 'Google Antigravity',
  claude: 'Anthropic Claude Code',
  anthropic: 'Anthropic Claude Code',
  codex: 'OpenAI Codex',
  openai: 'OpenAI Platform',
  ollama: 'Ollama Local',
  deepseek: 'DeepSeek',
  openrouter: 'OpenRouter Platform',
  custom: 'CLI Local Personalizado'
};

const PROVIDER_DASHBOARD_URLS = {
  agy: 'https://aistudio.google.com/app/plan_information',
  claude: 'https://claude.ai/settings/usage',
  anthropic: 'https://claude.ai/settings/usage',
  codex: 'https://platform.openai.com/usage',
  openai: 'https://platform.openai.com/usage',
  deepseek: 'https://platform.deepseek.com/usage',
  openrouter: 'https://openrouter.ai/credits'
};

function getBarGradient(percent) {
  const color = percent >= 50
    ? 'var(--color-success, #10b981)'
    : percent >= 20
      ? 'var(--color-warning, #f59e0b)'
      : 'var(--color-danger, #ef4444)';
  return {
    background: `linear-gradient(90deg, ${color} 0%, color-mix(in srgb, ${color} 80%, white) 50%, ${color} 100%)`,
    shadow: `0 0 10px color-mix(in srgb, ${color} 40%, transparent)`,
    badgeColor: color,
    badgeBg: `color-mix(in srgb, ${color} 12%, transparent)`,
    badgeBorder: `color-mix(in srgb, ${color} 30%, transparent)`
  };
}

function UsageQuotaCard({ quotas: rawQuotas, cardData, provider: rawProvider }) {
  const quotas = rawQuotas || cardData?.quotas || [];
  const provider = rawProvider || cardData?.provider || 'agy';

  const groups = {};
  for (const q of quotas) {
    if (!groups[q.family]) groups[q.family] = [];
    groups[q.family].push(q);
  }

  const providerLabel = PROVIDER_LABELS[provider] || (provider ? provider.toUpperCase() : 'Google Antigravity');
  const dashboardUrl = PROVIDER_DASHBOARD_URLS[provider] || null;

  const handleOpenDashboard = (e) => {
    e.preventDefault();
    if (!dashboardUrl) return;
    openUrl(dashboardUrl).catch(() => window.open(dashboardUrl, '_blank'));
  };

  return (
    <div style={{
      margin: '8px 0',
      borderRadius: 'var(--radius-md, 8px)',
      background: 'color-mix(in srgb, var(--bg-card) 95%, black)',
      border: '1px solid var(--border-color)',
      borderLeft: '4px solid var(--primary)',
      padding: '12px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.28)'
    }}>
      {/* Cabecera Táctica de la Tarjeta */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            padding: '4px',
            borderRadius: '5px',
            background: 'color-mix(in srgb, var(--primary) 14%, transparent)',
            border: '1px solid color-mix(in srgb, var(--primary) 35%, transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Activity size={14} color="var(--primary)" />
          </div>
          <div>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-high)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
              Cuotas y Telemetría del Proveedor
            </span>
            <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
              Motor activo · {providerLabel}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--primary)',
            boxShadow: '0 0 8px var(--primary)',
            animation: 'pulse 2s infinite'
          }} />
          <span style={{ fontSize: '0.64rem', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', color: 'var(--primary)', letterSpacing: '0.04em' }}>
            [ EN VIVO ]
          </span>
        </div>
      </div>

      {/* Lista de Grupos o Estado de Telemetría */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {Object.keys(groups).length === 0 ? (
          <div style={{
            padding: '12px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            fontSize: '0.74rem',
            color: 'var(--text-muted)'
          }}>
            {cardData?.raw ? (
              <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.70rem', color: 'var(--text-high)', whiteSpace: 'pre-wrap' }}>
                {cardData.raw.trim()}
              </pre>
            ) : (
              <span>Sesión activa en {providerLabel}. Consulta los límites en la consola web oficial del proveedor.</span>
            )}
          </div>
        ) : (
          Object.entries(groups).map(([family, qList]) => {
            const FamilyIcon = FAMILY_ICONS[family] || Zap;
            const badgeText = FAMILY_BADGES[family] || 'Modelos';

            return (
              <div key={family} style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '6px',
                padding: '9px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FamilyIcon size={13} color="var(--primary)" />
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-high)' }}>
                      {family}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.60rem',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono, monospace)'
                  }}>
                    {badgeText}
                  </span>
                </div>

                {/* Renglones de Límites */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {qList.map((item, idx) => {
                    const styleConfig = getBarGradient(item.percent);
                    const isTextMetric = item.isText || typeof item.percent !== 'number' || isNaN(item.percent);

                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.70rem' }}>
                          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                            {item.limitType}
                          </span>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isTextMetric ? (
                              <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, fontSize: '0.70rem', color: 'var(--primary)' }}>
                                {item.reset}
                              </span>
                            ) : (
                              <>
                                {item.reset && (
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-muted)', fontSize: '0.62rem' }}>
                                    <Clock size={10} />
                                    <span>{item.reset}</span>
                                  </span>
                                )}
                                <span style={{
                                  fontFamily: 'var(--font-mono, monospace)',
                                  fontWeight: 700,
                                  fontSize: '0.68rem',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: styleConfig.badgeBg,
                                  border: `1px solid ${styleConfig.badgeBorder}`,
                                  color: styleConfig.badgeColor
                                }}>
                                  {item.percent}% restante
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* ⚡ Barra de Carga Líquida con Gradiente Semántico */}
                        {!isTextMetric && (
                          <div className="liquid-progress-container" style={{ height: '6px' }}>
                            <div
                              className="liquid-progress-fill"
                              style={{
                                width: `${Math.max(2, Math.min(100, item.percent))}%`,
                                background: styleConfig.background,
                                boxShadow: styleConfig.shadow
                              }}
                            >
                              <div className="liquid-progress-shimmer" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pie de Página */}
      <div style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        paddingTop: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        fontSize: '0.64rem',
        color: 'var(--text-muted)'
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ShieldCheck size={11} color="var(--primary)" />
          <span>Límites calculados en ventanas de protección del motor.</span>
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {dashboardUrl && (
            <button
              type="button"
              onClick={handleOpenDashboard}
              style={{
                background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
                border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
                color: 'var(--primary)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-xs)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.64rem',
                fontWeight: 700
              }}
              title="Abrir panel oficial de uso y suscripción en el navegador"
            >
              <span>Ver Cuota Oficial</span>
              <ExternalLink size={10} />
            </button>
          )}
          <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>/usage</span>
        </div>
      </div>
    </div>
  );
}

export default memo(UsageQuotaCard);
