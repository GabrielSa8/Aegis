import { Plus, Edit3, Trash2 } from 'lucide-react';
import Dashboard from '../Dashboard';
import TransactionForm from '../TransactionForm';
import TacticalButton from '../ui/TacticalButton';

export default function OperationsSection({
  safeTransactions,
  selectedDate,
  onBudgetChange,
  onTransactionSave,
  editingTransaction,
  onCancelEdit,
  onCategoriesChange,
  visibleMonthlyTxs,
  monthlyTxs,
  visibleLimit,
  onLoadMore,
  onEditTx,
  onDeleteTx
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Métricas KPI Rápidas (Sin tarjetas de presupuesto) */}
      <Dashboard 
        transactions={safeTransactions} 
        selectedDate={selectedDate} 
        onBudgetChange={onBudgetChange} 
        showBudgets={false} 
      />

      {/* Formulario e Historial Lado a Lado */}
      <div className="main-layout" style={{ marginTop: '0.5rem' }}>
        {/* Formulario */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <TransactionForm 
            selectedDate={selectedDate} 
            onTransactionSave={onTransactionSave} 
            editingTransaction={editingTransaction} 
            onCancelEdit={onCancelEdit} 
            onCategoriesChange={onCategoriesChange} 
          />
        </div>

        {/* Historial del Ciclo */}
        <div className="tx-list-container glass">
          <div className="tx-header">
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Historial del Ciclo</h3>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>
                Mostrando {visibleMonthlyTxs.length} de {monthlyTxs.length} registros
              </p>
            </div>
          </div>
          <div className="tx-items">
            {visibleMonthlyTxs.length > 0 ? (
              visibleMonthlyTxs.map((tx) => (
                <div key={tx.id} className="tx-item">
                  <div className="tx-left">
                    <div className={`tx-icon-wrapper ${tx.type}`}>
                      {tx.type === 'income' ? <Plus size={16} /> : <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>-</span>}
                    </div>
                    <div className="tx-info">
                      <h4>{tx.description || tx.category}</h4>
                      <p>{(tx.date || '').split('-').reverse().join('/')} • <span className="tx-badge">{tx.category}</span></p>
                    </div>
                  </div>
                  <div className="tx-right">
                    <div className="tx-details">
                      <span className="tx-badge" style={{ background: 'rgba(255,255,255,0.03)' }}>{tx.paymentMethod}</span>
                    </div>
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
                No hay transacciones registradas en este período.
              </div>
            )}
            {monthlyTxs.length > visibleLimit && (
              <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                <TacticalButton
                  variant="secondary"
                  size="sm"
                  onClick={onLoadMore}
                >
                  Cargar más registros ({monthlyTxs.length - visibleLimit} restantes)
                </TacticalButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
