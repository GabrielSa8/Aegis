import { Check } from 'lucide-react';
import { THEMES, UI_SCALE_PRESETS } from './settingsHelpers';

export default function AppearanceSection({ config, currentTheme, onSelectTheme, onScaleChange }) {
  if (!config) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '780px' }}>
      <div>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 4px 0', color: '#fff' }}>
          Esquemas de Color Tácticos
        </h3>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
          Personaliza la paleta visual para optimizar el contraste y el confort de lectura.
        </p>
      </div>

      {/* Grid de Temas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
        {THEMES.map(theme => {
          const isSelected = currentTheme === theme.id;
          return (
            <div
              key={theme.id}
              onClick={() => onSelectTheme(theme.id)}
              style={{
                background: theme.bg,
                border: isSelected ? `2px solid ${theme.accent}` : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                cursor: 'pointer',
                transition: 'var(--transition)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '8px',
                boxShadow: isSelected ? `0 0 12px ${theme.accent}33` : 'none'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff' }}>
                    {theme.name}
                  </span>
                  {isSelected && <Check size={14} color={theme.accent} />}
                </div>
                <p style={{ fontSize: '0.7rem', color: '#9ca3af', margin: '4px 0 0 0', lineHeight: '1.15rem' }}>
                  {theme.desc}
                </p>
              </div>

              {/* Swatches */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: theme.bg, border: '1px solid #444' }} title="Fondo" />
                <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: theme.card, border: '1px solid #444' }} title="Superficie" />
                <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: theme.accent }} title="Acento" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Escala de Interfaz / Zoom DPI */}
      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '0.25rem' }}>
          Escala de Interfaz (Zoom DPI Proporcional)
        </span>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0 0 0.65rem 0' }}>
          Ajusta la densidad visual y tipográfica sin desbordar los límites de la ventana.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {UI_SCALE_PRESETS.map(scale => {
            const isSelected = Math.abs((config.uiScale || 1.0) - scale.val) < 0.02;
            return (
              <button
                key={scale.val}
                onClick={() => onScaleChange(scale.val)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: isSelected ? 'var(--primary-glow)' : 'rgba(255,255,255,0.03)',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  color: isSelected ? 'var(--text-high)' : 'var(--text-muted)',
                  fontSize: '0.74rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                {isSelected && <Check size={12} color="var(--primary)" />}
                <span>{scale.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
