import React from 'react';
import {
  useAccountsMsi,
  AccountsSection,
  MsiPlansSection,
  RecurringExpensesSection,
  AccountModal,
  MsiModal,
  RecurringModal
} from './finances/msi';

export default function AccountsMsiView({ onTransactionCreated }) {
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
    handleDeleteRecurring
  } = useAccountsMsi(onTransactionCreated);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 💳 SECCIÓN 1: CUENTAS Y TARJETAS */}
      <AccountsSection
        paymentMethods={paymentMethods}
        onAddClick={() => setShowAccountModal(true)}
        onDeleteAccount={handleDeleteAccount}
      />

      {/* 📦 SECCIÓN 2: PLANES MESES SIN INTERESES (MSI) */}
      <MsiPlansSection
        msiPlans={msiPlans}
        onAddClick={() => setShowMsiModal(true)}
        onPayInstallment={handlePayInstallment}
        onDeleteMsi={handleDeleteMsi}
      />

      {/* ⏰ SECCIÓN 3: GASTOS RECURRENTES Y SERVICIOS FIJOS */}
      <RecurringExpensesSection
        recurringExpenses={recurringExpenses}
        onAddClick={() => setShowRecurringModal(true)}
        onApproveRecurring={handleApproveRecurring}
        onDeleteRecurring={handleDeleteRecurring}
      />

      {/* MODALES TÁCTICOS */}
      <AccountModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        accountForm={accountForm}
        setAccountForm={setAccountForm}
        onSubmit={handleSaveAccount}
      />

      <MsiModal
        isOpen={showMsiModal}
        onClose={() => setShowMsiModal(false)}
        msiForm={msiForm}
        setMsiForm={setMsiForm}
        paymentMethods={paymentMethods}
        onSubmit={handleSaveMsi}
      />

      <RecurringModal
        isOpen={showRecurringModal}
        onClose={() => setShowRecurringModal(false)}
        recurringForm={recurringForm}
        setRecurringForm={setRecurringForm}
        paymentMethods={paymentMethods}
        onSubmit={handleSaveRecurring}
      />
    </div>
  );
}
