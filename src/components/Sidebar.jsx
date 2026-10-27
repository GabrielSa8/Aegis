import { 
  Bot, 
  PiggyBank, 
  BookOpen, 
  GitBranch, 
  CheckSquare, 
  Activity, 
  Gamepad2, 
  ShieldCheck, 
  Cpu
} from 'lucide-react';

export default function Sidebar({ activeTab, onSelectTab, coreStatus }) {
  const navItems = [
    { id: 'agent', label: 'Agente Copilot', icon: Bot, badge: 'PTY' },
    { id: 'finances', label: 'Finanzas', icon: PiggyBank },
    { id: 'vault', label: 'Bóveda IA', icon: BookOpen, badge: '5 Hubs' },
    { id: 'devops', label: 'Radar DevOps', icon: GitBranch, badge: '20 Skills' },
    { id: 'tasks', label: 'Agenda & Tareas', icon: CheckSquare },
    { id: 'sentinel', label: 'Centinela N150', icon: Activity },
    { id: 'leisure', label: 'Ocio & D&D', icon: Gamepad2 }
  ];

  return (
    <aside style={{
      width: '240px',
      background: 'var(--bg-card)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '1rem',
      userSelect: 'none',
      flexShrink: 0
    }}>
      {/* Brand Header */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '0.4rem 0.5rem',
          marginBottom: '1.25rem',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            padding: '6px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={20} color="#10b981" />
          </div>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-high)', letterSpacing: '0.02em', margin: 0 }}>
              AEGIS
            </h2>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              Command Cockpit
            </span>
          </div>
        </div>

        {/* Nav Tabs */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                  border: isActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
                  color: isActive ? 'var(--text-high)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  textAlign: 'left',
                  width: '100%',
                  fontFamily: 'inherit'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon size={16} color={isActive ? '#10b981' : '#788882'} />
                  <span style={{ fontSize: '0.8rem', fontWeight: isActive ? 600 : 500 }}>
                    {item.label}
                  </span>
                </div>
                {item.badge && (
                  <span style={{
                    fontSize: '0.6rem',
                    padding: '2px 5px',
                    borderRadius: '3px',
                    background: isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    color: isActive ? '#a7f3d0' : '#788882',
                    fontWeight: 600
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Core Status & Quick Action */}
      <div style={{
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <div style={{
          fontSize: '0.68rem',
          color: '#34d399',
          background: 'rgba(16, 185, 129, 0.06)',
          border: '1px solid rgba(16, 185, 129, 0.15)',
          padding: '5px 8px',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Cpu size={13} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {coreStatus || 'Core Online'}
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          padding: '2px 4px'
        }}>
          <span>Atajo global</span>
          <kbd style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            borderRadius: '3px',
            padding: '1px 4px',
            fontSize: '0.6rem',
            color: 'var(--text-high)'
          }}>Ctrl + K</kbd>
        </div>
      </div>
    </aside>
  );
}
