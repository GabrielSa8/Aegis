import React from 'react';
import { Shield, ArrowRight, ArrowLeft, Check, Sparkles, X } from 'lucide-react';
import { ModalWrapper, TacticalButton, TacticalBadge } from '../ui';
import { useOnboarding } from './useOnboarding';
import { OnboardingStepIdentity } from './OnboardingStepIdentity';
import { OnboardingStepDiscovery } from './OnboardingStepDiscovery';
import { OnboardingStepCheatSheet } from './OnboardingStepCheatSheet';

export function OnboardingModal({ isOpen, onClose, onComplete }) {
  const {
    step,
    setStep,
    inspection,
    loadingInspection,
    creatingVault,
    completing,
    operatorName,
    setOperatorName,
    operatorRole,
    setOperatorRole,
    responseStyle,
    setResponseStyle,
    selectedTheme,
    setSelectedTheme,
    selectedVault,
    setSelectedVault,
    selectedEngine,
    setSelectedEngine,
    selectedEditor,
    setSelectedEditor,
    selectedTerminal,
    setSelectedTerminal,
    handleCreateDefaultVault,
    handleFinish
  } = useOnboarding({
    onComplete: (updatedCfg) => {
      if (onComplete) onComplete(updatedCfg);
      if (onClose) onClose();
    }
  });

  if (!isOpen) return null;

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="740px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.2rem' }}>
        {/* Cabecera Táctica del Onboarding */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', background: 'color-mix(in srgb, var(--primary) 15%, transparent)', color: 'var(--primary)' }}>
              <Shield size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-high)' }}>
                Bienvenido a Aegis — Centro de Mando Soberano
              </h2>
              <p style={{ fontSize: '0.72rem', margin: 0, color: 'var(--text-muted)' }}>
                Configuración inicial y auto-descubrimiento en 3 pasos rápidos.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              Paso {step} de 3
            </span>
            <TacticalBadge variant="primary">v2.11.0</TacticalBadge>
          </div>
        </div>

        {/* Indicador de Progreso Visual */}
        <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: '3px',
                borderRadius: '2px',
                background: s <= step ? 'var(--primary)' : 'color-mix(in srgb, var(--border-color) 40%, transparent)',
                transition: 'background 0.2s ease'
              }}
            />
          ))}
        </div>

        {/* Contenido del Paso Activo */}
        {step === 1 && (
          <OnboardingStepIdentity
            operatorName={operatorName}
            setOperatorName={setOperatorName}
            operatorRole={operatorRole}
            setOperatorRole={setOperatorRole}
            responseStyle={responseStyle}
            setResponseStyle={setResponseStyle}
            selectedTheme={selectedTheme}
            setSelectedTheme={setSelectedTheme}
          />
        )}

        {step === 2 && (
          <OnboardingStepDiscovery
            inspection={inspection}
            loadingInspection={loadingInspection}
            selectedVault={selectedVault}
            setSelectedVault={setSelectedVault}
            selectedEngine={selectedEngine}
            setSelectedEngine={setSelectedEngine}
            selectedEditor={selectedEditor}
            setSelectedEditor={setSelectedEditor}
            selectedTerminal={selectedTerminal}
            setSelectedTerminal={setSelectedTerminal}
            onCreateDefaultVault={handleCreateDefaultVault}
            creatingVault={creatingVault}
          />
        )}

        {step === 3 && <OnboardingStepCheatSheet />}

        {/* Botonera Inferior */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.2rem' }}>
          <div>
            {step > 1 && (
              <TacticalButton
                variant="ghost"
                size="sm"
                icon={ArrowLeft}
                onClick={() => setStep((s) => s - 1)}
              >
                Anterior
              </TacticalButton>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {step < 3 ? (
              <TacticalButton
                variant="primary"
                size="sm"
                icon={ArrowRight}
                onClick={() => setStep((s) => s + 1)}
              >
                Siguiente
              </TacticalButton>
            ) : (
              <TacticalButton
                variant="primary"
                size="sm"
                icon={Sparkles}
                loading={completing}
                onClick={handleFinish}
              >
                {completing ? 'Guardando...' : 'Iniciar Centro de Mando'}
              </TacticalButton>
            )}
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}
