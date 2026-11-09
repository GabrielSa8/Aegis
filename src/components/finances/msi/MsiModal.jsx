import React from 'react';
import { Layers, Calendar } from 'lucide-react';
import ModalWrapper from '../../ui/ModalWrapper';
import TacticalButton from '../../ui/TacticalButton';
import { getNextMsiBillingDate } from '../../../utils/storage';

export default function MsiModal({
  isOpen,
  onClose,
  msiForm,
  setMsiForm,
  paymentMethods = [],
  onSubmit
}) {
  const isEditing = Boolean(msiForm.id);

  const selectedCard = (paymentMethods || []).find(
    (pm) => pm.name === msiForm.paymentMethod || String(pm.id) === String(msiForm.paymentMethod)
  );
  const cutoff = (selectedCard?.cutoffDay && Number(selectedCard.cutoffDay) > 0)
    ? Number(selectedCard.cutoffDay)
    : 22;
  const billingDay = (cutoff % 31) + 1;

  const handleCardChange = (e) => {
    const newMethod = e.target.value;
    const match = (paymentMethods || []).find(
      (pm) => pm.name === newMethod || String(pm.id) === String(newMethod)
    );
    const newCutoff = (match?.cutoffDay && Number(match.cutoffDay) > 0) ? Number(match.cutoffDay) : 22;
    const newDue = getNextMsiBillingDate(newCutoff);
    setMsiForm({
      ...msiForm,
      paymentMethod: newMethod,
      nextDueDate: newDue
    });
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Plan a Meses Sin Intereses' : 'Nuevo Plan a Meses Sin Intereses'}
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
              onChange={(e) => {
                const total = e.target.value;
                setMsiForm({
                  ...msiForm,
                  totalInstallments: total,
                  remainingInstallments: isEditing ? msiForm.remainingInstallments : total
                });
              }}
              style={{ width: '100%', padding: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.8rem' }}
            />
          </div>
        </div>

        {isEditing && (
          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cuotas Pendientes / Restantes</label>
            <input
              type="number"
              min="0"
              max={msiForm.totalInstallments || 48}
              required
              value={msiForm.remainingInstallments}
              onChange={(e) => setMsiForm({ ...msiForm, remainingInstallments: e.target.value })}
              style={{ width: '100%', padding: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.8rem' }}
            />
          </div>
        )}

        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tarjeta Utilizada</label>
          <select
            value={msiForm.paymentMethod}
            onChange={handleCardChange}
            style={{ fontSize: '0.75rem', padding: '6px 26px 6px 10px', width: '100%' }}
          >
            {(paymentMethods || []).map((pm) => (
              <option key={pm.id} value={pm.name}>{pm.name}</option>
            ))}
          </select>
        </div>

        {/* Banner de Automatización de Cobro Post-Corte */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '5px 8px',
            borderRadius: 'var(--radius-sm, 5px)',
            background: 'color-mix(in srgb, var(--accent, var(--primary)) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--accent, var(--primary)) 25%, transparent)',
            fontSize: '0.67rem',
            color: 'var(--accent, var(--primary))'
          }}
        >
          <span>Corte: <strong>Día {cutoff}</strong></span>
          <span>→</span>
          <span>Cobro automático: <strong>Día {billingDay}</strong></span>
        </div>

        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Fecha Primer / Próximo Cobro</label>
          <input
            type="date"
            required
            value={msiForm.nextDueDate || ''}
            onChange={(e) => setMsiForm({ ...msiForm, nextDueDate: e.target.value })}
            style={{ width: '100%', padding: '6px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.8rem' }}
          />
        </div>

        <TacticalButton
          type="submit"
          variant="primary"
          style={{ marginTop: '0.35rem', width: '100%', justifyContent: 'center' }}
        >
          {isEditing ? 'Guardar Cambios' : 'Registrar Plan MSI'}
        </TacticalButton>
      </form>
    </ModalWrapper>
  );
}
