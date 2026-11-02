import { 
  ReceiptText, 
  CalendarClock, 
  Layers
} from 'lucide-react';

export const FINANCES_SUBTABS = [
  { id: 'operations', label: 'Cockpit & Ledger', icon: ReceiptText, keyHint: '1' },
  { id: 'pulse', label: 'Pulso & Calendario', icon: CalendarClock, keyHint: '2' },
  { id: 'structure', label: 'Estructura & Control', icon: Layers, keyHint: '3' }
];
