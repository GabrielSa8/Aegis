import { useState } from 'react';
import { Palette, Undo2, Save, X } from 'lucide-react';
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <TacticalButton
        variant="ghost"
        size="xs"
        icon={Undo2}
        onClick={handleResetAll}
      >
        Restablecer Todo
      </TacticalButton>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {projects.map((proj) => {
          const currentTheme = resolveProjectTheme(proj, draft);
          const userCustom = draft[proj] || {};
          const currentColorId =
            userCustom.colorId || NORDIC_PALETTE.find((p) => p.color === currentTheme.color)?.id || 'emerald';
          const isPickerOpen = activePickerProj === proj;

          return (
            <div
              key={proj}
              style={{
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(0, 0, 0, 0.38)',
                border: isPickerOpen ? '1px solid #34d399' : `1px solid ${currentTheme.border}`,
                borderRadius: '8px',
                overflow: 'hidden',
                transition: 'border-color 0.15s ease'
              }}
            >
              {/* Fila Principal */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.85rem',
                  gap: '10px'
                }}
              >
                {/* Badge Preview en Vivo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 auto', minWidth: '160px' }}>
                  <span
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
                    <span>{proj}</span>
                  </span>
                </div>

                {/* Controles: Botón Emoji Grande + Swatches de Color */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  {/* Botón de Emoji */}
                  <button
                    type="button"
                    onClick={() => setActivePickerProj(isPickerOpen ? null : proj)}
                    title="Haz clic para desplegar la cuadrícula de emojis"
                    style={{
                      minWidth: '44px',
                      height: '34px',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: isPickerOpen ? 'rgba(52, 211, 153, 0.2)' : 'rgba(0, 0, 0, 0.5)',
                      border: isPickerOpen ? '1.5px solid #34d399' : '1px solid var(--border-color)',
                      fontSize: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: isPickerOpen ? '0 0 10px rgba(52, 211, 153, 0.4)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {currentTheme.icon || '📁'}
                  </button>

                  {/* Swatches de Color Nórdicos */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {NORDIC_PALETTE.map((pal) => {
                      const isSelected = currentColorId === pal.id;
                      return (
                        <div
                          key={pal.id}
                          onClick={() => handleUpdate(proj, 'colorId', pal.id)}
                          title={pal.name}
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: pal.color,
                            cursor: 'pointer',
                            border: isSelected ? '2px solid #ffffff' : '1px solid rgba(0, 0, 0, 0.5)',
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
                  style={{
                    padding: '0.65rem 0.85rem',
                    background: 'rgba(0, 0, 0, 0.55)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ fontSize: '0.66rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>
                    Selecciona un emoji para {proj}:
                  </div>

                  <div
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
                        style={{
                          height: '32px',
                          background: currentTheme.icon === emoji ? 'rgba(52, 211, 153, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                          border: currentTheme.icon === emoji ? '1px solid #34d399' : '1px solid transparent',
                          borderRadius: '4px',
                          fontSize: '1.15rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'transform 0.1s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'none';
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  {/* Entrada directa opcional para pegar cualquier emoji */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
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
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        color: '#f1f5f9',
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
