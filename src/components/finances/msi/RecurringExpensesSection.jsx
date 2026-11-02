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
      gap: '0.5rem',
      height: '100%',
      minHeight: 0
    }}>
      {/* Cabecera y Botón Nuevo Gasto */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', flexShrink: 0 }}>
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
            <Repeat size={18} />
          </div>
          <span>No hay gastos fijos programados. Pulsa en "Nuevo Gasto Fijo" para registrar un servicio o suscripción mensual.</span>
        </div>
      ) : (
        <div className="structure-list-container no-scrollbar">
          {recurringExpenses.map((rec) => {
            const currentMonthStr = new Date().toISOString().slice(0, 7);
            const isPaidThisMonth = rec.lastPaidDate && rec.lastPaidDate.startsWith(currentMonthStr);
            const daysDiff = rec.dueDay - todayDay;

            let dueColor = 'var(--text-muted)';
            let dueBg = 'color-mix(in srgb, var(--border-color) 40%, transparent)';
            let dueText = `Vence día ${rec.dueDay}`;

            if (isPaidThisMonth) {
              dueText = '✓ Pagado este ciclo';
              dueColor = 'var(--primary)';
              dueBg = 'color-mix(in srgb, var(--primary) 15%, transparent)';
            } else if (daysDiff === 0) {
              dueText = '⚠️ Vence hoy';
              dueColor = 'var(--danger)';
              dueBg = 'color-mix(in srgb, var(--danger) 18%, transparent)';
            } else if (daysDiff > 0 && daysDiff <= 3) {
              dueText = `En ${daysDiff} días`;
              dueColor = 'var(--warning)';
              dueBg = 'color-mix(in srgb, var(--warning) 18%, transparent)';
            }

            return (
              <div
                key={rec.id}
                className="structure-card structure-elastic-card"
              >
                {/* Fila 1: Título + Categoría + Badge de Vencimiento + Acciones */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flexWrap: 'wrap' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      borderRadius: 'var(--radius-sm, 6px)',
                      background: 'color-mix(in srgb, var(--accent, var(--primary)) 16%, transparent)',
                      flexShrink: 0
                    }}>
                      <Repeat size={13} style={{ color: 'var(--accent, var(--primary))' }} />
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {rec.description}
                    </span>
                    <span style={{
                      fontSize: '0.62rem',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      background: 'color-mix(in srgb, var(--border-color) 45%, transparent)',
                      color: 'var(--text-muted)'
                    }}>
                      {rec.category}
                    </span>
                    <span style={{
                      fontSize: '0.62rem',
                      padding: '1px 6px',
                      borderRadius: '3px',
                      background: dueBg,
                      color: dueColor,
                      fontWeight: 700,
                      whiteSpace: 'nowrap'
                    }}>
                      {dueText}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    {!isPaidThisMonth && (
                      <button
                        type="button"
                        onClick={() => onApproveRecurring(rec.id)}
                        className="structure-action-btn"
                        style={{
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
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Fila 2: Método de pago + Monto Hero */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    <span>{rec.paymentMethod}</span>
                    <span>·</span>
                    <span>Día de corte {rec.dueDay}</span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      fontSize: 'clamp(0.92rem, 1.8vh, 1.15rem)',
                      fontWeight: 800,
                      color: 'var(--text-high)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      ${(rec.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
