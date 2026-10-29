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
  Zap, 
  Minimize2
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

export function getBaseCommands({
  onSelectTab,
  onToggleZenMode,
  onOpenSettings,
  onThemeChange,
  onClose
}) {
  return [
    // 🧭 Navegación
    { id: 'nav-agent', title: 'Ir a Agente IA', category: 'Navegación', icon: Bot, shortcut: 'Alt + 1', action: () => { onSelectTab('agent'); onClose(); } },
    { id: 'nav-finances', title: 'Ir a Vida & Finanzas (Timeline)', category: 'Navegación', icon: DollarSign, shortcut: 'Alt + 2', action: () => { onSelectTab('finances'); onClose(); } },
    { id: 'nav-vault', title: 'Ir a Bóveda Obsidian', category: 'Navegación', icon: BookOpen, shortcut: 'Alt + 3', action: () => { onSelectTab('vault'); onClose(); } },
    { id: 'nav-devops', title: 'Ir a DevOps & Flota Git', category: 'Navegación', icon: GitBranch, shortcut: 'Alt + 4', action: () => { onSelectTab('devops'); onClose(); } },
    { id: 'nav-tasks', title: 'Ir a Tareas de Bóveda', category: 'Navegación', icon: CheckSquare, shortcut: 'Alt + 5', action: () => { onSelectTab('tasks'); onClose(); } },
    { id: 'nav-sentinel', title: 'Ir a Centinela & Telemetría Host', category: 'Navegación', icon: Activity, shortcut: 'Alt + 6', action: () => { onSelectTab('sentinel'); onClose(); } },
    { id: 'nav-gaming', title: 'Ir a Gaming Cockpit & Aceleración', category: 'Navegación', icon: Gamepad2, shortcut: 'Alt + 7', action: () => { onSelectTab('gaming'); onClose(); } },
    { id: 'nav-settings', title: 'Ir a Sistema & Configuración Soberana', category: 'Navegación', icon: Settings, shortcut: 'Alt + 8', action: () => { onSelectTab('settings'); onClose(); } },

    // ⚡ Acciones Tácticas
    { id: 'act-zen', title: 'Alternar Modo Zen (Pantalla Completa)', category: 'Acciones', icon: Minimize2, shortcut: 'Alt + Z', action: () => { onToggleZenMode(); onClose(); } },
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
    },
    { 
      id: 'act-steam', 
      title: 'Lanzar Steam con GameMode', 
      category: 'Acciones', 
      icon: Gamepad2, 
      action: () => { 
        invoke('launch_game', { target: 'steam' }).catch(() => {}); 
        onClose(); 
      } 
    },

    // 🎨 Temas Visuales
    { id: 'theme-nordic', title: 'Tema: Nordic Slate & Moss (Predeterminado)', category: 'Temas', icon: Palette, action: () => { onThemeChange('nordic-moss'); onClose(); } },
    { id: 'theme-tokyo', title: 'Tema: Tokyo Night (Indigo Cyberpunk)', category: 'Temas', icon: Palette, action: () => { onThemeChange('tokyo-night'); onClose(); } },
    { id: 'theme-oled', title: 'Tema: OLED Pure Black (100% Negro & Láser Verde)', category: 'Temas', icon: Palette, action: () => { onThemeChange('oled-black'); onClose(); } },
    { id: 'theme-amber', title: 'Tema: Amber Terminal (Hacker Ámbar Monocromo)', category: 'Temas', icon: Palette, action: () => { onThemeChange('amber-terminal'); onClose(); } },
    { id: 'theme-dracula', title: 'Tema: Dracula Dark (Púrpura & Magenta)', category: 'Temas', icon: Palette, action: () => { onThemeChange('dracula'); onClose(); } },
  ];
}
