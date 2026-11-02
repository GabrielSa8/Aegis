import React, { useMemo } from 'react';
import { Flame, ShieldCheck, TrendingUp, TrendingDown, AlertTriangle, Zap, Calendar, ArrowRight } from 'lucide-react';
import { calculateBurnRateMetrics } from './burnRateEngine';

export default function BurnRateCockpit({
  transactions = [],
  startDate,
  endDate,
  selectedDate,
  budgets = {},
  paymentMethods = [],
  recurringExpenses = [],
  msiPlans = []
}) {
  const metrics = useMemo(() => {
    return calculateBurnRateMetrics({
      transactions,
      startDate,
      endDate,
      currentDate: selectedDate ? new Date(selectedDate + 'T12:00:00') : new Date(),
      budgets,
      paymentMethods,
      recurringExpenses,
      msiPlans
    });
  }, [transactions, startDate, endDate, selectedDate, budgets, paymentMethods, recurringExpenses, msiPlans]);

  const {
    totalCycleDays,
    daysElapsed,
    daysRemaining,
    progressPercent,
    totalIncome,
    totalExpense,
    totalBudget,
    effectiveCap,
    dailyBurnRate,
    projectedTotalExpense,
    projectedNetBalance,
    projectedRatio,
    safeDailyBudget,
    runwayDays,
    idealPaceExpense,
    deltaPace,
    riskLevel,
    riskTitle,
    riskAdvice
  } = metrics;

  // Colores semánticos según el nivel de riesgo
  const badgeColor = riskLevel === 'danger'
    ? 'var(--danger)'
    : riskLevel === 'warning'
    ? 'var(--warning)'
    : 'var(--accent, var(--primary))';

  const badgeBg = riskLevel === 'danger'
    ? 'color-mix(in srgb, var(--danger) 15%, transparent)'
    : riskLevel === 'warning'
    ? 'color-mix(in srgb, var(--warning) 15%, transparent)'
    : 'color-mix(in srgb, var(--accent, var(--primary)) 15%, transparent)';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        height: '100%',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* 🚀 Banner Táctico Predictivo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.45rem 0.75rem',
          borderRadius: 'var(--radius-sm, 6px)',
          background: badgeBg,
          border: `1px solid color-mix(in srgb, ${badgeColor} 30%, transparent)`,
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontWeight: 800,
              fontSize: '0.72rem',
              color: badgeColor,
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            {riskLevel === 'danger' ? <AlertTriangle size={13} /> : <Flame size={13} />}
            <span>{riskTitle}</span>
          </div>
          <span style={{ fontSize: '0.66rem', color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {riskAdvice}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.64rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono, monospace)', flexShrink: 0 }}>
          <Calendar size={11} style={{ opacity: 0.7 }} />
          <span>Día {daysElapsed}/{totalCycleDays}</span>
          <span>•</span>
          <strong style={{ color: 'var(--text-high)' }}>{daysRemaining}d para corte</strong>
        </div>
      </div>

      {/* 📊 Tríada de Métricas de Burn-Rate */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.55rem',
          flex: 1,
          minHeight: 0
        }}
      >
        {/* Tarjeta 1: Burn Rate Actual */}
        <div
          style={{
            background: 'color-mix(in srgb, var(--bg-card) 70%, transparent)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm, 6px)',
            padding: '0.55rem 0.65rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Ritmo de Quema
            </span>
            <Flame size={12} style={{ color: 'var(--warning)' }} />
          </div>

          <div style={{ margin: '0.2rem 0' }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-high)' }}>
              ${Math.round(dailyBurnRate).toLocaleString()}
              <span style={{ fontSize: '0.62rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '3px' }}>/día</span>
            </div>
          </div>

          <div style={{ fontSize: '0.6rem', color: deltaPace > 0 ? 'var(--danger)' : 'var(--accent, var(--primary))', display: 'flex', alignItems: 'center', gap: '3px' }}>
            {deltaPace > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            <span>{deltaPace > 0 ? `+$${Math.round(deltaPace).toLocaleString()} sobre ritmo ideal` : `-$${Math.round(Math.abs(deltaPace)).toLocaleString()} de ahorro`}</span>
          </div>
        </div>

        {/* Tarjeta 2: Proyección de Fin de Ciclo */}
        <div
          style={{
            background: 'color-mix(in srgb, var(--bg-card) 70%, transparent)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm, 6px)',
            padding: '0.55rem 0.65rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Proyección al Corte
            </span>
            <TrendingUp size={12} style={{ color: badgeColor }} />
          </div>

          <div style={{ margin: '0.2rem 0' }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, fontFamily: 'var(--font-mono, monospace)', color: badgeColor }}>
              ${Math.round(projectedTotalExpense).toLocaleString()}
            </div>
          </div>

          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span>{projectedRatio.toFixed(0)}% del tope</span>
            <span>•</span>
            <span style={{ color: projectedNetBalance >= 0 ? 'var(--accent, var(--primary))' : 'var(--danger)', fontWeight: 600 }}>
              {projectedNetBalance >= 0 ? `+$${Math.round(projectedNetBalance).toLocaleString()}` : `-$${Math.round(Math.abs(projectedNetBalance)).toLocaleString()}`}
            </span>
          </div>
        </div>

        {/* Tarjeta 3: Runway & Tope Seguro */}
        <div
          style={{
            background: 'color-mix(in srgb, var(--bg-card) 70%, transparent)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm, 6px)',
            padding: '0.55rem 0.65rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Límite Diario Seguro
            </span>
            <ShieldCheck size={12} style={{ color: 'var(--accent, var(--primary))' }} />
          </div>

          <div style={{ margin: '0.2rem 0' }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-high)' }}>
              ${Math.round(safeDailyBudget).toLocaleString()}
              <span style={{ fontSize: '0.62rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '3px' }}>/día máx</span>
            </div>
          </div>

          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Zap size={10} style={{ color: 'var(--warning)' }} />
            <span>Runway: <strong style={{ color: 'var(--text-high)' }}>{runwayDays >= 999 ? '∞' : `${runwayDays}d`}</strong></span>
          </div>
        </div>
      </div>

      {/* 🧭 Visualizador Comparativo de Trayectoria (Tiempo vs Gasto) */}
      <div
        style={{
          background: 'color-mix(in srgb, var(--bg-card) 50%, transparent)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm, 6px)',
          padding: '0.45rem 0.65rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
          <span>Avance del Ciclo ({progressPercent.toFixed(0)}% del tiempo)</span>
          <span>Gasto Real ({effectiveCap > 0 ? ((totalExpense / effectiveCap) * 100).toFixed(0) : 0}% consumido)</span>
        </div>

        {/* Doble barra comparativa */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {/* Barra Tiempo */}
          <div style={{ height: '4px', width: '100%', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, progressPercent)}%`,
                background: 'var(--border-color)',
                borderRadius: '2px',
                transition: 'width 0.4s ease'
              }}
            />
          </div>

          {/* Barra Gasto */}
          <div style={{ height: '5px', width: '100%', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, effectiveCap > 0 ? (totalExpense / effectiveCap) * 100 : 0)}%`,
                background: badgeColor,
                borderRadius: '2px',
                boxShadow: `0 0 6px ${badgeColor}`,
                transition: 'width 0.4s ease'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
