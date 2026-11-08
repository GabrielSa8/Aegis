import { Sliders, Save, X, Search, Keyboard, Undo2, AlertTriangle } from 'lucide-react';
import { TacticalButton } from '../ui';
import { AEGIS_VERSION } from './settingsHelpers';

export default function SettingsHeader({
  saveStatus,
  onSave,
  onClose,
  searchQuery = '',
  setSearchQuery,
  onOpenShortcuts,
  isDirty = false,
  onDiscard
}) {
  return (
    <div className="settings-header-card" style={{
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
      <div className="settings-header-info" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
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
            <h2 className="settings-header-title" style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, color: 'var(--text-high)', whiteSpace: 'nowrap' }}>
              Centro de Configuración & Sistema
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
          <span className="settings-header-subtitle" style={{ fontSize: '0.68rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', whiteSpace: 'nowrap' }}>
            4 Macro-Hubs de control: Entorno, Pantalla, Motores IA y Datos del Sistema.
          </span>
        </div>
      </div>

      <div className="settings-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0, marginLeft: 'auto', flexWrap: 'wrap' }}>
        {/* Aclaración permanente de guardado */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 8px',
          borderRadius: 'var(--radius-sm)',
          background: isDirty ? 'color-mix(in srgb, var(--warning) 12%, transparent)' : 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
          border: `1px solid ${isDirty ? 'color-mix(in srgb, var(--warning) 30%, transparent)' : 'var(--border-color)'}`,
          fontSize: '0.66rem',
          color: isDirty ? 'var(--warning)' : 'var(--text-muted)',
          whiteSpace: 'nowrap'
        }}>
          <AlertTriangle size={12} color={isDirty ? 'var(--warning)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
          <span>Ningún cambio será realizado de forma permanente hasta no dar en guardar</span>
        </div>

        {/* Buscador táctico rápido de secciones/ajustes */}
        {setSearchQuery && (
          <div className="settings-search-bar" style={{
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

        {/* Indicador de cambios pendientes */}
        {isDirty && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            background: 'color-mix(in srgb, var(--accent, var(--primary)) 18%, transparent)',
            border: '1px solid color-mix(in srgb, var(--accent, var(--primary)) 40%, transparent)',
            fontSize: '0.68rem',
            color: 'var(--text-high)',
            fontWeight: 700
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--accent, var(--primary))',
              display: 'inline-block'
            }} />
            Cambios sin guardar
          </div>
        )}

        {/* Descartar cambios */}
        {isDirty && onDiscard && (
          <TacticalButton
            variant="ghost"
            size="sm"
            icon={Undo2}
            onClick={onDiscard}
            title="Descartar todos los cambios no guardados y restaurar valores previos"
          >
            Descartar
          </TacticalButton>
        )}

        {saveStatus && (
          <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {saveStatus}
          </span>
        )}

        <TacticalButton
          variant={isDirty ? "primary" : "secondary"}
          size="sm"
          icon={Save}
          onClick={onSave}
          style={{
            whiteSpace: 'nowrap',
            boxShadow: isDirty ? '0 0 12px color-mix(in srgb, var(--primary) 40%, transparent)' : 'none'
          }}
        >
          {isDirty ? 'Guardar Todo' : 'Guardado'}
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
