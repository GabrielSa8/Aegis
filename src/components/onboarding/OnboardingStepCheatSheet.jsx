import React from 'react';
import { ShieldCheck, Command, Lock, Terminal, Sparkles } from 'lucide-react';

const SHORTCUTS = [
  { kbd: 'Ctrl + K', label: 'Paleta Omnibar', desc: 'Buscador universal de notas, temas, acciones y macros' },
  { kbd: 'Alt + 1..8', label: 'Navegación Cockpit', desc: 'Conmutación directa entre las 8 pestañas tácticas' },
  { kbd: 'Ctrl + O', label: 'Acordeón de Pensamiento', desc: 'Expandir o contraer razonamiento y herramientas de la IA' },
  { kbd: 'Alt + L', label: 'Cierre Soberano', desc: 'Bloqueo instantáneo de pantalla con cifrado AES-256' },
  { kbd: 'Ctrl + ,', label: 'Centro de Ajustes', desc: 'Acceso directo a los 4 macro-hubs de configuración' },
  { kbd: 'Alt + Z', label: 'Modo Zen', desc: 'Ocultar docks y barras para enfoque de lectura máxima' }
];

export function OnboardingStepCheatSheet() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'color-mix(in srgb, var(--primary) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '3px' }}>
          <ShieldCheck size={18} />
          <span>Centro de Mando Personal Configurado</span>
        </div>
        <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-high)', lineHeight: 1.4 }}>
          Tus datos se mantienen 100% locales en tu máquina: las notas residen en Obsidian Markdown y la telemetría en SQLite embebido, con cero consumo de servidores externos.
        </p>
      </div>

      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Atajos de Teclado Maestros
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.45rem' }}>
          {SHORTCUTS.map((sc) => (
            <div
              key={sc.kbd}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 9px',
                borderRadius: 'var(--radius-sm)',
                background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
                border: '1px solid var(--border-color)'
              }}
            >
              <kbd className="tactical-kbd" style={{ fontSize: '0.68rem', padding: '2px 6px', whiteSpace: 'nowrap' }}>
                {sc.kbd}
              </kbd>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-high)' }}>
                  {sc.label}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {sc.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
