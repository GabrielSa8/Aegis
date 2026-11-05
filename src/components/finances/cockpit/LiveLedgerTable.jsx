import { memo } from 'react';
import { Plus, Minus, Edit3, Trash2 } from 'lucide-react';
import TacticalButton from '../../ui/TacticalButton';

function LiveLedgerTable({
  transactions = [],
  onEditTx,
  onDeleteTx,
  visibleLimit,
  totalCount,
  onLoadMore
}) {
  if (transactions.length === 0) {
    return (
      <div 
        style={{ 
          padding: '2.5rem 1rem', 
          textAlign: 'center', 
          borderRadius: 'var(--radius-md, 8px)',
          border: '1px dashed var(--border-color, rgba(255,255,255,0.1))',
          background: 'var(--bg-card, rgba(255,255,255,0.01))',
          color: 'var(--text-muted)'
        }}
      >
        <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Sin operaciones registradas en este período</p>
        <p style={{ fontSize: '0.72rem', marginTop: '4px', opacity: 0.7 }}>
          Utiliza el deck de la izquierda para registrar tu primer gasto o ingreso.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minHeight: 0 }}>
      <div 
        className="ledger-elastic-container no-scrollbar"
        style={{ paddingRight: '2px' }}
      >
        {transactions.map((tx) => {
          const isIncome = tx.type === 'income';
          const formattedDate = (tx.date || '').split('-').slice(1).reverse().join('/');
          const amountNum = Number(tx.amount || 0);

          return (
            <div
              key={tx.id}
              className="ledger-row ledger-elastic-row"
            >
              {/* Icono Tipo */}
              <div
                className="ledger-row-icon"
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isIncome 
                    ? 'color-mix(in srgb, var(--accent, var(--primary)) 20%, transparent)' 
                    : 'color-mix(in srgb, var(--accent-danger, var(--danger)) 15%, transparent)',
                  color: isIncome ? 'var(--accent, var(--primary))' : 'var(--accent-danger, var(--danger))'
                }}
              >
                {isIncome ? <Plus size={11} /> : <Minus size={11} />}
              </div>

              {/* Fecha */}
              <span 
                className="ledger-row-date"
                style={{ 
                  color: 'var(--text-muted)', 
                  fontFamily: 'JetBrains Mono, monospace', 
                  fontSize: '0.7rem' 
                }}
              >
                {formattedDate || '—'}
              </span>

              {/* Concepto / Nota */}
              <div className="ledger-row-desc" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-high)' }}>
                  {tx.description || tx.category}
                </span>
              </div>

              {/* Categoría Badge */}
              <span
                className="ledger-row-category"
                style={{
                  fontSize: '0.68rem',
                  padding: '0.12rem 0.45rem',
                  borderRadius: 'var(--radius-sm, 4px)',
                  border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                  background: 'color-mix(in srgb, var(--bg-card) 80%, transparent)',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap'
                }}
              >
                {tx.category}
              </span>

              {/* Método / Cuenta */}
              <span
                className="ledger-row-method"
                style={{
                  fontSize: '0.68rem',
                  padding: '0.12rem 0.45rem',
                  borderRadius: 'var(--radius-sm, 4px)',
                  background: 'color-mix(in srgb, var(--accent, var(--primary)) 8%, transparent)',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap'
                }}
              >
                {tx.paymentMethod || 'Débito'}
              </span>

              {/* Monto Tabular */}
              <span
                className="ledger-row-amount"
                style={{
                  textAlign: 'right',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  color: isIncome ? 'var(--accent, var(--primary))' : 'var(--text-high)'
                }}
              >
                {isIncome ? '+' : '-'}${amountNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>

              {/* Acciones */}
              <div className="ledger-row-actions">
                <button
                  type="button"
                  onClick={() => onEditTx(tx)}
                  title="Editar transacción"
                  aria-label="Editar transacción"
                  className="ledger-action-btn"
                >
                  <Edit3 size={12} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTx(tx);
                  }}
                  title="Eliminar transacción"
                  aria-label="Eliminar transacción"
                  className="ledger-action-btn delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {totalCount > visibleLimit && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
          <TacticalButton
            variant="secondary"
            size="sm"
            onClick={onLoadMore}
          >
            Cargar más registros ({totalCount - visibleLimit} restantes)
          </TacticalButton>
        </div>
      )}
    </div>
  );
}

export default memo(LiveLedgerTable);
