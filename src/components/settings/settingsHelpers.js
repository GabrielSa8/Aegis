import { 
  User, 
  Palette, 
  HardDrive, 
  Bot, 
  GitBranch, 
  Bell, 
  Gamepad2,
  Puzzle 
} from 'lucide-react';

export const THEMES = [
  {
    id: 'nordic-moss',
    name: 'Nordic Slate & Moss',
    desc: 'Verde esmeralda salvia sobre pizarra nórdica. Alta densidad y concentración.',
    bg: '#0f1211',
    card: '#161a19',
    accent: '#10b981'
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    desc: 'Índigo profundo con acentos cian y violeta neón estilo cyberpunk.',
    bg: '#13141f',
    card: '#1a1b26',
    accent: '#7dcfff'
  },
  {
    id: 'oled-black',
    name: 'OLED Pure Black',
    desc: 'Negro puro al 100% con contraste esmeralda láser. Máximo ahorro energético.',
    bg: '#000000',
    card: '#0a0a0a',
    accent: '#00ff88'
  },
  {
    id: 'amber-terminal',
    name: 'Amber Terminal',
    desc: 'Monocromo hacker ámbar cálido sobre carbón ultra-oscuro.',
    bg: '#0a0802',
    card: '#141005',
    accent: '#f59e0b'
  },
  {
    id: 'dracula',
    name: 'Dracula Dark',
    desc: 'Gótico elegante con tonos púrpura y magenta vampírico.',
    bg: '#21222c',
    card: '#282a36',
    accent: '#bd93f9'
  }
];

export const EMOJI_AVATARS = ['🛡️', '⚡', '💻', '🚀', '🦾', '🧠', '🎯', '🌌', '🕹️', '⚔️', '🦅', '🔥'];

export const BILLING_LINKS = [
  { name: 'Google AI Studio', url: 'https://aistudio.google.com/', desc: 'Gemini API & Cuotas' },
  { name: 'Anthropic Console', url: 'https://console.anthropic.com/', desc: 'Claude API & Facturación' },
  { name: 'OpenAI Platform', url: 'https://platform.openai.com/usage', desc: 'GPT-4o & Consumo' },
  { name: 'OpenRouter Credits', url: 'https://openrouter.ai/credits', desc: 'Balance Multi-Proveedor' },
  { name: 'DeepSeek Platform', url: 'https://platform.deepseek.com/', desc: 'DeepSeek-V3 / R1 Cuotas' }
];

export const MASTER_SHORTCUTS = [
  { key: 'Alt + 1..8', desc: 'Navegación instantánea entre pestañas de Aegis' },
  { key: 'Ctrl + K', desc: 'Abrir Paleta de Comandos Omnibar & Buscador' },
  { key: 'Ctrl + O', desc: 'Alternar vista de pensamiento y herramientas del Agente' },
  { key: 'Ctrl + B', desc: 'Alternar panel lateral de carpetas en Bóveda' },
  { key: 'Ctrl + ,', desc: 'Acceso directo a este Centro de Configuración' },
  { key: 'Esc', desc: 'Cerrar modales o búsqueda activa' }
];

export const SECTIONS = [
  { id: 'profile', label: 'Identidad & Perfil', icon: User },
  { id: 'plugins', label: 'Plugins & Módulos', icon: Puzzle },
  { id: 'appearance', label: 'Apariencia & Escala', icon: Palette },
  { id: 'storage', label: 'Rutas & Almacenamiento', icon: HardDrive },
  { id: 'ai', label: 'Motores IA & Presupuesto', icon: Bot },
  { id: 'devops', label: 'Flota Git & DevOps', icon: GitBranch },
  { id: 'notifications', label: 'Notificaciones SO', icon: Bell },
  { id: 'gaming', label: 'Modo Gaming', icon: Gamepad2 }
];

export const UI_SCALE_PRESETS = [
  { label: '90% Compacto', val: 0.9 },
  { label: '100% Estándar', val: 1.0 },
  { label: '110% Cómodo', val: 1.1 },
  { label: '120% Amplio', val: 1.2 }
];

export const RESPONSE_STYLES = [
  { id: 'caveman', title: 'Caveman Full', desc: 'Ultra-comprimido, directo al código o comando, cero relleno.' },
  { id: 'technical', title: 'Técnico Conciso', desc: 'Respuestas precisas con arquitectura y trade-offs técnicos.' },
  { id: 'detailed', title: 'Formativo & Detallado', desc: 'Explicaciones paso a paso, razonamiento y contexto amplio.' }
];

export const NOTIFICATION_DEFINITIONS = [
  {
    id: 'sentinelTempAlert',
    title: 'Alerta Térmica de Centinela (> 85°C)',
    desc: 'Notifica inmediatamente si la CPU alcanza umbrales de sobrecalentamiento o estrangulamiento térmico.'
  },
  {
    id: 'taskDeadlinesAlert',
    title: 'Recordatorio de Tareas Próximas a Vencer',
    desc: 'Avisa sobre compromisos y checkboxes con fecha límite programada para hoy.'
  },
  {
    id: 'financeCutoffsAlert',
    title: 'Recordatorio de Cortes de Tarjetas y Pagos Fijos',
    desc: 'Avisa con 48 horas de antelación sobre fechas de corte quincenales y mensuales.'
  },
  {
    id: 'gitBranchAlerts',
    title: 'Avisos de Divergencia Git (Ahead / Behind)',
    desc: 'Alerta cuando una rama local esté detrás del remoto para evitar conflictos.'
  }
];

export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function applyUiScale(scale) {
  const s = Number(scale) || 1.0;
  document.documentElement.style.zoom = '';
  document.documentElement.style.fontSize = `${16 * s}px`;
  document.documentElement.style.setProperty('--ui-scale', String(s));
}
