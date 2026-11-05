import { useState, useMemo } from 'react';
import { Sparkles, FolderOpen, Download, Plus, AlertCircle, CheckCircle2, Search, Compass, PackageCheck } from 'lucide-react';
import { useCommunityPlugins } from './useCommunityPlugins';
import CommunityPluginCard from './CommunityPluginCard';
import CatalogPluginCard from './CatalogPluginCard';
import InstallPluginModal from './InstallPluginModal';
import CreatePluginModal from './CreatePluginModal';
import TacticalButton from '../../ui/TacticalButton';
import TacticalBadge from '../../ui/TacticalBadge';

const CATEGORIES = ['Todos', 'Finanzas', 'Utilidades', 'Productividad', 'DevOps', 'Gaming'];

export default function CommunityPluginsDeck() {
  const {
    plugins,
    catalog,
    loading,
    installingPluginId,
    error,
    actionMessage,
    togglePlugin,
    installFromPath,
    installFromUrl,
    installFromCatalog,
    uninstallPlugin,
    createScaffold,
    openFolder
  } = useCommunityPlugins();

  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'installed'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('Todos');
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const installedMap = useMemo(() => {
    const map = {};
    plugins.forEach(p => {
      map[p.manifest.id] = p;
    });
    return map;
  }, [plugins]);

  const filteredCatalog = useMemo(() => {
    return catalog.filter(item => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || 
        item.name.toLowerCase().includes(q) || 
        item.description.toLowerCase().includes(q) ||
        item.author.toLowerCase().includes(q);
      const matchesCat = selectedCat === 'Todos' || item.category === selectedCat;
      return matchesSearch && matchesCat;
    });
  }, [catalog, searchQuery, selectedCat]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* 🧭 Header con Navegación Dual: Catálogo vs Instalados */}
      <div className="settings-plugins-deck-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div className="settings-plugins-tabs-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`settings-plugin-tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              background: activeTab === 'catalog' ? 'var(--primary-glow)' : 'transparent',
              border: activeTab === 'catalog' ? '1px solid var(--primary)' : '1px solid transparent',
              color: activeTab === 'catalog' ? 'var(--text-high)' : 'var(--text-muted)',
              fontSize: '0.74rem',
              fontWeight: activeTab === 'catalog' ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Compass size={13} color={activeTab === 'catalog' ? 'var(--primary)' : 'currentColor'} />
            <span>Catálogo Comunitario ({catalog.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('installed')}
            className={`settings-plugin-tab-btn ${activeTab === 'installed' ? 'active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              background: activeTab === 'installed' ? 'var(--primary-glow)' : 'transparent',
              border: activeTab === 'installed' ? '1px solid var(--primary)' : '1px solid transparent',
              color: activeTab === 'installed' ? 'var(--text-high)' : 'var(--text-muted)',
              fontSize: '0.74rem',
              fontWeight: activeTab === 'installed' ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <PackageCheck size={13} color={activeTab === 'installed' ? 'var(--primary)' : 'currentColor'} />
            <span>Instalados ({plugins.length})</span>
          </button>
        </div>

        <div className="settings-plugins-deck-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <TacticalButton variant="secondary" size="sm" onClick={() => setShowInstallModal(true)} title="Instalar archivo .aegispkg local o URL">
            <Download size={11} style={{ marginRight: '4px' }} />
            Instalar .aegispkg
          </TacticalButton>

          <TacticalButton variant="ghost" size="sm" onClick={() => setShowCreateModal(true)} title="Crear plantilla de plugin en disco">
            <Plus size={11} style={{ marginRight: '4px' }} />
            Plantilla
          </TacticalButton>

          <TacticalButton variant="ghost" size="sm" onClick={openFolder} title="Abrir directorio local en explorador de archivos">
            <FolderOpen size={12} />
          </TacticalButton>
        </div>
      </div>

      {/* Alertas */}
      {actionMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          borderRadius: 'var(--radius-sm)',
          background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
          border: '1px solid var(--primary)',
          color: 'var(--text-high)',
          fontSize: '0.72rem'
        }}>
          <CheckCircle2 size={14} color="var(--primary)" />
          <span>{actionMessage}</span>
        </div>
      )}

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          borderRadius: 'var(--radius-sm)',
          background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
          border: '1px solid var(--danger)',
          color: 'var(--danger)',
          fontSize: '0.72rem'
        }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Vista Catálogo: Buscador + Filtros por Categoría + Grid */}
      {activeTab === 'catalog' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Barra de Filtros */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className={`settings-cat-filter-btn ${selectedCat === cat ? 'active' : ''}`}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: selectedCat === cat ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                    border: '1px solid ' + (selectedCat === cat ? 'var(--primary)' : 'var(--border-color)'),
                    color: selectedCat === cat ? 'var(--bg-main)' : 'var(--text-muted)',
                    fontSize: '0.66rem',
                    fontWeight: selectedCat === cat ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: '200px' }}>
              <Search size={12} color="var(--text-muted)" style={{ position: 'absolute', left: '8px', top: '8px' }} />
              <input
                type="text"
                placeholder="Buscar plugin..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '5px 8px 5px 26px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-high)',
                  fontSize: '0.72rem'
                }}
              />
            </div>
          </div>

          {/* Grid del Catálogo */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.75rem' }}>
            {filteredCatalog.map(item => {
              const installed = installedMap[item.id];
              return (
                <CatalogPluginCard
                  key={item.id}
                  item={item}
                  isInstalled={Boolean(installed)}
                  isEnabled={installed ? installed.isEnabled : false}
                  isInstalling={installingPluginId === item.id}
                  onInstall={installFromCatalog}
                  onToggle={togglePlugin}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Vista Instalados: Lista o Empty State */}
      {activeTab === 'installed' && (
        plugins.length === 0 ? (
          <div style={{
            padding: '2rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
            border: '1px dashed var(--border-color)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <Sparkles size={20} color="var(--primary)" style={{ opacity: 0.6 }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-high)' }}>
              No tienes extensiones comunitarias instaladas
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Explora el <strong>Catálogo Comunitario</strong> para instalar plugins verificados en 1-clic.
            </span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.75rem' }}>
            {plugins.map(p => (
              <CommunityPluginCard
                key={p.manifest.id}
                plugin={p}
                onToggle={togglePlugin}
                onUninstall={uninstallPlugin}
              />
            ))}
          </div>
        )
      )}

      {/* Modales */}
      <InstallPluginModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        onInstallPath={installFromPath}
        onInstallUrl={installFromUrl}
      />

      <CreatePluginModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateScaffold={createScaffold}
      />
    </div>
  );
}
