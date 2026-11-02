import { useState, useEffect } from 'react';
import { CreditCard, Layers, PieChart, Target, Repeat, Flame } from 'lucide-react';
import { getBudgets } from '../../../utils/storage';
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
  YearlyEvolutionChart,
  BurnRateCockpit
} from '../analytics';
import StructureDeleteModal from './StructureDeleteModal';
import Dashboard from '../../Dashboard';

export default function FinanceStructureView({
  safeTransactions = [],
  selectedDate,
  cutoffDay,
  onBudgetChange,
  onTransactionCreated
}) {
  const [activeAccountTab, setActiveAccountTab] = useState('accounts'); // 'accounts' | 'msi' | 'recurring'
  const [analyticsView, setAnalyticsView] = useState('cycle'); // 'cycle' | 'burnrate' | 'annual'
  const [budgets, setBudgets] = useState({});

  useEffect(() => {
    let mounted = true;
    getBudgets().then((b) => {
      if (mounted && b) setBudgets(b);
    });
    return () => { mounted = false; };
  }, [safeTransactions.length]);

  // Hook soberano de Cuentas, MSI y Recurrentes
  const {
    paymentMethods, msiPlans, recurringExpenses,
    showAccountModal, setShowAccountModal,
    showMsiModal, setShowMsiModal,
    showRecurringModal, setShowRecurringModal,
    accountForm, setAccountForm,
    msiForm, setMsiForm,
    recurringForm, setRecurringForm,
    handleOpenAddAccount, handleEditAccount, handleSaveAccount, handleDeleteAccount,
    handleSaveMsi, handlePayInstallment, handleDeleteMsi,
    handleSaveRecurring, handleApproveRecurring, handleDeleteRecurring,
    itemToDelete, handleCancelDelete, handleConfirmDelete
  } = useAccountsMsi(onTransactionCreated);

  // Hook de analítica de gastos
  const {
    startDate, endDate, activeFinancialYear,
    doughnutData, hasExpenses, doughnutOptions,
    barData, barOptions, methodData, methodOptions
  } = useAnalyticsData(safeTransactions, selectedDate, paymentMethods);

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
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto' }} className="no-scrollbar">
          {activeAccountTab === 'accounts' && (
            <AccountsSection
              paymentMethods={paymentMethods}
              onAddClick={handleOpenAddAccount}
              onEditAccount={handleEditAccount}
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
              {analyticsView === 'burnrate' ? (
                <Flame size={13} style={{ color: 'var(--warning)' }} />
              ) : (
                <PieChart size={13} style={{ color: 'var(--accent, var(--primary))' }} />
              )}
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-high)' }}>
                {analyticsView === 'burnrate' ? 'TELEMETRÍA BURN-RATE & RUNWAY' : `DISTRIBUCIÓN DE GASTO (${activeFinancialYear})`}
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
                onClick={() => setAnalyticsView('burnrate')}
                className={`structure-tab-pill ${analyticsView === 'burnrate' ? 'active' : ''}`}
                style={{ padding: '0.18rem 0.5rem', fontSize: '0.67rem', display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                <Flame size={10} style={{ color: analyticsView === 'burnrate' ? 'var(--warning)' : 'currentColor' }} />
                <span>Burn-Rate</span>
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
            {analyticsView === 'burnrate' ? (
              <BurnRateCockpit
                transactions={safeTransactions}
                startDate={startDate}
                endDate={endDate}
                selectedDate={selectedDate}
                budgets={budgets}
                paymentMethods={paymentMethods}
                recurringExpenses={recurringExpenses}
                msiPlans={msiPlans}
              />
            ) : analyticsView === 'cycle' ? (
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
      <StructureDeleteModal
        itemToDelete={itemToDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}