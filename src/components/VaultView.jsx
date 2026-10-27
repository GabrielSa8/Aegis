import { useState } from 'react';
import { BookOpen, Folder, GitBranch, Shield, Search, FileText, CheckCircle2 } from 'lucide-react';

export default function VaultView() {
  const [searchTerm, setSearchTerm] = useState('');

  const hubs = [
    {
      id: '00',
      code: '00 Sistema',
      title: 'Sistema y Cerebro IA',
      desc: 'Perfil, especificaciones N150, Bitácora de proyectos y protocolo del agente.',
      icon: Shield,
      color: '#10b981',
      notes: ['Perfil_Gabriel.md', 'Stack_y_Entorno.md', 'Bitacora_Proyectos.md', 'Protocolo_Agente.md']
    },
    {
      id: '01',
      code: '01 Operaciones MELI',
      title: 'Operaciones Mercado Libre',
      desc: 'Procesos de última milla, ambulancias, layout, etiquetado y manuales.',
      icon: Folder,
      color: '#d97706',
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
      color: '#8b5cf6',
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem', overflowY: 'auto' }}>
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.85rem 1.25rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-high)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <BookOpen color="#10b981" size={18} />
            Bóveda de Conocimiento (BrainIA)
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
            Ruta local: <code style={{ color: 'var(--text-high)' }}>/home/zabrielsa/Documentos/Obsidian Vault/</code>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '5px 10px', borderRadius: 'var(--radius-md)', fontSize: '0.7rem', color: '#34d399', fontWeight: 600 }}>
          <CheckCircle2 size={13} />
          <span>Sincronizada con GitHub (main)</span>
        </div>
      </div>

      {/* Search Input */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '0.5rem 0.85rem'
      }}>
        <Search size={15} color="var(--text-muted)" />
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
            color: 'var(--text-high)',
            fontSize: '0.8rem',
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* 5 Hubs Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '0.75rem'
      }}>
        {filteredHubs.map((hub) => {
          const Icon = hub.icon;
          return (
            <div
              key={hub.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.75rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: hub.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {hub.code}
                  </span>
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
                    <Icon size={14} color={hub.color} />
                  </div>
                </div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-high)', margin: '0 0 4px 0' }}>
                  {hub.title}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                  {hub.desc}
                </p>
              </div>

              {/* Note Chips */}
              <div>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Notas Clave:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {hub.notes.map((note, nIdx) => (
                    <span
                      key={nIdx}
                      style={{
                        fontSize: '0.68rem',
                        padding: '2px 6px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-high)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <FileText size={10} color="var(--text-muted)" />
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
