import { Sliders, Save, X } from 'lucide-react';
import { TacticalButton } from '../ui';

export default function SettingsHeader({ saveStatus, onSave, onClose }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.65rem 1.25rem',
      borderBottom: '1px solid var(--border-color)',
      background: 'rgba(0,0,0,0.25)',
      flexShrink: 0,
      width: '100%',
      boxSizing: 'border-box',
      gap: '0.75rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
        <Sliders size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, color: '#fff', whiteSpace: 'nowrap' }}>
              Centro de Configuración & Soberanía del Sistema
            </h2>
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              color: 'var(--primary)',
              background: 'var(--primary-glow)',
              padding: '0.1rem 0.4rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--primary)',
              whiteSpace: 'nowrap'
            }}>
              v2.8.0
            </span>
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', whiteSpace: 'nowrap' }}>
            Ajustes globales, identidad, rutas de datos soberanas y presupuesto de recursos.
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
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
