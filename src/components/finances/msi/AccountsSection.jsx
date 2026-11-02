import React from 'react';
import { CreditCard, Plus, Trash2, Wallet, Banknote } from 'lucide-react';

export default function AccountsSection({ paymentMethods = [], onAddClick, onDeleteAccount }) {
  return (
    <div style={{
      background: 'transparent',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.65rem'
    }}>
      {/* Cabecera y Botón Agregar Cuenta */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CreditCard size={14} style={{ color: 'var(--accent, var(--primary))' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)' }}>
            Cuentas & Tarjetas Registradas
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            ({paymentMethods.length})
          </span>
        </div>

        <button
          type="button"
          onClick={onAddClick}
          className="structure-action-btn"
          title="Agregar nueva cuenta o tarjeta"
        >
          <Plus size={12} />
          <span>Agregar Cuenta</span>
        </button>
      </div>

      {/* Grid de Cuentas Responsivo */}
      {paymentMethods.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
          No hay cuentas registradas. Pulsa en "Agregar Cuenta" para dar de alta tu primera tarjeta o cuenta.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '8px'
        }}>
          {paymentMethods.map((pm) => {
            const isCredit = pm.type === 'credit';
            const Icon = isCredit ? CreditCard : (pm.type === 'cash' ? Banknote : Wallet);
            const borderAccent = isCredit ? 'var(--accent, var(--primary))' : 'var(--primary)';

            return (
              <div
                key={pm.id}
                className="structure-card"
                style={{
                  borderLeft: `4px solid ${borderAccent}`,
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                    <Icon size={12} style={{ color: borderAccent, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {pm.name}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteAccount(pm)}
                    className="structure-action-btn delete"
                    title="Eliminar método"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {isCredit ? 'Límite Crédito' : 'Saldo Base'}
                  </span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-high)', fontFamily: 'var(--font-mono)' }}>
                    ${(isCredit ? pm.creditLimit || 0 : pm.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {isCredit && (pm.cutoffDay || pm.paymentDay) && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.62rem',
                    color: 'var(--text-muted)',
                    borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.05))',
                    paddingTop: '3px'
                  }}>
                    {pm.cutoffDay && <span>Corte: Día {pm.cutoffDay}</span>}
                    {pm.paymentDay && <span>Pago: Día {pm.paymentDay}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
