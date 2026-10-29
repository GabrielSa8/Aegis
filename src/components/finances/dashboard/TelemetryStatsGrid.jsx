import React from 'react';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, CreditCard } from 'lucide-react';

export function TelemetryStatsGrid({ metrics, showBudgets }) {
  const {
    netBalance,
    totalIncome,
    totalExpense,
    daysRemaining,
    totalCreditAccumulated,
    savingsRate
  } = metrics;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '8px',
        marginBottom: showBudgets ? '1rem' : '0'
      }}
    >
      {/* Balance Neto */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}
      >
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Balance Neto
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: netBalance >= 0 ? '#10b981' : 'var(--danger)', fontFamily: 'var(--font-mono)' }}>
            {netBalance >= 0 ? '+' : ''}${netBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.1)' }}>
          <Wallet size={15} color="#10b981" />
        </div>
      </div>

      {/* Ingresos */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}
      >
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Ingresos
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
            +${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.1)' }}>
          <TrendingUp size={15} color="#10b981" />
        </div>
      </div>

      {/* Gastos */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}
      >
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Gastos
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ef4444', fontFamily: 'var(--font-mono)' }}>
            -${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.1)' }}>
          <TrendingDown size={15} color="#ef4444" />
        </div>
      </div>

      {/* Acumulado Tarjeta + Corte */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Tarjeta
            </span>
            <span
              style={{
                fontSize: '0.58rem',
                padding: '1px 5px',
                borderRadius: '3px',
                background: daysRemaining <= 5 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                color: daysRemaining <= 5 ? '#f87171' : '#c084fc',
                fontWeight: 700
              }}
            >
              {daysRemaining}d corte
            </span>
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#c084fc', fontFamily: 'var(--font-mono)' }}>
            ${totalCreditAccumulated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', background: 'rgba(168, 85, 247, 0.1)' }}>
          <CreditCard size={15} color="#c084fc" />
        </div>
      </div>

      {/* Tasa de Ahorro */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}
      >
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Tasa Ahorro
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: savingsRate >= 0 ? '#f59e0b' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {savingsRate.toFixed(1)}%
          </div>
        </div>
        <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', background: 'rgba(245, 158, 11, 0.1)' }}>
          <PiggyBank size={15} color="#f59e0b" />
        </div>
      </div>
    </div>
  );
}
