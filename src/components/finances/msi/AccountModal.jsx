import React from 'react';
import { CreditCard } from 'lucide-react';
import ModalWrapper from '../../ui/ModalWrapper';
import TacticalButton from '../../ui/TacticalButton';

export default function AccountModal({
  isOpen,
  onClose,
  accountForm,
  setAccountForm,
  onSubmit
}) {
  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Agregar Cuenta o Tarjeta"
      icon={CreditCard}
      maxWidth="380px"
    >
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Nombre de Cuenta / Tarjeta</label>
          <input
            type="text"
            required
            placeholder="ej. BBVA Oro, Nu Débito..."
            value={accountForm.name}
            onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
            style={{ width: '100%', padding: '6px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.8rem' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tipo</label>
            <select
              value={accountForm.type}
              onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })}
              style={{ fontSize: '0.75rem', padding: '6px 26px 6px 10px', width: '100%' }}
            >
              <option value="debit">Débito</option>
              <option value="credit">Crédito</option>
              <option value="cash">Efectivo</option>
              <option value="crypto">Cripto</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Color Identificador</label>
            <input
              type="color"
              value={accountForm.color}
              onChange={(e) => setAccountForm({ ...accountForm, color: e.target.value })}
              style={{ width: '100%', height: '32px', background: 'transparent', border: 'none', cursor: 'pointer' }}
            />
          </div>
        </div>

        {accountForm.type === 'credit' ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Día de Corte</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="ej. 5"
                  value={accountForm.cutoffDay}
                  onChange={(e) => setAccountForm({ ...accountForm, cutoffDay: e.target.value })}
                  style={{ width: '100%', padding: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.8rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Día Límite de Pago</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="ej. 25"
                  value={accountForm.paymentDay}
                  onChange={(e) => setAccountForm({ ...accountForm, paymentDay: e.target.value })}
                  style={{ width: '100%', padding: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.8rem' }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Límite de Crédito ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="ej. 25000"
                value={accountForm.creditLimit}
                onChange={(e) => setAccountForm({ ...accountForm, creditLimit: e.target.value })}
                style={{ width: '100%', padding: '6px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.8rem' }}
              />
            </div>
          </>
        ) : (
          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Saldo Inicial ($)</label>
            <input
              type="number"
              step="0.01"
              placeholder="ej. 5000"
              value={accountForm.balance}
              onChange={(e) => setAccountForm({ ...accountForm, balance: e.target.value })}
              style={{ width: '100%', padding: '6px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.8rem' }}
            />
          </div>
        )}

        <TacticalButton
          type="submit"
          variant="primary"
          style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}
        >
          Guardar Cuenta
        </TacticalButton>
      </form>
    </ModalWrapper>
  );
}
