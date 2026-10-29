import Analytics from './Analytics';
import TimelineView from './TimelineView';
import AccountsMsiView from './AccountsMsiView';
import {
  useFinances,
  FinancesNav,
  CycleCloseBanner,
  OperationsSection,
  CalendarSection,
  BudgetsSection,
  BackupsModal,
  DeleteTxModal,
  RestoreSnapshotModal
} from './finances';

export default function FinancesView() {
  const {
    subTab,
    setSubTab,
    safeTransactions,
    timelineEvents,
    selectedDate,
    setSelectedDate,
    editingTransaction,
    snapshots,
    showBackupsModal,
    setShowBackupsModal,
    deletingTransaction,
    setDeletingTransaction,
    restoringSnapshotId,
    setRestoringSnapshotId,
    visibleLimit,
    setVisibleLimit,
    startDate,
    endDate,
    monthlyTxs,
    visibleMonthlyTxs,
    selectedDayTxs,
    selectedDayEvents,
    isToday22,
    refreshSnapshots,
    refreshTransactionsAndSnapshots,
    handleToggleTimelineEvent,
    handleSaveTimelineEvent,
    handleDeleteTimelineEvent,
    handleTransactionSave,
    handleTransactionEdit,
    handleCancelEdit,
    confirmDeleteTransaction,
    handleExportBackup,
    handleImportBackup,
    handleDownloadSnapshot,
    confirmRestoreSnapshot
  } = useFinances();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* 🧭 Barra de Sub-Navegación Táctica */}
      <FinancesNav
        subTab={subTab}
        onSelectSubTab={setSubTab}
        startDate={startDate}
        endDate={endDate}
        snapshotsCount={snapshots.length}
        onOpenBackups={() => setShowBackupsModal(true)}
      />

      {/* Recordatorio de Cierre de Ciclo */}
      <CycleCloseBanner
        isToday22={isToday22}
        onExportBackup={handleExportBackup}
      />

      {/* 🚀 SUB-VISTA 1: OPERACIONES & REGISTRO */}
      {subTab === 'operations' && (
        <OperationsSection
          safeTransactions={safeTransactions}
          selectedDate={selectedDate}
          onBudgetChange={refreshSnapshots}
          onTransactionSave={handleTransactionSave}
          editingTransaction={editingTransaction}
          onCancelEdit={handleCancelEdit}
          onCategoriesChange={refreshTransactionsAndSnapshots}
          visibleMonthlyTxs={visibleMonthlyTxs}
          monthlyTxs={monthlyTxs}
          visibleLimit={visibleLimit}
          onLoadMore={() => setVisibleLimit((prev) => prev + 30)}
          onEditTx={handleTransactionEdit}
          onDeleteTx={setDeletingTransaction}
        />
      )}

      {/* 💳 SUB-VISTA 2: CUENTAS, MSI Y GASTOS RECURRENTES */}
      {subTab === 'accounts' && (
        <AccountsMsiView onTransactionCreated={refreshTransactionsAndSnapshots} />
      )}

      {/* 🧭 SUB-VISTA 3: TIMELINE MAESTRO CRUZADO */}
      {subTab === 'timeline' && (
        <TimelineView 
          events={timelineEvents}
          onToggleEvent={handleToggleTimelineEvent}
          onSaveEvent={handleSaveTimelineEvent}
          onDeleteEvent={handleDeleteTimelineEvent}
        />
      )}

      {/* 📅 SUB-VISTA 4: CALENDARIO */}
      {subTab === 'calendar' && (
        <CalendarSection
          safeTransactions={safeTransactions}
          timelineEvents={timelineEvents}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          selectedDayTxs={selectedDayTxs}
          selectedDayEvents={selectedDayEvents}
          onToggleTimelineEvent={handleToggleTimelineEvent}
          onEditTx={handleTransactionEdit}
          onDeleteTx={setDeletingTransaction}
          onGoToOperations={() => setSubTab('operations')}
        />
      )}

      {/* 📊 SUB-VISTA 5: ANALÍTICA & GRÁFICOS */}
      {subTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Analytics 
            transactions={safeTransactions} 
            selectedDate={selectedDate} 
          />
        </div>
      )}

      {/* 🎯 SUB-VISTA 6: PRESUPUESTOS & RESPALDOS */}
      {subTab === 'budgets' && (
        <BudgetsSection
          safeTransactions={safeTransactions}
          selectedDate={selectedDate}
          onBudgetChange={refreshSnapshots}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
        />
      )}

      {/* ⚙️ MODAL DE RESPALDOS */}
      <BackupsModal
        isOpen={showBackupsModal}
        onClose={() => setShowBackupsModal(false)}
        snapshots={snapshots}
        onDownloadSnapshot={handleDownloadSnapshot}
        onSelectRestoreSnapshot={setRestoringSnapshotId}
      />

      {/* 🗑️ MODAL DE BORRADO DE REGISTRO */}
      <DeleteTxModal
        transaction={deletingTransaction}
        onClose={() => setDeletingTransaction(null)}
        onConfirm={confirmDeleteTransaction}
      />

      {/* ⚠️ MODAL DE RESTAURACIÓN DE RESPALDO */}
      <RestoreSnapshotModal
        snapshotId={restoringSnapshotId}
        onClose={() => setRestoringSnapshotId(null)}
        onConfirm={confirmRestoreSnapshot}
      />
    </div>
  );
}
