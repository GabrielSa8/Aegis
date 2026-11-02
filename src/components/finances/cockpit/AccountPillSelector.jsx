import { useState, useEffect } from 'react';
import { CreditCard, Wallet, Banknote } from 'lucide-react';
import { getPaymentMethods } from '../../../utils/storage';

const DEFAULT_METHODS = [
  { id: 'debito', name: 'Débito' },
  { id: 'credito', name: 'Crédito' },
  { id: 'mp', name: 'Mercado Pago' },
  { id: 'efectivo', name: 'Efectivo' }
];

export default function AccountPillSelector({ value, onChange }) {
  const [methods, setMethods] = useState(DEFAULT_METHODS);

  useEffect(() => {
    let mounted = true;
    const loadMethods = async () => {
      try {
        const loaded = await getPaymentMethods();
        if (mounted && Array.isArray(loaded) && loaded.length > 0) {
          setMethods(loaded);
        }
      } catch (err) {
        console.error('Error cargando cuentas:', err);
      }
    };
    loadMethods();
    return () => { mounted = false; };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.02em' }}>
        CUENTA / MÉTODO
      </label>
      <div 
        style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '0.4rem',
          maxHeight: '110px',
          overflowY: 'auto'
        }}
        className="no-scrollbar"
      >
        {methods.map((m) => {
          const methodName = m.name || m;
          const isSelected = value === methodName;
          return (
            <button
              key={m.id || methodName}
              type="button"
              onClick={() => onChange(methodName)}
              className={`cockpit-pill-btn ${isSelected ? 'selected' : ''}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.3rem 0.65rem',
                borderRadius: 'var(--radius-sm, 6px)',
                fontSize: '0.75rem',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                border: isSelected 
                  ? '1px solid var(--accent, var(--primary))' 
                  : '1px solid var(--border-color, rgba(255,255,255,0.08))',
                background: isSelected 
                  ? 'color-mix(in srgb, var(--accent, var(--primary)) 18%, transparent)' 
                  : 'var(--bg-card, rgba(255,255,255,0.03))',
                color: isSelected ? 'var(--text-high)' : 'var(--text-muted)'
              }}
            >
              <CreditCard size={12} style={{ opacity: isSelected ? 1 : 0.6 }} />
              <span>{methodName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
