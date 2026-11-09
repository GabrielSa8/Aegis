import { Database, Key, Shield, Minimize2 } from 'lucide-react';

export default function EncryptionPoliciesCard({ status, onTogglePolicy, disabled }) {
  return (
    <div
      style={{
        background: 'color-mix(in srgb, var(--bg-card) 95%, black)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md, 12px)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        opacity: disabled ? 0.6 : 1,
        pointerEvents: disabled ? 'none' : 'auto'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Shield size={18} style={{ color: 'var(--primary)' }} />
        <h4 style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-high)' }}>
          Políticas de Cifrado en Reposo
        </h4>
      </div>

      {/* Switch 1: Cifrado de Credenciales */}
      <div
        className="settings-policy-row"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 14px',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-color)',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Key size={16} style={{ color: 'var(--primary)' }} />
          <div>
            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-high)' }}>
              Cifrar Tokens API y Credenciales
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Protege el token de Telegram y llaves de proveedores con AES-256-GCM derivado de tu contraseña.
            </div>
          </div>
        </div>
        <label className="tactical-switch">
          <input
            type="checkbox"
            checked={!!status?.encryptCredentials}
            onChange={(e) => onTogglePolicy('encryptCredentials', e.target.checked)}
          />
        </label>
      </div>

      {/* Switch 2: Cifrado de Base de Datos SQLite */}
      <div
        className="settings-policy-row"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 14px',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-color)',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Database size={16} style={{ color: 'var(--primary)' }} />
          <div>
            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-high)' }}>
              Cifrar Base de Datos SQLite en Reposo (`aegis_lifeos.db`)
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Al bloquear o cerrar Aegis, la base de datos se cifra atómicamente con AES-256 y se purga el archivo en claro.
            </div>
          </div>
        </div>
        <label className="tactical-switch">
          <input
            type="checkbox"
            checked={!!status?.encryptDatabase}
            onChange={(e) => onTogglePolicy('encryptDatabase', e.target.checked)}
          />
        </label>
      </div>

      {/* Switch 3: Bloqueo al Minimizar a Bandeja */}
      <div
        className="settings-policy-row"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 14px',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-color)',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Minimize2 size={16} style={{ color: 'var(--text-muted)' }} />
          <div>
            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-high)' }}>
              Bloquear al Ocultar / Minimizar a la Bandeja
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Requiere ingresar la Contraseña Maestra cada vez que se restaura la ventana desde el System Tray.
            </div>
          </div>
        </div>
        <label className="tactical-switch">
          <input
            type="checkbox"
            checked={!!status?.lockOnTrayMinimize}
            onChange={(e) => onTogglePolicy('lockOnTrayMinimize', e.target.checked)}
          />
        </label>
      </div>
    </div>
  );
}
