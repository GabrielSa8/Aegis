import { Terminal, CheckCircle2, AlertCircle, Play, Sparkles } from 'lucide-react';
import { TacticalButton } from '../../ui';

const KNOWN_TERMINALS = [
  { id: 'auto', name: 'Auto-detectar', desc: 'Cascada inteligente del sistema' },
  { id: 'ptyxis', name: 'Ptyxis', desc: 'Terminal GNOME/Fedora moderna' },
  { id: 'ghostty', name: 'Ghostty', desc: 'Acelerada por GPU moderna' },
  { id: 'kitty', name: 'Kitty', desc: 'Emulador GPU extensible y rápido' },
  { id: 'alacritty', name: 'Alacritty', desc: 'Emulador GPU ligero en Rust' },
  { id: 'kgx', name: 'Console (KGX)', desc: 'Terminal estándar de GNOME' },
  { id: 'gnome-terminal', name: 'GNOME Terminal', desc: 'Terminal clásica de GNOME' },
  { id: 'foot', name: 'Foot', desc: 'Terminal ultra-rápida Wayland' },
  { id: 'konsole', name: 'KDE Konsole', desc: 'Terminal avanzada de KDE Plasma' },
  { id: 'wezterm', name: 'WezTerm', desc: 'Terminal GPU en Rust con Lua' },
  { id: 'xterm', name: 'XTerm', desc: 'Terminal universal de fallback' },
  { id: 'custom', name: 'Personalizado', desc: 'Comando o binario del sistema' }
];

export default function TerminalSelectorCard({
  envConfig,
  installedTools,
  loadingTools,
  testingTool,
  testResult,
  onUpdateEnvironment,
  onTestTool
}) {
  const currentTerminal = envConfig.preferredTerminal || 'auto';
  const customCmd = envConfig.customTerminalCmd || '';

  const getToolDetection = (id) => {
    if (id === 'auto' || id === 'custom') return null;
    return installedTools.terminals.find(t => t.id === id);
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-sm)',
              background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}
          >
            <Terminal size={16} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0, color: 'var(--text-high)' }}>
              Emulador de Terminal Preferido
            </h4>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Determina qué terminal se lanza al abrir repositorios, actualizar el sistema o ejecutar Neovim.
            </p>
          </div>
        </div>

        <TacticalButton
          size="xs"
          variant="secondary"
          onClick={() => onTestTool('terminal', currentTerminal, customCmd)}
          disabled={testingTool === `terminal:${currentTerminal}`}
          icon={<Play size={11} />}
        >
          {testingTool === `terminal:${currentTerminal}` ? 'Abriendo...' : 'Probar Terminal'}
        </TacticalButton>
      </div>

      {testResult?.key === `terminal:${currentTerminal}` && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.72rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: testResult.success
              ? 'color-mix(in srgb, var(--primary) 12%, transparent)'
              : 'color-mix(in srgb, var(--danger) 12%, transparent)',
            border: `1px solid ${testResult.success ? 'var(--primary)' : 'var(--danger)'}`,
            color: testResult.success ? 'var(--primary)' : 'var(--danger)'
          }}
        >
          {testResult.success ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* Grid de Terminales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '8px' }}>
        {KNOWN_TERMINALS.map(term => {
          const isSelected = currentTerminal === term.id;
          const detection = getToolDetection(term.id);
          const isInstalled = detection ? detection.installed : null;

          return (
            <div
              key={term.id}
              onClick={() => onUpdateEnvironment({ preferredTerminal: term.id })}
              className={`settings-tool-select-card ${isSelected ? 'active' : ''}`}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                background: isSelected
                  ? 'color-mix(in srgb, var(--primary) 8%, var(--bg-card))'
                  : 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? '0 0 12px var(--primary-glow)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isSelected ? 'var(--text-high)' : 'var(--text-muted)' }}>
                  {term.name}
                </span>

                {term.id === 'auto' ? (
                  <span
                    style={{
                      fontSize: '0.62rem',
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    <Sparkles size={9} /> Recomendado
                  </span>
                ) : term.id !== 'custom' && !loadingTools && (
                  <span
                    style={{
                      fontSize: '0.62rem',
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: isInstalled
                        ? 'color-mix(in srgb, var(--primary) 15%, transparent)'
                        : 'color-mix(in srgb, var(--text-muted) 10%, transparent)',
                      color: isInstalled ? 'var(--primary)' : 'var(--text-muted)'
                    }}
                  >
                    {isInstalled ? '✓ Detectado' : 'No hallada'}
                  </span>
                )}
              </div>

              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: '1.2' }}>
                {term.desc}
              </span>
            </div>
          );
        })}
      </div>

      {/* Campo de comando personalizado si aplica */}
      {currentTerminal === 'custom' && (
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'color-mix(in srgb, var(--bg-main) 60%, transparent)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-high)' }}>
            Plantilla de Comando para Terminal Personalizada
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={customCmd}
              onChange={(e) => onUpdateEnvironment({ customTerminalCmd: e.target.value })}
              placeholder="ej. foot -D %p   ó   st -d %p"
              style={{
                flex: 1,
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 10px',
                color: 'var(--text-high)'
              }}
            />
          </div>
          <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
            Usa <code>%p</code> como marcador del directorio de trabajo.
          </span>
        </div>
      )}
    </div>
  );
}
