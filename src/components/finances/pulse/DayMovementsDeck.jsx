import { useState } from 'react';
import { Plus, Edit3, Trash2, CheckSquare, Square, ArrowRight, CalendarRange } from 'lucide-react';
import InlineTxEditor from './InlineTxEditor';

export default function DayMovementsDeck({
  selectedDate,
  selectedDayTxs = [],
  selectedDayEvents = [],
  onToggleTimelineEvent,
  onSaveTransaction,
  onDeleteTx,
  onGoToOperations,
  cycleLabel
}) {
  const [editingTx, setEditingTx] = useState(null);

  const formattedDate = (() => {
    if (!selectedDate) return 'Fecha seleccionada';
    const [y, m, d] = selectedDate.split('-');
    const obj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    return obj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  })();

  const totalExpense = selectedDayTxs
    .filter((t) => t.type !== 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalIncome = selectedDayTxs
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const handleSaveInline = async (updatedTx) => {
    if (onSaveTransaction) {
      await onSaveTransaction(updatedTx);
    }
    setEditingTx(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      {/* Resumen del Día y Ciclo */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '0.45rem 0.65rem',
          borderRadius: 'var(--radius-sm, 6px)',
          background: 'color-mix(in srgb, var(--accent, var(--primary)) 8%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent, var(--primary)) 20%, transparent)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-high)' }}>
            {formattedDate}
          </span>
          {cycleLabel && (
            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <CalendarRange size={10} style={{ color: 'var(--accent, var(--primary))' }} />
              {cycleLabel}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace' }}>
          {totalIncome > 0 && (
            <span style={{ color: 'var(--accent, var(--primary))', fontWeight: 700 }}>
              +${totalIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          )}
          {totalExpense > 0 && (
            <span style={{ color: 'var(--danger, #ef4444)', fontWeight: 700 }}>
              -${totalExpense.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          )}
        </div>
      </div>

      {/* Lista Scrolleable */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          paddingRight: '2px'
        }}
        className="no-scrollbar"
      >
        {/* Hitos del Día */}
        {selectedDayEvents.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              HITOS OPERATIVOS ({selectedDayEvents.length})
            </span>
            {selectedDayEvents.map((evt) => {
              const isCompleted = evt.status === 'completed';
              return (
                <div
                  key={evt.id}
                  className="day-deck-tx-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.35rem 0.55rem',
                    borderRadius: 'var(--radius-sm, 5px)',
                    border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                    background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
                    opacity: isCompleted ? 0.65 : 1
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0, flex: 1 }}>
                    <button
                      type="button"
                      onClick={() => onToggleTimelineEvent(evt.id, !isCompleted)}
                      style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: isCompleted ? 'var(--accent, var(--primary))' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                      title={isCompleted ? 'Marcar pendiente' : 'Marcar completado'}
                    >
                      {isCompleted ? <CheckSquare size={13} /> : <Square size={13} />}
                    </button>
                    <span style={{ fontSize: '0.74rem', color: isCompleted ? 'var(--text-muted)' : 'var(--text-high)', textDecoration: isCompleted ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {evt.title}
                    </span>
                  </div>
                  {evt.time && (
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {evt.time}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Transacciones del Día */}
        {selectedDayTxs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              TRANSACCIONES ({selectedDayTxs.length})
            </span>
            {selectedDayTxs.map((tx) => {
              const isIncome = tx.type === 'income';
              const amt = Number(tx.amount) || 0;
              const isBeingEdited = editingTx?.id === tx.id;

              return (
                <div
                  key={tx.id}
                  className="day-deck-tx-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.35rem 0.55rem',
                    borderRadius: 'var(--radius-sm, 5px)',
                    border: isBeingEdited 
                      ? '1px solid var(--accent, var(--primary))' 
                      : '1px solid var(--border-color, rgba(255,255,255,0.08))',
                    background: isBeingEdited 
                      ? 'color-mix(in srgb, var(--accent, var(--primary)) 12%, var(--bg-card))' 
                      : 'color-mix(in srgb, var(--bg-card) 60%, transparent)'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tx.description || tx.category}
                    </span>
                    <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                      {tx.paymentMethod} • {tx.category}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: '0.76rem',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontWeight: 700,
                        color: isIncome ? 'var(--accent, var(--primary))' : 'var(--text-high)'
                      }}
                    >
                      {isIncome ? '+' : '-'}${amt.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button
                        type="button"
                        onClick={() => setEditingTx(isBeingEdited ? null : tx)}
                        className="cockpit-filter-pill"
                        title="Editar transacción"
                        style={{
                          background: isBeingEdited ? 'var(--accent, var(--primary))' : 'transparent',
                          border: 'none',
                          color: isBeingEdited ? 'var(--bg-main)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '2px',
                          borderRadius: '3px',
                          touchAction: 'manipulation'
                        }}
                      >
                        <Edit3 size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (editingTx?.id === tx.id) setEditingTx(null);
                          onDeleteTx?.(tx);
                        }}
                        className="cockpit-filter-pill"
                        title="Eliminar"
                        style={{ background: 'transparent', border: 'none', color: 'var(--danger, #ef4444)', cursor: 'pointer', padding: '2px' }}
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

        {/* Estado Vacío del Día */}
        {selectedDayEvents.length === 0 && selectedDayTxs.length === 0 && (
          <div
            style={{
              padding: '2.5rem 1rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--text-muted)'
            }}
          >
            <p style={{ fontSize: '0.76rem', margin: 0, fontWeight: 500 }}>
              Sin movimientos ni hitos programados en este día.
            </p>
            {onGoToOperations && (
              <button
                type="button"
                onClick={onGoToOperations}
                className="cockpit-filter-pill"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.7rem',
                  padding: '0.25rem 0.6rem',
                  borderRadius: 'var(--radius-sm, 5px)',
                  cursor: 'pointer',
                  border: '1px solid color-mix(in srgb, var(--accent, var(--primary)) 30%, transparent)',
                  background: 'color-mix(in srgb, var(--accent, var(--primary)) 12%, transparent)',
                  color: 'var(--text-high)'
                }}
              >
                <span>Añadir operación en este día</span>
                <ArrowRight size={11} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Menú/Editor Inline en la parte inferior si está editando */}
      {editingTx && (
        <InlineTxEditor
          tx={editingTx}
          onSave={handleSaveInline}
          onCancel={() => setEditingTx(null)}
        />
      )}
    </div>
  );
}
