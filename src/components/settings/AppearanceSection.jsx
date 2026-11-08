import { Check, Sparkles } from 'lucide-react';
import { THEMES, UI_SCALE_PRESETS } from './settingsHelpers';

export default function AppearanceSection({ config, currentTheme, onSelectTheme, onScaleChange }) {
  if (!config) return null;

  const activeThemeId = config.theme || currentTheme;
  const currentScale = config.uiScale || 1.0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Cabecera */}
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        <h3 style={{ fontSize: '0.88rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-high)' }}>
          Esquemas de Color & Escala
        </h3>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
          Personaliza la paleta visual para optimizar el contraste de cabina y el confort de lectura en cualquier pantalla.
        </p>
      </div>

      {/* Grid Fluido de Temas (100% Ancho) */}
      <div>
        <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
          Paleta Visual de Alta Densidad ({THEMES.length} Esquemas de Contraste)
        </label>
        <div className="settings-themes-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px'
        }}>
          {THEMES.map((theme) => {
            const isSelected = activeThemeId === theme.id;
            return (
              <div
                key={theme.id}
                onClick={() => onSelectTheme(theme.id)}
                className="settings-theme-card"
                style={{
                  background: theme.bg,
                  border: isSelected ? `2px solid ${theme.accent}` : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '10px',
                  boxShadow: isSelected ? `0 0 16px ${theme.accent}33` : 'none',
                  minHeight: '120px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-high)' }}>
                      {theme.name}
                    </span>
                    {isSelected && <Check size={14} color={theme.accent} />}
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '6px 0 0 0', lineHeight: '1.25' }}>
                    {theme.desc}
                  </p>
                </div>

                {/* Swatches de Muestra */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: 'auto' }}>
                  <span
                    style={{ width: '16px', height: '16px', borderRadius: '50%', background: theme.bg, border: '1px solid color-mix(in srgb, var(--border-color) 60%, transparent)' }}
                    title="Color de Fondo (Canvas)"
                  />
                  <span
                    style={{ width: '16px', height: '16px', borderRadius: '50%', background: theme.card, border: '1px solid color-mix(in srgb, var(--border-color) 60%, transparent)' }}
                    title="Color de Superficie (Card)"
                  />
                  <span
                    style={{ width: '16px', height: '16px', borderRadius: '50%', background: theme.accent }}
                    title="Acento Primario"
                  />
                  {isSelected && (
                    <span style={{
                      marginLeft: 'auto',
                      fontSize: '0.62rem',
                      fontFamily: 'var(--font-mono)',
                      color: theme.accent,
                      fontWeight: 700
                    }}>
                      Activo
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Escala de Interfaz / Zoom DPI */}
      <div style={{
        background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
        padding: '14px 16px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
          <div>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-high)', display: 'block' }}>
              Escala de Interfaz (Zoom DPI Proporcional)
            </span>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Ajusta la densidad visual y tipográfica general de Aegis de forma proporcional.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={13} color="var(--primary)" />
            <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>
              Actual: {Math.round(currentScale * 100)}%
            </span>
          </div>
        </div>

        <div className="settings-scale-presets" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
          {UI_SCALE_PRESETS.map((scale) => {
            const isSelected = Math.abs(currentScale - scale.val) < 0.02;
            return (
              <button
                key={scale.val}
                type="button"
                onClick={() => onScaleChange(scale.val)}
                className="settings-scale-btn"
                style={{
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: isSelected
                    ? 'color-mix(in srgb, var(--primary) 15%, transparent)'
                    : 'color-mix(in srgb, var(--bg-main) 50%, transparent)',
                  border: isSelected
                    ? '1px solid var(--primary)'
                    : '1px solid var(--border-color)',
                  color: isSelected ? 'var(--text-high)' : 'var(--text-muted)',
                  fontSize: '0.74rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
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
