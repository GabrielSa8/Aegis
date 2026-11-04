import { Sliders, Bell, DollarSign, CheckSquare, Bot, Folder } from 'lucide-react';

export default function GatewayPermissionsCard({
  gatewayConfig,
  onUpdateConfig
}) {
  const gw = gatewayConfig || {};

  const toggles = [
    {
      key: 'notifyOnStart',
      label: 'Notificar al Iniciar Gateway',
      desc: 'Envía un mensaje de saludo a Telegram cuando Aegis arranca en el host.',
      icon: Bell,
      val: gw.notifyOnStart ?? true
    },
    {
      key: 'allowExpenses',
      label: 'Permitir Registro de Gastos (/gasto)',
      desc: 'Inserta transacciones directamente en la base SQLite de finanzas.',
      icon: DollarSign,
      val: gw.allowExpenses ?? true
    },
    {
      key: 'allowTasks',
      label: 'Permitir Apuntar Tareas (/tarea)',
      desc: 'Agrega líneas formateadas con fecha al archivo Inbox de tu Bóveda.',
      icon: CheckSquare,
      val: gw.allowTasks ?? true
    },
    {
      key: 'allowAiQueries',
      label: 'Permitir Consultas de IA (/ai)',
      desc: 'Ejecuta prompts headless ultrarrápidos con el motor activo.',
      icon: Bot,
      val: gw.allowAiQueries ?? true
    }
  ];

  return (
    <div style={{
      padding: '1.25rem',
      borderRadius: 'var(--radius-md)',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Sliders size={16} color="var(--primary)" />
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-high)' }}>
          Políticas de Operación & Destinos
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
        {toggles.map((t) => {
          const Icon = t.icon;
          return (
            <label
              key={t.key}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(0,0,0,0.1)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer'
              }}
            >
              <input
                type="checkbox"
                checked={t.val}
                onChange={(e) => onUpdateConfig({ [t.key]: e.target.checked })}
                style={{ marginTop: '0.2rem', accentColor: 'var(--primary)' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-high)' }}>
                  <Icon size={13} color="var(--primary)" />
                  <span>{t.label}</span>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  {t.desc}
                </div>
              </div>
            </label>
          );
        })}
      </div>

      <div style={{
        padding: '0.75rem',
        borderRadius: 'var(--radius-sm)',
        background: 'rgba(0,0,0,0.1)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-high)' }}>
          <Folder size={13} color="var(--primary)" />
          <span>Archivo Inbox de Tareas en Bóveda</span>
        </div>
        <input
          type="text"
          value={gw.inboxFile || '00 Sistema/Inbox.md'}
          onChange={(e) => onUpdateConfig({ inboxFile: e.target.value })}
          placeholder="00 Sistema/Inbox.md"
          style={{
            width: '100%',
            padding: '0.45rem 0.65rem',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-high)',
            fontSize: '0.74rem',
            fontFamily: 'monospace'
          }}
        />
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          Ruta relativa dentro de tu Bóveda de Obsidian donde se anexarán las tareas recibidas de Telegram.
        </span>
      </div>
    </div>
  );
}
