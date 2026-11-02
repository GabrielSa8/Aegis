import React from 'react';
import { Repeat, Plus, Check, Trash2 } from 'lucide-react';

export default function RecurringExpensesSection({
  recurringExpenses = [],
  onAddClick,
  onApproveRecurring,
  onDeleteRecurring
}) {
  const todayDay = new Date().getDate();

  return (
    <div style={{
      background: 'transparent',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.65rem'
    }}>
      {/* Cabecera y Botón Nuevo Gasto */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Repeat size={14} style={{ color: 'var(--accent, var(--primary))' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)' }}>
            Gastos Fijos & Servicios Programados
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            ({recurringExpenses.length})
          </span>
        </div>

        <button
          type="button"
          onClick={onAddClick}
          className="structure-action-btn"
          title="Programar nuevo gasto fijo recurrente"
        >
          <Plus size={12} />
          <span>Nuevo Gasto Fijo</span>
        </button>
      </div>

      {recurringExpenses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
          No hay gastos fijos programados. Pulsa en "Nuevo Gasto Fijo" para registrar un servicio o suscripción mensual.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '8px' }}>
          {recurringExpenses.map((rec) => {
            const currentMonthStr = new Date().toISOString().slice(0, 7);
            const isPaidThisMonth = rec.lastPaidDate && rec.lastPaidDate.startsWith(currentMonthStr);
            const daysDiff = rec.dueDay - todayDay;

            let dueColor = 'var(--text-muted)';
            let dueBg = 'color-mix(in srgb, var(--border-color) 40%, transparent)';
            let dueText = `Vence día ${rec.dueDay}`;

            if (isPaidThisMonth) {
              dueText = '✓ Pagado este ciclo';
              dueColor = 'var(--primary, #10b981)';
              dueBg = 'color-mix(in srgb, var(--primary, #10b981) 15%, transparent)';
            } else if (daysDiff === 0) {
              dueText = '⚠️ Vence hoy';
              dueColor = 'var(--danger, #ef4444)';
              dueBg = 'color-mix(in srgb, var(--danger, #ef4444) 18%, transparent)';
            } else if (daysDiff > 0 && daysDiff <= 3) {
              dueText = `En ${daysDiff} días`;
              dueColor = 'var(--warning, #d97706)';
              dueBg = 'color-mix(in srgb, var(--warning, #d97706) 18%, transparent)';
            }

            return (
              <div
                key={rec.id}
                className="structure-card"
                style={{
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                {/* Cabecera de la tarjeta: Título + Badge de Vencimiento */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {rec.description}
                  </span>
                  <span style={{
                    fontSize: '0.62rem',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    background: dueBg,
                    color: dueColor,
                    fontWeight: 700,
                    whiteSpace: 'nowrap'
                  }}>
                    {dueText}
                  </span>
                </div>

                {/* Monto y Categoría */}
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    {rec.category}
                  </span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-high)', fontFamily: 'JetBrains Mono, monospace' }}>
                    ${(rec.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Pie: Método de pago y Botones de Acción */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '2px',
                  paddingTop: '4px',
                  borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.05))',
                  gap: '4px'
                }}>
                  <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {rec.paymentMethod}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    {!isPaidThisMonth && (
                      <button
                        type="button"
                        onClick={() => onApproveRecurring(rec.id)}
                        className="structure-action-btn"
                        style={{
                          padding: '2px 6px',
                          fontSize: '0.66rem',
                          background: 'color-mix(in srgb, var(--primary) 18%, transparent)',
                          borderColor: 'color-mix(in srgb, var(--primary) 35%, transparent)',
                          color: 'var(--primary)'
                        }}
                        title="Registrar pago en SQLite y marcar como pagado"
                      >
                        <Check size={11} />
                        <span>Aprobar</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onDeleteRecurring(rec)}
                      className="structure-action-btn delete"
                      title="Eliminar gasto fijo"
                    >
                      <Trash2 size={12} />
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
