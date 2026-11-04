import { 
  Bot, 
  BookOpen, 
  PiggyBank, 
  CheckSquare, 
  Activity, 
  GitBranch, 
  Gamepad2, 
  Settings 
} from 'lucide-react';

/**
 * Catálogo Unificado de Módulos & Plugins de Aegis (v3.0 Sovereign Architecture)
 * 
 * CORE INAMOVIBLE (Inmutables, siempre activos):
 * - agent: Agente IA de Terminal y Chat
 * - vault: Bóveda de Conocimiento y Markdown de Obsidian
 * - settings: Centro de Configuración & Gestor de Plugins
 * 
 * PLUGINS OPCIONALES (Desactivables / Descargables de memoria):
 * - finances: Finanzas, Presupuestos, MSI y Radar
 * - tasks: Gestor de Tareas, Kanban y Matriz Eisenhower
 * - sentinel: Centinela de Hardware, CPU, RAM y Procesos
 * - devops: Flota Git y Sincronización de Repositorios
 * - gaming: Centro de Juegos, Proton, Wine y GameMode
 * - timeline: Cronología Histórica y Línea de Tiempo
 */

export const CORE_MODULES = [
  {
    id: 'agent',
    name: 'Agente Soberano IA',
    description: 'Terminal de interacción inteligente, comandos bash, razonamiento profundo y fallback multi-modelo.',
    icon: Bot,
    category: 'Núcleo Primario',
    isCore: true,
    ramImpact: 'Nativo',
    shortcut: 'Alt + 1'
  },
  {
    id: 'vault',
    name: 'Bóveda de Conocimiento',
    description: 'Explorador local de archivos Markdown, grafo de conocimiento, backlinks, canvas y renderizador Mermaid.',
    icon: BookOpen,
    category: 'Núcleo Primario',
    isCore: true,
    ramImpact: 'Nativo',
    shortcut: 'Alt + 3'
  },
  {
    id: 'settings',
    name: 'Sistema & Gestor de Plugins',
    description: 'Configuración soberana, control de almacenamiento SQLite, gestión de módulos y ajustes de perfil.',
    icon: Settings,
    category: 'Núcleo Primario',
    isCore: true,
    ramImpact: 'Nativo',
    shortcut: 'Alt + 8'
  }
];

export const OPTIONAL_PLUGINS = [
  {
    id: 'finances',
    name: 'Finanzas & Presupuestos',
    description: 'Control de ingresos, gastos, cortes quincenales/mensuales, radar de liquidez y planes de meses sin intereses (MSI).',
    icon: PiggyBank,
    category: 'Productividad Personal',
    isCore: false,
    ramImpact: 'Ligero (~6 MB)',
    defaultEnabled: true,
    shortcut: 'Alt + 2',
    features: [
      'Radar de liquidez proyectado',
      'Alertas de corte de tarjeta',
      'Desglose por categorías y métodos de pago',
      'Simulador de compras diferidas (MSI)'
    ]
  },
  {
    id: 'tasks',
    name: 'Gestor de Tareas & Prioridades',
    description: 'Sincronización bidireccional con tareas en Markdown de la Bóveda Obsidian, Matriz Eisenhower y backlog ágil.',
    icon: CheckSquare,
    category: 'Productividad Personal',
    isCore: false,
    ramImpact: 'Mínimo (~3 MB)',
    defaultEnabled: true,
    shortcut: 'Alt + 5',
    features: [
      'Tablero Kanban interactivo',
      'Matriz Eisenhower (Urgente / Importante)',
      'Escaneo de checkboxes de la Bóveda',
      'Notificaciones de vencimiento'
    ]
  },
  {
    id: 'sentinel',
    name: 'Centinela Host & Hardware',
    description: 'Monitoreo en vivo de telemetría de CPU, frecuencias por núcleo, consumo de RAM, ZRAM, swap y administrador de procesos.',
    icon: Activity,
    category: 'Sistema & Rendimiento',
    isCore: false,
    ramImpact: 'Moderado (~12 MB)',
    defaultEnabled: true,
    shortcut: 'Alt + 6',
    features: [
      'Lectura térmica con alerta preventiva >85°C',
      'Monitoreo ZRAM y compactación de memoria',
      'Matador táctico de procesos zombies',
      'Huella en memoria del binario Aegis'
    ]
  },
  {
    id: 'devops',
    name: 'DevOps & Flota Git',
    description: 'Inspección de múltiples repositorios Git locales, estado de branches, commits pendientes, ahead/behind y roles.',
    icon: GitBranch,
    category: 'Desarrollo de Software',
    isCore: false,
    ramImpact: 'Bajo (~4 MB)',
    defaultEnabled: true,
    shortcut: 'Alt + 4',
    features: [
      'Auditoría multi-repositorio unificada',
      'Detección de ramas divergentes',
      'Warnings tácticos en repositorios sensibles',
      'Integración con editor preferido'
    ]
  },
  {
    id: 'gaming',
    name: 'Centro de Ocio & Gaming',
    description: 'Lanzador optimizado para Linux con soporte GameMode, Gamescope/FSR, perfiles Proton/Wine y biblioteca de emuladores.',
    icon: Gamepad2,
    category: 'Gaming & Ocio',
    isCore: false,
    ramImpact: 'Bajo en reposo (~5 MB)',
    defaultEnabled: true,
    shortcut: 'Alt + 7',
    features: [
      'Aceleración GameMode con 1-clic',
      'FSR upscaling integrado con Gamescope',
      'Registro de horas de juego y sesiones',
      'Perfiles de rendimiento para hardware modesto'
    ]
  }
];

export const ALL_PLUGINS = [...CORE_MODULES, ...OPTIONAL_PLUGINS];

export const DEFAULT_ENABLED_MODULES = {
  finances: true,
  tasks: true,
  sentinel: true,
  devops: true,
  gaming: true
};

export const TAB_ORDER = [
  'agent',
  'finances',
  'vault',
  'devops',
  'tasks',
  'sentinel',
  'gaming',
  'settings'
];

export function getVisibleTabs(enabledModules = {}) {
  return TAB_ORDER.filter((id) => {
    if (id === 'agent' || id === 'vault' || id === 'settings') return true;
    return enabledModules[id] !== false;
  });
}
