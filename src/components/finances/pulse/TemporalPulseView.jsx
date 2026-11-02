import { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, CalendarRange } from 'lucide-react';
import Calendar from '../../Calendar';
import DayMovementsDeck from './DayMovementsDeck';
import CycleAgendaDeck from './CycleAgendaDeck';
import UpcomingDeadlinesRadar from './UpcomingDeadlinesRadar';
import { useFinancialDeadlines } from './useFinancialDeadlines';
import { getFinancialMonthRange, isDateInRange } from '../../../utils/storage';

export default function TemporalPulseView({
  safeTransactions = [],
  selectedDate,
  onDateSelect,
  selectedDayTxs = [],
  startDate,
  endDate,
  cutoffDay,
  onSaveTransaction,
  onDeleteTx,
  onGoToOperations
}) {
  const [activeDeck, setActiveDeck] = useState('day'); // 'day' | 'cycle'

  // Hook unificado para cortes, pagos de tarjetas, gastos recurrentes y MSI
  const {
    upcomingDeadlines,
    deadlinesByDayMap,
    getDeadlinesForDate,
    loading: deadlinesLoading
  } = useFinancialDeadlines();

  const selectedDayDeadlines = useMemo(() => {
    return getDeadlinesForDate(selectedDate);
  }, [getDeadlinesForDate, selectedDate]);

  // Calcular el ciclo financiero correspondiente a la fecha seleccionada
  const cycleInfo = useMemo(() => {
    const range = getFinancialMonthRange(selectedDate, cutoffDay || 22);
    const startStr = range.startDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    const endStr = range.endDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    const yearStr = range.endDate.getFullYear();
    return {
      ...range,
      label: `${startStr} – ${endStr} ${yearStr}`
    };
  }, [selectedDate, cutoffDay]);

  // Contar transacciones de este ciclo específico detectado
  const cycleTxsCount = useMemo(() => {
    return (safeTransactions || []).filter((tx) => {
      if (!tx || !tx.date) return false;
      return isDateInRange(tx.date, cycleInfo.startDate, cycleInfo.endDate);
    }).length;
  }, [safeTransactions, cycleInfo]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(380px, 52%) minmax(320px, 48%)',
        gap: '0.85rem',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      {/* Columna Izquierda: Calendario Mensual Táctico + Radar de Vencimientos */}
      <div
        style={{
          borderRadius: 'var(--radius-md, 8px)',
          border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
          background: 'var(--bg-card, rgba(255,255,255,0.02))',
          padding: '0.85rem',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem'
        }}
      >
        <Calendar
          transactions={safeTransactions}
          deadlinesByDayMap={deadlinesByDayMap}
          selectedDate={selectedDate}
          onDateSelect={onDateSelect}
        />

        {/* 🧭 Radar de Próximos Vencimientos, Cortes y Compromisos */}
        <UpcomingDeadlinesRadar
          upcomingDeadlines={upcomingDeadlines}
          loading={deadlinesLoading}
          selectedDate={selectedDate}
          onDateSelect={onDateSelect}
        />
      </div>

      {/* Columna Derecha: Deck Bilateral de Movimientos y Agenda */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          borderRadius: 'var(--radius-md, 8px)',
          border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
          background: 'var(--bg-card, rgba(255,255,255,0.02))',
          padding: '0.85rem',
          height: '100%',
          overflow: 'hidden'
        }}
      >
        {/* Selector de Pestañas del Deck Derecho + Badge de Ciclo Seleccionado */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))', paddingBottom: '0.45rem', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setActiveDeck('day')}
              className="cockpit-filter-pill"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.22rem 0.6rem',
                fontSize: '0.72rem',
                fontWeight: activeDeck === 'day' ? 700 : 500,
                borderRadius: 'var(--radius-sm, 6px)',
                cursor: 'pointer',
                border: activeDeck === 'day' 
                  ? '1px solid var(--accent, var(--primary))' 
                  : '1px solid transparent',
                background: activeDeck === 'day' 
                  ? 'color-mix(in srgb, var(--accent, var(--primary)) 16%, transparent)' 
                  : 'transparent',
                color: activeDeck === 'day' ? 'var(--text-high)' : 'var(--text-muted)'
              }}
            >
              <CalendarIcon size={12} />
              <span>Día Seleccionado</span>
              <span style={{ fontSize: '0.65rem', opacity: 0.8, fontFamily: 'JetBrains Mono, monospace' }}>
                ({selectedDayTxs.length + selectedDayDeadlines.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDeck('cycle')}
              className="cockpit-filter-pill"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.22rem 0.6rem',
                fontSize: '0.72rem',
                fontWeight: activeDeck === 'cycle' ? 700 : 500,
                borderRadius: 'var(--radius-sm, 6px)',
                cursor: 'pointer',
                border: activeDeck === 'cycle' 
                  ? '1px solid var(--accent, var(--primary))' 
                  : '1px solid transparent',
                background: activeDeck === 'cycle' 
                  ? 'color-mix(in srgb, var(--accent, var(--primary)) 16%, transparent)' 
                  : 'transparent',
                color: activeDeck === 'cycle' ? 'var(--text-high)' : 'var(--text-muted)'
              }}
            >
              <CalendarRange size={12} />
              <span>Agenda del Ciclo</span>
              <span style={{ fontSize: '0.65rem', opacity: 0.8, fontFamily: 'JetBrains Mono, monospace' }}>
                ({cycleTxsCount})
              </span>
            </button>
          </div>

          {/* Badge del Ciclo Seleccionado */}
          <div 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '4px', 
              padding: '2px 7px', 
              borderRadius: 'var(--radius-sm, 5px)', 
              background: 'color-mix(in srgb, var(--accent, var(--primary)) 10%, transparent)', 
              border: '1px solid color-mix(in srgb, var(--accent, var(--primary)) 25%, transparent)',
              fontSize: '0.66rem',
              color: 'var(--text-high)',
              fontFamily: 'JetBrains Mono, monospace'
            }}
            title="Ciclo financiero según fecha seleccionada"
          >
            <CalendarRange size={11} style={{ color: 'var(--accent, var(--primary))' }} />
            <span>Ciclo:</span>
            <strong>{cycleInfo.label}</strong>
          </div>
        </div>

        {/* Contenido del Deck Activo */}
        {activeDeck === 'day' ? (
          <DayMovementsDeck
            selectedDate={selectedDate}
            selectedDayTxs={selectedDayTxs}
            selectedDayDeadlines={selectedDayDeadlines}
            onSaveTransaction={onSaveTransaction}
            onDeleteTx={onDeleteTx}
            onGoToOperations={onGoToOperations}
            cycleLabel={cycleInfo.label}
          />
        ) : (
          <CycleAgendaDeck
            transactions={safeTransactions}
            startDate={cycleInfo.startDate}
            endDate={cycleInfo.endDate}
            cycleLabel={cycleInfo.label}
            onSaveTransaction={onSaveTransaction}
            onDeleteTx={onDeleteTx}
          />
        )}
      </div>
    </div>
  );
}
