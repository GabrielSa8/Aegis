import { 
  User, 
  Palette, 
  HardDrive, 
  Bot, 
  GitBranch, 
  Bell, 
  Gamepad2,
  Puzzle,
  Radio,
  Send,
  Lock
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
  },
  {
    id: 'catppuccin-mocha',
    name: 'Catppuccin Mocha',
    desc: 'Pasteles suaves sobre lienzo café índigo. Máximo confort visual.',
    bg: '#1e1e2e',
    card: '#252538',
    accent: '#cba6f7'
  },
  {
    id: 'gruvbox-dark',
    name: 'Gruvbox Retro',
    desc: 'Tonalidades tierra cálidas, verde bosque y ocre analógico vintage.',
    bg: '#1d2021',
    card: '#282828',
    accent: '#8ec07c'
  },
  {
    id: 'solarized-dark',
    name: 'Solarized Cyan',
    desc: 'Cian y aguamarina calibrados sobre azul petróleo profundo.',
    bg: '#002b36',
    card: '#073642',
    accent: '#2aa198'
  },
  {
    id: 'synthwave-84',
    name: 'Synthwave \'84',
    desc: 'Neón fucsia y cian eléctrico sobre horizonte púrpura retro-futurista.',
    bg: '#1a162b',
    card: '#241b3d',
    accent: '#ff2a85'
  },
  {
    id: 'matrix-code',
    name: 'Matrix Cyber',
    desc: 'Verde terminal fósforo de alta penetración sobre negro carbón.',
    bg: '#040d07',
    card: '#0a1a0f',
    accent: '#00ff66'
  },
  {
    id: 'nord-frost',
    name: 'Nord Arctic Frost',
    desc: 'Azul hielo polar sobre azul grisáceo boreal. Limpio y minimalista.',
    bg: '#242933',
    card: '#2e3440',
    accent: '#88c0d0'
  },
  {
    id: 'monokai-pro',
    name: 'Monokai Pro',
    desc: 'Amarillo sol cálido y magenta vibrante sobre carbón puro.',
    bg: '#191919',
    card: '#222222',
    accent: '#ffd866'
  }
];

export const AEGIS_VERSION = 'v2.19.6';

export const BILLING_LINKS = [
  { name: 'Google AI Studio', url: 'https://aistudio.google.com/', desc: 'Gemini API & Cuotas' },
  { name: 'Anthropic Console', url: 'https://console.anthropic.com/', desc: 'Claude API & Facturación' },
  { name: 'OpenAI Platform', url: 'https://platform.openai.com/usage', desc: 'GPT-4o & Consumo' },
  { name: 'OpenRouter Credits', url: 'https://openrouter.ai/credits', desc: 'Balance Multi-Proveedor' },
  { name: 'DeepSeek Platform', url: 'https://platform.deepseek.com/', desc: 'DeepSeek-V3 / R1 Cuotas' }
];

export const MASTER_SHORTCUTS = [
  { key: 'Alt + 1..N', desc: 'Navegación instantánea entre pestañas activas de Aegis' },
  { key: 'Ctrl + K', desc: 'Abrir Paleta de Comandos Omnibar & Buscador' },
  { key: 'Ctrl + O', desc: 'Alternar vista de pensamiento y herramientas del Agente' },
  { key: 'Ctrl + B', desc: 'Alternar panel lateral de carpetas en Bóveda' },
  { key: 'Ctrl + ,', desc: 'Acceso directo a este Centro de Configuración' },
  { key: 'Alt + L', desc: 'Bloquear Vault / Cockpit con Contraseña Maestra' },
  { key: 'Esc', desc: 'Cerrar modales o búsqueda activa' }
];

export const MACRO_HUBS = [
  {
    id: 'general',
    label: 'Operador & Entorno',
    icon: User,
    badge: 'Core',
    keywords: 'nombre alias rol estilo caveman ide editor vscode cursor terminal neovim ptyxis git repositorios flota'
  },
  {
    id: 'interface',
    label: 'Interfaz & Pantalla',
    icon: Palette,
    badge: 'UI/UX',
    keywords: 'tema colores oled dracula tokyo zoom escala dpi gamemode gamescope fsr aceleracion graficos notificaciones bandeja tray'
  },
  {
    id: 'ai',
    label: 'Motores IA & Cuotas',
    icon: Bot,
    badge: 'LLM',
    keywords: 'agente agy claude ollama custom fallback tokens presupuesto cuotas facturacion api'
  },
  {
    id: 'system',
    label: 'Sistema, Datos & Red',
    icon: HardDrive,
    badge: 'Host',
    keywords: 'obsidian vault sqlite backup respaldo actualizaciones releases contraseña master password cifrado p2p wifi telegram bot plugins modulos'
  }
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
  },
  {
    id: 'agentCompletionAlert',
    title: 'Finalización de Tareas del Agente (Segundo Plano)',
    desc: 'Notifica en el escritorio cuando el agente termine de razonar o ejecutar si Aegis está minimizado o en otra ventana.'
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
