import React from 'react';
import { Repeat } from 'lucide-react';
import ModalWrapper from '../../ui/ModalWrapper';
import TacticalButton from '../../ui/TacticalButton';

export default function RecurringModal({
  isOpen,
  onClose,
  recurringForm,
  setRecurringForm,
  paymentMethods = [],
  onSubmit
}) {
  const isEditing = Boolean(recurringForm.id);

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Gasto Fijo / Servicio' : 'Programar Gasto Fijo / Servicio'}
      icon={Repeat}
      maxWidth="380px"
    >
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Descripción</label>
          <input
            type="text"
            required
            placeholder="ej. Internet 300MB, Renta, Spotify..."
            value={recurringForm.description}
            onChange={(e) => setRecurringForm({ ...recurringForm, description: e.target.value })}
            style={{ width: '100%', padding: '6px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.8rem' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Monto ($)</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="650"
              value={recurringForm.amount}
              onChange={(e) => setRecurringForm({ ...recurringForm, amount: e.target.value })}
              style={{ width: '100%', padding: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.8rem' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Día de Vencimiento</label>
            <input
              type="number"
              min="1"
              max="31"
              required
              value={recurringForm.dueDay}
              onChange={(e) => setRecurringForm({ ...recurringForm, dueDay: e.target.value })}
              style={{ width: '100%', padding: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.8rem' }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Método de Pago Habitual</label>
          <select
            value={recurringForm.paymentMethod}
            onChange={(e) => setRecurringForm({ ...recurringForm, paymentMethod: e.target.value })}
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
          {isEditing ? 'Guardar Cambios' : 'Guardar Gasto Fijo'}
        </TacticalButton>
      </form>
    </ModalWrapper>
  );
}
