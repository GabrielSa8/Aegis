import React from 'react';
import { BookOpen, Cpu, Terminal, Plus, Shield, Puzzle } from 'lucide-react';
import { TacticalButton } from '../ui';

export function OnboardingStepDiscovery({
  inspection,
  loadingInspection,
  selectedVault,
  setSelectedVault,
  selectedEngine,
  setSelectedEngine,
  selectedEditor,
  setSelectedEditor,
  selectedTerminal,
  setSelectedTerminal,
  harnessEnabled = true,
  setHarnessEnabled,
  onCreateDefaultVault,
  creatingVault
}) {
  if (loadingInspection) {
    return (
      <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div className="animate-spin" style={{ width: '24px', height: '24px', border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 10px auto' }} />
        <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>Inspeccionando hardware, bóvedas y herramientas del sistema...</p>
      </div>
    );
  }

  const vaults = inspection?.vaults || [];
  const engines = inspection?.aiEngines || inspection?.ai_engines || [];
  const steam = inspection?.steam;
  const editors = inspection?.editors || [];
  const terminals = inspection?.terminals || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
      {/* 1. Bóveda Obsidian Auto-Detectada */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'color-mix(in srgb, var(--bg-card) 50%, transparent)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-high)' }}>
            <BookOpen size={15} color="var(--primary)" />
            <span>Bóveda de Obsidian (Segundo Cerebro)</span>
          </div>

          <TacticalButton
            variant="secondary"
            size="xs"
            icon={Plus}
            loading={creatingVault}
            onClick={onCreateDefaultVault}
            title="Crear una nueva bóveda limpia en ~/Documents/Aegis Vault"
          >
            {creatingVault ? 'Creando...' : 'Crear Bóveda Nueva'}
          </TacticalButton>
        </div>

        {vaults.length === 0 ? (
          <div style={{ padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'color-mix(in srgb, var(--warning) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--warning) 25%, transparent)', color: 'var(--warning)', fontSize: '0.74rem' }}>
            No se detectaron bóvedas existentes. Pulsa el botón superior para inicializar una automáticamente en tu carpeta personal.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {vaults.map((v) => {
              const active = selectedVault === v.path;
              return (
                <div
                  key={v.path}
                  onClick={() => setSelectedVault(v.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: active ? 'color-mix(in srgb, var(--primary) 12%, transparent)' : 'color-mix(in srgb, var(--bg-card) 70%, transparent)',
                    border: `1px solid ${active ? 'var(--primary)' : 'var(--border-color)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="radio"
                      name="selected_vault"
                      checked={active}
                      onChange={() => setSelectedVault(v.path)}
                      style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: active ? 'var(--primary)' : 'var(--text-high)' }}>
                        {v.name}
                      </div>
                      <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {v.path}
                      </div>
                    </div>
                  </div>

                  <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'color-mix(in srgb, var(--primary) 15%, transparent)', color: 'var(--primary)', fontWeight: 600 }}>
                    {v.noteCount} notas
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Motores IA Detectados */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'color-mix(in srgb, var(--bg-card) 50%, transparent)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-high)' }}>
          <Cpu size={15} color="var(--warning)" />
          <span>Motores IA y Copilotos Detectados</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
          {engines.map((eng) => {
            const active = selectedEngine === eng.id;
            return (
              <div
                key={eng.id}
                onClick={() => setSelectedEngine(eng.id)}
                style={{
                  padding: '7px 9px',
                  borderRadius: 'var(--radius-sm)',
                  background: active ? 'color-mix(in srgb, var(--warning) 12%, transparent)' : 'color-mix(in srgb, var(--bg-card) 70%, transparent)',
                  border: `1px solid ${active ? 'var(--warning)' : 'var(--border-color)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontSize: '0.77rem', fontWeight: 700, color: active ? 'var(--warning)' : 'var(--text-high)' }}>
                    {eng.name}
                  </span>
                  {eng.installed ? (
                    <span style={{ fontSize: '0.62rem', color: 'var(--primary)', fontWeight: 700 }}>✓ Detectado</span>
                  ) : (
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Configurable</span>
                  )}
                </div>
                <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                  {eng.accountEmail ? (
                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                      {eng.accountEmail} {eng.planType ? `(${eng.planType})` : ''}
                    </span>
                  ) : (
                    eng.details || (eng.installed ? 'Binario disponible en PATH' : 'Sin binario')
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 2b. Switch Aegis Adaptive Harness (6 Pilares — Auto L1⇄L3) */}
        <div
          style={{
            marginTop: '4px',
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
            background: harnessEnabled
              ? 'color-mix(in srgb, var(--primary) 10%, transparent)'
              : 'color-mix(in srgb, var(--bg-card) 70%, transparent)',
            border: `1px solid ${harnessEnabled ? 'color-mix(in srgb, var(--primary) 40%, transparent)' : 'var(--border-color)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <Shield size={16} style={{ color: harnessEnabled ? 'var(--primary)' : 'var(--text-muted)', marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-high)' }}>
                  Aegis Adaptive Harness (Auto-Nivel L1 ⇄ L2 ⇄ L3)
                </span>
                <span
                  style={{
                    fontSize: '0.60rem',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: 'var(--radius-sm)',
                    background: harnessEnabled
                      ? 'color-mix(in srgb, var(--primary) 18%, transparent)'
                      : 'color-mix(in srgb, var(--border-color) 40%, transparent)',
                    color: harnessEnabled ? 'var(--primary)' : 'var(--text-muted)'
                  }}
                >
                  {harnessEnabled ? 'RECOMENDADO · ACTIVO' : 'MODO MANUAL / EXTERNO'}
                </span>
              </div>
              <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', lineHeight: 1.35, marginTop: '2px' }}>
                No necesitas cambiar el nivel manualmente: detecta la complejidad de cada paso en tiempo real (inicia en L1 rápido, sube a L2/L3 si el paso es complejo y baja a L1 si vuelve a ser simple), poda tokens innecesarios y auto-verifica salidas. Desactívalo si prefieres usar tu propio harness.
              </div>
            </div>
          </div>

          <label className="tactical-switch" style={{ flexShrink: 0 }}>
            <input
              type="checkbox"
              checked={Boolean(harnessEnabled)}
              onChange={(e) => setHarnessEnabled && setHarnessEnabled(e.target.checked)}
            />
            <span className="tactical-slider" />
          </label>
        </div>
      </div>

      {/* 3. Entorno de Desarrollo & Extensiones */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.6rem' }}>
        {/* Editores y Terminales */}
        <div style={{ background: 'color-mix(in srgb, var(--bg-card) 50%, transparent)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-high)', marginBottom: '6px' }}>
            <Terminal size={14} color="var(--accent)" />
            <span>Herramientas Dev en PATH</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {editors.filter((e) => e.installed).map((e) => (
              <span key={e.id} style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}>
                {e.name}
              </span>
            ))}
            {terminals.filter((t) => t.installed).map((t) => (
              <span key={t.id} style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'color-mix(in srgb, var(--primary) 12%, transparent)', color: 'var(--primary)' }}>
                {t.name}
              </span>
            ))}
          </div>
        </div>

        {/* Arquitectura Modular & Modo Mínimo */}
        <div style={{ background: 'color-mix(in srgb, var(--bg-card) 50%, transparent)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-high)', marginBottom: '4px' }}>
            <Puzzle size={14} color="var(--primary)" />
            <span>Arquitectura Modular</span>
          </div>
          <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
            Aegis arranca en <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Modo Mínimo (~18 MB RAM)</span>. En <span style={{ color: 'var(--text-high)', fontWeight: 600 }}>Ajustes ➔ Plugins</span> podrás instalar en 1-clic lo que necesites (Finanzas, Tareas, Centinela, Flota Git o Gaming).
          </div>
        </div>
      </div>
    </div>
  );
}
