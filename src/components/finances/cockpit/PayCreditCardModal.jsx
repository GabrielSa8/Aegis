import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CreditCard, Wallet, ArrowRight, CheckCircle2 } from 'lucide-react';
import ModalWrapper from '../../ui/ModalWrapper';
import TacticalButton from '../../ui/TacticalButton';
import {
  getTodayLocalDateStr,
  getFinancialMonthRange,
  isDateInRange,
  payCreditCard
} from '../../../utils/storage';

export default function PayCreditCardModal({
  isOpen,
  onClose,
  targetCard,
  creditCards = [],
  transactions = [],
  selectedDate,
  cutoffDay = 22,
  currentCycleAmount = 0,
  pastCycleAmount = 0,
  suggestedAmount = 0,
  paymentMethods = [],
  onConfirmPayment
}) {
  const [selectedCard, setSelectedCard] = useState(null);
  const [amount, setAmount] = useState('');
  const [debitMethod, setDebitMethod] = useState('');
  const [date, setDate] = useState(getTodayLocalDateStr());
  const [submitting, setSubmitting] = useState(false);

  // Lista de tarjetas de crédito disponibles
  const availableCards = useMemo(() => {
    if (Array.isArray(creditCards) && creditCards.length > 0) return creditCards;
    if (Array.isArray(paymentMethods)) {
      return paymentMethods.filter((pm) => pm.type === 'credit' || (pm.cutoffDay && Number(pm.cutoffDay) > 0));
    }
    return targetCard ? [targetCard] : [];
  }, [creditCards, paymentMethods, targetCard]);

  // Cuentas de débito o efectivo disponibles para pagar
  const debitAccounts = useMemo(() => {
    if (!Array.isArray(paymentMethods)) return [];
    const filtered = paymentMethods.filter((pm) => pm.type !== 'credit');
    if (filtered.length > 0) return filtered;
    return [{ id: 'debito', name: 'Débito' }, { id: 'efectivo', name: 'Efectivo' }];
  }, [paymentMethods]);

  // Sincronizar tarjeta activa al abrir
  useEffect(() => {
    if (isOpen) {
      const active = targetCard || (availableCards.length > 0 ? availableCards[0] : null);
      setSelectedCard(active);
      setDate(getTodayLocalDateStr());
      if (debitAccounts.length > 0) {
        setDebitMethod(debitAccounts[0].name || 'Débito');
      }
    }
  }, [isOpen, targetCard, availableCards, debitAccounts]);

  // Cálculo autónomo de saldos del ciclo actual y pasado si se reciben transacciones
  const { effectiveCurrent, effectivePast } = useMemo(() => {
    if (!selectedCard || !Array.isArray(transactions) || transactions.length === 0) {
      return {
        effectiveCurrent: currentCycleAmount || 0,
        effectivePast: pastCycleAmount || 0
      };
    }

    const cardCutoff = (selectedCard.cutoffDay && Number(selectedCard.cutoffDay) > 0)
      ? Number(selectedCard.cutoffDay)
      : (cutoffDay || 22);

    const { startDate, endDate } = getFinancialMonthRange(selectedDate, cardCutoff);
    const prevDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
    const y = prevDate.getFullYear();
    const m = String(prevDate.getMonth() + 1).padStart(2, '0');
    const d = String(prevDate.getDate()).padStart(2, '0');
    const prevRange = getFinancialMonthRange(`${y}-${m}-${d}`, cardCutoff);

    let curExp = 0;
    let curInc = 0;
    let pastExp = 0;
    let pastInc = 0;
    const cName = (selectedCard.name || '').trim().toLowerCase();
    const cId = String(selectedCard.id || '').trim().toLowerCase();

    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      const txMethod = (tx.paymentMethod || '').trim().toLowerCase();
      const isMatch = txMethod === cName || txMethod === cId || (cName && txMethod.includes(cName));
      if (!isMatch) continue;

      const amt = Number(tx.amount) || 0;
      if (isDateInRange(tx.date, startDate, endDate)) {
        if (tx.type === 'expense') curExp += amt;
        else if (tx.type === 'income') curInc += amt;
      }
      if (isDateInRange(tx.date, prevRange.startDate, prevRange.endDate)) {
        if (tx.type === 'expense') pastExp += amt;
        else if (tx.type === 'income') pastInc += amt;
      }
    }

    return {
      effectiveCurrent: Math.max(0, curExp - curInc),
      effectivePast: Math.max(0, pastExp - pastInc)
    };
  }, [selectedCard, transactions, selectedDate, cutoffDay, currentCycleAmount, pastCycleAmount]);

  // Sincronizar monto inicial al cambiar tarjeta o saldos
  useEffect(() => {
    if (isOpen) {
      const initialAmount = effectivePast > 0
        ? effectivePast
        : (effectiveCurrent > 0 ? effectiveCurrent : suggestedAmount);
      setAmount(initialAmount > 0 ? String(initialAmount) : '');
    }
  }, [isOpen, effectivePast, effectiveCurrent, suggestedAmount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      alert('Ingresa un monto válido mayor a 0');
      return;
    }
    const cardToPay = selectedCard || targetCard;
    if (!cardToPay) {
      alert('Selecciona una tarjeta de crédito a liquidar');
      return;
    }

    setSubmitting(true);
    try {
      if (onConfirmPayment) {
        await onConfirmPayment({
          card: cardToPay,
          debitAccount: debitMethod || 'Débito',
          amount: parsedAmount,
          date: date || getTodayLocalDateStr(),
          description: `Liquidación TDC ${cardToPay.name || 'Tarjeta'}`
        });
      } else {
        await payCreditCard({
          card: cardToPay,
          debitAccount: debitMethod || 'Débito',
          amount: parsedAmount,
          date: date || getTodayLocalDateStr(),
          description: `Liquidación TDC ${cardToPay.name || 'Tarjeta'}`
        });
      }
      onClose();
    } catch (err) {
      console.error('Error procesando liquidación de tarjeta:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const cardName = selectedCard?.name || targetCard?.name || 'Tarjeta de Crédito';

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={`Pagar Tarjeta: ${cardName}`}
      icon={CreditCard}
      maxWidth="420px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {/* Selector de Tarjeta si hay más de una disponible */}
        {availableCards.length > 1 && (
          <div>
            <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Tarjeta de Crédito a Liquidar
            </label>
            <select
              value={selectedCard?.id || ''}
              onChange={(e) => {
                const found = availableCards.find((c) => String(c.id) === e.target.value);
                if (found) setSelectedCard(found);
              }}
              style={{
                width: '100%',
                padding: '6px 10px',
                fontSize: '0.76rem',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-high)',
                outline: 'none',
                marginTop: '3px'
              }}
            >
              {availableCards.map((c) => (
                <option key={c.id} value={c.id} style={{ background: 'var(--surface-panel, #121212)' }}>
                  {c.name} {c.cutoffDay ? `(Corte día ${c.cutoffDay})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Flujo de fondos: Débito -> TDC */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.55rem 0.75rem',
            background: 'color-mix(in srgb, var(--surface-panel, var(--bg-card)) 70%, transparent)',
            borderRadius: 'var(--radius-sm, 6px)',
            border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
            fontSize: '0.72rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Wallet size={13} style={{ color: 'var(--primary)' }} />
            <span style={{ color: 'var(--text-muted)' }}>Débito / Fondos</span>
          </div>
          <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <CreditCard size={13} style={{ color: 'var(--accent, var(--primary))' }} />
            <span style={{ fontWeight: 700, color: 'var(--text-high)' }}>{cardName}</span>
          </div>
        </div>

        {/* Botones de Selección Rápida de Saldo */}
        {(effectivePast > 0 || effectiveCurrent > 0) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 700 }}>
              Saldos Calculados del Periodo
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: effectivePast > 0 && effectiveCurrent > 0 ? '1fr 1fr' : '1fr', gap: '6px' }}>
              {effectivePast > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(String(effectivePast))}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '5px 8px',
                    borderRadius: 'var(--radius-sm, 6px)',
                    background: 'color-mix(in srgb, var(--danger, #ef4444) 12%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--danger, #ef4444) 30%, transparent)',
                    color: 'var(--danger, #f87171)',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  title="Liquidar saldo pendiente del ciclo cerrado anterior"
                >
                  <span style={{ fontSize: '0.6rem', fontWeight: 600 }}>Ciclo Pasado (Corte)</span>
                  <strong style={{ fontSize: '0.84rem', fontFamily: 'var(--font-mono)' }}>
                    ${effectivePast.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </strong>
                </button>
              )}

              {effectiveCurrent > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(String(effectiveCurrent))}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '5px 8px',
                    borderRadius: 'var(--radius-sm, 6px)',
                    background: 'color-mix(in srgb, var(--accent, var(--primary)) 12%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--accent, var(--primary)) 30%, transparent)',
                    color: 'var(--accent, var(--primary))',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  title="Liquidar consumo acumulado del ciclo actual en curso"
                >
                  <span style={{ fontSize: '0.6rem', fontWeight: 600 }}>Ciclo Actual</span>
                  <strong style={{ fontSize: '0.84rem', fontFamily: 'var(--font-mono)' }}>
                    ${effectiveCurrent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </strong>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Monto a Liquidar */}
        <div>
          <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Monto a Liquidar ($)
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            style={{
              width: '100%',
              padding: '7px 10px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent, var(--primary))',
              fontSize: '0.95rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              outline: 'none',
              marginTop: '3px'
            }}
          />
        </div>

        {/* Cuenta de Débito de Origen */}
        <div>
          <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Pagar desde Cuenta
          </label>
          <select
            value={debitMethod}
            onChange={(e) => setDebitMethod(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px',
              fontSize: '0.76rem',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-high)',
              outline: 'none',
              marginTop: '3px'
            }}
          >
            {debitAccounts.map((pm) => (
              <option key={pm.id} value={pm.name} style={{ background: 'var(--surface-panel, #121212)' }}>
                {pm.name} {typeof pm.balance === 'number' ? `($${pm.balance.toLocaleString()})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha del Pago */}
        <div>
          <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Fecha de Operación
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px',
              fontSize: '0.76rem',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-high)',
              outline: 'none',
              marginTop: '3px'
            }}
          />
        </div>

        <div style={{ marginTop: '0.35rem' }}>
          <TacticalButton
            type="submit"
            variant="primary"
            icon={CheckCircle2}
            disabled={submitting}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {submitting ? 'Procesando...' : `Confirmar Liquidación ($${parseFloat(amount || 0).toLocaleString()})`}
          </TacticalButton>
        </div>
      </form>
    </ModalWrapper>
  );
}
