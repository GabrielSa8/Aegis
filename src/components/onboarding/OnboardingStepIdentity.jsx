import React from 'react';
import { User, Palette, Zap, Sparkles } from 'lucide-react';

const THEMES = [
  { id: 'nordic-moss', name: 'Nordic Moss', desc: 'Gris pizarra y verde musgo nórdico' },
  { id: 'tokyo-night', name: 'Tokyo Night', desc: 'Neón azul noche y magenta cyberpunk' },
  { id: 'oled-black', name: 'OLED Pure Black', desc: 'Negro puro 0 nits y alto contraste' },
  { id: 'amber-terminal', name: 'Amber Terminal', desc: 'Fósforo ámbar cálido estilo CRT retro' },
  { id: 'dracula', name: 'Dracula Dark', desc: 'Púrpura y cian gótico elegante' }
];

const STYLES = [
  { id: 'caveman', label: 'Caveman Full', desc: 'Ultra-comprimido, directo al comando o diff. Cero relleno.' },
  { id: 'technical', label: 'Técnico Conciso', desc: 'Preciso, sin cortesías, con notas arquitecturales clave.' },
  { id: 'detailed', label: 'Formativo', desc: 'Explicaciones paso a paso, contexto y razonamiento pedagógico.' }
];

export function OnboardingStepIdentity({
  operatorName,
  setOperatorName,
  operatorRole,
  setOperatorRole,
  responseStyle,
  setResponseStyle,
  selectedTheme,
  setSelectedTheme
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Sección Perfil del Operador */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-high)' }}>
          <User size={15} color="var(--primary)" />
          <span>Perfil del Operador Soberano</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.6rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
              Nombre o Alias
            </label>
            <input
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              placeholder="Gabriel"
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-high)',
                fontSize: '0.8rem',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
              Rol Principal
            </label>
            <input
              type="text"
              value={operatorRole}
              onChange={(e) => setOperatorRole(e.target.value)}
              placeholder="Ingeniero de Software"
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-high)',
                fontSize: '0.8rem',
                outline: 'none'
              }}
            />
          </div>
        </div>
      </div>

      {/* Estilo de Respuesta del Agente */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-high)' }}>
          <Zap size={15} color="var(--warning)" />
          <span>Estilo de Respuesta del Copiloto IA</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
          {STYLES.map((st) => {
            const active = responseStyle === st.id;
            return (
              <div
                key={st.id}
                onClick={() => setResponseStyle(st.id)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: active ? 'color-mix(in srgb, var(--primary) 12%, transparent)' : 'color-mix(in srgb, var(--bg-card) 40%, transparent)',
                  border: `1px solid ${active ? 'var(--primary)' : 'var(--border-color)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: active ? 'var(--primary)' : 'var(--text-high)', marginBottom: '2px' }}>
                  {st.label}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                  {st.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tema Visual */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-high)' }}>
          <Palette size={15} color="var(--accent)" />
          <span>Tema Visual de Cabina</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.45rem' }}>
          {THEMES.map((th) => {
            const active = selectedTheme === th.id;
            return (
              <div
                key={th.id}
                onClick={() => {
                  setSelectedTheme(th.id);
                  document.documentElement.setAttribute('data-theme', th.id);
                }}
                style={{
                  padding: '7px 9px',
                  borderRadius: 'var(--radius-sm)',
                  background: active ? 'color-mix(in srgb, var(--accent) 14%, transparent)' : 'color-mix(in srgb, var(--bg-card) 40%, transparent)',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border-color)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: active ? 'var(--accent)' : 'var(--text-high)' }}>
                  {th.name}
                </div>
                <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {th.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
