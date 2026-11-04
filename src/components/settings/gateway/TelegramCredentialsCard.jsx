import { useState } from 'react';
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import TacticalButton from '../../ui/TacticalButton';

export default function TelegramCredentialsCard({
  botTokenInput,
  setBotTokenInput,
  testingToken,
  tokenValidationResult,
  onTestToken,
  onSaveToken
}) {
  const [showToken, setShowToken] = useState(false);

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
        <KeyRound size={16} color="var(--primary)" />
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-high)' }}>
          Credenciales de Telegram Bot API
        </span>
      </div>

      <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
        Crea tu bot privado en Telegram hablando con <strong style={{ color: 'var(--primary)' }}>@BotFather</strong>, copia el HTTP API Token y pégalo abajo. La conexión es 100% directa entre tu equipo y Telegram vía HTTPS saliente.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type={showToken ? 'text' : 'password'}
            value={botTokenInput}
            onChange={(e) => setBotTokenInput(e.target.value)}
            placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz..."
            style={{
              width: '100%',
              padding: '0.55rem 2.25rem 0.55rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-high)',
              fontSize: '0.78rem',
              fontFamily: 'monospace'
            }}
          />
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            style={{
              position: 'absolute',
              right: '0.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
          >
            {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>

        <TacticalButton
          variant="secondary"
          onClick={onTestToken}
          disabled={testingToken || !botTokenInput.trim()}
          icon={testingToken ? Loader2 : CheckCircle2}
        >
          {testingToken ? 'Validando...' : 'Probar'}
        </TacticalButton>

        <TacticalButton
          variant="primary"
          onClick={() => onSaveToken(botTokenInput.trim())}
          disabled={!botTokenInput.trim()}
        >
          Guardar Token
        </TacticalButton>
      </div>

      {tokenValidationResult && (
        <div style={{
          padding: '0.6rem 0.75rem',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.74rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: tokenValidationResult.success
            ? 'color-mix(in srgb, var(--primary) 12%, transparent)'
            : 'color-mix(in srgb, var(--danger) 12%, transparent)',
          border: `1px solid ${tokenValidationResult.success ? 'var(--primary)' : 'var(--danger)'}`,
          color: tokenValidationResult.success ? 'var(--primary)' : 'var(--danger)'
        }}>
          {tokenValidationResult.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          <span>{tokenValidationResult.message}</span>
        </div>
      )}
    </div>
  );
}
