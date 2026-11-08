import React from 'react';
import { Shield, Trophy, Zap, Compass, Gamepad2 } from 'lucide-react';
import TacticalButton from '../ui/TacticalButton';

export default function GameCompanionQuickActions({ onSelectAction, disabled }) {
  const actions = [
    {
      id: 'builds',
      label: 'Builds & Clases',
      icon: Shield,
      prompt: 'Recomiéndame las mejores builds, armas o clases iniciales y avanzadas para jugar eficientemente.'
    },
    {
      id: 'achievements',
      label: 'Siguiente Logro',
      icon: Trophy,
      prompt: 'Analiza mis logros bloqueados pendientes del contexto y dame la estrategia exacta paso a paso para desbloquear el más accesible.'
    },
    {
      id: 'perf',
      label: 'Config FPS & Gráficos',
      icon: Zap,
      prompt: 'Dame la configuración gráfica óptima para mi procesador y GPU (FSR/Gamescope, target FPS, parámetros Proton/Wine) para balancear fluidez y nitidez.'
    },
    {
      id: 'secrets',
      label: 'Secretos & Rutas',
      icon: Compass,
      prompt: '¿Qué secretos, rutas ocultas o mecánicas poco evidentes son indispensables en las primeras horas de partida?'
    },
    {
      id: 'controls',
      label: 'Mando & Atajos',
      icon: Gamepad2,
      prompt: '¿Cuál es el mejor layout de mando o combinación de teclas recomendado para maximizar la comodidad?'
    }
  ];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      overflowX: 'auto',
      paddingBottom: '4px',
      scrollbarWidth: 'none'
    }}>
      {actions.map((act) => (
        <TacticalButton
          key={act.id}
          variant="secondary"
          size="xs"
          icon={act.icon}
          disabled={disabled}
          onClick={() => onSelectAction(act.prompt, act.label)}
          style={{
            whiteSpace: 'nowrap',
            fontSize: '0.68rem',
            padding: '3px 8px',
            border: '1px solid color-mix(in srgb, var(--primary) 30%, var(--border-color))',
            background: 'color-mix(in srgb, var(--bg-card) 85%, var(--primary) 5%)'
          }}
        >
          {act.label}
        </TacticalButton>
      ))}
    </div>
  );
}
