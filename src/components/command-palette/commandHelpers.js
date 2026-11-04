import { 
  Bot, 
  DollarSign, 
  BookOpen, 
  GitBranch, 
  CheckSquare, 
  Activity, 
  Gamepad2, 
  Palette, 
  Settings, 
  Zap
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

export function getBaseCommands({
  onSelectTab,
  onOpenSettings,
  onThemeChange,
  onClose,
  enabledModules = {}
}) {
  const allTabs = [
    { tabId: 'agent', title: 'Ir a Agente IA', icon: Bot },
    { tabId: 'finances', title: 'Ir a Vida & Finanzas (Cockpit & Pulse)', icon: DollarSign },
    { tabId: 'vault', title: 'Ir a Bóveda Obsidian', icon: BookOpen },
    { tabId: 'devops', title: 'Ir a DevOps & Flota Git', icon: GitBranch },
    { tabId: 'tasks', title: 'Ir a Tareas de Bóveda', icon: CheckSquare },
    { tabId: 'sentinel', title: 'Ir a Centinela & Telemetría Host', icon: Activity },
    { tabId: 'gaming', title: 'Ir a Gaming Cockpit & Aceleración', icon: Gamepad2 },
    { tabId: 'settings', title: 'Ir a Sistema & Configuración Soberana', icon: Settings },
  ];

  const navCommands = allTabs
    .filter((cmd) => {
      if (cmd.tabId === 'agent' || cmd.tabId === 'vault' || cmd.tabId === 'settings') return true;
      return enabledModules[cmd.tabId] !== false;
    })
    .map((cmd, idx) => ({
      id: `nav-${cmd.tabId}`,
      tabId: cmd.tabId,
      title: cmd.title,
      category: 'Navegación',
      icon: cmd.icon,
      shortcut: `Alt + ${idx + 1}`,
      action: () => {
        onSelectTab(cmd.tabId);
        onClose();
      }
    }));

  const actions = [
    { id: 'act-settings', title: 'Abrir Ajustes Globales & Flota', category: 'Acciones', icon: Settings, shortcut: 'Ctrl + ,', action: () => { onOpenSettings(); onClose(); } },
    { 
      id: 'act-purge', 
      title: 'Purgar Memoria RAM & Compactar ZRAM', 
      category: 'Acciones', 
      icon: Zap, 
      action: () => { 
        invoke('clean_system_memory').catch(() => {}); 
        onClose(); 
      } 
    }
  ];

  if (enabledModules.gaming !== false) {
    actions.push({ 
      id: 'act-steam', 
      title: 'Lanzar Steam con GameMode', 
      category: 'Acciones', 
      icon: Gamepad2, 
      action: () => { 
        invoke('launch_game', { target: 'steam' }).catch(() => {}); 
        onClose(); 
      } 
    });
  }

  return [
    ...navCommands,
    ...actions,

    // 🎨 Temas Visuales
    { id: 'theme-nordic', title: 'Tema: Nordic Slate & Moss (Predeterminado)', category: 'Temas', icon: Palette, action: () => { onThemeChange('nordic-moss'); onClose(); } },
    { id: 'theme-tokyo', title: 'Tema: Tokyo Night (Indigo Cyberpunk)', category: 'Temas', icon: Palette, action: () => { onThemeChange('tokyo-night'); onClose(); } },
    { id: 'theme-oled', title: 'Tema: OLED Pure Black (100% Negro & Láser Verde)', category: 'Temas', icon: Palette, action: () => { onThemeChange('oled-black'); onClose(); } },
    { id: 'theme-amber', title: 'Tema: Amber Terminal (Hacker Ámbar Monocromo)', category: 'Temas', icon: Palette, action: () => { onThemeChange('amber-terminal'); onClose(); } },
    { id: 'theme-dracula', title: 'Tema: Dracula Dark (Púrpura & Magenta)', category: 'Temas', icon: Palette, action: () => { onThemeChange('dracula'); onClose(); } },
  ];
}
