import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { TacticalButton } from '../ui';

export default function UnsavedChangesModal({
  isOpen,
  onContinueEditing,
  onDiscardAndLeave,
  onSaveAndLeave
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 3000 }}>
      <div
        className="modal-content glass"
        style={{
          maxWidth: '460px',
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              background: 'color-mix(in srgb, var(--warning) 15%, transparent)',
              color: 'var(--warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '0.95rem',
                fontWeight: 700,
                color: 'var(--text-high)'
              }}
            >
              ¿Salir sin guardar los cambios?
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Tienes ajustes o plugins modificados sin persistir.
            </span>
          </div>
        </div>

        <p
          style={{
            margin: 0,
            fontSize: '0.76rem',
            color: 'var(--text-muted)',
            lineHeight: 1.45
          }}
        >
          Ningún cambio será realizado de forma permanente hasta no dar en guardar. Si sales ahora, los cambios no se verán en tu sistema y se descartarán.
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.5rem',
            marginTop: '0.5rem',
            flexWrap: 'wrap'
          }}
        >
          <TacticalButton variant="ghost" size="sm" onClick={onContinueEditing}>
            Continuar editando
          </TacticalButton>

          <TacticalButton
            variant="secondary"
            size="sm"
            style={{ color: 'var(--danger)' }}
            onClick={onDiscardAndLeave}
          >
            Salir sin guardar
          </TacticalButton>

          <TacticalButton variant="primary" size="sm" onClick={onSaveAndLeave}>
            Guardar y salir
          </TacticalButton>
        </div>
      </div>
    </div>
  );
}
