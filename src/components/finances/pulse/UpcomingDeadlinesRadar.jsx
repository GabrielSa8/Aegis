import { Clock, ChevronRight } from 'lucide-react';

export default function UpcomingDeadlinesRadar({
  upcomingDeadlines = [],
  loading = false,
  selectedDate,
  onDateSelect
}) {
  return (
    <div className="radar-deadlines-container">
      {/* Cabecera Táctica del Radar */}
      <div className="radar-deadlines-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Clock size={13} style={{ color: 'var(--accent, var(--primary))' }} />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-high)', letterSpacing: '0.03em' }}>
            PRÓXIMOS VENCIMIENTOS & CORTES
          </span>
        </div>
        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono, monospace)' }}>
          {upcomingDeadlines.length} próximos
        </span>
      </div>

      {/* Lista Desplazable de Compromisos */}
      <div className="radar-deadlines-list no-scrollbar">
        {loading ? (
          <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Escaneando fechas clave...
          </div>
        ) : upcomingDeadlines.length === 0 ? (
          <div style={{ padding: '1.2rem', textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Sin cortes ni vencimientos en los próximos 30 días.
          </div>
        ) : (
          upcomingDeadlines.map((item) => {
            const Icon = item.icon;
            const isToday = item.diffDays === 0;
            const isTomorrow = item.diffDays === 1;
            const isImminent = item.diffDays <= 3;
            const dayNum = item.date ? item.date.getDate() : item.day;
            const monthShort = item.date
              ? item.date.toLocaleDateString('es-ES', { month: 'short' })
              : 'DÍA';

            // Tag semántico de cuenta regresiva
            let countdownLabel = `En ${item.diffDays} días`;
            let countdownColor = 'var(--text-muted)';
            let countdownBg = 'color-mix(in srgb, var(--text-muted) 10%, transparent)';

            if (isToday) {
              countdownLabel = 'HOY';
              countdownColor = 'var(--danger)';
              countdownBg = 'color-mix(in srgb, var(--danger) 18%, transparent)';
            } else if (isTomorrow) {
              countdownLabel = 'MAÑANA';
              countdownColor = 'var(--warning)';
              countdownBg = 'color-mix(in srgb, var(--warning) 18%, transparent)';
            } else if (isImminent) {
              countdownLabel = `En ${item.diffDays} días`;
              countdownColor = 'var(--accent, var(--primary))';
              countdownBg = 'color-mix(in srgb, var(--accent, var(--primary)) 14%, transparent)';
            }

            const isSelected = selectedDate === item.isoDate;

            return (
              <div
                key={item.id}
                onClick={() => onDateSelect?.(item.isoDate)}
                className={`radar-deadline-item ${isSelected ? 'selected' : ''}`}
                style={{
                  borderLeftColor: item.color || 'var(--accent, var(--primary))'
                }}
                title={`Hacer clic para enfocar el ${item.isoDate} en el calendario`}
              >
                {/* Bloque Fecha */}
                <div className="radar-date-badge">
                  <span className="radar-date-day">{dayNum}</span>
                  <span className="radar-date-month">{monthShort}</span>
                </div>

                {/* Info del Compromiso */}
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, gap: '1px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {Icon && <Icon size={11} style={{ color: item.color || 'var(--accent, var(--primary))', flexShrink: 0 }} />}
                    <span className="radar-item-title">{item.title}</span>
                  </div>
                  <span className="radar-item-subtitle">{item.subtitle}</span>
                </div>

                {/* Monto y Contador */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                  {item.amount != null && item.amount > 0 && (
                    <span className="radar-item-amount">
                      ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  )}
                  <span
                    className="radar-countdown-badge"
                    style={{
                      color: countdownColor,
                      background: countdownBg,
                      border: `1px solid color-mix(in srgb, ${countdownColor} 30%, transparent)`
                    }}
                  >
                    {countdownLabel}
                  </span>
                  <ChevronRight size={11} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
