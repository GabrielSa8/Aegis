import { Sliders, Save, X, Search, Keyboard } from 'lucide-react';
import { TacticalButton } from '../ui';
import { AEGIS_VERSION } from './settingsHelpers';

export default function SettingsHeader({
  saveStatus,
  onSave,
  onClose,
  searchQuery = '',
  setSearchQuery,
  onOpenShortcuts
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.65rem 1.25rem',
      borderBottom: '1px solid var(--border-color)',
      background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
      flexShrink: 0,
      width: '100%',
      boxSizing: 'border-box',
      gap: '0.75rem',
      flexWrap: 'wrap'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
        <div style={{
          padding: '6px',
          borderRadius: 'var(--radius-sm)',
          background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Sliders size={18} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, color: 'var(--text-high)', whiteSpace: 'nowrap' }}>
              Centro de Configuración & Soberanía
            </h2>
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              color: 'var(--primary)',
              background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
              padding: '0.1rem 0.45rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
              whiteSpace: 'nowrap'
            }}>
              {AEGIS_VERSION}
            </span>
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', whiteSpace: 'nowrap' }}>
            4 Macro-Hubs de control: Entorno, Pantalla, Motores IA y Datos del Sistema.
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0, marginLeft: 'auto' }}>
        {/* Buscador táctico rápido de secciones/ajustes */}
        {setSearchQuery && (
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            minWidth: '180px'
          }}>
            <Search size={13} style={{ position: 'absolute', left: '8px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar parámetros..."
              style={{
                width: '100%',
                padding: '4px 8px 4px 26px',
                fontSize: '0.72rem',
                borderRadius: 'var(--radius-sm)',
                background: 'color-mix(in srgb, var(--bg-main) 60%, transparent)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-high)',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '0.7rem'
                }}
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* Botón rápido de Atajos Maestros */}
        {onOpenShortcuts && (
          <TacticalButton
            variant="ghost"
            size="sm"
            icon={Keyboard}
            onClick={onOpenShortcuts}
            title="Ver Atajos de Teclado (Cheat Sheet)"
          >
            Atajos
          </TacticalButton>
        )}

        {saveStatus && (
          <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {saveStatus}
          </span>
        )}

        <TacticalButton
          variant="primary"
          size="sm"
          icon={Save}
          onClick={onSave}
          style={{ whiteSpace: 'nowrap' }}
        >
          Guardar Todo
        </TacticalButton>

        {onClose && (
          <button
            onClick={onClose}
            className="btn btn-secondary btn-icon"
            style={{ width: '1.75rem', height: '1.75rem' }}
            title="Cerrar (Esc)"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
