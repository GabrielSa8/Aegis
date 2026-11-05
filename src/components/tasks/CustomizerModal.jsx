import { useState } from 'react';
import { Palette, Undo2, Save } from 'lucide-react';
import { ModalWrapper, TacticalButton } from '../ui';
import { NORDIC_PALETTE, CURATED_EMOJIS, resolveProjectTheme } from './taskHelpers';

export function CustomizerModal({ projects, customizations, onSave, onClose }) {
  const [draft, setDraft] = useState({ ...customizations });
  const [activePickerProj, setActivePickerProj] = useState(null);

  const handleUpdate = (proj, field, val) => {
    setDraft((prev) => ({
      ...prev,
      [proj]: {
        ...(prev[proj] || {}),
        [field]: val
      }
    }));
  };

  const handleResetAll = () => {
    setDraft({});
  };

  const handleSaveAndClose = () => {
    onSave(draft);
    onClose();
  };

  const footer = (
    <div className="customizer-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px', flexWrap: 'wrap' }}>
      <TacticalButton
        variant="ghost"
        size="xs"
        icon={Undo2}
        onClick={handleResetAll}
        className="customizer-reset-btn"
      >
        Restablecer Todo
      </TacticalButton>

      <div className="customizer-footer-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <TacticalButton
          variant="secondary"
          size="sm"
          onClick={onClose}
        >
          Cancelar
        </TacticalButton>
        <TacticalButton
          variant="primary"
          size="sm"
          icon={Save}
          onClick={handleSaveAndClose}
        >
          Guardar
        </TacticalButton>
      </div>
    </div>
  );

  return (
    <ModalWrapper
      isOpen={true}
      onClose={onClose}
      title="Personalizador de Proyectos & Contextos"
      subtitle="Haz clic en el emoji para abrir el selector rápido o elige un color de la paleta nórdica para cada proyecto."
      icon={Palette}
      maxWidth="620px"
      footer={footer}
    >
      <div className="customizer-projects-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {projects.map((proj) => {
          const currentTheme = resolveProjectTheme(proj, draft);
          const userCustom = draft[proj] || {};
          const currentColorId =
            userCustom.colorId || NORDIC_PALETTE.find((p) => p.color === currentTheme.color)?.id || 'emerald';
          const isPickerOpen = activePickerProj === proj;

          return (
            <div
              key={proj}
              className={`customizer-project-row ${isPickerOpen ? 'is-picker-open' : ''}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                background: 'color-mix(in srgb, var(--bg-card) 75%, transparent)',
                border: isPickerOpen ? '1px solid var(--primary)' : `1px solid ${currentTheme.border}`,
                borderRadius: '8px',
                overflow: 'hidden',
                transition: 'border-color 0.15s ease'
              }}
            >
              {/* Fila Principal */}
              <div
                className="customizer-project-main"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.85rem',
                  gap: '10px',
                  flexWrap: 'wrap'
                }}
              >
                {/* Badge Preview en Vivo */}
                <div className="customizer-badge-container" style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 auto', minWidth: '140px' }}>
                  <span
                    className="customizer-preview-badge"
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: currentTheme.color,
                      background: currentTheme.bg,
                      border: `1px solid ${currentTheme.border}`,
                      padding: '3px 9px',
                      borderRadius: '5px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: `0 0 8px ${currentTheme.border}`
                    }}
                  >
                    <span style={{ fontSize: '0.95rem' }}>{currentTheme.icon}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proj}</span>
                  </span>
                </div>

                {/* Controles: Botón Emoji Grande + Swatches de Color */}
                <div className="customizer-controls-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  {/* Botón de Emoji */}
                  <button
                    type="button"
                    onClick={() => setActivePickerProj(isPickerOpen ? null : proj)}
                    title="Haz clic para desplegar la cuadrícula de emojis"
                    className="customizer-emoji-trigger"
                    style={{
                      minWidth: '44px',
                      height: '34px',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: isPickerOpen ? 'color-mix(in srgb, var(--primary) 20%, transparent)' : 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
                      border: isPickerOpen ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                      fontSize: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: isPickerOpen ? '0 0 10px color-mix(in srgb, var(--primary) 40%, transparent)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {currentTheme.icon || '📁'}
                  </button>

                  {/* Swatches de Color Nórdicos */}
                  <div className="customizer-palette-swatches" style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                    {NORDIC_PALETTE.map((pal) => {
                      const isSelected = currentColorId === pal.id;
                      return (
                        <div
                          key={pal.id}
                          onClick={() => handleUpdate(proj, 'colorId', pal.id)}
                          title={pal.name}
                          className={`customizer-color-swatch ${isSelected ? 'is-selected' : ''}`}
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: pal.color,
                            cursor: 'pointer',
                            border: isSelected ? '2px solid var(--text-high)' : '1px solid var(--border-color)',
                            transform: isSelected ? 'scale(1.25)' : 'none',
                            boxShadow: isSelected ? `0 0 8px ${pal.color}` : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Cuadrícula Desplegable de Emojis */}
              {isPickerOpen && (
                <div
                  className="customizer-emoji-dropdown"
                  style={{
                    padding: '0.65rem 0.85rem',
                    background: 'color-mix(in srgb, var(--bg-card) 95%, transparent)',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ fontSize: '0.66rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Selecciona un emoji para {proj}:
                  </div>

                  <div
                    className="customizer-emoji-grid"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(32px, 1fr))',
                      gap: '4px'
                    }}
                  >
                    {CURATED_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          handleUpdate(proj, 'icon', emoji);
                          setActivePickerProj(null);
                        }}
                        className={`customizer-emoji-btn ${currentTheme.icon === emoji ? 'is-active' : ''}`}
                        style={{
                          height: '32px',
                          background: currentTheme.icon === emoji ? 'color-mix(in srgb, var(--primary) 25%, transparent)' : 'color-mix(in srgb, var(--text-high) 4%, transparent)',
                          border: currentTheme.icon === emoji ? '1px solid var(--primary)' : '1px solid transparent',
                          borderRadius: '4px',
                          fontSize: '1.15rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'transform 0.1s ease'
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  {/* Entrada directa opcional para pegar cualquier emoji */}
                  <div className="customizer-emoji-custom-input" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>O escribe/pega otro:</span>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="Emoji..."
                      value={userCustom.icon || ''}
                      onChange={(e) => handleUpdate(proj, 'icon', e.target.value)}
                      style={{
                        width: '60px',
                        height: '24px',
                        textAlign: 'center',
                        background: 'color-mix(in srgb, var(--bg-card) 70%, transparent)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        color: 'var(--text-high)',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ModalWrapper>
  );
}
export default CustomizerModal;
