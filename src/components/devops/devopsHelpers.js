/**
 * devopsHelpers.js — Funciones puras, taxonomía y formatters para telemetría DevOps.
 * Respeta la Doctrina Aegis: cero hardcode, diseño modular y portable.
 */

export const SKILL_CATEGORIES = [
  { id: 'all', label: 'Todas' },
  { id: 'cloud', label: 'Cloud & Backend' },
  { id: 'frontend', label: 'Frontend & UI' },
  { id: 'diagrams', label: 'Diagramas' },
  { id: 'caveman', label: 'Caveman & Ahorro' },
  { id: 'quality', label: 'Testing & Calidad' },
  { id: 'learning', label: 'Aprendizaje & PKM' },
  { id: 'meta', label: 'Meta-Skills' }
];

/**
 * Clasifica heurísticamente una habilidad según su nombre y descripción.
 */
export function getSkillCategory(skill) {
  const id = (skill.id || skill.name || '').toLowerCase();
  const desc = (skill.description || '').toLowerCase();
  const text = `${id} ${desc}`;

  if (text.includes('caveman') || text.includes('ponytail') || text.includes('input-filter') || text.includes('compress') || text.includes('cavecrew')) {
    return 'caveman';
  }
  if (text.includes('cloud') || text.includes('aws') || text.includes('tadu') || text.includes('sam') || text.includes('backend') || text.includes('sdk') || text.includes('shell') || text.includes('loop')) {
    return 'cloud';
  }
  if (text.includes('frontend') || text.includes('react') || text.includes('ui') || text.includes('compose') || text.includes('impeccable') || text.includes('canvas') || text.includes('statusline')) {
    return 'frontend';
  }
  if (text.includes('diagram') || text.includes('mermaid') || text.includes('drawio') || text.includes('architecture') || text.includes('axonometric')) {
    return 'diagrams';
  }
  if (text.includes('tdd') || text.includes('test') || text.includes('clean-code') || text.includes('security') || text.includes('babysit') || text.includes('split-to-prs')) {
    return 'quality';
  }
  if (text.includes('obsidian') || text.includes('vault') || text.includes('feynman') || text.includes('spaced-repetition') || text.includes('cortex')) {
    return 'learning';
  }
  return 'meta';
}

/**
 * Paquetes de Modpacks iniciales universales y soberanos.
 */
export const DEFAULT_MODPACKS = [
  {
    id: 'pack_fullstack_cloud',
    name: 'Fullstack Cloud & TADÚ',
    description: 'Ingeniería backend SAM/DynamoDB, clean code y pruebas TDD.',
    category: 'cloud',
    enabled: true,
    skills: ['tadu-backend', 'clean-code-security', 'tdd-practitioner', 'ponytail', 'superpowers'],
    disabledSubSkills: []
  },
  {
    id: 'pack_frontend_impeccable',
    name: 'Impeccable UI & Design',
    description: 'Diseño visual de alta jerarquía, React TS optimizado y canvas interactivo.',
    category: 'frontend',
    enabled: false,
    skills: ['frontend-design', 'impeccable', 'react-ts-performance', 'canvas', 'diagram-design'],
    disabledSubSkills: []
  },
  {
    id: 'pack_caveman_ultrasaver',
    name: 'Caveman Max Token Saver',
    description: 'Máximo recorte de ruido y tokens mediante comunicación caveman y pruning quirúrgico.',
    category: 'caveman',
    enabled: true,
    skills: ['caveman', 'input-filter-optimization', 'ponytail', 'caveman-commit', 'cavecrew'],
    disabledSubSkills: []
  },
  {
    id: 'pack_mobile_android',
    name: 'Android Soberano (Granja)',
    description: 'Kotlin moderno, Jetpack Compose, audio SoundPool y arquitectura limpia.',
    category: 'frontend',
    enabled: false,
    skills: ['jetpack-compose-patterns', 'clean-code-security', 'tdd-practitioner'],
    disabledSubSkills: []
  },
  {
    id: 'pack_second_brain',
    name: 'Segundo Cerebro & PKM',
    description: 'Arquitectura de bóvedas Obsidian, tarjetas de memoria y técnica Feynman.',
    category: 'learning',
    enabled: false,
    skills: ['obsidian-vault-architect', 'spaced-repetition-generator', 'feynman-technique-mentor'],
    disabledSubSkills: []
  }
];

const MODPACKS_STORAGE_KEY = 'aegis_skills_modpacks_v1';

export function loadStoredModpacks() {
  try {
    const raw = localStorage.getItem(MODPACKS_STORAGE_KEY);
    if (!raw) return DEFAULT_MODPACKS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_MODPACKS;
  } catch (e) {
    return DEFAULT_MODPACKS;
  }
}

export function saveStoredModpacks(modpacks) {
  try {
    localStorage.setItem(MODPACKS_STORAGE_KEY, JSON.stringify(modpacks));
  } catch (e) {
    console.error('Error guardando modpacks:', e);
  }
}

/**
 * Retorna estilos y configuración visual según el código de estado de Git.
 */
export function getStatusBadgeConfig(status) {
  if (status === '??') {
    return { color: 'var(--warning, #fb923c)', bg: 'color-mix(in srgb, var(--warning) 15%, transparent)', label: 'Untracked' };
  }
  if (status.includes('M')) {
    return { color: 'var(--warning, #fbbf24)', bg: 'color-mix(in srgb, var(--warning) 15%, transparent)', label: 'Modified' };
  }
  if (status.includes('A')) {
    return { color: 'var(--success, #34d399)', bg: 'color-mix(in srgb, var(--success) 15%, transparent)', label: 'Added' };
  }
  if (status.includes('D')) {
    return { color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', label: 'Deleted' };
  }
  return { color: 'var(--text-muted)', bg: 'rgba(255, 255, 255, 0.05)', label: status };
}

/**
 * Retorna color y fondo para una línea de git diff unificado.
 */
export function getDiffLineStyle(line) {
  if (line.startsWith('+') && !line.startsWith('+++')) {
    return {
      color: 'var(--success, #34d399)',
      bg: 'color-mix(in srgb, var(--success) 12%, transparent)'
    };
  }
  if (line.startsWith('-') && !line.startsWith('---')) {
    return {
      color: '#f87171',
      bg: 'rgba(239, 68, 68, 0.12)'
    };
  }
  if (line.startsWith('@@')) {
    return {
      color: 'var(--accent, #38bdf8)',
      bg: 'color-mix(in srgb, var(--accent) 10%, transparent)'
    };
  }
  if (line.startsWith('diff --git') || line.startsWith('index ')) {
    return {
      color: 'var(--secondary, #c084fc)',
      bg: 'color-mix(in srgb, var(--secondary) 8%, transparent)'
    };
  }
  return {
    color: 'var(--text-muted)',
    bg: 'transparent'
  };
}
