import React from 'react';
import { Repeat, Plus, Check, Trash2 } from 'lucide-react';
import TacticalButton from '../../ui/TacticalButton';

export default function RecurringExpensesSection({
  recurringExpenses,
  onAddClick,
  onApproveRecurring,
  onDeleteRecurring
}) {
  const todayDay = new Date().getDate();

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
          <Repeat size={16} color="#f59e0b" />
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-high)' }}>
            Programador de Gastos Fijos & Servicios
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            • Aprobación rápida con 1-click
          </span>
        </div>

        <TacticalButton
          variant="secondary"
          size="xs"
          icon={Plus}
          onClick={onAddClick}
        >
          Nuevo Gasto Fijo
        </TacticalButton>
      </div>

      {recurringExpenses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          No hay gastos fijos programados.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
          {recurringExpenses.map((rec) => {
            const currentMonthStr = new Date().toISOString().slice(0, 7);
            const isPaidThisMonth = rec.lastPaidDate && rec.lastPaidDate.startsWith(currentMonthStr);
            const daysDiff = rec.dueDay - todayDay;
            
            let dueBadge = { text: `Vence día ${rec.dueDay}`, bg: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)' };
            if (isPaidThisMonth) {
              dueBadge = { text: '✅ Pagado este ciclo', bg: 'rgba(16, 185, 129, 0.15)', color: '#a7f3d0' };
            } else if (daysDiff === 0) {
              dueBadge = { text: '⚠️ Vence hoy', bg: 'rgba(239, 68, 68, 0.2)', color: '#f87171' };
            } else if (daysDiff > 0 && daysDiff <= 3) {
              dueBadge = { text: `En ${daysDiff} días`, bg: 'rgba(245, 158, 11, 0.2)', color: '#fde68a' };
            }

            return (
              <div
                key={rec.id}
                style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-high)' }}>
                    {rec.description}
                  </span>
                  <span style={{
                    fontSize: '0.62rem',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    background: dueBadge.bg,
                    color: dueBadge.color,
                    fontWeight: 700
                  }}>
                    {dueBadge.text}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {rec.category}
                  </span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
                    ${rec.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '4px',
                  paddingTop: '6px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.04)'
                }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    Método: {rec.paymentMethod}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {!isPaidThisMonth && (
                      <TacticalButton
                        variant="ghost"
                        size="xs"
                        icon={Check}
                        onClick={() => onApproveRecurring(rec.id)}
                        style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                        title="Crea la transacción en SQLite y marca como pagado"
                      >
                        Aprobar Pago
                      </TacticalButton>
                    )}

                    <button
                      onClick={() => onDeleteRecurring(rec.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                      title="Eliminar gasto fijo"
                    >
                      <Trash2 size={11} />
                    </button>
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
