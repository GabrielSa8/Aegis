import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck,
  Compass
} from 'lucide-react';
import { useModuleTour } from './useModuleTour';

export function ModuleTourModal({ activeTab }) {
  const {
    isOpen,
    currentStep,
    totalSteps,
    activeTourData,
    dontShowAgain,
    setDontShowAgain,
    closeTour,
    nextStep,
    prevStep,
    setCurrentStep
  } = useModuleTour(activeTab);

  if (!isOpen || !activeTourData || !activeTourData.steps) return null;

  const step = activeTourData.steps[currentStep] || activeTourData.steps[0];
  if (!step) return null;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div 
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.78)',
        padding: '1rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeTour(dontShowAgain);
      }}
    >
      <div style={{
        width: '100%',
        maxWidth: '560px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg, 12px)',
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: 'var(--text-high)'
      }}>
        {/* Cabecera del Tour */}
        <div style={{
          padding: '1rem 1.25rem 0.85rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem',
          background: 'color-mix(in srgb, var(--primary) 6%, transparent)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Compass size={18} style={{ color: 'var(--primary)' }} />
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
                {activeTourData.title}
              </h2>
              {activeTourData.badge && (
                <span style={{
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--primary) 35%, transparent)',
                  color: 'var(--primary)'
                }}>
                  {activeTourData.badge}
                </span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {activeTourData.description}
            </p>
          </div>

          <button
            onClick={() => closeTour(dontShowAgain)}
            title="Cerrar guía"
            aria-label="Cerrar guía"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-high)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Indicador de Prerrequisitos (Solo en el paso inicial si existen) */}
        {currentStep === 0 && activeTourData.prerequisites?.length > 0 && (
          <div style={{
            padding: '0.65rem 1.25rem',
            background: 'color-mix(in srgb, var(--bg-main) 60%, transparent)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={13} style={{ color: 'var(--primary)' }} /> Requisitos:
            </span>
            {activeTourData.prerequisites.map((prereq, idx) => (
              <span key={idx} style={{
                fontSize: '0.7rem',
                padding: '2px 8px',
                borderRadius: '6px',
                background: prereq.required ? 'color-mix(in srgb, var(--primary) 12%, transparent)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${prereq.required ? 'color-mix(in srgb, var(--primary) 30%, transparent)' : 'var(--border-color)'}`,
                color: prereq.required ? 'var(--primary)' : 'var(--text-muted)'
              }}>
                <strong>{prereq.label}:</strong> {prereq.status}
              </span>
            ))}
          </div>
        )}

        {/* Contenido del Paso Actual */}
        <div style={{ padding: '1.25rem', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-high)' }}>
              {step.title}
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Paso {currentStep + 1} de {totalSteps}
            </span>
          </div>

          <p style={{ margin: '0 0 1rem 0', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
            {step.desc}
          </p>

          {/* Lista de Detalles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '1.25rem' }}>
            {step.details?.map((detail, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                fontSize: '0.78rem',
                color: 'var(--text-high)',
                lineHeight: '1.4'
              }}>
                <CheckCircle2 size={14} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                <span>{detail}</span>
              </div>
            ))}
          </div>

          {/* Pro Tip Callout */}
          {activeTourData.proTip && (
            <div style={{
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'color-mix(in srgb, var(--primary) 8%, transparent)',
              border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.74rem',
              color: 'var(--text-muted)'
            }}>
              <Sparkles size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span><strong>Consejo:</strong> {activeTourData.proTip}</span>
            </div>
          )}
        </div>

        {/* Barra de Progreso por Pasos (Dots) */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '6px',
          paddingBottom: '0.75rem'
        }}>
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              aria-label={`Ir al paso ${idx + 1}`}
              style={{
                width: idx === currentStep ? '20px' : '7px',
                height: '7px',
                borderRadius: '4px',
                background: idx === currentStep ? 'var(--primary)' : 'var(--border-color)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                padding: 0
              }}
            />
          ))}
        </div>

        {/* Footer de Controles */}
        <div style={{
          padding: '0.85rem 1.25rem',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'color-mix(in srgb, var(--bg-main) 40%, transparent)'
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            userSelect: 'none'
          }}>
            <input 
              type="checkbox" 
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            <span>No volver a mostrar en esta pestaña</span>
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-high)',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ChevronLeft size={14} /> Anterior
              </button>
            )}

            <button
              onClick={nextStep}
              style={{
                background: 'var(--primary)',
                border: 'none',
                color: 'var(--bg-main, #000)',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {isLastStep ? '¡Entendido!' : 'Siguiente'}
              {!isLastStep && <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
