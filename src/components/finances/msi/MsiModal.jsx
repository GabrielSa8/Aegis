import React from 'react';
import { Layers } from 'lucide-react';
import ModalWrapper from '../../ui/ModalWrapper';
import TacticalButton from '../../ui/TacticalButton';

export default function MsiModal({
  isOpen,
  onClose,
  msiForm,
  setMsiForm,
  paymentMethods = [],
  onSubmit
}) {
  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Plan a Meses Sin Intereses"
      icon={Layers}
      maxWidth="380px"
    >
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Descripción del Bien / Compra</label>
          <input
            type="text"
            required
            placeholder="ej. Monitor USB-C, Laptop..."
            value={msiForm.description}
            onChange={(e) => setMsiForm({ ...msiForm, description: e.target.value })}
            style={{ width: '100%', padding: '6px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.8rem' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Monto Total ($)</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="3600"
              value={msiForm.totalAmount}
              onChange={(e) => setMsiForm({ ...msiForm, totalAmount: e.target.value })}
              style={{ width: '100%', padding: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.8rem' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Plazo (Meses)</label>
            <input
              type="number"
              min="2"
              max="48"
              required
              value={msiForm.totalInstallments}
              onChange={(e) => setMsiForm({ ...msiForm, totalInstallments: e.target.value, remainingInstallments: e.target.value })}
              style={{ width: '100%', padding: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.8rem' }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tarjeta Utilizada</label>
          <select
            value={msiForm.paymentMethod}
            onChange={(e) => setMsiForm({ ...msiForm, paymentMethod: e.target.value })}
            style={{ fontSize: '0.75rem', padding: '6px 26px 6px 10px', width: '100%' }}
          >
            {(paymentMethods || []).map((pm) => (
              <option key={pm.id} value={pm.name}>{pm.name}</option>
            ))}
          </select>
        </div>

        <TacticalButton
          type="submit"
          variant="primary"
          style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}
        >
          Registrar Plan MSI
        </TacticalButton>
      </form>
    </ModalWrapper>
  );
}
