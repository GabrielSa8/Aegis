import { 
  Bot, 
  PiggyBank, 
  BookOpen, 
  GitBranch, 
  CheckSquare, 
  Activity, 
  Gamepad2
} from 'lucide-react';

export default function CommandDock({ activeTab, onSelectTab }) {
  const dockItems = [
    { id: 'agent', label: 'Agente Copilot', icon: Bot, shortcut: '1' },
    { id: 'finances', label: 'Finanzas', icon: PiggyBank, shortcut: '2' },
    { id: 'vault', label: 'Bóveda IA', icon: BookOpen, shortcut: '3' },
    { id: 'devops', label: 'Radar DevOps', icon: GitBranch, shortcut: '4' },
    { id: 'tasks', label: 'Agenda & Tareas', icon: CheckSquare, shortcut: '5' },
    { id: 'sentinel', label: 'Centinela N150', icon: Activity, shortcut: '6' },
    { id: 'leisure', label: 'Ocio & D&D', icon: Gamepad2, shortcut: '7' }
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      background: 'rgba(22, 26, 25, 0.95)',
      backdropFilter: 'blur(12px)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      padding: '5px 8px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      boxShadow: '0 12px 32px -8px rgba(0, 0, 0, 0.6)'
    }}>
      {dockItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            title={`${item.label} (Alt + ${item.shortcut})`}
            style={{
              position: 'relative',
              background: isActive ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
              border: isActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              color: isActive ? 'var(--text-high)' : 'var(--text-muted)',
              transition: 'var(--transition)',
              fontFamily: 'inherit'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon size={16} color={isActive ? '#10b981' : '#788882'} />
              <span style={{ fontSize: '0.75rem', fontWeight: isActive ? 600 : 500 }}>
                {item.label}
              </span>
            </div>

            {/* Micro-LED activo */}
            {isActive && (
              <div style={{
                position: 'absolute',
                bottom: '2px',
                width: '16px',
                height: '2px',
                borderRadius: '1px',
                background: '#10b981',
                boxShadow: '0 0 6px #10b981'
              }} />
            )}
          </button>
        );
      })}

      {/* Separator & Hint */}
      <div style={{ width: '1px', height: '22px', background: 'var(--border-color)', margin: '0 4px' }} />
      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', padding: '0 4px', fontFamily: 'var(--font-mono)' }}>
        Alt+1..7
      </span>
    </div>
  );
}
