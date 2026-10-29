import { Plus, Edit3, Trash2, CheckSquare, Square } from 'lucide-react';
import Calendar from '../Calendar';
import TacticalButton from '../ui/TacticalButton';

export default function CalendarSection({
  safeTransactions,
  timelineEvents,
  selectedDate,
  onDateSelect,
  selectedDayTxs,
  selectedDayEvents,
  onToggleTimelineEvent,
  onEditTx,
  onDeleteTx,
  onGoToOperations
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) minmax(300px, 380px)', gap: '1.25rem' }}>
      <div>
        <Calendar 
          transactions={safeTransactions} 
          timelineEvents={timelineEvents}
          selectedDate={selectedDate} 
          onDateSelect={onDateSelect} 
        />
      </div>

      <div className="tx-list-container glass" style={{ height: 'fit-content', maxHeight: '600px', display: 'flex', flexDirection: 'column' }}>
        <div className="tx-header">
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Movimientos del {selectedDate}</h3>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>
              {selectedDayTxs.length} transacciones • {selectedDayEvents.length} hitos
            </p>
          </div>
          <TacticalButton
            variant="secondary"
            size="sm"
            onClick={onGoToOperations}
          >
            + Añadir en este día
          </TacticalButton>
        </div>

        {/* Hitos Operativos del Día */}
        {selectedDayEvents.length > 0 && (
          <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Hitos & Operaciones ({selectedDayEvents.length})
            </span>
            {selectedDayEvents.map((evt) => {
              const isCompleted = evt.status === 'completed';
              return (
                <div key={evt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '5px 8px', background: 'rgba(0,0,0,0.25)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                    <button
                      onClick={() => onToggleTimelineEvent(evt.id, !isCompleted)}
                      style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: isCompleted ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                      title={isCompleted ? 'Marcar pendiente' : 'Marcar completado'}
                    >
                      {isCompleted ? <CheckSquare size={14} /> : <Square size={14} />}
                    </button>
                    <span style={{ fontSize: '0.76rem', color: isCompleted ? 'var(--text-muted)' : '#fff', textDecoration: isCompleted ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {evt.title}
                    </span>
                  </div>
                  {evt.time && (
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {evt.time}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="tx-items" style={{ flex: 1, overflowY: 'auto' }}>
          {selectedDayTxs.length > 0 ? (
            selectedDayTxs.map((tx) => (
              <div key={tx.id} className="tx-item">
                <div className="tx-left">
                  <div className={`tx-icon-wrapper ${tx.type}`}>
                    {tx.type === 'income' ? <Plus size={16} /> : <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>-</span>}
                  </div>
                  <div className="tx-info">
                    <h4>{tx.description || tx.category}</h4>
                    <p><span className="tx-badge">{tx.category}</span></p>
                  </div>
                </div>
                <div className="tx-right">
                  <div className={`tx-amount ${tx.type}`}>
                    {tx.type === 'income' ? '+' : '-'}${Number(tx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="tx-actions">
                    <button type="button" onClick={() => onEditTx(tx)} title="Editar"><Edit3 size={14} /></button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); onDeleteTx(tx); }} className="delete" title="Eliminar"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
              Sin movimientos registrados para el {selectedDate}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
