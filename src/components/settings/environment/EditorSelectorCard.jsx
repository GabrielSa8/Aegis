import { Code, CheckCircle2, AlertCircle, Play, Terminal } from 'lucide-react';
import { TacticalButton } from '../../ui';

const KNOWN_EDITORS = [
  { id: 'cursor', name: 'Cursor AI', desc: 'Editor nativo con IA de cabecera' },
  { id: 'code', name: 'VS Code', desc: 'Visual Studio Code estándar' },
  { id: 'neovim', name: 'Neovim', desc: 'Editor modal en terminal / Neovide' },
  { id: 'zed', name: 'Zed Editor', desc: 'Editor ultra-rápido en Rust' },
  { id: 'subl', name: 'Sublime Text', desc: 'Editor ligero de alto rendimiento' },
  { id: 'idea', name: 'IntelliJ IDEA', desc: 'IDE completo de JetBrains' },
  { id: 'custom', name: 'Personalizado', desc: 'Comando o binario del sistema' }
];

export default function EditorSelectorCard({
  envConfig,
  installedTools,
  loadingTools,
  testingTool,
  testResult,
  onUpdateEnvironment,
  onTestTool
}) {
  const currentEditor = envConfig.preferredEditor || 'cursor';
  const customCmd = envConfig.customEditorCmd || '';

  const getToolDetection = (id) => {
    if (id === 'custom') return null;
    return installedTools.editors.find(e => e.id === id);
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
            <Code size={16} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0, color: 'var(--text-high)' }}>
              Editor / IDE Preferido
            </h4>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Determina qué entorno se inicia al pulsar &quot;Abrir en Editor&quot; desde la flota Git o tareas.
            </p>
          </div>
        </div>

        <TacticalButton
          size="xs"
          variant="secondary"
          onClick={() => onTestTool('editor', currentEditor, customCmd)}
          disabled={testingTool === `editor:${currentEditor}`}
          icon={<Play size={11} />}
        >
          {testingTool === `editor:${currentEditor}` ? 'Abriendo...' : 'Probar Editor'}
        </TacticalButton>
      </div>

      {testResult?.key === `editor:${currentEditor}` && (
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

      {/* Grid de Editores */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '8px' }}>
        {KNOWN_EDITORS.map(ed => {
          const isSelected = currentEditor === ed.id;
          const detection = getToolDetection(ed.id);
          const isInstalled = detection ? detection.installed : null;

          return (
            <div
              key={ed.id}
              onClick={() => onUpdateEnvironment({ preferredEditor: ed.id })}
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
                  {ed.name}
                </span>

                {ed.id !== 'custom' && !loadingTools && (
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
                    {isInstalled ? '✓ Detectado' : 'No hallado'}
                  </span>
                )}
              </div>

              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: '1.2' }}>
                {ed.desc}
              </span>
            </div>
          );
        })}
      </div>

      {/* Campo de comando personalizado si aplica */}
      {currentEditor === 'custom' && (
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
            Plantilla de Comando para Editor Personalizado
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={customCmd}
              onChange={(e) => onUpdateEnvironment({ customEditorCmd: e.target.value })}
              placeholder="ej. subl -n %p   ó   idea %p"
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
            Usa <code>%p</code> como marcador de la ruta absoluta del repositorio o archivo.
          </span>
        </div>
      )}
    </div>
  );
}
