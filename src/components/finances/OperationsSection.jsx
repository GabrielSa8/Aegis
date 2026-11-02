import { useState, useMemo } from 'react';
import Dashboard from '../Dashboard';
import { QuickEntryDeck, LiveLedgerTable, LedgerHeaderFilter, QuickAccountsSummary } from './cockpit';

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
  onDeleteTx,
  startDate,
  endDate,
  cutoffDay,
  onUpdateCutoffDay,
  onShiftCycle
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'expense' | 'income'

  // Filtrado reactivo en tiempo real por búsqueda y tipo
  const filteredTxs = useMemo(() => {
    return (visibleMonthlyTxs || []).filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const desc = (tx.description || '').toLowerCase();
        const cat = (tx.category || '').toLowerCase();
        const method = (tx.paymentMethod || '').toLowerCase();
        return desc.includes(q) || cat.includes(q) || method.includes(q);
      }
      return true;
    });
  }, [visibleMonthlyTxs, typeFilter, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', height: '100%', overflow: 'hidden' }}>
      {/* 📊 Métricas KPI Rápidas (Nordic Compact) */}
      <Dashboard 
        transactions={safeTransactions} 
        selectedDate={selectedDate} 
        cutoffDay={cutoffDay}
        onBudgetChange={onBudgetChange} 
        showBudgets={false} 
      />

      {/* ⚡ Split-Cockpit: 36% Quick Deck & Cuentas / 64% Live Ledger */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'minmax(310px, 36%) 1fr', 
          gap: '0.85rem',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden'
        }}
      >
        {/* Columna Izquierda: Quick Entry Deck + Panel de Cuentas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', overflowY: 'auto' }} className="no-scrollbar">
          <QuickEntryDeck
            selectedDate={selectedDate}
            onTransactionSave={onTransactionSave}
            editingTransaction={editingTransaction}
            onCancelEdit={onCancelEdit}
            onCategoriesChange={onCategoriesChange}
          />
          <QuickAccountsSummary monthlyTxs={monthlyTxs} />
        </div>

        {/* Columna Derecha: Ledger & Filtros de Alta Densidad */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', height: '100%', overflow: 'hidden' }}>
          <LedgerHeaderFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            visibleCount={filteredTxs.length}
            totalCount={monthlyTxs ? monthlyTxs.length : 0}
            startDate={startDate}
            endDate={endDate}
            cutoffDay={cutoffDay}
            onUpdateCutoffDay={onUpdateCutoffDay}
            onShiftCycle={onShiftCycle}
          />
          <LiveLedgerTable
            transactions={filteredTxs}
            onEditTx={onEditTx}
            onDeleteTx={onDeleteTx}
            visibleLimit={visibleLimit}
            totalCount={monthlyTxs ? monthlyTxs.length : 0}
            onLoadMore={onLoadMore}
          />
        </div>
      </div>
    </div>
  );
}
