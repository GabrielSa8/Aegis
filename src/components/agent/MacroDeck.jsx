import { Zap, Play, Edit3 } from 'lucide-react';
import { getMacroVariables, interpolateMacroText } from './macroHelpers';

export default function MacroDeck({
  macros = [],
  loading = false,
  onSelectMacro,
  onExecuteMacro,
  onToggleMacroModal,
  isMacroModalOpen = false,
  activeContext
}) {
  const handleChipClick = async (e, macro) => {
    e.stopPropagation();
    const resolvedText = await interpolateMacroText(macro.text, activeContext);
    
    // Shift + Click -> Ejecución inmediata directa
    if (e.shiftKey) {
      if (onExecuteMacro) onExecuteMacro(resolvedText);
      return;
    }

    // Click simple -> Inyectar en prompt input para edición
    if (onSelectMacro) {
      onSelectMacro(resolvedText);
    } else if (onExecuteMacro) {
      onExecuteMacro(resolvedText);
    }
  };

  const handlePlayDirect = async (e, macro) => {
    e.stopPropagation();
    if (loading || !onExecuteMacro) return;
    const resolvedText = await interpolateMacroText(macro.text, activeContext);
    onExecuteMacro(resolvedText);
  };

  return (
    <div className="terminal-macro-shelf">
      <div 
        className="macro-shelf-scroll no-scrollbar"
        onWheel={(e) => {
          if (e.deltaY !== 0) {
            e.currentTarget.scrollLeft += e.deltaY;
          }
        }}
      >
        <span 
          className="macro-shelf-indicator"
          title="Macros rápidas. Clic: Cargar en prompt · Shift+Clic o [▶]: Ejecutar"
        >
          <Zap size={11} />
        </span>

        {macros.map((macro, idx) => {
          const vars = getMacroVariables(macro.text);
          const tooltip = `[Macro #${idx + 1}] ${macro.label}\n\n"${macro.text}"\n\n• Clic: Cargar en prompt\n• Shift + Clic o [▶]: Ejecutar`;

          return (
            <button
              key={macro.id || idx}
              type="button"
              onClick={(e) => handleChipClick(e, macro)}
              disabled={loading}
              className="tactical-macro-chip"
              title={tooltip}
              style={{ opacity: loading ? 0.5 : 1 }}
            >
              <kbd className="macro-chip-kbd">{idx + 1}</kbd>
              <span className="macro-chip-label">{macro.label}</span>

              {/* Badges de variables dinámicas */}
              {vars.map((v) => (
                <span key={v} className={`macro-var-badge var-${v}`}>
                  {`{{${v}}}`}
                </span>
              ))}

              {/* Botón rápido de ejecución directa */}
              <span
                className="macro-chip-play"
                onClick={(e) => handlePlayDirect(e, macro)}
                title="Ejecutar macro inmediatamente"
              >
                <Play size={8} fill="currentColor" />
              </span>
            </button>
          );
        })}
      </div>

      {/* Botón de administración de macros */}
      <button
        type="button"
        data-macro-modal-toggle="true"
        onClick={(e) => {
          e.currentTarget.blur();
          onToggleMacroModal?.();
        }}
        className={`macro-shelf-edit-btn ${isMacroModalOpen ? 'is-active' : ''}`}
        title={isMacroModalOpen ? 'Cerrar administrador de macros' : 'Administrar macros'}
      >
        <Edit3 size={11} color="var(--primary)" />
        <span>Editar</span>
      </button>
    </div>
  );
}
