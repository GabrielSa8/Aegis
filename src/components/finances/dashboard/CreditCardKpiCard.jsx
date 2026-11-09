import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CreditCard, ChevronDown, Zap } from 'lucide-react';
import { getFinancialMonthRange, isDateInRange, getTodayLocalDateStr, getPaymentMethods, getMsiPlans } from '../../../utils/storage';
import PayCreditCardModal from '../cockpit/PayCreditCardModal';

export default function CreditCardKpiCard({
  transactions = [],
  selectedDate,
  globalCutoffDay = 22,
  externalPaymentMethods = null
}) {
  const [internalMethods, setInternalMethods] = useState([]);
  const [msiPlans, setMsiPlans] = useState([]);
  const [methodsLoaded, setMethodsLoaded] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

  // Inicializar estrictamente con la selección persistida del usuario
  const [selectedCardId, setSelectedCardId] = useState(() => {
    return localStorage.getItem('aegis_kpi_credit_card_id') || 'all';
  });

  // Cargar métodos de pago
  const refreshMethods = useCallback(async () => {
    try {
      const list = await getPaymentMethods();
      if (Array.isArray(list)) {
        setInternalMethods(list);
      }
    } catch (err) {
      console.error('Error cargando métodos de pago en CreditCardKpiCard:', err);
    } finally {
      setMethodsLoaded(true);
    }
  }, []);

  // Cargar planes MSI para cálculo informativo de capital diferido
  const refreshMsi = useCallback(async () => {
    try {
      const list = await getMsiPlans();
      if (Array.isArray(list)) setMsiPlans(list);
    } catch (err) {
      console.error('Error cargando MSI en CreditCardKpiCard:', err);
    }
  }, []);

  useEffect(() => {
    if (externalPaymentMethods && Array.isArray(externalPaymentMethods)) {
      setInternalMethods(externalPaymentMethods);
      setMethodsLoaded(true);
    } else {
      refreshMethods();
    }
    refreshMsi();
  }, [externalPaymentMethods, refreshMethods, refreshMsi]);

  useEffect(() => {
    const handleMethodsChanged = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setInternalMethods(e.detail);
      } else {
        refreshMethods();
      }
      refreshMsi();
    };
    window.addEventListener('aegis:payment-methods-changed', handleMethodsChanged);
    return () => window.removeEventListener('aegis:payment-methods-changed', handleMethodsChanged);
  }, [refreshMethods, refreshMsi]);

  // Filtrar tarjetas de crédito registradas
  const creditCards = useMemo(() => {
    const list = externalPaymentMethods || internalMethods;
    if (!Array.isArray(list)) return [];
    return list.filter((pm) => pm.type === 'credit' || (pm.cutoffDay && Number(pm.cutoffDay) > 0));
  }, [externalPaymentMethods, internalMethods]);

  // Sincronizar selección fija una vez cargados los datos sin borrar preferencia
  useEffect(() => {
    if (!methodsLoaded || creditCards.length === 0) return;

    const saved = localStorage.getItem('aegis_kpi_credit_card_id');
    if (saved && saved !== 'all') {
      const match = creditCards.find(
        (c) => String(c.id) === saved || (c.name && c.name.toLowerCase() === saved.toLowerCase())
      );
      if (match && selectedCardId !== String(match.id)) {
        setSelectedCardId(String(match.id));
      }
    }
  }, [methodsLoaded, creditCards, selectedCardId]);

  // Tarjeta activa
  const activeCard = useMemo(() => {
    if (selectedCardId === 'all') return null;
    return creditCards.find(
      (c) => String(c.id) === String(selectedCardId) || (c.name && c.name.toLowerCase() === String(selectedCardId).toLowerCase())
    ) || null;
  }, [creditCards, selectedCardId]);

  // Día de corte efectivo (propio de la tarjeta o global)
  const activeCutoffDay = useMemo(() => {
    if (activeCard && activeCard.cutoffDay && Number(activeCard.cutoffDay) > 0) {
      return Number(activeCard.cutoffDay);
    }
    return globalCutoffDay || 22;
  }, [activeCard, globalCutoffDay]);

  // Periodo financiero del ciclo actual (ej. 22 al 22)
  const { startDate: cardStartDate, endDate: cardEndDate } = useMemo(() => {
    return getFinancialMonthRange(selectedDate, activeCutoffDay);
  }, [selectedDate, activeCutoffDay]);

  // Periodo financiero del ciclo anterior (ej. si el actual es 22 oct - 22 nov, el anterior fue 22 sep - 22 oct)
  const { prevStartDate, prevEndDate } = useMemo(() => {
    const prevDate = new Date(cardStartDate.getTime() - 24 * 60 * 60 * 1000);
    const y = prevDate.getFullYear();
    const m = String(prevDate.getMonth() + 1).padStart(2, '0');
    const d = String(prevDate.getDate()).padStart(2, '0');
    const prevRange = getFinancialMonthRange(`${y}-${m}-${d}`, activeCutoffDay);
    return { prevStartDate: prevRange.startDate, prevEndDate: prevRange.endDate };
  }, [cardStartDate, activeCutoffDay]);

  const currentDate = useMemo(() => {
    const dateStr = selectedDate || getTodayLocalDateStr();
    return new Date(dateStr + 'T12:00:00');
  }, [selectedDate]);

  // Días restantes para el corte
  const daysRemaining = useMemo(() => {
    const timeDiff = cardEndDate.getTime() - currentDate.getTime();
    const rawDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    return isNaN(rawDays) ? 0 : Math.max(0, rawDays);
  }, [cardEndDate, currentDate]);

  // Helper coincidencia de método con tarjeta
  const isCardMatch = useCallback((txMethod, card) => {
    if (!txMethod || !card) return false;
    const m = txMethod.trim().toLowerCase();
    const cName = (card.name || '').trim().toLowerCase();
    const cId = String(card.id || '').trim().toLowerCase();
    return m === cName || m === cId || (cName && m.includes(cName));
  }, []);

  // Total de transacciones del ciclo actual y ciclo anterior (gastos - abonos/pagos recibidos)
  const { cycleTotal, pastCycleTotal } = useMemo(() => {
    let currentExp = 0;
    let currentInc = 0;
    let pastExp = 0;
    let pastInc = 0;
    const safeList = Array.isArray(transactions) ? transactions : [];

    for (let i = 0; i < safeList.length; i++) {
      const tx = safeList[i];
      const amt = Number(tx.amount) || 0;
      const txMethod = (tx.paymentMethod || '').trim().toLowerCase();

      const matchesActive = activeCard
        ? isCardMatch(txMethod, activeCard)
        : (txMethod === 'crédito' || txMethod === 'credito' || creditCards.some((c) => isCardMatch(txMethod, c)));

      if (!matchesActive) continue;

      if (isDateInRange(tx.date, cardStartDate, cardEndDate)) {
        if (tx.type === 'expense') currentExp += amt;
        else if (tx.type === 'income') currentInc += amt;
      }

      if (isDateInRange(tx.date, prevStartDate, prevEndDate)) {
        if (tx.type === 'expense') pastExp += amt;
        else if (tx.type === 'income') pastInc += amt;
      }
    }

    return {
      cycleTotal: Math.max(0, currentExp - currentInc),
      pastCycleTotal: Math.max(0, pastExp - pastInc)
    };
  }, [transactions, cardStartDate, cardEndDate, prevStartDate, prevEndDate, activeCard, creditCards, isCardMatch]);

  // Capital restante pendiente de MSI diferidos (para información complementaria en tooltip)
  const msiPendingDebt = useMemo(() => {
    let sum = 0;
    for (const plan of msiPlans) {
      if (plan.status === 'completed' || !plan.remainingInstallments || plan.remainingInstallments <= 0) continue;
      const planMethod = (plan.paymentMethod || '').trim().toLowerCase();
      const monthlyAmt = Number(plan.monthlyAmount) || (plan.totalInstallments > 0 ? Number(plan.totalAmount) / plan.totalInstallments : 0);
      const remainingCapital = Number(plan.remainingInstallments) * monthlyAmt;

      if (activeCard) {
        const cardName = (activeCard.name || '').trim().toLowerCase();
        const cardId = String(activeCard.id || '').trim().toLowerCase();
        if (planMethod === cardName || planMethod === cardId || (cardName && planMethod.includes(cardName))) {
          sum += remainingCapital;
        }
      } else {
        sum += remainingCapital;
      }
    }
    return sum;
  }, [msiPlans, activeCard]);

  const handleCardChange = (e) => {
    const newId = e.target.value;
    setSelectedCardId(newId);
    localStorage.setItem('aegis_kpi_credit_card_id', newId);
  };

  const isCutoffNear = daysRemaining <= 5;
  const hasPendingToPay = cycleTotal > 0 || pastCycleTotal > 0;

  return (
    <>
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          minHeight: '52px',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, gap: '2px' }}>
          {/* Fila Superior: Selector Adaptativo de Tarjeta y Badge de Corte */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', minWidth: 0, width: '100%' }}>
            {creditCards.length > 0 ? (
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
                <select
                  value={selectedCardId}
                  onChange={handleCardChange}
                  style={{
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                    cursor: 'pointer',
                    paddingRight: '12px',
                    width: '100%',
                    minWidth: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title="Elegir tarjeta de crédito principal (persiste fijo)"
                >
                  {creditCards.length > 1 && (
                    <option value="all" style={{ background: 'var(--surface-panel, #121212)', color: 'var(--text-high)' }}>
                      Todas
                    </option>
                  )}
                  {creditCards.map((c) => (
                    <option
                      key={c.id}
                      value={c.id}
                      style={{ background: 'var(--surface-panel, #121212)', color: 'var(--text-high)' }}
                    >
                      {c.name || 'Tarjeta'}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={9}
                  style={{
                    position: 'absolute',
                    right: 0,
                    pointerEvents: 'none',
                    color: 'var(--text-muted)',
                    opacity: 0.7
                  }}
                />
              </div>
            ) : (
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, flex: 1, minWidth: 0 }}>
                Tarjeta
              </span>
            )}

            <span
              style={{
                fontSize: '0.58rem',
                padding: '1px 4px',
                borderRadius: '3px',
                background: isCutoffNear
                  ? 'color-mix(in srgb, var(--danger, #ef4444) 18%, transparent)'
                  : 'color-mix(in srgb, var(--accent, var(--primary)) 16%, transparent)',
                color: isCutoffNear
                  ? 'var(--danger, #f87171)'
                  : 'var(--accent, var(--primary))',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
              title={`Corte el día ${activeCutoffDay} (${daysRemaining} días restantes)`}
            >
              {daysRemaining}d corte
            </span>
          </div>

          {/* Fila Inferior: Monto total de transacciones del ciclo + Botón Pagar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
            <div
              style={{
                fontSize: '0.92rem',
                fontWeight: 800,
                color: 'var(--accent, var(--primary))',
                fontFamily: 'var(--font-mono)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.15
              }}
              title={`Total transacciones ciclo: $${cycleTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${pastCycleTotal > 0 ? ` (Ciclo pasado pendiente: $${pastCycleTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })})` : ''}${msiPendingDebt > 0 ? ` (Restante diferido MSI: $${msiPendingDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})` : ''}`}
            >
              ${cycleTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            {hasPendingToPay && (
              <button
                type="button"
                onClick={() => setShowPayModal(true)}
                style={{
                  background: 'color-mix(in srgb, var(--accent, var(--primary)) 18%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--accent, var(--primary)) 40%, transparent)',
                  color: 'var(--accent, var(--primary))',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  lineHeight: 1.15,
                  flexShrink: 0
                }}
                title="Pagar / liquidar saldo de la tarjeta"
              >
                <Zap size={9} />
                <span>Pagar</span>
              </button>
            )}
          </div>
        </div>

        {/* Icono Táctico Derecho */}
        <div
          onClick={() => {
            if (hasPendingToPay || creditCards.length > 0) setShowPayModal(true);
          }}
          style={{
            padding: '6px',
            borderRadius: 'var(--radius-sm)',
            background: 'color-mix(in srgb, var(--accent, var(--primary)) 12%, transparent)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: hasPendingToPay ? 'pointer' : 'default'
          }}
          title={hasPendingToPay ? 'Pagar saldo de tarjeta' : 'Tarjeta de crédito'}
        >
          <CreditCard size={15} style={{ color: 'var(--accent, var(--primary))' }} />
        </div>
      </div>

      {/* Modal Táctico de Pago / Liquidación TDC */}
      {showPayModal && (
        <PayCreditCardModal
          isOpen={showPayModal}
          onClose={() => setShowPayModal(false)}
          targetCard={activeCard || (creditCards.length > 0 ? creditCards[0] : null)}
          creditCards={creditCards}
          currentCycleAmount={cycleTotal}
          pastCycleAmount={pastCycleTotal}
          suggestedAmount={pastCycleTotal > 0 ? pastCycleTotal : cycleTotal}
          paymentMethods={internalMethods}
        />
      )}
    </>
  );
}
