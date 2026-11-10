import React from 'react';
import { CreditCard, Plus, Trash2, Wallet, Banknote, Pencil, Zap } from 'lucide-react';

export default function AccountsSection({
  paymentMethods = [],
  onAddClick,
  onEditAccount,
  onDeleteAccount,
  onPayCard
}) {
  return (
    <div style={{
      background: 'transparent',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      height: '100%',
      minHeight: 0
    }}>
      {/* Cabecera y Botón Agregar Cuenta */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', flexShrink: 0 }}>
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

      {/* Listado Vertical Elástico de Cuentas (Edge-to-Edge) */}
      {paymentMethods.length === 0 ? (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          color: 'var(--text-muted)',
          fontSize: '0.74rem',
          textAlign: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'color-mix(in srgb, var(--border-color) 40%, transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)'
          }}>
            <CreditCard size={18} />
          </div>
          <span>No hay cuentas registradas. Pulsa en "Agregar Cuenta" para dar de alta tu primera tarjeta o cuenta.</span>
        </div>
      ) : (
        <div className="structure-list-container no-scrollbar">
          {paymentMethods.map((pm) => {
            const isCredit = pm.type === 'credit';
            const Icon = isCredit ? CreditCard : (pm.type === 'cash' ? Banknote : Wallet);
            const borderAccent = pm.color || (isCredit ? 'var(--accent, var(--primary))' : 'var(--primary)');

            return (
              <div
                key={pm.id}
                className="structure-card structure-elastic-card"
                style={{
                  borderLeft: `4px solid ${borderAccent}`
                }}
              >
                {/* Fila Superior: Icono + Nombre + Tipo + Botón Eliminar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      borderRadius: 'var(--radius-sm, 6px)',
                      background: `color-mix(in srgb, ${borderAccent} 16%, transparent)`,
                      flexShrink: 0
                    }}>
                      <Icon size={13} style={{ color: borderAccent }} />
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {pm.name}
                    </span>
                    <span style={{
                      fontSize: '0.62rem',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: 'color-mix(in srgb, var(--border-color) 40%, transparent)',
                      color: 'var(--text-muted)',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}>
                      {isCredit ? 'Crédito' : (pm.type === 'cash' ? 'Efectivo' : 'Débito')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                    {isCredit && (
                      <button
                        type="button"
                        onClick={() => onPayCard && onPayCard(pm)}
                        className="structure-action-btn"
                        style={{
                          background: 'color-mix(in srgb, var(--accent, var(--primary)) 16%, transparent)',
                          borderColor: 'color-mix(in srgb, var(--accent, var(--primary)) 35%, transparent)',
                          color: 'var(--accent, var(--primary))',
                          padding: '3px 7px',
                          fontSize: '0.66rem'
                        }}
                        title="Pagar / liquidar saldo de esta tarjeta"
                      >
                        <Zap size={11} />
                        <span>Pagar</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onEditAccount && onEditAccount(pm)}
                      className="structure-action-btn"
                      title="Editar cuenta / tarjeta"
                      style={{ padding: '3px 7px', fontSize: '0.66rem' }}
                    >
                      <Pencil size={11} style={{ color: 'var(--accent, var(--primary))' }} />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteAccount(pm)}
                      className="structure-action-btn delete"
                      title="Eliminar método"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Fila Inferior: Fechas de corte/pago + Saldo Hero */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                      {isCredit ? 'Límite Crédito' : 'Saldo Disponible'}
                    </span>
                    {isCredit && (pm.cutoffDay || pm.paymentDay) ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {pm.cutoffDay && <span>Corte: <strong style={{ color: 'var(--text-high)' }}>Día {pm.cutoffDay}</strong></span>}
                        {pm.paymentDay && <span>Pago: <strong style={{ color: 'var(--text-high)' }}>Día {pm.paymentDay}</strong></span>}
                      </div>
                    ) : null}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      fontSize: 'clamp(0.92rem, 1.8vh, 1.16rem)',
                      fontWeight: 800,
                      color: 'var(--text-high)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      ${(isCredit ? pm.creditLimit || 0 : pm.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
