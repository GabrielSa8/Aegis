import { useState, useEffect, useCallback, useRef } from 'react';
import { MODULE_TOURS } from './tourCatalog';

const STORAGE_KEY = 'aegis_seen_module_tours';

function getStoredTours() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function useModuleTour(activeTab) {
  const [currentModuleId, setCurrentModuleId] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(true);
  const shownInSessionRef = useRef(new Set());

  // Abrir tour para un módulo específico
  const openTour = useCallback((moduleId) => {
    const tourData = MODULE_TOURS[moduleId];
    if (!tourData) return;
    setCurrentModuleId(moduleId);
    setCurrentStep(0);
    setDontShowAgain(true);
    setIsOpen(true);
  }, []);

  // Cerrar tour y guardar estado si corresponde
  const closeTour = useCallback((markAsSeen = true) => {
    if (currentModuleId) {
      shownInSessionRef.current.add(currentModuleId);
      if (markAsSeen) {
        try {
          const stored = getStoredTours();
          stored[currentModuleId] = true;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
        } catch (e) {
          console.error('[Tour] Error guardando estado de tour:', e);
        }
      }
    }
    setIsOpen(false);
  }, [currentModuleId]);

  // Verificar automáticamente si la pestaña actual no ha sido vista
  useEffect(() => {
    if (!activeTab) return;
    const normalized = activeTab === 'leisure' ? 'gaming' : activeTab;
    if (!MODULE_TOURS[normalized]) return;

    // Si había un tour abierto y el usuario cambia de pestaña, cerrarlo sin bloquear
    setIsOpen(false);

    const stored = getStoredTours();
    // Si ya se vio en almacenamiento o en esta sesión, no abrir automáticamente
    if (stored[normalized] || shownInSessionRef.current.has(normalized)) {
      return;
    }

    // Esperar 1.2s para confirmar que el usuario no está navegando rápidamente entre pestañas
    const timer = setTimeout(() => {
      openTour(normalized);
    }, 1200);

    return () => clearTimeout(timer);
  }, [activeTab, openTour]);

  // Escuchar evento global aegis:open-tour
  useEffect(() => {
    const handleOpenTourEvent = (e) => {
      const targetModule = e.detail?.moduleId || activeTab;
      const normalized = targetModule === 'leisure' ? 'gaming' : targetModule;
      if (normalized && MODULE_TOURS[normalized]) {
        openTour(normalized);
      }
    };

    window.addEventListener('aegis:open-tour', handleOpenTourEvent);
    return () => window.removeEventListener('aegis:open-tour', handleOpenTourEvent);
  }, [activeTab, openTour]);

  const activeTourData = currentModuleId ? MODULE_TOURS[currentModuleId] : null;
  const totalSteps = activeTourData?.steps?.length || 0;

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev < totalSteps - 1) return prev + 1;
      closeTour(dontShowAgain);
      return prev;
    });
  }, [totalSteps, closeTour, dontShowAgain]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => (prev > 0 ? prev - 1 : 0));
  }, []);

  return {
    isOpen,
    currentStep,
    totalSteps,
    activeTourData,
    dontShowAgain,
    setDontShowAgain,
    openTour,
    closeTour,
    nextStep,
    prevStep,
    setCurrentStep
  };
}
