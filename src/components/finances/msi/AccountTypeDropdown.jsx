import React, { useState, useRef, useEffect } from 'react';
import { CreditCard, Wallet, Banknote, Coins, ChevronDown, ChevronUp, Check } from 'lucide-react';

const ACCOUNT_TYPES = [
  { id: 'debit', label: 'Débito', desc: 'Cuenta bancaria o tarjeta de débito', icon: Wallet, color: 'var(--primary)' },
  { id: 'credit', label: 'Crédito', desc: 'Tarjeta de crédito con corte y MSI', icon: CreditCard, color: 'var(--accent, var(--primary))' },
  { id: 'cash', label: 'Efectivo', desc: 'Dinero físico en billetera o caja', icon: Banknote, color: 'var(--success, var(--primary))' },
  { id: 'crypto', label: 'Cripto', desc: 'Billetera digital o criptoactivos', icon: Coins, color: 'var(--warning, var(--primary))' }
];

export default function AccountTypeDropdown({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selected = ACCOUNT_TYPES.find((t) => t.id === value) || ACCOUNT_TYPES[0];
  const Icon = selected.icon;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', marginTop: '2px' }}>
      {/* Botón Disparador Táctico */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="tactical-select-trigger"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '6px 10px',
          background: 'rgba(0, 0, 0, 0.3)',
          border: `1px solid ${isOpen ? 'var(--accent, var(--primary))' : 'var(--border-color)'}`,
          borderRadius: 'var(--radius-sm, 6px)',
          color: 'var(--text-high)',
          cursor: 'pointer',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'all 0.16s ease'
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <div
            style={{
              width: '22px',
              height: '22px',
              borderRadius: 'var(--radius-sm, 5px)',
              background: `color-mix(in srgb, ${selected.color} 18%, transparent)`,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Icon size={12} style={{ color: selected.color }} />
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-high)' }}>
            {selected.label}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
          <span style={{ fontSize: '0.66rem', opacity: 0.8 }} className="account-type-desc-hint">
            {selected.desc}
          </span>
          {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </button>

      {/* Popover Menú Desplegable */}
      {isOpen && (
        <div
          role="listbox"
          className="tactical-select-popover no-scrollbar"
          style={{
            position: 'absolute',
            top: 'calc(100% + 5px)',
            left: 0,
            right: 0,
            zIndex: 120,
            padding: '5px',
            borderRadius: 'var(--radius-md, 8px)',
            background: 'color-mix(in srgb, var(--surface-panel, var(--bg-card)) 98%, transparent)',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.75), 0 0 16px color-mix(in srgb, var(--primary) 12%, transparent)',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px'
          }}
        >
          {ACCOUNT_TYPES.map((t) => {
            const isSelected = t.id === value;
            const ItemIcon = t.icon;

            return (
              <button
                key={t.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(t.id);
                  setIsOpen(false);
                }}
                className={`tactical-select-item ${isSelected ? 'selected' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-sm, 6px)',
                  border: '1px solid transparent',
                  background: isSelected
                    ? 'color-mix(in srgb, var(--accent, var(--primary)) 16%, transparent)'
                    : 'transparent',
                  color: isSelected ? 'var(--text-high)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.14s ease',
                  outline: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: 'var(--radius-sm, 5px)',
                      background: `color-mix(in srgb, ${t.color} 18%, transparent)`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <ItemIcon size={13} style={{ color: t.color }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: isSelected ? 700 : 600, color: 'var(--text-high)' }}>
                      {t.label}
                    </span>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                      {t.desc}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <Check size={14} style={{ color: 'var(--accent, var(--primary))', flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
