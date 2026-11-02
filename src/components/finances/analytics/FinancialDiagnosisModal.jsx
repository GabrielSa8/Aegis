import React, { useMemo } from 'react';
import { Sparkles, Brain, AlertTriangle, TrendingDown, Coffee, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { ModalWrapper, TacticalButton } from '../../ui';
import { queueMacro } from '../../agent/macroBus';

export default function FinancialDiagnosisModal({
  isOpen,
  onClose,
  metrics,
  transactions = [],
  budgets = {},
  paymentMethods = []
}) {
  // Análisis de Gastos Hormiga (micro-gastos <= $180)
  const antExpenses = useMemo(() => {
    if (!Array.isArray(transactions)) return { items: [], total: 0, percentage: 0 };
    
    // Filtrar micro-gastos repetitivos <= $180 de tipo expense
    const items = transactions.filter((t) => {
      const amt = Number(t.amount) || 0;
      return t.type !== 'income' && amt > 0 && amt <= 180;
    });

    const total = items.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalExp = metrics?.totalExpense || 1;
    const percentage = (total / totalExp) * 100;

    return { items, total, percentage };
  }, [transactions, metrics?.totalExpense]);

  // Análisis de Categorías Dominantes / Concentración de Riesgo
  const categoryConcentration = useMemo(() => {
    const expenses = {};
    (transactions || []).forEach((t) => {
      if (t.type !== 'income') {
        const cat = t.category || 'Otros';
        expenses[cat] = (expenses[cat] || 0) + (Number(t.amount) || 0);
      }
    });

    const total = metrics?.totalExpense || 1;
    return Object.entries(expenses)
      .map(([cat, amt]) => ({
        category: cat,
        amount: amt,
        ratio: (amt / total) * 100
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, metrics?.totalExpense]);

  // Ejecutar Macro y Enviar al Agente IA
  const handleConsultAgent = () => {
    const topCats = categoryConcentration.slice(0, 3).map((c) => `${c.category}: $${Math.round(c.amount).toLocaleString()} (${c.ratio.toFixed(0)}%)`).join(', ');

    const promptText = `Actúa como mi Asesor Financiero Táctico en Aegis. Realiza un diagnóstico exhaustivo y recomendaciones accionables para mi ciclo financiero activo con estos datos reales:

📊 **Radiografía del Ciclo Activo:**
- Total Gastado: $${Math.round(metrics?.totalExpense || 0).toLocaleString()} | Ingresos: $${Math.round(metrics?.totalIncome || 0).toLocaleString()}
- Ritmo de Quema (Burn Rate): $${Math.round(metrics?.dailyBurnRate || 0).toLocaleString()} / día
- Proyección al Corte: $${Math.round(metrics?.projectedTotalExpense || 0).toLocaleString()} (${(metrics?.projectedRatio || 0).toFixed(0)}% del tope)
- Días Restantes para Corte: ${metrics?.daysRemaining || 0} días | Runway: ${metrics?.runwayDays || 0} días
- Límite Seguro Recomendado: $${Math.round(metrics?.safeDailyBudget || 0).toLocaleString()} / día máx
- Estado Semáforo: ${metrics?.riskTitle || 'Evaluación'} (${metrics?.riskAdvice || ''})

🐜 **Fugas Invisibles / Gastos Hormiga:**
- Monto detectado en micro-gastos (≤$180): $${Math.round(antExpenses.total).toLocaleString()} (${antExpenses.items.length} movimientos, ${antExpenses.percentage.toFixed(1)}% del gasto total).

🎯 **Concentración de Gasto:**
- Principales Categorías: ${topCats || 'Sin registros suficientes'}.

Solicito:
1. Detección de fugas de capital y compras impulsivas en este ciclo.
2. Tres ajustes concretos para no exceder el presupuesto antes del corte.
3. Recomendación de ahorro basada en mi ritmo diario seguro ($${Math.round(metrics?.safeDailyBudget || 0).toLocaleString()}/día).`;

    queueMacro({
      id: 'macro-financial-copilot',
      label: 'Diagnóstico Finanzas',
      text: promptText
    }, true);

    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Copiloto Financiero IA — Diagnóstico de Ciclo"
      icon={Brain}
      maxWidth="680px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {/* Banner de Estado General */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-sm, 6px)',
            background: metrics?.riskLevel === 'danger'
              ? 'color-mix(in srgb, var(--danger) 15%, transparent)'
              : metrics?.riskLevel === 'warning'
              ? 'color-mix(in srgb, var(--warning) 15%, transparent)'
              : 'color-mix(in srgb, var(--accent, var(--primary)) 15%, transparent)',
            border: `1px solid color-mix(in srgb, ${metrics?.riskLevel === 'danger' ? 'var(--danger)' : metrics?.riskLevel === 'warning' ? 'var(--warning)' : 'var(--accent, var(--primary))'} 35%, transparent)`
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <Sparkles size={16} style={{ color: metrics?.riskLevel === 'danger' ? 'var(--danger)' : 'var(--accent, var(--primary))' }} />
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-high)' }}>
                {metrics?.riskTitle || 'Diagnóstico Preliminar'}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {metrics?.riskAdvice}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono, monospace)' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-high)' }}>
              ${Math.round(metrics?.dailyBurnRate || 0).toLocaleString()}<span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>/d</span>
            </div>
            <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Quema Diaria
            </div>
          </div>
        </div>

        {/* Rejilla Bilateral de Detección */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
          {/* Tarjeta Gastos Hormiga */}
          <div
            style={{
              padding: '0.65rem 0.75rem',
              borderRadius: 'var(--radius-sm, 6px)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Coffee size={12} style={{ color: 'var(--warning)' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-high)' }}>
                  Gastos Hormiga (≤$180)
                </span>
              </div>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', color: 'var(--warning)' }}>
                {antExpenses.percentage.toFixed(0)}% del gasto
              </span>
            </div>

            <div style={{ fontSize: '0.95rem', fontWeight: 800, fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-high)' }}>
              ${Math.round(antExpenses.total).toLocaleString()}
              <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '4px' }}>
                ({antExpenses.items.length} compras)
              </span>
            </div>

            <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', margin: 0 }}>
              {antExpenses.items.length === 0
                ? 'Sin micro-gastos detectados en este ciclo.'
                : 'Micro-pagos repetitivos que drenan silenciosamente tu flujo de caja.'}
            </p>
          </div>

          {/* Tarjeta Concentración de Categorías */}
          <div
            style={{
              padding: '0.65rem 0.75rem',
              borderRadius: 'var(--radius-sm, 6px)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-high)' }}>
                Categorías Dominantes
              </span>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Top 3</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {categoryConcentration.slice(0, 3).map((c) => (
                <div key={c.category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.66rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{c.category}</span>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', color: c.ratio > 40 ? 'var(--warning)' : 'var(--text-high)' }}>
                    ${Math.round(c.amount).toLocaleString()} ({c.ratio.toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tríada de Métricas de Seguridad */}
        <div
          style={{
            padding: '0.55rem 0.75rem',
            borderRadius: 'var(--radius-sm, 6px)',
            background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.68rem'
          }}
        >
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Límite Diario Seguro: </span>
            <strong style={{ color: 'var(--accent, var(--primary))', fontFamily: 'var(--font-mono, monospace)' }}>
              ${Math.round(metrics?.safeDailyBudget || 0).toLocaleString()}/día
            </strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Runway Disponible: </span>
            <strong style={{ color: 'var(--text-high)', fontFamily: 'var(--font-mono, monospace)' }}>
              {metrics?.runwayDays >= 999 ? 'Saludable (∞)' : `${metrics?.runwayDays} días`}
            </strong>
          </div>
        </div>

        {/* Acciones del Modal */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.3rem' }}>
          <TacticalButton variant="ghost" size="sm" onClick={onClose}>
            Cerrar
          </TacticalButton>
          <TacticalButton
            variant="primary"
            size="sm"
            onClick={handleConsultAgent}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Brain size={13} />
            <span>Consultar al Agente IA</span>
            <ArrowRight size={12} />
          </TacticalButton>
        </div>
      </div>
    </ModalWrapper>
  );
}
