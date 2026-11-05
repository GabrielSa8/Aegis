import { useState, useRef, useEffect } from 'react';
import { CreditCard, Wallet, Banknote, ChevronDown, ChevronUp, Check } from 'lucide-react';

export default function PaymentMethodDropdown({
  value,
  onChange,
  paymentMethods = [],
  dropUp = true
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Cerrar al hacer clic fuera o Escape
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

  // Encontrar el método activo
  const selectedMethod = paymentMethods.find((pm) => (pm.name || pm) === value) || { name: value || 'Efectivo' };
  const isCredit = selectedMethod?.type === 'credit';
  const SelectedIcon = isCredit ? CreditCard : (selectedMethod?.type === 'cash' ? Banknote : Wallet);
  const selectedAccent = selectedMethod?.color || (isCredit ? 'var(--accent, var(--primary))' : 'var(--primary)');

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'inline-flex',
        flex: '1 1 130px',
        minWidth: 0,
        boxSizing: 'border-box'
      }}
    >
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
          gap: '6px',
          padding: '4px 8px',
          fontSize: '0.72rem',
          background: 'rgba(0, 0, 0, 0.3)',
          border: `1px solid ${isOpen ? 'var(--accent, var(--primary))' : 'var(--border-color)'}`,
          borderRadius: 'var(--radius-sm, 5px)',
          color: 'var(--text-high)',
          cursor: 'pointer',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'all 0.16s ease'
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
          <div
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '4px',
              background: `color-mix(in srgb, ${selectedAccent} 18%, transparent)`,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <SelectedIcon size={11} style={{ color: selectedAccent }} />
          </div>
          <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedMethod.name || value || 'Seleccionar método'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', flexShrink: 0 }}>
          {selectedMethod.type && (
            <span
              style={{
                fontSize: '0.58rem',
                padding: '1px 4px',
                borderRadius: '3px',
                background: 'color-mix(in srgb, var(--border-color) 40%, transparent)',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                fontWeight: 600
              }}
            >
              {isCredit ? 'Crédito' : (selectedMethod.type === 'cash' ? 'Efectivo' : 'Débito')}
            </span>
          )}
          {isOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </div>
      </button>

      {/* Menú Desplegable Táctico (Nordic Glass) */}
      {isOpen && (
        <div
          role="listbox"
          className="tactical-select-popover no-scrollbar"
          style={{
            position: 'absolute',
            bottom: dropUp ? 'calc(100% + 6px)' : 'auto',
            top: dropUp ? 'auto' : 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 110,
            minWidth: '200px',
            maxHeight: '180px',
            overflowY: 'auto',
            padding: '4px',
            borderRadius: 'var(--radius-md, 8px)',
            background: 'color-mix(in srgb, var(--surface-panel, var(--bg-card)) 98%, transparent)',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.75), 0 0 16px color-mix(in srgb, var(--primary) 12%, transparent)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
        >
          {paymentMethods.map((pm) => {
            const pmName = pm.name || pm;
            const isSelected = (value || '') === pmName;
            const pmIsCredit = pm.type === 'credit';
            const PmIcon = pmIsCredit ? CreditCard : (pm.type === 'cash' ? Banknote : Wallet);
            const pmAccent = pm.color || (pmIsCredit ? 'var(--accent, var(--primary))' : 'var(--primary)');

            return (
              <button
                key={pm.id || pmName}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(pmName);
                  setIsOpen(false);
                }}
                className={`tactical-select-item ${isSelected ? 'selected' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  padding: '5px 8px',
                  borderRadius: 'var(--radius-sm, 5px)',
                  border: '1px solid transparent',
                  background: isSelected
                    ? 'color-mix(in srgb, var(--accent, var(--primary)) 16%, transparent)'
                    : 'transparent',
                  color: isSelected ? 'var(--text-high)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  fontWeight: isSelected ? 700 : 500,
                  outline: 'none',
                  textAlign: 'left',
                  transition: 'all 0.14s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      background: `color-mix(in srgb, ${pmAccent} 18%, transparent)`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <PmIcon size={12} style={{ color: pmAccent }} />
                  </div>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pmName}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {pm.type && (
                    <span
                      style={{
                        fontSize: '0.58rem',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        background: 'color-mix(in srgb, var(--border-color) 40%, transparent)',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}
                    >
                      {pmIsCredit ? 'Crédito' : (pm.type === 'cash' ? 'Efectivo' : 'Débito')}
                    </span>
                  )}
                  {isSelected && (
                    <Check size={12} style={{ color: 'var(--accent, var(--primary))' }} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
