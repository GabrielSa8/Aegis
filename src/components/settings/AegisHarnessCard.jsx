import React from 'react';
import { Shield, Zap, Scissors, RefreshCw, Layers } from 'lucide-react';

const HARNESS_PILLARS = [
  {
    key: 'dynamicStepScaling',
    icon: Layers,
    title: 'Escalado Dinámico por Paso (L1 ⇄ L2 ⇄ L3)',
    desc: 'Evalúa cada subtarea en tiempo real: inicia en L1 (Flash) para pasos simples, sube a L2/L3 en pasos complejos y vuelve a L1 al finalizar, sin cambiar el nivel manualmente.'
  },
  {
    key: 'aciContextPruning',
    icon: Scissors,
    title: 'Pre-Filtro ACI & Repo-Map Compacto',
    desc: 'Poda lockfiles (Cargo.lock, package-lock.json), trunca logs masivos conservando errores clave y alinea el prefijo estático para ~80% de hit en KV-Cache.'
  },
  {
    key: 'enforceSurgicalEdits',
    icon: Zap,
    title: 'Contrato de Edición Quirúrgica',
    desc: 'Evita que el modelo reescriba archivos enteros innecesariamente; fuerza cambios por bloques puntuales y sin relleno conversacional.'
  },
  {
    key: 'autoHealEscalation',
    icon: RefreshCw,
    title: 'Verificador Determinista & Auto-Heal',
    desc: 'Valida la salida en Rust (<5ms). Si una tarea falla en L1 o L2, escala automáticamente al siguiente nivel y reintenta sin intervención manual.'
  }
];

export default function AegisHarnessCard({ config, setConfig }) {
  if (!config) return null;

  const harness = config.harness || {
    enabled: true,
    dynamicStepScaling: true,
    aciContextPruning: true,
    enforceSurgicalEdits: true,
    autoHealEscalation: true
  };

  const updateHarnessField = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      harness: {
        ...(prev.harness || {
          enabled: true,
          dynamicStepScaling: true,
          aciContextPruning: true,
          enforceSurgicalEdits: true,
          autoHealEscalation: true
        }),
        [field]: value
      }
    }));
  };

  return (
    <div
      style={{
        background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
        padding: '14px 16px',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${harness.enabled ? 'color-mix(in srgb, var(--primary) 45%, var(--border-color))' : 'var(--border-color)'}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      {/* Cabecera Principal con Switch Maestro */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              background: harness.enabled
                ? 'color-mix(in srgb, var(--primary) 15%, transparent)'
                : 'color-mix(in srgb, var(--border-color) 30%, transparent)',
              color: harness.enabled ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            <Shield size={16} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-high)' }}>
                Aegis Adaptive Harness (6 Pilares)
              </span>
              <span
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-sm)',
                  background: harness.enabled
                    ? 'color-mix(in srgb, var(--primary) 15%, transparent)'
                    : 'color-mix(in srgb, var(--border-color) 30%, transparent)',
                  color: harness.enabled ? 'var(--primary)' : 'var(--text-muted)',
                  fontFamily: 'monospace'
                }}
              >
                {harness.enabled ? 'ACTIVO · AUTO L1⇄L3' : 'BYPASS · HARNESS PROPIO / MANUAL'}
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.70rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
              Optimiza rendimiento, poda tokens innecesarios y gestiona el nivel de cada tarea automáticamente. Desactívalo si prefieres usar tu propio harness externo o control manual fijo.
            </p>
          </div>
        </div>

        <label className="tactical-switch" title="Activar o desactivar Aegis Adaptive Harness">
          <input
            type="checkbox"
            checked={Boolean(harness.enabled)}
            onChange={(e) => updateHarnessField('enabled', e.target.checked)}
          />
        </label>
      </div>

      {/* Sub-controles de los Pilares cuando está activo */}
      {harness.enabled && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '8px',
            paddingTop: '6px',
            borderTop: '1px solid var(--border-color)'
          }}
        >
          {HARNESS_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            const checked = harness[pillar.key] !== false;
            return (
              <div
                key={pillar.key}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'color-mix(in srgb, var(--bg-card) 80%, transparent)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <Icon size={14} style={{ color: checked ? 'var(--primary)' : 'var(--text-muted)', marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-high)' }}>
                      {pillar.title}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.35, marginTop: '2px' }}>
                      {pillar.desc}
                    </div>
                  </div>
                </div>

                <label className="tactical-switch" style={{ flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => updateHarnessField(pillar.key, e.target.checked)}
                  />
                </label>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
