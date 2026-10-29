import React from 'react';
import { CreditCard, Plus, Trash2 } from 'lucide-react';
import TacticalButton from '../../ui/TacticalButton';

export default function AccountsSection({ paymentMethods, onAddClick, onDeleteAccount }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCard size={16} color="#10b981" />
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-high)' }}>
            Cuentas & Tarjetas Registradas
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            • Débito, Crédito y Billeteras
          </span>
        </div>

        <TacticalButton
          variant="secondary"
          size="xs"
          icon={Plus}
          onClick={onAddClick}
        >
          Agregar Cuenta
        </TacticalButton>
      </div>

      {/* Grid de Cuentas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '8px'
      }}>
        {paymentMethods.map((pm) => {
          const isCredit = pm.type === 'credit';
          return (
            <div
              key={pm.id}
              style={{
                background: 'rgba(0, 0, 0, 0.25)',
                border: `1px solid ${isCredit ? 'rgba(168, 85, 247, 0.3)' : 'var(--border-color)'}`,
                borderLeft: `4px solid ${pm.color || (isCredit ? '#a855f7' : '#10b981')}`,
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)' }}>
                  {pm.name}
                </span>
                <button
                  onClick={() => onDeleteAccount(pm.id)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                  title="Eliminar método"
                >
                  <Trash2 size={11} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {isCredit ? 'Límite Crédito' : 'Saldo'}
                </span>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: isCredit ? '#c084fc' : '#10b981', fontFamily: 'var(--font-mono)' }}>
                  ${(isCredit ? pm.creditLimit || 0 : pm.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              {isCredit && (pm.cutoffDay || pm.paymentDay) && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.62rem',
                  color: 'var(--text-muted)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  paddingTop: '4px'
                }}>
                  {pm.cutoffDay && <span>Corte: Día {pm.cutoffDay}</span>}
                  {pm.paymentDay && <span>Límite pago: Día {pm.paymentDay}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
