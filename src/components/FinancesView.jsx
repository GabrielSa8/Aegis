import {
  useFinances,
  FinancesNav,
  CycleCloseBanner,
  OperationsSection,
  TemporalPulseView,
  FinanceStructureView,
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
    cutoffDay,
    handleUpdateCutoffDay,
    handleShiftCycle,
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', height: '100%', width: '100%', overflow: 'hidden', position: 'relative' }}>
      {/* 🧭 Barra Superior de Sub-Navegación Táctica */}
      <FinancesNav
        subTab={subTab}
        onSelectSubTab={setSubTab}
        snapshotsCount={snapshots.length}
        onOpenBackups={() => setShowBackupsModal(true)}
      />

      {/* Recordatorio de Cierre de Ciclo */}
      <CycleCloseBanner
        isToday22={isToday22}
        onExportBackup={handleExportBackup}
      />

      {/* 🚀 Contenedor Flexible de Sub-Vistas (100% Pantalla Útil) */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
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
            startDate={startDate}
            endDate={endDate}
            cutoffDay={cutoffDay}
            onUpdateCutoffDay={handleUpdateCutoffDay}
            onShiftCycle={handleShiftCycle}
          />
        )}

        {/* 🧭 VISTA 2: PULSO TEMPORAL (CALENDARIO TÁCTICO & AGENDA DEL CICLO) */}
        {(subTab === 'pulse' || subTab === 'calendar' || subTab === 'timeline') && (
          <TemporalPulseView
            safeTransactions={safeTransactions}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            selectedDayTxs={selectedDayTxs}
            startDate={startDate}
            endDate={endDate}
            cutoffDay={cutoffDay}
            onSaveTransaction={handleTransactionSave}
            onDeleteTx={setDeletingTransaction}
            onGoToOperations={() => setSubTab('operations')}
          />
        )}

        {/* 📊 VISTA 3: ESTRUCTURA, MSI, ANALÍTICA & PRESUPUESTOS */}
        {(subTab === 'structure' || subTab === 'accounts' || subTab === 'analytics' || subTab === 'budgets') && (
          <FinanceStructureView
            safeTransactions={safeTransactions}
            selectedDate={selectedDate}
            cutoffDay={cutoffDay}
            onBudgetChange={refreshSnapshots}
            onTransactionCreated={refreshTransactionsAndSnapshots}
          />
        )}
      </div>

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
