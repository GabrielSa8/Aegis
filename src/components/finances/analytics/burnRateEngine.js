/**
 * ⚡ Algoritmo de Burn-Rate, Runway y Proyección de Fin de Ciclo (Fase 2.5)
 * O(1) tiempo de ejecución, 100% local, 0 tokens.
 */

export function calculateBurnRateMetrics({
  transactions = [],
  startDate,
  endDate,
  currentDate = new Date(),
  budgets = {},
  paymentMethods = [],
  recurringExpenses = [],
  msiPlans = []
}) {
  const safeTxs = Array.isArray(transactions) ? transactions : [];

  // Fechas y duraciones del ciclo
  const sDate = startDate instanceof Date ? startDate : new Date(startDate);
  const eDate = endDate instanceof Date ? endDate : new Date(endDate);
  const cDate = currentDate instanceof Date ? currentDate : new Date(currentDate);

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const totalCycleDays = Math.max(1, Math.round((eDate.getTime() - sDate.getTime()) / MS_PER_DAY));
  
  // Días transcurridos (mínimo 1 para evitar división entre 0)
  const rawElapsed = Math.round((cDate.getTime() - sDate.getTime()) / MS_PER_DAY) + 1;
  const daysElapsed = Math.max(1, Math.min(totalCycleDays, rawElapsed));
  const daysRemaining = Math.max(0, totalCycleDays - daysElapsed);
  const progressPercent = Math.min(100, Math.max(0, (daysElapsed / totalCycleDays) * 100));

  // Acumulados reales del ciclo actual
  let totalIncome = 0;
  let totalExpense = 0;
  const categoryExpenses = {};

  safeTxs.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'income') {
      totalIncome += amt;
    } else {
      totalExpense += amt;
      const cat = tx.category || 'Otros';
      categoryExpenses[cat] = (categoryExpenses[cat] || 0) + amt;
    }
  });

  // Presupuesto total configurado
  const totalBudget = Object.values(budgets || {}).reduce((sum, lim) => sum + (Number(lim) || 0), 0);
  const effectiveCap = totalBudget > 0 ? totalBudget : totalIncome;

  // Compromisos fijos pendientes en lo que resta del ciclo
  let pendingRecurring = 0;
  const currentDayNum = cDate.getDate();
  (recurringExpenses || []).forEach((rec) => {
    const due = Number(rec.dueDay || rec.paymentDay);
    if (due && due > currentDayNum) {
      pendingRecurring += Number(rec.amount) || 0;
    }
  });

  let pendingMsi = 0;
  (msiPlans || []).forEach((plan) => {
    if (plan.remainingInstallments > 0) {
      pendingMsi += Number(plan.monthlyAmount) || 0;
    }
  });

  // 1. Velocidad de Quema Diaria (Daily Burn Rate)
  const dailyBurnRate = totalExpense / daysElapsed;

  // 2. Proyección de Gasto al Cierre de Ciclo
  const projectedVariableExpense = dailyBurnRate * daysRemaining;
  const projectedTotalExpense = totalExpense + projectedVariableExpense + pendingRecurring;
  const projectedNetBalance = totalIncome - projectedTotalExpense;

  // 3. Gasto Diario Seguro Recomendado (Safe Daily Limit)
  const availableRemaining = Math.max(0, effectiveCap - totalExpense - pendingRecurring);
  const safeDailyBudget = daysRemaining > 0 ? availableRemaining / daysRemaining : 0;

  // 4. Runway (Días de vida financiera antes de agotar capital/presupuesto)
  let runwayDays = 999;
  if (dailyBurnRate > 0) {
    runwayDays = Math.max(0, Math.round(availableRemaining / dailyBurnRate));
  }

  // 5. Porcentaje Proyectado y Semáforo de Riesgo
  const projectedRatio = effectiveCap > 0 ? (projectedTotalExpense / effectiveCap) * 100 : 0;
  const idealPaceExpense = effectiveCap > 0 ? (effectiveCap / totalCycleDays) * daysElapsed : 0;
  const deltaPace = totalExpense - idealPaceExpense; // >0 vas gastando de más; <0 vas ahorrando

  let riskLevel = 'safe'; // 'safe' | 'warning' | 'danger'
  let riskTitle = 'Ritmo Saludable';
  let riskAdvice = '';

  if (effectiveCap > 0 && projectedTotalExpense > effectiveCap) {
    riskLevel = 'danger';
    riskTitle = 'Alerta de Sobregiro';
    const overrun = projectedTotalExpense - effectiveCap;
    riskAdvice = `A este ritmo superarás el presupuesto por $${Math.round(overrun).toLocaleString()}. Límite recomendado: $${Math.round(safeDailyBudget).toLocaleString()}/día.`;
  } else if (projectedRatio >= 85) {
    riskLevel = 'warning';
    riskTitle = 'Ritmo Acelerado';
    riskAdvice = `Consumirás el ${projectedRatio.toFixed(0)}% del capital asignado. Modera compras discrecionales a $${Math.round(safeDailyBudget).toLocaleString()}/día.`;
  } else {
    riskLevel = 'safe';
    riskTitle = 'Trayectoria Óptima';
    const margin = effectiveCap - projectedTotalExpense;
    riskAdvice = `Margen proyectado de $${Math.round(margin).toLocaleString()} libres al corte. Mantén el ritmo actual.`;
  }

  return {
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
    pendingRecurring,
    pendingMsi,
    riskLevel,
    riskTitle,
    riskAdvice
  };
}
