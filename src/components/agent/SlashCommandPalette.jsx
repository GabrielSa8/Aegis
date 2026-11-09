import { useEffect, useRef } from 'react';
import {
  Trash2,
  Minimize2,
  Zap,
  Activity,
  ClipboardPaste,
  GitCompare,
  Terminal,
  Coins,
  Sparkles,
  Code,
  Brain,
  Cpu,
  FolderGit2,
  Package,
  HelpCircle
} from 'lucide-react';

const ICON_MAP = {
  Trash2,
  Minimize2,
  Zap,
  Activity,
  ClipboardPaste,
  GitCompare,
  Coins,
  Sparkles,
  Terminal,
  Code,
  Brain,
  Cpu,
  FolderGit2,
  Package,
  HelpCircle
};

export default function SlashCommandPalette({
  commands = [],
  selectedIndex = 0,
  onSelectCommand
}) {
  const listRef = useRef(null);

  // Auto-scroll del elemento seleccionado dentro de la lista
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex];
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  if (!commands.length) return null;

  return (
    <div className="slash-command-palette" role="listbox" aria-label="Comandos rápidos">
      <div className="slash-palette-header">
        <span className="slash-palette-title">
          <Terminal size={12} />
          <span>Comandos Rápidos (/)</span>
        </span>
        <span className="slash-palette-keys">
          ↑↓ navegar · ↵ ejecutar · esc salir
        </span>
      </div>

      <div className="slash-palette-list custom-scrollbar" ref={listRef}>
        {commands.map((cmd, idx) => {
          const IconComp = ICON_MAP[cmd.icon] || Terminal;
          const isSelected = idx === selectedIndex;

          return (
            <div
              key={cmd.id}
              role="option"
              aria-selected={isSelected}
              className={`slash-palette-item ${isSelected ? 'is-selected' : ''}`}
              onClick={() => onSelectCommand(cmd)}
            >
              <div className="slash-palette-item-left">
                <div className="slash-palette-icon-wrap">
                  <IconComp size={13} />
                </div>
                <div className="slash-palette-info">
                  <div className="slash-palette-cmd-row">
                    <span className="slash-palette-cmd-name">{cmd.command}</span>
                    <span className="slash-palette-cmd-label">{cmd.label}</span>
                  </div>
                  <span className="slash-palette-cmd-desc">{cmd.desc}</span>
                </div>
              </div>

              <span className="slash-palette-badge">{cmd.category}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
