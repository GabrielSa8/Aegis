import { Keyboard, Command } from 'lucide-react';
import { ModalWrapper, TacticalButton } from '../ui';
import { MASTER_SHORTCUTS } from './settingsHelpers';

export function ShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Atajos Maestros de Teclado"
      icon={Keyboard}
      maxWidth="560px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <TacticalButton variant="secondary" size="sm" onClick={onClose}>
            Entendido
          </TacticalButton>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px 0' }}>
        <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>
          Controles rápidos para operar el Centro de Mando sin soltar las manos del teclado:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {MASTER_SHORTCUTS.map((sc) => (
            <div
              key={sc.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
                border: '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)',
                fontSize: '0.74rem',
                gap: '12px'
              }}
            >
              <span style={{ color: 'var(--text-high)', fontWeight: 500 }}>{sc.desc}</span>
              <kbd style={{
                background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
                border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
                padding: '3px 8px',
                borderRadius: '4px',
                color: 'var(--primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                fontWeight: 700,
                whiteSpace: 'nowrap'
              }}>
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </ModalWrapper>
  );
}
