import React from 'react';
import {
  ChevronUp,
  ChevronDown,
  Link as LinkIcon,
  ExternalLink,
  Share2,
  RefreshCw,
  Maximize2,
  Minimize2
} from 'lucide-react';
import VaultMicroGraph from './VaultMicroGraph';
import VaultBacklinksList from './VaultBacklinksList';
import VaultOutgoingList from './VaultOutgoingList';

/**
 * VaultBacklinksPanel — Panel retráctil inferior al pie del editor
 * para inspección de enlaces entrantes (backlinks), salientes y micro-grafo,
 * con soporte para modo expandido / maximizado a pantalla completa.
 */
export function VaultBacklinksPanel({ networkState, onNavigateNote }) {
  const {
    network,
    loading,
    isExpanded,
    toggleExpanded,
    isMaximized,
    toggleMaximized,
    activeTab,
    setActiveTab,
    degreeFilter,
    setDegreeFilter,
    incomingCount,
    outgoingCount,
    refreshNetwork
  } = networkState;

  if (!network && !loading) return null;

  return (
    <div
      style={
        isMaximized
          ? {
              position: 'absolute',
              inset: 0,
              zIndex: 40,
              background: 'var(--bg-card)',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 'var(--radius-lg)'
            }
          : {
              borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              zIndex: 5
            }
      }
    >
      {/* 🧭 Cabecera Táctica del Panel (34px) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          background: 'rgba(0, 0, 0, 0.18)',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={toggleExpanded}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
              borderRadius: 'var(--radius-xs)'
            }}
            title={isExpanded ? 'Colapsar panel' : 'Desplegar red'}
          >
            {isExpanded && !isMaximized ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>

          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-high)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Share2 size={13} color="var(--primary)" />
            <span>Red de Conocimiento</span>
          </span>

          {/* Badges de Conteo */}
          <div style={{ display: 'flex', gap: '4px', marginLeft: '4px' }}>
            <span
              style={{
                fontSize: '0.64rem',
                padding: '1px 6px',
                borderRadius: 'var(--radius-full)',
                background: incomingCount > 0 ? 'color-mix(in srgb, var(--primary) 15%, transparent)' : 'rgba(255, 255, 255, 0.05)',
                color: incomingCount > 0 ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: 600
              }}
            >
              {incomingCount} {incomingCount === 1 ? 'Backlink' : 'Backlinks'}
            </span>
            <span
              style={{
                fontSize: '0.64rem',
                padding: '1px 6px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-muted)',
                fontWeight: 600
              }}
            >
              {outgoingCount} Salientes
            </span>
          </div>
        </div>

        {/* Pestañas & Acciones */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.3)', padding: '2px', borderRadius: 'var(--radius-sm)', gap: '2px' }}>
            <button
              onClick={() => { setActiveTab('backlinks'); if (!isExpanded) toggleExpanded(); }}
              style={{
                background: activeTab === 'backlinks' && isExpanded ? 'var(--primary)' : 'transparent',
                color: activeTab === 'backlinks' && isExpanded ? 'var(--bg-primary)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: 'var(--radius-xs)',
                padding: '3px 8px',
                fontSize: '0.68rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <LinkIcon size={11} />
              <span>Backlinks</span>
            </button>

            <button
              onClick={() => { setActiveTab('outgoing'); if (!isExpanded) toggleExpanded(); }}
              style={{
                background: activeTab === 'outgoing' && isExpanded ? 'var(--primary)' : 'transparent',
                color: activeTab === 'outgoing' && isExpanded ? 'var(--bg-primary)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: 'var(--radius-xs)',
                padding: '3px 8px',
                fontSize: '0.68rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ExternalLink size={11} />
              <span>Salientes</span>
            </button>

            <button
              onClick={() => { setActiveTab('graph'); if (!isExpanded) toggleExpanded(); }}
              style={{
                background: activeTab === 'graph' && isExpanded ? 'var(--primary)' : 'transparent',
                color: activeTab === 'graph' && isExpanded ? 'var(--bg-primary)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: 'var(--radius-xs)',
                padding: '3px 8px',
                fontSize: '0.68rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Share2 size={11} />
              <span>Micro-Grafo</span>
            </button>
          </div>

          <button
            onClick={refreshNetwork}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: 'var(--radius-xs)'
            }}
            title="Recargar red"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={toggleMaximized}
            style={{
              background: 'transparent',
              border: 'none',
              color: isMaximized ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: 'var(--radius-xs)'
            }}
            title={isMaximized ? 'Restaurar panel' : 'Maximizar lienzo de red'}
          >
            {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* 📖 Cuerpo Retráctil del Panel */}
      {isExpanded && (
        <div
          style={{
            flex: isMaximized ? 1 : 'none',
            height: isMaximized ? 'auto' : '230px',
            minHeight: isMaximized ? 0 : '180px',
            overflowY: 'auto',
            padding: '0.75rem',
            background: 'rgba(0, 0, 0, 0.12)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {activeTab === 'backlinks' && (
            <VaultBacklinksList incoming={network?.incoming} onNavigateNote={onNavigateNote} />
          )}

          {activeTab === 'outgoing' && (
            <VaultOutgoingList outgoing={network?.outgoing} onNavigateNote={onNavigateNote} />
          )}

          {activeTab === 'graph' && (
            <VaultMicroGraph
              network={network}
              degreeFilter={degreeFilter}
              setDegreeFilter={setDegreeFilter}
              onSelectNote={onNavigateNote}
              isMaximized={isMaximized}
              onToggleMaximize={toggleMaximized}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default VaultBacklinksPanel;
