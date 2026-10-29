import { Gauge, ExternalLink } from 'lucide-react';
import { BILLING_LINKS } from './settingsHelpers';

export default function AiBudgetSection({ config, setConfig, updateTokenBudget, onOpenExternal }) {
  if (!config) return null;
  const tokenBudget = config.tokenBudget || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '780px' }}>
      <div>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 4px 0', color: '#fff' }}>
          Hub de Motores IA & Presupuesto de Tokens
        </h3>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
          Controla qué agente ejecuta tus tareas y define topes para prevenir sobrecostos de API.
        </p>
      </div>

      {/* Selector de Agente */}
      <div className="form-group">
        <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Motor de Agente Activo</label>
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
      </div>

      {config.agentType === 'custom' && (
        <div className="form-group">
          <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Comando de Ejecución del Agente</label>
          <input
            type="text"
            value={config.agentCustomCmd || ''}
            onChange={(e) => setConfig({ ...config, agentCustomCmd: e.target.value })}
            placeholder="ej. /usr/local/bin/custom-agent --stream"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}
          />
        </div>
      )}

      {/* Presupuesto de Tokens */}
      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <Gauge size={14} color="var(--primary)" />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>
            Control de Presupuesto & Topes de Consumo
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <div className="form-group">
            <label style={{ fontSize: '0.7rem' }}>Límite Diario (Tokens)</label>
            <input
              type="number"
              value={tokenBudget.dailyLimit || 100000}
              onChange={(e) => updateTokenBudget({ dailyLimit: Number(e.target.value) })}
              style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)' }}
            />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.7rem' }}>Límite Semanal (Tokens)</label>
            <input
              type="number"
              value={tokenBudget.weeklyLimit || 500000}
              onChange={(e) => updateTokenBudget({ weeklyLimit: Number(e.target.value) })}
              style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)' }}
            />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.7rem' }}>Umbral de Alerta (%)</label>
            <input
              type="number"
              value={tokenBudget.warnThresholdPercent || 80}
              onChange={(e) => updateTokenBudget({ warnThresholdPercent: Number(e.target.value) })}
              style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)' }}
            />
          </div>
        </div>
      </div>

      {/* Consolas Oficiales de Facturación */}
      <div>
        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '6px' }}>
          Consolas Oficiales de Facturación y Cuotas
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '8px' }}>
          {BILLING_LINKS.map(link => (
            <div
              key={link.name}
              onClick={() => onOpenExternal(link.url)}
              style={{
                padding: '8px 10px',
                background: 'rgba(255,255,255,0.02)',
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
              <div>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#fff', display: 'block' }}>
                  {link.name}
                </span>
                <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                  {link.desc}
                </span>
              </div>
              <ExternalLink size={12} color="var(--primary)" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
