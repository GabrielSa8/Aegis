import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

import { getTodayLocalDateStr } from '../utils/storage';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function Calendar({ transactions, selectedDate, onDateSelect }) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  const today = new Date();
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

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

  // Obtener resumen de transacciones de un día
  const getDaySummary = (dayStr) => {
    const dayTxs = safeTransactions.filter(t => t.date === dayStr);
    let income = 0;
    let expense = 0;

    dayTxs.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') {
        income += amt;
      } else {
        expense += amt;
      }
    });

    return { income, expense, hasTransactions: dayTxs.length > 0 };
  };

  // Generar grid de días
  const renderDays = () => {
    const days = [];
    
    // Rellenar días vacíos antes del primer día del mes
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Renderizar días reales del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDateString(day);
      const { income, expense, hasTransactions } = getDaySummary(dateStr);
      
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
          <div className="day-number">{day}</div>
          
          {/* Indicadores visuales y resumen financiero diario */}
          {hasTransactions && (
            <div className="day-dots-container" style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%' }}>
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
