import { useState, useEffect, useMemo, useCallback } from 'react';
import { CreditCard, Scissors, Repeat, Layers } from 'lucide-react';
import { getPaymentMethods, getRecurringExpenses, getMsiPlans } from '../../../utils/storage';

export function useFinancialDeadlines() {
  const [methods, setMethods] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [msiPlans, setMsiPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const [m, r, p] = await Promise.all([
        getPaymentMethods(),
        getRecurringExpenses(),
        getMsiPlans()
      ]);
      if (Array.isArray(m)) setMethods(m);
      if (Array.isArray(r)) setRecurring(r);
      if (Array.isArray(p)) setMsiPlans(p);
    } catch (err) {
      console.error('Error cargando vencimientos en hook:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // Lista de reglas de vencimiento recurrentes/mensuales
  const rules = useMemo(() => {
    const list = [];

    // 1. Tarjetas de Crédito: Cortes y Límites de Pago
    methods.forEach((pm) => {
      if (pm.type !== 'credit') return;

      if (pm.cutoffDay && pm.cutoffDay >= 1 && pm.cutoffDay <= 31) {
        list.push({
          id: `cutoff-${pm.id}`,
          day: Number(pm.cutoffDay),
          title: `Corte ${pm.name}`,
          subtitle: 'Corte de Tarjeta',
          category: 'Corte',
          type: 'cutoff',
          color: pm.color || 'var(--primary)',
          amount: null,
          icon: Scissors
        });
      }

      const payDay = pm.paymentDay || pm.paymentDueDay;
      if (payDay && payDay >= 1 && payDay <= 31) {
        list.push({
          id: `pay-${pm.id}`,
          day: Number(payDay),
          title: `Límite Pago ${pm.name}`,
          subtitle: pm.creditLimit ? `Límite: $${Number(pm.creditLimit).toLocaleString()}` : 'Pago de Tarjeta',
          category: 'Pago Tarjeta',
          type: 'card_payment',
          color: pm.color || 'var(--secondary)',
          amount: null,
          icon: CreditCard
        });
      }
    });

    // 2. Gastos Recurrentes / Fijos
    recurring.forEach((rec) => {
      const due = rec.dueDay || rec.paymentDay;
      if (due && due >= 1 && due <= 31) {
        list.push({
          id: `rec-${rec.id}`,
          day: Number(due),
          title: rec.description || rec.name || 'Gasto Recurrente',
          subtitle: `Gasto Fijo • ${rec.category || 'Servicios'}`,
          category: rec.category || 'Servicios',
          type: 'recurring',
          color: 'var(--accent, var(--primary))',
          amount: Number(rec.amount) || 0,
          icon: Repeat
        });
      }
    });

    // 3. Cuotas MSI
    msiPlans.forEach((plan) => {
      if (plan.remainingInstallments <= 0) return;
      let day = 15;
      if (plan.nextDueDate) {
        const parts = plan.nextDueDate.split('-').map(Number);
        if (parts[2]) day = parts[2];
      }
      list.push({
        id: `msi-${plan.id}`,
        day,
        title: plan.description || 'Plan MSI',
        subtitle: `MSI • Restan ${plan.remainingInstallments} cuotas`,
        category: 'MSI',
        type: 'msi',
        color: 'var(--accent, var(--primary))',
        amount: Number(plan.monthlyAmount) || 0,
        icon: Layers,
        specificDueDate: plan.nextDueDate
      });
    });

    return list;
  }, [methods, recurring, msiPlans]);

  // Próximos vencimientos a 30 días cronológicos (para el Radar)
  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const items = rules.map((r) => {
      let target = new Date(today.getFullYear(), today.getMonth(), r.day);
      if (target < today) {
        target = new Date(today.getFullYear(), today.getMonth() + 1, r.day);
      }
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const isoDate = target.toISOString().slice(0, 10);
      return {
        ...r,
        date: target,
        diffDays,
        isoDate
      };
    });

    return items
      .filter((i) => i.diffDays >= 0 && i.diffDays <= 30)
      .sort((a, b) => a.diffDays - b.diffDays);
  }, [rules]);

  // Mapa por día del mes (1..31) para acceso O(1) en el calendario
  const deadlinesByDayMap = useMemo(() => {
    const map = new Map();
    for (let day = 1; day <= 31; day++) {
      const dayItems = rules.filter((r) => r.day === day);
      if (dayItems.length > 0) {
        map.set(day, dayItems);
      }
    }
    return map;
  }, [rules]);

  // Helper para obtener vencimientos de una fecha YYYY-MM-DD
  const getDeadlinesForDate = useCallback((dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return [];
    const parts = dateStr.split('-');
    const day = parseInt(parts[2], 10);
    if (!day || isNaN(day)) return [];
    return deadlinesByDayMap.get(day) || [];
  }, [deadlinesByDayMap]);

  return {
    rules,
    upcomingDeadlines,
    deadlinesByDayMap,
    getDeadlinesForDate,
    loading,
    reload
  };
}
