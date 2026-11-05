import { useState } from 'react';
import { Plus, Edit3, Trash2, ArrowRight, CalendarRange } from 'lucide-react';
import InlineTxEditor from './InlineTxEditor';

export default function DayMovementsDeck({
  selectedDate,
  selectedDayTxs = [],
  selectedDayDeadlines = [],
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

        {/* Resumen Dinámico de Balances */}
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem' }}>
          {totalIncome > 0 && (
            <span style={{ color: 'var(--success, #10b981)', fontWeight: 700 }}>
              +${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          )}
          {totalExpense > 0 && (
            <span style={{ color: 'var(--danger, #ef4444)', fontWeight: 700 }}>
              -${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          )}
          {totalIncome === 0 && totalExpense === 0 && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.66rem' }}>
              $0.00
            </span>
          )}
        </div>
      </div>

      {/* Lista Desplazable de Movimientos del Día */}
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
        {/* Vencimientos, Cortes y Compromisos Financieros del Día */}
        {selectedDayDeadlines.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              VENCIMIENTOS & CORTES ({selectedDayDeadlines.length})
            </span>
            {selectedDayDeadlines.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="day-deck-tx-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.35rem 0.55rem',
                    borderRadius: 'var(--radius-sm, 5px)',
                    border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                    borderLeft: `3px solid ${item.color || 'var(--accent, var(--primary))'}`,
                    background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0, flex: 1 }}>
                    {Icon && <Icon size={12} style={{ color: item.color || 'var(--accent, var(--primary))', flexShrink: 0 }} />}
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.title}
                      </span>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                        {item.subtitle}
                      </span>
                    </div>
                  </div>
                  {item.amount != null && item.amount > 0 && (
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-high)' }}>
                      ${Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Transacciones del Día Elásticas */}
        {selectedDayTxs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(4px, 0.8vh, 8px)', flex: 1, minHeight: 0 }}>
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
                  className="day-deck-tx-card pulse-elastic-tx-card"
                  style={{
                    border: isBeingEdited 
                      ? '1px solid var(--accent, var(--primary))' 
                      : undefined,
                    background: isBeingEdited 
                      ? 'color-mix(in srgb, var(--accent, var(--primary)) 12%, var(--bg-card))' 
                      : undefined
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

                  <div className="pulse-tx-meta-actions">
                    <span
                      style={{
                        fontSize: '0.76rem',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontWeight: 700,
                        color: isIncome ? 'var(--accent, var(--primary))' : 'var(--danger)'
                      }}
                    >
                      {isIncome ? '+' : '-'}${amt.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>

                    {/* Botones de Acción */}
                    <div className="pulse-tx-actions">
                      <button
                        type="button"
                        onClick={() => setEditingTx(isBeingEdited ? null : tx)}
                        className={`pulse-tx-action-btn ${isBeingEdited ? 'is-active' : ''}`}
                        title="Editar transacción"
                        aria-label="Editar transacción"
                      >
                        <Edit3 size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteTx?.(tx)}
                        className="pulse-tx-action-btn delete"
                        title="Eliminar transacción"
                        aria-label="Eliminar transacción"
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
        {selectedDayDeadlines.length === 0 && selectedDayTxs.length === 0 && (
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
              Sin transacciones ni compromisos en este día.
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
          key={editingTx.id}
          tx={editingTx}
          onSave={handleSaveInline}
          onCancel={() => setEditingTx(null)}
        />
      )}
    </div>
  );
}
