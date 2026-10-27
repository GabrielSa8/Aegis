import { useState } from 'react';
import { BookOpen, Folder, GitBranch, Shield, Search, ExternalLink, FileText, CheckCircle2 } from 'lucide-react';

export default function VaultView() {
  const [searchTerm, setSearchTerm] = useState('');

  const hubs = [
    {
      id: '00',
      code: '00 Sistema',
      title: 'Sistema y Cerebro IA',
      desc: 'Perfil, especificaciones N150, Bitácora de proyectos y protocolo del agente.',
      icon: Shield,
      color: '#6366f1',
      notes: ['Perfil_Gabriel.md', 'Stack_y_Entorno.md', 'Bitacora_Proyectos.md', 'Protocolo_Agente.md']
    },
    {
      id: '01',
      code: '01 Operaciones MELI',
      title: 'Operaciones Mercado Libre',
      desc: 'Procesos de última milla, ambulancias, layout, etiquetado y manuales.',
      icon: Folder,
      color: '#fbbf24',
      notes: ['MOC - Operaciones Mercado Libre.md', 'SOP_Ambulancias.md', 'Layout_Hub.md']
    },
    {
      id: '02',
      code: '02 Proyectos de Software',
      title: 'Proyectos de Software',
      desc: 'Monorepo TADÚ (SAM/Python), app Granja (Android), Aegis, AegisTrack y Booklet.',
      icon: GitBranch,
      color: '#10b981',
      notes: ['Aegis.md', 'TADU - Plataforma de Movilidad.md', 'Granja - App Android.md', 'AegisTrack.md']
    },
    {
      id: '03',
      code: '03 Personal y Ocio',
      title: 'Personal y Ocio',
      desc: 'Modo Gaming en Intel N150 (GameMode, FSR), D&D 5e (Knol de Piedranegra) y catálogo.',
      icon: Folder,
      color: '#ec4899',
      notes: ['MOC - Personal y Ocio.md', 'Knol_de_Piedranegra.md', 'Gaming_N150.md']
    },
    {
      id: '04',
      code: '04 Estudios y Certs',
      title: 'Estudios y Certificaciones',
      desc: 'Materias universitarias de ingeniería y preparación de certificaciones AWS.',
      icon: BookOpen,
      color: '#06b6d4',
      notes: ['MOC - Estudios y Certificaciones.md', 'AWS_Developer_Associate.md', 'Flashcards_AWS.md']
    }
  ];

  const filteredHubs = hubs.filter(h => 
    h.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.notes.some(n => n.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1.25rem' }}>
      {/* Header & Git Status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem 1.5rem',
        background: 'rgba(17, 24, 39, 0.7)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen color="#6366f1" size={20} />
            Bóveda de Conocimiento (BrainIA)
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '3px 0 0 0' }}>
            Ruta local: <code style={{ color: '#cbd5e1' }}>/home/zabrielsa/Documentos/Obsidian Vault/</code>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>
          <CheckCircle2 size={14} />
          <span>Sincronizada con GitHub (main)</span>
        </div>
      </div>

      {/* Search Input */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'rgba(17, 24, 39, 0.7)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '0.6rem 1rem'
      }}>
        <Search size={16} color="#64748b" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar en los 5 Hubs o notas específicas..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#fff',
            fontSize: '0.85rem'
          }}
        />
      </div>

      {/* 5 Hubs Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1rem',
        overflowY: 'auto'
      }}>
        {filteredHubs.map((hub) => {
          const Icon = hub.icon;
          return (
            <div
              key={hub.id}
              style={{
                background: 'rgba(17, 24, 39, 0.75)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-xl)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: hub.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {hub.code}
                  </span>
                  <div style={{ background: `${hub.color}22`, padding: '6px', borderRadius: '8px' }}>
                    <Icon size={16} color={hub.color} />
                  </div>
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: '0 0 6px 0' }}>
                  {hub.title}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4 }}>
                  {hub.desc}
                </p>
              </div>

              {/* Note Chips */}
              <div>
                <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Notas Clave:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {hub.notes.map((note, nIdx) => (
                    <span
                      key={nIdx}
                      style={{
                        fontSize: '0.7rem',
                        padding: '3px 8px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '6px',
                        color: '#cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <FileText size={11} color="#64748b" />
                      {note}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
