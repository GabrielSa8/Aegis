import { useState } from 'react';
import { CreditCard, Layers, PieChart, Target, Repeat } from 'lucide-react';
import {
  useAccountsMsi,
  AccountsSection,
  MsiPlansSection,
  RecurringExpensesSection,
  AccountModal,
  MsiModal,
  RecurringModal
} from '../msi';
import {
  useAnalyticsData,
  CategoryExpenseChart,
  MethodExpenseChart,
  YearlyEvolutionChart
} from '../analytics';
import FinanceDeleteConfirmModal from '../FinanceDeleteConfirmModal';
import Dashboard from '../../Dashboard';

export default function FinanceStructureView({
  safeTransactions = [],
  selectedDate,
  cutoffDay,
  onBudgetChange,
  onTransactionCreated
}) {
  const [activeAccountTab, setActiveAccountTab] = useState('accounts'); // 'accounts' | 'msi' | 'recurring'
  const [analyticsView, setAnalyticsView] = useState('cycle'); // 'cycle' | 'annual'

  // Hook soberano de Cuentas, MSI y Recurrentes
  const {
    paymentMethods,
    msiPlans,
    recurringExpenses,
    showAccountModal,
    setShowAccountModal,
    showMsiModal,
    setShowMsiModal,
    showRecurringModal,
    setShowRecurringModal,
    accountForm,
    setAccountForm,
    msiForm,
    setMsiForm,
    recurringForm,
    setRecurringForm,
    handleSaveAccount,
    handleDeleteAccount,
    handleSaveMsi,
    handlePayInstallment,
    handleDeleteMsi,
    handleSaveRecurring,
    handleApproveRecurring,
    handleDeleteRecurring,
    itemToDelete,
    handleCancelDelete,
    handleConfirmDelete
  } = useAccountsMsi(onTransactionCreated);

  // Hook de analítica de gastos
  const {
    startDate,
    endDate,
    activeFinancialYear,
    doughnutData,
    hasExpenses,
    doughnutOptions,
    barData,
    barOptions,
    methodData,
    methodOptions
  } = useAnalyticsData(safeTransactions, selectedDate);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(340px, 48%) minmax(340px, 52%)',
        gap: '0.85rem',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      {/* 💳 COLUMNA IZQUIERDA: RADAR DE CUENTAS, MSI & COMPROMISOS */}
      <div
        style={{
          borderRadius: 'var(--radius-md, 8px)',
          border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
          background: 'var(--bg-card, rgba(255,255,255,0.02))',
          padding: '0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
          height: '100%',
          overflow: 'hidden'
        }}
      >
        {/* Selector de Pestañas Superior */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))', paddingBottom: '0.45rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {[
              { id: 'accounts', label: 'Cuentas & Tarjetas', count: paymentMethods.length, icon: CreditCard },
              { id: 'msi', label: 'Planes MSI', count: msiPlans.length, icon: Layers },
              { id: 'recurring', label: 'Gastos Fijos', count: recurringExpenses.length, icon: Repeat }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeAccountTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveAccountTab(tab.id)}
                  className={`structure-tab-pill ${isActive ? 'active' : ''}`}
                >
                  <Icon size={12} style={{ color: isActive ? 'var(--accent, var(--primary))' : 'currentColor' }} />
                  <span>{tab.label}</span>
                  <span style={{ fontSize: '0.64rem', opacity: 0.8, fontFamily: 'JetBrains Mono, monospace' }}>
                    ({tab.count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel Scrolleable del Tier 1 */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }} className="no-scrollbar">
          {activeAccountTab === 'accounts' && (
            <AccountsSection
              paymentMethods={paymentMethods}
              onAddClick={() => setShowAccountModal(true)}
              onDeleteAccount={handleDeleteAccount}
            />
          )}
          {activeAccountTab === 'msi' && (
            <MsiPlansSection
              msiPlans={msiPlans}
              onAddClick={() => setShowMsiModal(true)}
              onPayInstallment={handlePayInstallment}
              onDeleteMsi={handleDeleteMsi}
            />
          )}
          {activeAccountTab === 'recurring' && (
            <RecurringExpensesSection
              recurringExpenses={recurringExpenses}
              onAddClick={() => setShowRecurringModal(true)}
              onApproveRecurring={handleApproveRecurring}
              onDeleteRecurring={handleDeleteRecurring}
            />
          )}
        </div>
      </div>

      {/* 📊 COLUMNA DERECHA: SPLIT VERTICAL (ANALÍTICA + PRESUPUESTOS) */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: 'minmax(220px, 46%) 1fr',
          gap: '0.75rem',
          height: '100%',
          overflow: 'hidden'
        }}
      >
        {/* Bloque Superior: Analítica de Distribución */}
        <div
          style={{
            borderRadius: 'var(--radius-md, 8px)',
            border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
            background: 'var(--bg-card, rgba(255,255,255,0.02))',
            padding: '0.75rem 0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))', paddingBottom: '0.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <PieChart size={13} style={{ color: 'var(--accent, var(--primary))' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-high)' }}>
                DISTRIBUCIÓN DE GASTO ({activeFinancialYear})
              </span>
            </div>
            <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setAnalyticsView('cycle')}
                className={`structure-tab-pill ${analyticsView === 'cycle' ? 'active' : ''}`}
                style={{ padding: '0.18rem 0.5rem', fontSize: '0.67rem' }}
              >
                Ciclo Actual
              </button>
              <button
                type="button"
                onClick={() => setAnalyticsView('annual')}
                className={`structure-tab-pill ${analyticsView === 'annual' ? 'active' : ''}`}
                style={{ padding: '0.18rem 0.5rem', fontSize: '0.67rem' }}
              >
                Anual
              </button>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }} className="no-scrollbar">
            {analyticsView === 'cycle' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', height: '100%' }}>
                <CategoryExpenseChart
                  startDate={startDate}
                  endDate={endDate}
                  doughnutData={doughnutData}
                  doughnutOptions={doughnutOptions}
                  hasExpenses={hasExpenses}
                />
                <MethodExpenseChart
                  startDate={startDate}
                  endDate={endDate}
                  methodData={methodData}
                  methodOptions={methodOptions}
                  hasExpenses={hasExpenses}
                />
              </div>
            ) : (
              <YearlyEvolutionChart
                activeFinancialYear={activeFinancialYear}
                barData={barData}
                barOptions={barOptions}
              />
            )}
          </div>
        </div>

        {/* Bloque Inferior: Presupuestos por Categoría */}
        <div 
          style={{ 
            borderRadius: 'var(--radius-md, 8px)', 
            border: '1px solid var(--border-color, rgba(255,255,255,0.08))', 
            background: 'var(--bg-card, rgba(255,255,255,0.02))', 
            padding: '0.65rem 0.85rem', 
            display: 'flex', 
            flexDirection: 'column', 
            overflow: 'hidden'
          }}
        >
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }} className="no-scrollbar">
            <Dashboard
              transactions={safeTransactions}
              selectedDate={selectedDate}
              cutoffDay={cutoffDay}
              onBudgetChange={onBudgetChange}
              showBudgets={true}
              showStats={false}
            />
          </div>
        </div>
      </div>

      {/* Modales Soberanos */}
      <AccountModal isOpen={showAccountModal} onClose={() => setShowAccountModal(false)} accountForm={accountForm} setAccountForm={setAccountForm} onSubmit={handleSaveAccount} />
      <MsiModal isOpen={showMsiModal} onClose={() => setShowMsiModal(false)} msiForm={msiForm} setMsiForm={setMsiForm} paymentMethods={paymentMethods} onSubmit={handleSaveMsi} />
      <RecurringModal isOpen={showRecurringModal} onClose={() => setShowRecurringModal(false)} recurringForm={recurringForm} setRecurringForm={setRecurringForm} paymentMethods={paymentMethods} onSubmit={handleSaveRecurring} />

      {/* 🗑️ Modal Unificado de Confirmación de Borrado */}
      <FinanceDeleteConfirmModal
        isOpen={Boolean(itemToDelete)}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title={
          itemToDelete?.type === 'account' ? '¿Eliminar cuenta o tarjeta?' :
          itemToDelete?.type === 'msi' ? '¿Eliminar plan MSI?' :
          itemToDelete?.type === 'recurring' ? '¿Eliminar gasto recurrente?' :
          '¿Confirmar eliminación?'
        }
        description={
          itemToDelete?.type === 'account' ? (
            <>
              Estás a punto de eliminar la cuenta/tarjeta{' '}
              <strong>"{itemToDelete.data?.name}"</strong>{' '}
              ({itemToDelete.data?.type === 'credit' ? 'Crédito' : 'Débito / Efectivo'}).
              {itemToDelete.data?.type === 'credit' && itemToDelete.data?.creditLimit ? (
                <> Límite: <strong>${Number(itemToDelete.data.creditLimit).toLocaleString()}</strong>.</>
              ) : ''}
              <br />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Esta acción no se puede deshacer en la base de datos local SQLite.
              </span>
            </>
          ) : itemToDelete?.type === 'msi' ? (
            <>
              Estás a punto de eliminar el plan a meses sin intereses{' '}
              <strong>"{itemToDelete.data?.description}"</strong> por un total de{' '}
              <strong style={{ color: 'var(--danger)' }}>
                ${Number(itemToDelete.data?.totalAmount || 0).toLocaleString()}
              </strong>{' '}
              ({itemToDelete.data?.totalInstallments} mensualidades).
            </>
          ) : itemToDelete?.type === 'recurring' ? (
            <>
              Estás a punto de eliminar el gasto fijo recurrente{' '}
              <strong>"{itemToDelete.data?.description}"</strong> por{' '}
              <strong style={{ color: 'var(--danger)' }}>
                ${Number(itemToDelete.data?.amount || 0).toLocaleString()}
              </strong>{' '}
              (Día de corte: {itemToDelete.data?.dueDay}).
            </>
          ) : null
        }
        confirmText={
          itemToDelete?.type === 'account' ? 'Eliminar Cuenta' :
          itemToDelete?.type === 'msi' ? 'Eliminar Plan' :
          itemToDelete?.type === 'recurring' ? 'Eliminar Gasto' :
          'Sí, Eliminar'
        }
      />
    </div>
  );
}