import React from 'react';
import { CreditCard, Palette, Check } from 'lucide-react';
import ModalWrapper from '../../ui/ModalWrapper';
import AccountTypeDropdown from './AccountTypeDropdown';

export default function AccountModal({
  isOpen,
  onClose,
  accountForm,
  setAccountForm,
  onSubmit
}) {
  const isEditing = Boolean(accountForm.id);
  const colorPresets = ['#004481', '#820ad1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#6366f1', '#ec4899'];

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Cuenta o Tarjeta' : 'Agregar Cuenta o Tarjeta'}
      icon={CreditCard}
      maxWidth="420px"
    >
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Nombre de Cuenta / Tarjeta</label>
          <input
            type="text"
            required
            placeholder="ej. BBVA Oro, Nu Débito..."
            value={accountForm.name}
            onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
            style={{ width: '100%', padding: '7px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-high)', fontSize: '0.82rem' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tipo de Cuenta / Instrumento</label>
          <AccountTypeDropdown
            value={accountForm.type || 'debit'}
            onChange={(newType) => setAccountForm({ ...accountForm, type: newType })}
          />
        </div>

        {/* 🎨 Selector de Color Identificador Responsivo y Táctil */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Color Identificador</label>
            <span style={{ fontSize: '0.67rem', fontFamily: 'var(--font-mono)', color: 'var(--text-high)', opacity: 0.85 }}>
              {accountForm.color || '#004481'}
            </span>
          </div>

          <div className="account-color-grid">
            {colorPresets.map((c) => {
              const isSelected = (accountForm.color || '').toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAccountForm({ ...accountForm, color: c })}
                  className={`account-color-swatch ${isSelected ? 'selected' : ''}`}
                  style={{ background: c }}
                  title={`Color ${c}`}
                >
                  {isSelected && <Check size={14} style={{ color: '#fff', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))' }} />}
                </button>
              );
            })}

            <label
              className="account-color-custom-btn"
              title="Elegir cualquier color personalizado"
            >
              <input
                type="color"
                value={accountForm.color || '#004481'}
                onChange={(e) => setAccountForm({ ...accountForm, color: e.target.value })}
                className="account-color-native-input"
              />
              <Palette size={13} style={{ color: 'var(--text-high)' }} />
            </label>
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
                  style={{ width: '100%', padding: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-high)', fontSize: '0.8rem' }}
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
                  style={{ width: '100%', padding: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-high)', fontSize: '0.8rem' }}
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
                style={{ width: '100%', padding: '6px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-high)', fontSize: '0.8rem' }}
              />
            </div>
          </>
        ) : (
          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {isEditing ? 'Saldo Disponible ($)' : 'Saldo Inicial ($)'}
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="ej. 5000"
              value={accountForm.balance}
              onChange={(e) => setAccountForm({ ...accountForm, balance: e.target.value })}
              style={{ width: '100%', padding: '6px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-high)', fontSize: '0.8rem' }}
            />
          </div>
        )}

        {/* 🎯 Acciones del Footer Responsivas (Cancelar + Guardar Cambios) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '8px',
          marginTop: '0.5rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-color)',
          flexWrap: 'wrap'
        }}>
          <button
            type="button"
            onClick={onClose}
            className="budget-modal-btn budget-modal-btn-secondary"
            style={{ flex: '1 1 90px' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="budget-modal-btn budget-modal-btn-primary"
            style={{ flex: '2 1 150px' }}
          >
            {isEditing ? 'Guardar Cambios' : 'Guardar Cuenta'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
