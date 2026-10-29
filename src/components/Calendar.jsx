import { useState, useMemo, memo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Layers } from 'lucide-react';

import { getTodayLocalDateStr } from '../utils/storage';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const NORDIC_PALETTE = [
  '#34d399', '#38bdf8', '#818cf8', '#a78bfa', '#f472b6',
  '#fbbf24', '#fb923c', '#4ade80', '#2dd4bf', '#a3e635'
];

function getDomainColor(domain) {
  if (!domain) return '#94a3b8';
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = (hash << 5) - hash + domain.charCodeAt(i);
    hash |= 0;
  }
  return NORDIC_PALETTE[Math.abs(hash) % NORDIC_PALETTE.length];
}

function Calendar({ transactions, timelineEvents = [], selectedDate, onDateSelect }) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  const today = new Date();
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeEvents = Array.isArray(timelineEvents) ? timelineEvents : [];

  // Mapa de transacciones por fecha precomputado en O(N) para lookup O(1)
  const dailySummaryMap = useMemo(() => {
    const map = new Map();
    for (let i = 0; i < safeTransactions.length; i++) {
      const t = safeTransactions[i];
      if (!t.date) continue;
      let entry = map.get(t.date);
      if (!entry) {
        entry = { income: 0, expense: 0, count: 0 };
        map.set(t.date, entry);
      }
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') {
        entry.income += amt;
      } else {
        entry.expense += amt;
      }
      entry.count++;
    }
    return map;
  }, [safeTransactions]);

  // Mapa de eventos del timeline por fecha O(N)
  const dailyEventsMap = useMemo(() => {
    const map = new Map();
    for (let i = 0; i < safeEvents.length; i++) {
      const evt = safeEvents[i];
      if (!evt.date) continue;
      let list = map.get(evt.date);
      if (!list) {
        list = [];
        map.set(evt.date, list);
      }
      list.push(evt);
    }
    return map;
  }, [safeEvents]);

  // Obtener días del mes seleccionado
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Obtener el primer día de la semana del mes (0 = Domingo, 6 = Sábado)
  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDayIndex = getFirstDayOfMonth(currentMonth, currentYear);

  // Navegar al mes anterior
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  // Navegar al siguiente mes
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Ir al día de hoy
  const handleGoToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    onDateSelect(getTodayLocalDateStr(now));
  };

  // Formatear día con ceros a la izquierda
  const formatDateString = (day) => {
    const monthStr = String(currentMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${currentYear}-${monthStr}-${dayStr}`;
  };

  // Generar grid de días con lookup instantáneo O(1)
  const renderDays = () => {
    const days = [];
    
    // Rellenar días vacíos antes del primer día del mes
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Renderizar días reales del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDateString(day);
      const summary = dailySummaryMap.get(dateStr) || { income: 0, expense: 0, count: 0 };
      const dayEvents = dailyEventsMap.get(dateStr) || [];
      const hasTransactions = summary.count > 0;
      const hasEvents = dayEvents.length > 0;
      const { income, expense } = summary;
      
      const isToday = today.getDate() === day && 
                      today.getMonth() === currentMonth && 
                      today.getFullYear() === currentYear;

      const isSelected = selectedDate === dateStr;

      days.push(
        <div
          key={`day-${day}`}
          onClick={() => onDateSelect(dateStr)}
          className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span className="day-number">{day}</span>
            {hasEvents && (
              <div style={{ display: 'flex', gap: '3px' }} title={`${dayEvents.length} eventos operativos`}>
                {dayEvents.slice(0, 3).map((e) => (
                  <span
                    key={e.id}
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: getDomainColor(e.domain),
                      boxShadow: `0 0 5px ${getDomainColor(e.domain)}`
                    }}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <span style={{ fontSize: '0.6rem', color: '#9ca3af', lineHeight: 1 }}>+</span>
                )}
              </div>
            )}
          </div>
          
          {/* Indicadores visuales y resumen financiero diario */}
          {hasTransactions && (
            <div className="day-dots-container" style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%', marginTop: 'auto' }}>
              {income > 0 && (
                <div className="day-amount-summary income">
                  +${income.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
              )}
              {expense > 0 && (
                <div className="day-amount-summary expense">
                  -${expense.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
              )}
              <div className="day-dots">
                {income > 0 && <span className="dot income"></span>}
                {expense > 0 && <span className="dot expense"></span>}
              </div>
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="calendar-container glass">
      <div className="calendar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarIcon size={20} className="text-primary" style={{ color: 'var(--primary)' }} />
          <h3 className="calendar-title">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h3>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={handlePrevMonth} className="btn btn-secondary btn-icon" title="Mes Anterior">
            <ChevronLeft size={18} />
          </button>
          <button onClick={handleGoToToday} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
            Hoy
          </button>
          <button onClick={handleNextMonth} className="btn btn-secondary btn-icon" title="Siguiente Mes">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        {/* Cabecera de días de la semana */}
        {DAY_NAMES.map(name => (
          <div key={name} className="day-name">
            {name}
          </div>
        ))}

        {/* Cuerpos de días */}
        {renderDays()}
      </div>
    </div>
  );
}

export default memo(Calendar);
