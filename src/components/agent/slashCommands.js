import {
  SUBSCRIPTION_MODELS,
  PROVIDER_MODELS,
  getModelsForProvider,
  resolveModelByQuery
} from './slashCommandFormatters';

export { SUBSCRIPTION_MODELS, PROVIDER_MODELS, getModelsForProvider, resolveModelByQuery };

export const COMMON_SYSTEM_COMMANDS = [
  {
    id: 'clear',
    command: '/clear',
    label: 'Vaciar Pantalla',
    desc: 'Limpia los mensajes visuales del chat en la sesión actual',
    icon: 'Trash2',
    category: 'Sesión'
  },
  {
    id: 'clip',
    command: '/clip',
    label: 'Pegar Portapapeles',
    desc: 'Pega el texto del portapapeles directamente en el prompt',
    icon: 'ClipboardPaste',
    category: 'Entrada'
  },
  {
    id: 'diff',
    command: '/diff',
    label: 'Inyectar Git Diff',
    desc: 'Inserta los cambios recientes sin confirmar del workspace',
    icon: 'GitCompare',
    category: 'Código'
  }
];

export const PROVIDER_COMMANDS = {
  agy: [
    {
      id: 'usage',
      command: '/usage',
      label: 'Cuota Real del Proveedor',
      desc: 'Consulta límites reales de 5h y semanal directamente de tu cuenta',
      icon: 'Activity',
      category: 'Proveedor'
    },
    {
      id: 'compact',
      command: '/compact',
      label: 'Compactar Contexto',
      desc: 'Comprime el historial de la conversación y libera tokens en el motor',
      icon: 'Minimize2',
      category: 'Contexto'
    },
    {
      id: 'credits',
      command: '/credits',
      label: 'Saldo y Créditos',
      desc: 'Consulta los créditos disponibles en tu cuenta del proveedor',
      icon: 'Coins',
      category: 'Proveedor'
    },
    {
      id: 'model',
      command: '/model',
      label: 'Modelo del Motor',
      desc: 'Inspecciona el modelo activo y catálogo de la suscripción',
      icon: 'Zap',
      category: 'Motor'
    },
    {
      id: 'intensity-low',
      command: '/intensity low',
      label: 'Intensidad: Low',
      desc: 'Ajusta el nivel de razonamiento del modelo activo a Low',
      icon: 'Brain',
      category: 'Motor'
    },
    {
      id: 'intensity-mid',
      command: '/intensity mid',
      label: 'Intensidad: Mid',
      desc: 'Ajusta el nivel de razonamiento del modelo activo a Mid',
      icon: 'Brain',
      category: 'Motor'
    },
    {
      id: 'intensity-high',
      command: '/intensity high',
      label: 'Intensidad: High',
      desc: 'Ajusta el nivel de razonamiento del modelo activo a High',
      icon: 'Brain',
      category: 'Motor'
    },
    {
      id: 'model-claude',
      command: '/model claude',
      label: 'Modelo: Claude Sonnet 5.5',
      desc: 'Conmutar a Claude Sonnet 5.5 High (precisión de código y refactor)',
      icon: 'Code',
      category: 'Motor'
    },
    {
      id: 'model-opus',
      command: '/model opus',
      label: 'Modelo: Claude Opus 5.5',
      desc: 'Conmutar a Claude Opus 5.5 High (máxima capacidad cognitiva)',
      icon: 'Sparkles',
      category: 'Motor'
    },
    {
      id: 'model-argon',
      command: '/model argon',
      label: 'Modelo: Gemini 4 Argon',
      desc: 'Conmutar a Gemini 4 Argon High (razonamiento profundo)',
      icon: 'Brain',
      category: 'Motor'
    },
    {
      id: 'model-flash',
      command: '/model flash',
      label: 'Modelo: Gemini 3.8 Flash',
      desc: 'Conmutar a Gemini 3.8 Flash High (velocidad ultrarrápida)',
      icon: 'Zap',
      category: 'Motor'
    },
    {
      id: 'model-gpt',
      command: '/model gpt',
      label: 'Modelo: GPT-OSS 120B',
      desc: 'Conmutar a GPT-OSS 120B Medium (open-weights)',
      icon: 'Cpu',
      category: 'Motor'
    },
    {
      id: 'skills',
      command: '/skills',
      label: 'Skills del Agente',
      desc: 'Consulta el catálogo de herramientas y skills cargadas en el agente',
      icon: 'Sparkles',
      category: 'Agente'
    }
  ],
  claude: [
    {
      id: 'compact',
      command: '/compact',
      label: 'Compactar Contexto',
      desc: 'Comprime el historial en Claude Code y libera ventana de tokens',
      icon: 'Minimize2',
      category: 'Contexto'
    },
    {
      id: 'model',
      command: '/model',
      label: 'Modelo del Motor',
      desc: 'Inspecciona o alterna el modelo activo en Claude Code',
      icon: 'Zap',
      category: 'Motor'
    },
    {
      id: 'model-sonnet',
      command: '/model sonnet',
      label: 'Modelo: Claude 3.5 Sonnet',
      desc: 'Conmutar a Claude 3.5 Sonnet (desarrollo y refactorización)',
      icon: 'Code',
      category: 'Motor'
    },
    {
      id: 'model-opus',
      command: '/model opus',
      label: 'Modelo: Claude 3 Opus',
      desc: 'Conmutar a Claude 3 Opus (máxima capacidad conceptual)',
      icon: 'Sparkles',
      category: 'Motor'
    },
    {
      id: 'model-haiku',
      command: '/model haiku',
      label: 'Modelo: Claude 3.5 Haiku',
      desc: 'Conmutar a Claude 3.5 Haiku (velocidad y baja latencia)',
      icon: 'Zap',
      category: 'Motor'
    },
    {
      id: 'cost',
      command: '/cost',
      label: 'Costo de Sesión',
      desc: 'Consulta el gasto acumulado en USD en la sesión de Claude Code',
      icon: 'Coins',
      category: 'Proveedor'
    }
  ],
  ollama: [
    {
      id: 'compact',
      command: '/compact',
      label: 'Compactar Contexto',
      desc: 'Limpia la ventana de contexto del modelo local',
      icon: 'Minimize2',
      category: 'Contexto'
    },
    {
      id: 'model',
      command: '/model',
      label: 'Modelo del Motor',
      desc: 'Inspecciona o conmuta el modelo local de Ollama',
      icon: 'Cpu',
      category: 'Motor'
    }
  ],
  custom: [
    {
      id: 'compact',
      command: '/compact',
      label: 'Compactar Contexto',
      desc: 'Comprime el historial de la conversación',
      icon: 'Minimize2',
      category: 'Contexto'
    }
  ]
};

