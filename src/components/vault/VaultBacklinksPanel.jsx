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
      className="vault-backlinks-container"
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
      <div className="vault-backlinks-header">
        <div className="vault-backlinks-left">
          <button
            onClick={toggleExpanded}
            className="vault-backlinks-toggle-btn"
            title={isExpanded ? 'Colapsar panel' : 'Desplegar red'}
          >
            {isExpanded && !isMaximized ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>

          <span className="vault-backlinks-title">
            <Share2 size={13} color="var(--primary)" style={{ flexShrink: 0 }} />
            <span className="vault-backlinks-title-text">Red de Conocimiento</span>
          </span>

          {/* Badges de Conteo */}
          <div className="vault-backlinks-badges">
            <span className={`vault-backlinks-badge ${incomingCount > 0 ? 'is-active' : ''}`}>
              {incomingCount} <span className="vault-backlinks-badge-text">{incomingCount === 1 ? 'Backlink' : 'Backlinks'}</span>
            </span>
            <span className="vault-backlinks-badge">
              {outgoingCount} <span className="vault-backlinks-badge-text">Salientes</span>
            </span>
          </div>
        </div>

        {/* Pestañas & Acciones */}
        <div className="vault-backlinks-right">
          <div className="vault-backlinks-tab-group">
            <button
              onClick={() => { setActiveTab('backlinks'); if (!isExpanded) toggleExpanded(); }}
              className={`vault-backlinks-tab-btn ${activeTab === 'backlinks' && isExpanded ? 'is-active' : ''}`}
              title="Enlaces entrantes (Backlinks)"
            >
              <LinkIcon size={11} />
              <span className="vault-backlinks-tab-label">Backlinks</span>
            </button>

            <button
              onClick={() => { setActiveTab('outgoing'); if (!isExpanded) toggleExpanded(); }}
              className={`vault-backlinks-tab-btn ${activeTab === 'outgoing' && isExpanded ? 'is-active' : ''}`}
              title="Enlaces salientes"
            >
              <ExternalLink size={11} />
              <span className="vault-backlinks-tab-label">Salientes</span>
            </button>

            <button
              onClick={() => { setActiveTab('graph'); if (!isExpanded) toggleExpanded(); }}
              className={`vault-backlinks-tab-btn ${activeTab === 'graph' && isExpanded ? 'is-active' : ''}`}
              title="Micro-Grafo de relaciones"
            >
              <Share2 size={11} />
              <span className="vault-backlinks-tab-label">Micro-Grafo</span>
            </button>
          </div>

          <button
            onClick={refreshNetwork}
            className="vault-sidebar-icon-btn"
            title="Recargar red"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={toggleMaximized}
            className="vault-sidebar-icon-btn"
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
