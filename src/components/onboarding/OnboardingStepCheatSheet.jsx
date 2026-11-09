import React from 'react';
import { ShieldCheck, PanelTop, PanelLeft, PanelRight, Workflow, Terminal } from 'lucide-react';

const SHORTCUTS = [
  { kbd: 'Ctrl + K', label: 'Paleta Omnibar', desc: 'Buscador universal de notas, temas, acciones y macros' },
  { kbd: 'Alt + 1..N', label: 'Navegación Dinámica', desc: 'Conmutación entre módulos activos (inicia con Núcleo: Alt+1 Agente, Alt+2 Bóveda, Alt+3 Sistema)' },
  { kbd: 'Ctrl + O', label: 'Acordeón de Pensamiento', desc: 'Expandir o contraer razonamiento y herramientas de la IA' },
  { kbd: 'Alt + L', label: 'Bloqueo de Pantalla', desc: 'Bloqueo instantáneo de pantalla con cifrado AES-256' },
  { kbd: 'Ctrl + ,', label: 'Centro de Ajustes', desc: 'Acceso directo a configuración y gestor de plugins' },
  { kbd: 'Alt + Z', label: 'Modo Zen', desc: 'Ocultar docks y barras para enfoque de lectura máxima' }
];

export function OnboardingStepCheatSheet({ harnessEnabled = true }) {
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

      {/* 🧭 Arquitectura del Cockpit: Los 3 Docks */}
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Anatomía del Cockpit (Los 3 Docks)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.45rem', marginBottom: '0.45rem' }}>
          {/* Dock Superior */}
          <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', fontWeight: 700, color: 'var(--primary)' }}>
              <PanelTop size={14} />
              <span>Dock Superior (38px)</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.67rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
              Control maestro: Omnibar (<kbd className="tactical-kbd" style={{ fontSize: '0.62rem' }}>Ctrl+K</kbd>), semáforo Git, Modo Zen (<kbd className="tactical-kbd" style={{ fontSize: '0.62rem' }}>Alt+Z</kbd>), bloqueo y botón de guías <kbd className="tactical-kbd" style={{ fontSize: '0.62rem' }}>[?]</kbd>.
            </p>
          </div>

          {/* Dock Izquierdo */}
          <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', fontWeight: 700, color: 'var(--accent, #7dcfff)' }}>
              <PanelLeft size={14} />
              <span>Dock Izquierdo (Módulos)</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.67rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
              Navegación dinámica de módulos (<kbd className="tactical-kbd" style={{ fontSize: '0.62rem' }}>Alt+1..N</kbd>). Pasa el cursor por el borde izquierdo para desplegarlo o fíjalo con la chincheta.
            </p>
          </div>

          {/* Dock Derecho */}
          <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', fontWeight: 700, color: 'var(--warning, #f59e0b)' }}>
              <PanelRight size={14} />
              <span>Dock Derecho (Contextos)</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.67rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
              Entornos de trabajo para la IA en el borde derecho: selecciona el proyecto activo en 1 clic para orientar al agente.
            </p>
          </div>
        </div>

        {/* 💡 Explicación de qué son los contextos */}
        <div style={{ padding: '7px 10px', borderRadius: 'var(--radius-sm)', background: 'color-mix(in srgb, var(--bg-card) 40%, transparent)', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <Workflow size={15} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '2px' }} />
          <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-high)', lineHeight: 1.4 }}>
            <strong>¿Para qué son los Contextos?</strong> Son cápsulas de trabajo para la IA. Cada contexto enlaza una carpeta de proyecto (<code style={{ fontSize: '0.65rem' }}>workingDir</code>), sus skills activas y sus notas de Obsidian. Al cambiar de contexto con 1 clic en el dock derecho, la IA sabe exactamente qué archivos y herramientas usar sin mezclar proyectos ni saturar tokens.
          </p>
        </div>

        {/* 🛡️ Explicación del Aegis Adaptive Harness (Escalado Dinámico por Paso) */}
        <div style={{ marginTop: '0.45rem', padding: '7px 10px', borderRadius: 'var(--radius-sm)', background: 'color-mix(in srgb, var(--primary) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--primary) 25%, transparent)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <ShieldCheck size={15} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
          <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-high)', lineHeight: 1.4 }}>
            <strong>¿Cómo funciona el Aegis Harness ({harnessEnabled ? 'Activo' : 'Configurable en Ajustes'})?</strong> En lugar de gastar siempre en un modelo lento o cambiar de nivel a mano, evalúa cada subtarea en vivo: ejecuta pasos simples en <strong>L1 (Flash)</strong>, sube a <strong>L2 (Balanceado)</strong> o <strong>L3 (Profundo)</strong> cuando el siguiente paso lo exige, poda archivos ruidosos (<code style={{ fontSize: '0.65rem' }}>lockfiles</code>), alinea el caché KV (-80% latencia) y auto-repara fallos. Puedes alternarlo en la barra superior (<code style={{ fontSize: '0.65rem' }}>Auto L1⇄L3</code>) o en <strong>Ajustes ➔ Motor IA</strong>.
          </p>
        </div>

        {/* ⚡ Comandos Rápidos Esenciales (/slash) */}
        <div style={{ marginTop: '0.45rem', padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'color-mix(in srgb, var(--bg-card) 50%, transparent)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', fontWeight: 700, color: 'var(--primary)' }}>
            <Terminal size={14} />
            <span>Comandos Rápidos Esenciales (Escribe / en el chat)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '4px' }}>
            <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>
              <code style={{ color: 'var(--accent)', fontWeight: 600 }}>/usage</code> — Cuotas de 5h y semanal
            </div>
            <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>
              <code style={{ color: 'var(--accent)', fontWeight: 600 }}>/compact</code> — Comprimir y liberar memoria
            </div>
            <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>
              <code style={{ color: 'var(--accent)', fontWeight: 600 }}>/model</code> — Conmutar modelo en vivo
            </div>
            <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>
              <code style={{ color: 'var(--accent)', fontWeight: 600 }}>/intensity</code> — Esfuerzo low/mid/high
            </div>
            <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>
              <code style={{ color: 'var(--primary)', fontWeight: 600 }}>/context &lt;tema&gt;</code> — Auto-crear contexto
            </div>
            <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>
              <code style={{ color: 'var(--primary)', fontWeight: 600 }}>/pack &lt;tema&gt;</code> — Auto-crear modpack
            </div>
            <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>
              <code style={{ color: 'var(--accent)', fontWeight: 600 }}>/help</code> — Guía completa en chat
            </div>
            <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>
              <code style={{ color: 'var(--text-high)', fontWeight: 600 }}>/clip & /diff</code> — Inyección rápida
            </div>
          </div>
        </div>

        {/* 🚀 Primer paso recomendado: Plugins */}
        <div style={{ marginTop: '0.45rem', padding: '7px 10px', borderRadius: 'var(--radius-sm)', background: 'color-mix(in srgb, var(--primary) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--primary) 25%, transparent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1rem' }}>🧩</span>
          <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-high)', lineHeight: 1.4 }}>
            <strong>Primer paso recomendado:</strong> Abre <strong>Ajustes (<kbd className="tactical-kbd" style={{ fontSize: '0.62rem' }}>Ctrl+,</kbd> o <kbd className="tactical-kbd" style={{ fontSize: '0.62rem' }}>Alt+3</kbd>) ➔ Plugins</strong> para activar en 1 clic los módulos que quieras usar (Finanzas, Tareas Kanban, Centinela Host, Flota Git o Gaming).
          </p>
        </div>
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
