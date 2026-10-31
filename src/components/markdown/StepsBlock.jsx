import { useMemo, memo } from 'react';
import { Check, Loader2, AlertTriangle, Circle, ListOrdered } from 'lucide-react';

function StepsBlock({ code }) {
  // Parsear cada línea del bloque en un paso estructurado
  const { steps, completedCount, activeCount, totalCount } = useMemo(() => {
    if (!code) return { steps: [], completedCount: 0, activeCount: 0, totalCount: 0 };

    const rawLines = code.split('\n').filter((l) => l.trim().length > 0);
    let done = 0;
    let active = 0;

    const parsed = rawLines.map((line, idx) => {
      const trimmed = line.trim();

      // Extracción de estado: [x], [done], [completed], [>], [active], [running], [!], [warn], [ ]
      let status = 'pending';
      let cleanText = trimmed;

      // Remover numeración inicial (1., 2., 3., etc. o -)
      cleanText = cleanText.replace(/^(\d+[\.\)]\s*|-\s*|\*\s*)/, '');

      // Detección de etiqueta de estado
      const statusMatch = cleanText.match(/^\[([xX✓\->!]|done|completed|active|running|in-progress|warn|alert|pending|todo)\]\s*(.*)$/i);
      if (statusMatch) {
        const tag = statusMatch[1].toLowerCase();
        cleanText = statusMatch[2].trim();

        if (tag === 'x' || tag === '✓' || tag === 'done' || tag === 'completed') {
          status = 'done';
          done++;
        } else if (tag === '>' || tag === '-' || tag === 'active' || tag === 'running' || tag === 'in-progress') {
          status = 'active';
          active++;
        } else if (tag === '!' || tag === 'warn' || tag === 'alert') {
          status = 'warn';
        } else {
          status = 'pending';
        }
      } else {
        // Si no tiene corchetes pero es el primer paso o tiene numeración
        status = idx === 0 ? 'active' : 'pending';
        if (status === 'active') active++;
      }

      // Separar título de descripción usando '::' o ':' si existe
      let title = cleanText;
      let description = '';

      if (cleanText.includes('::')) {
        const parts = cleanText.split('::');
        title = parts[0].trim();
        description = parts.slice(1).join('::').trim();
      } else if (cleanText.includes(' - ') && !cleanText.startsWith('-')) {
        const parts = cleanText.split(' - ');
        title = parts[0].trim();
        description = parts.slice(1).join(' - ').trim();
      }

      return {
        id: idx + 1,
        title,
        description,
        status
      };
    });

    return {
      steps: parsed,
      completedCount: done,
      activeCount: active,
      totalCount: parsed.length
    };
  }, [code]);

  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div
      style={{
        background: 'var(--bg-main, #0f1211)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        margin: '0.75rem 0',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
      }}
    >
      {/* Cabecera del Stepper con telemetría de progreso */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'color-mix(in srgb, var(--bg-card) 90%, transparent)',
          borderBottom: '1px solid var(--border-color)',
          fontSize: '0.72rem',
          gap: '8px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ListOrdered size={13} color="var(--primary)" />
          <span style={{ fontWeight: 700, color: 'var(--text-high)', letterSpacing: '0.04em' }}>
            SECUENCIA DE EJECUCIÓN
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '0.66rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono, monospace)'
            }}
          >
            {completedCount}/{totalCount} completados ({progressPercent}%)
          </span>

          {/* Mini barra de progreso */}
          <div
            style={{
              width: '60px',
              height: '4px',
              background: 'var(--border-color)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: 'var(--primary)',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>
      </div>

      {/* Lista vertical de pasos conectados */}
      <div style={{ padding: '0.85rem 1rem 0.5rem 1rem' }}>
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;

          let icon = <Circle size={11} color="var(--text-muted)" />;
          let nodeBg = 'var(--border-color)';
          let nodeBorder = 'var(--border-color)';
          let titleColor = 'var(--text-muted)';
          let statusLabel = 'PENDIENTE';

          if (step.status === 'done') {
            icon = <Check size={11} color="var(--primary)" strokeWidth={2.5} />;
            nodeBg = 'color-mix(in srgb, var(--primary) 15%, transparent)';
            nodeBorder = 'var(--primary)';
            titleColor = 'var(--text-high)';
            statusLabel = 'LISTO';
          } else if (step.status === 'active') {
            icon = <Loader2 size={11} color="var(--primary)" className="spin" />;
            nodeBg = 'color-mix(in srgb, var(--primary) 20%, transparent)';
            nodeBorder = 'var(--primary)';
            titleColor = 'var(--text-high)';
            statusLabel = 'EN CURSO';
          } else if (step.status === 'warn') {
            icon = <AlertTriangle size={11} color="var(--warning)" />;
            nodeBg = 'color-mix(in srgb, var(--warning) 15%, transparent)';
            nodeBorder = 'var(--warning)';
            titleColor = 'var(--text-high)';
            statusLabel = 'ATENCIÓN';
          }

          return (
            <div
              key={step.id}
              style={{
                display: 'flex',
                gap: '12px',
                position: 'relative',
                paddingBottom: isLast ? '4px' : '14px'
              }}
            >
              {/* Conector vertical */}
              {!isLast && (
                <div
                  style={{
                    position: 'absolute',
                    top: '20px',
                    left: '10px',
                    width: '1px',
                    bottom: '0',
                    background:
                      step.status === 'done'
                        ? 'color-mix(in srgb, var(--primary) 50%, var(--border-color))'
                        : 'var(--border-color)'
                  }}
                />
              )}

              {/* Nodo del paso */}
              <div
                style={{
                  width: '21px',
                  height: '21px',
                  borderRadius: 'var(--radius-full)',
                  background: nodeBg,
                  border: `1.5px solid ${nodeBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  zIndex: 1,
                  boxShadow:
                    step.status === 'active'
                      ? '0 0 8px color-mix(in srgb, var(--primary) 40%, transparent)'
                      : 'none'
                }}
              >
                {icon}
              </div>

              {/* Contenido del paso */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color:
                        step.status === 'done' || step.status === 'active'
                          ? 'var(--primary)'
                          : 'var(--text-muted)'
                    }}
                  >
                    PASO {String(step.id).padStart(2, '0')}
                  </span>

                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: step.status === 'active' ? 700 : 600,
                      color: titleColor
                    }}
                  >
                    {step.title}
                  </span>

                  {step.status === 'active' && (
                    <span
                      style={{
                        padding: '1px 5px',
                        borderRadius: 'var(--radius-full)',
                        background: 'color-mix(in srgb, var(--primary) 18%, transparent)',
                        color: 'var(--primary)',
                        fontSize: '0.58rem',
                        fontWeight: 700,
                        letterSpacing: '0.04em'
                      }}
                    >
                      {statusLabel}
                    </span>
                  )}
                </div>

                {step.description && (
                  <p
                    style={{
                      margin: '2px 0 0 0',
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      lineHeight: '1.4'
                    }}
                  >
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default memo(StepsBlock);
