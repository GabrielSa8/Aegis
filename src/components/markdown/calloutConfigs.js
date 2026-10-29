import { 
  Quote, 
  Info, 
  Lightbulb, 
  Sparkles, 
  AlertTriangle, 
  AlertOctagon, 
  Bug, 
  CheckCircle2, 
  HelpCircle, 
  ListTree 
} from 'lucide-react';

/**
 * Configuraciones visuales para Callouts / Admonitions de Obsidian
 */
export const CALLOUT_CONFIGS = {
  quote: {
    title: 'CITA',
    color: '#c084fc',
    bg: 'rgba(168, 85, 247, 0.08)',
    border: 'rgba(168, 85, 247, 0.35)',
    icon: Quote
  },
  cite: {
    title: 'CITA',
    color: '#c084fc',
    bg: 'rgba(168, 85, 247, 0.08)',
    border: 'rgba(168, 85, 247, 0.35)',
    icon: Quote
  },
  note: {
    title: 'NOTA',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.08)',
    border: 'rgba(56, 189, 248, 0.35)',
    icon: Info
  },
  info: {
    title: 'INFORMACIÓN',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.08)',
    border: 'rgba(56, 189, 248, 0.35)',
    icon: Info
  },
  todo: {
    title: 'TODO',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.08)',
    border: 'rgba(56, 189, 248, 0.35)',
    icon: Info
  },
  tip: {
    title: 'CONSEJO',
    color: '#34d399',
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.35)',
    icon: Lightbulb
  },
  hint: {
    title: 'PISTA',
    color: '#34d399',
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.35)',
    icon: Lightbulb
  },
  important: {
    title: 'IMPORTANTE',
    color: 'var(--primary)',
    bg: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.4)',
    icon: Sparkles
  },
  warning: {
    title: 'ADVERTENCIA',
    color: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.08)',
    border: 'rgba(251, 191, 36, 0.35)',
    icon: AlertTriangle
  },
  caution: {
    title: 'PRECAUCIÓN',
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.08)',
    border: 'rgba(249, 115, 22, 0.35)',
    icon: AlertTriangle
  },
  attention: {
    title: 'ATENCIÓN',
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.08)',
    border: 'rgba(249, 115, 22, 0.35)',
    icon: AlertTriangle
  },
  danger: {
    title: 'PELIGRO',
    color: '#f87171',
    bg: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(239, 68, 68, 0.35)',
    icon: AlertOctagon
  },
  error: {
    title: 'ERROR',
    color: '#f87171',
    bg: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(239, 68, 68, 0.35)',
    icon: AlertOctagon
  },
  failure: {
    title: 'FALLO',
    color: '#f87171',
    bg: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(239, 68, 68, 0.35)',
    icon: AlertOctagon
  },
  bug: {
    title: 'BUG',
    color: '#f43f5e',
    bg: 'rgba(244, 63, 94, 0.08)',
    border: 'rgba(244, 63, 94, 0.35)',
    icon: Bug
  },
  success: {
    title: 'ÉXITO',
    color: '#34d399',
    bg: 'rgba(52, 211, 153, 0.08)',
    border: 'rgba(52, 211, 153, 0.35)',
    icon: CheckCircle2
  },
  check: {
    title: 'VERIFICADO',
    color: '#34d399',
    bg: 'rgba(52, 211, 153, 0.08)',
    border: 'rgba(52, 211, 153, 0.35)',
    icon: CheckCircle2
  },
  done: {
    title: 'COMPLETADO',
    color: '#34d399',
    bg: 'rgba(52, 211, 153, 0.08)',
    border: 'rgba(52, 211, 153, 0.35)',
    icon: CheckCircle2
  },
  question: {
    title: 'PREGUNTA',
    color: '#60a5fa',
    bg: 'rgba(96, 165, 250, 0.08)',
    border: 'rgba(96, 165, 250, 0.35)',
    icon: HelpCircle
  },
  help: {
    title: 'AYUDA',
    color: '#60a5fa',
    bg: 'rgba(96, 165, 250, 0.08)',
    border: 'rgba(96, 165, 250, 0.35)',
    icon: HelpCircle
  },
  faq: {
    title: 'FAQ',
    color: '#60a5fa',
    bg: 'rgba(96, 165, 250, 0.08)',
    border: 'rgba(96, 165, 250, 0.35)',
    icon: HelpCircle
  },
  example: {
    title: 'EJEMPLO',
    color: '#c084fc',
    bg: 'rgba(192, 132, 252, 0.08)',
    border: 'rgba(192, 132, 252, 0.35)',
    icon: ListTree
  }
};
