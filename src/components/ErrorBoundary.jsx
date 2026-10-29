import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { TacticalButton } from './ui/TacticalButton';

/**
 * ErrorBoundary — Cortafuegos táctico de excepciones en vistas de Aegis.
 * Previene pantallas negras y caídas globales de la aplicación si una vista lanza una excepción.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[ErrorBoundary:${this.props.name || 'View'}]`, error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            background: 'rgba(15, 18, 17, 0.95)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 'var(--radius-lg, 8px)',
            margin: '1rem',
            textAlign: 'center',
            gap: '1rem',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1.5px solid rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <AlertTriangle size={22} color="#f87171" />
          </div>

          <div>
            <h3
              style={{
                margin: '0 0 6px 0',
                fontSize: '1rem',
                fontWeight: 800,
                color: '#f87171',
                fontFamily: 'var(--font-mono, monospace)',
                letterSpacing: '0.04em'
              }}
            >
              Excepción en {this.props.name || 'Componente'}
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: '0.78rem',
                color: 'var(--text-muted, #94a3b8)',
                maxWidth: '480px'
              }}
            >
              Se capturó un fallo inesperado durante la ejecución. El resto del sistema Aegis permanece operativo.
            </p>
          </div>

          {this.state.error && (
            <pre
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                padding: '0.75rem 1rem',
                fontSize: '0.72rem',
                color: '#fca5a5',
                fontFamily: 'monospace',
                maxWidth: '650px',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                textAlign: 'left'
              }}
            >
              {this.state.error.toString()}
            </pre>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TacticalButton
              variant="terminal"
              size="sm"
              icon={RefreshCw}
              onClick={this.handleReset}
            >
              Reintentar Vista
            </TacticalButton>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;