// Retrocompatibilidad
export const SLASH_COMMANDS = [...PROVIDER_COMMANDS.agy, ...COMMON_SYSTEM_COMMANDS];

/**
 * Obtiene el catálogo de comandos según el proveedor activo
 */
export function getSlashCommandsForProvider(agentType = 'agy') {
  const providerCmds = PROVIDER_COMMANDS[agentType] || PROVIDER_COMMANDS.agy;
  return [...providerCmds, ...COMMON_SYSTEM_COMMANDS];
}

/**
 * Filtra los slash commands según el texto ingresado tras '/' y el proveedor activo
 * @param {string} query Texto tras el slash
 * @param {string} agentType Proveedor configurado ('agy' | 'claude' | 'ollama' | 'custom')
 * @returns {Array} Comandos filtrados
 */
export function filterSlashCommands(query, agentType = 'agy') {
  const commands = getSlashCommandsForProvider(agentType);
  const clean = (query || '').replace(/^\//, '').trim().toLowerCase();
  if (!clean) return commands;
  return commands.filter((cmd) => {
    const cleanCmd = cmd.command.replace(/^\//, '').toLowerCase();
    return (
      cleanCmd.startsWith(clean) ||
      cleanCmd.includes(clean) ||
      cmd.id.toLowerCase().startsWith(clean) ||
      cmd.label.toLowerCase().includes(clean)
    );
  });
}
