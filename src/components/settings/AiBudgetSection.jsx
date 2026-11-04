import { Gauge, ExternalLink, Bot, ShieldAlert } from 'lucide-react';
import { BILLING_LINKS } from './settingsHelpers';
import FallbackChainSection from './FallbackChainSection';

export default function AiBudgetSection({ config, setConfig, updateTokenBudget, onOpenExternal }) {
  if (!config) return null;
  const tokenBudget = config.tokenBudget || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Cabecera */}
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        <h3 style={{ fontSize: '0.88rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-high)' }}>
          Hub de Motores IA & Presupuesto de Tokens
        </h3>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
          Controla qué agente ejecuta tus tareas en segundo plano, la cadena resiliente de respaldo y los topes de consumo API.
        </p>
      </div>

      {/* Grid de 2 Columnas Tácticas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '16px',
        alignItems: 'start'
      }}>
        {/* Columna Izquierda: Motores IA + Cadena Fallback */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Selector de Agente Principal */}
          <div style={{
            background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bot size={15} color="var(--primary)" />
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)' }}>
                Motor de Agente Activo Primario
              </label>
            </div>
            <select
              value={config.agentType || 'agy'}
              onChange={(e) => setConfig({ ...config, agentType: e.target.value })}
              style={{ fontSize: '0.78rem' }}
            >
              <option value="agy">Google Antigravity CLI (agy) — Integrado nativo</option>
              <option value="claude">Claude Code (claude)</option>
              <option value="ollama">Ollama Local (Offline / Privado)</option>
              <option value="custom">Comando Shell Personalizado</option>
            </select>
            <p style={{ fontSize: '0.67rem', color: 'var(--text-muted)', margin: 0 }}>
              Antigravity opera localmente con auto-aprobación y razonamiento avanzado.
            </p>

            {config.agentType === 'custom' && (
              <div className="form-group" style={{ marginTop: '6px', marginBottom: 0 }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  Comando de Ejecución del Agente
                </label>
                <input
                  type="text"
                  value={config.agentCustomCmd || ''}
                  onChange={(e) => setConfig({ ...config, agentCustomCmd: e.target.value })}
                  placeholder="ej. /usr/local/bin/custom-agent --stream"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}
                />
              </div>
            )}
          </div>

          {/* Cadena Fallback de Proveedores */}
          <FallbackChainSection config={config} setConfig={setConfig} />
        </div>

        {/* Columna Derecha: Presupuesto & Facturación */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Presupuesto de Tokens */}
          <div style={{
            background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Gauge size={15} color="var(--primary)" />
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-high)' }}>
                Control de Presupuesto & Topes de Consumo
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
              gap: '10px'
            }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 600 }}>Diario (Tokens)</label>
                <input
                  type="number"
                  value={tokenBudget.dailyLimit || 100000}
                  onChange={(e) => updateTokenBudget({ dailyLimit: Number(e.target.value) })}
                  style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)' }}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 600 }}>Semanal (Tokens)</label>
                <input
                  type="number"
                  value={tokenBudget.weeklyLimit || 500000}
                  onChange={(e) => updateTokenBudget({ weeklyLimit: Number(e.target.value) })}
                  style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)' }}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 600 }}>Umbral Alerta (%)</label>
                <input
                  type="number"
                  value={tokenBudget.warnThresholdPercent || 80}
                  onChange={(e) => updateTokenBudget({ warnThresholdPercent: Number(e.target.value) })}
                  style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)' }}
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 8px',
              borderRadius: 'var(--radius-sm)',
              background: 'color-mix(in srgb, var(--bg-main) 40%, transparent)',
              fontSize: '0.66rem',
              color: 'var(--text-muted)'
            }}>
              <ShieldAlert size={12} color="var(--warning)" />
              <span>Avisos preventivos en cabecera antes de superar el límite semanal.</span>
            </div>
          </div>

          {/* Consolas Oficiales de Facturación */}
          <div style={{
            background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-high)' }}>
              Consolas Oficiales de Facturación y Cuotas
            </span>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '8px'
            }}>
              {BILLING_LINKS.map((link) => (
                <div
                  key={link.name}
                  onClick={() => onOpenExternal(link.url)}
                  style={{
                    padding: '8px 10px',
                    background: 'color-mix(in srgb, var(--bg-main) 50%, transparent)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-high)', display: 'block' }}>
                      {link.name}
                    </span>
                    <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                      {link.desc}
                    </span>
                  </div>
                  <ExternalLink size={12} color="var(--primary)" style={{ flexShrink: 0, marginLeft: '6px' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
