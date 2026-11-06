export const MODULE_TOURS = {
  agent: {
    id: 'agent',
    title: 'Omnichannel AI Agent',
    badge: 'Alt + 1',
    description: 'Puente nativo PTY y asistente cognitivo para terminales y herramientas de IA.',
    prerequisites: [
      { label: 'Servidor LLM o CLI', status: 'Ollama / agy / Claude Code', required: true },
      { label: 'API Keys', status: 'Opcional (si usas modelos cloud)', required: false }
    ],
    steps: [
      {
        title: 'Los 3 Docks & ¿Qué son los Contextos?',
        desc: 'Navegación espacial del cockpit y aislamiento de entornos para la IA.',
        details: [
          'Dock Superior: Control maestro con Omnibar (Ctrl + K), semáforos Git, Modo Zen (Alt + Z) y Guías [?].',
          'Dock Izquierdo: Barra de pestañas (Alt + 1..8) retráctil al pasar el cursor por el borde izquierdo.',
          'Dock Derecho (Contextos): Cápsulas que aíslan el proyecto en disco, sus skills activas y notas de Obsidian para que la IA no mezcle archivos ni queme tokens.',
          'Al hacer clic en un contexto del dock derecho, el agente enfoca su memoria y operaciones en ese proyecto.'
        ]
      },
      {
        title: 'Terminal Interactiva PTY',
        desc: 'Conexión bidireccional directa con procesos CLI del sistema con soporte ANSI y colores.',
        details: [
          'Ejecución fluida de subagentes sin latencia de navegador.',
          'Soporte completo de interactividad en consola.',
          'Consumo mínimo de memoria (~15MB adicionales).'
        ]
      },
      {
        title: 'Selector Flash vs Profundo',
        desc: 'Controla la profundidad cognitiva y el consumo de tokens según la tarea.',
        details: [
          'Modo Flash: Consultas ultrarrápidas y micro-ediciones directas.',
          'Modo Profundo: Razonamiento multi-paso, planeación y llamada a tools.',
          'Aislamiento dinámico de contexto para reducir hasta 60% de tokens.'
        ]
      },
      {
        title: 'Inyección de Macros Rápidas',
        desc: 'Variables dinámicas que inyectan contexto del portapapeles o del repositorio.',
        details: [
          '{{clip}}: Inyecta el contenido de tu portapapeles en el prompt.',
          '{{diff}}: Inyecta automáticamente los cambios git sin commitear.',
          'Historial de comandos accesible con flechas arriba/abajo.'
        ]
      }
    ],
    proTip: 'Usa Ctrl + K en cualquier momento para invocar la paleta omnibar y cambiar de módulo.'
  },

  finances: {
    id: 'finances',
    title: 'Sovereign Finances & LifeOS',
    badge: 'Alt + 2',
    description: 'Cockpit financiero y timeline multi-dominio 100% offline respaldado por SQLite.',
    prerequisites: [
      { label: 'Base de Datos Local', status: 'SQLite nativa (~/.local/share/aegis/)', required: true }
    ],
    steps: [
      {
        title: 'Cockpit de Burn-Rate',
        desc: 'Monitorea tu velocidad de gasto mensual y límite presupuestario.',
        details: [
          'Límite mensual configurable con barra de progreso reactiva.',
          'Cálculo de presupuesto diario restante según días del mes.',
          'Alertas visuales de sobregiro o gasto acelerado.'
        ]
      },
      {
        title: 'Radar de Vencimientos y Cortes',
        desc: 'Control de fechas críticas de tarjetas y servicios.',
        details: [
          'Tarjetas con alerta a 8 días y 15 días del corte.',
          'Días restantes calculados dinámicamente.',
          'Historial de facturas y compromisos programados.'
        ]
      },
      {
        title: 'Calendario & Master Timeline',
        desc: 'Visualización integral de tus finanzas y compromisos.',
        details: [
          'Puntos de categorías por día para ver picos de consumo.',
          'Timeline que combina sprints de software, materias y finanzas.',
          'Ingreso rápido de transacciones en menos de 3 segundos.'
        ]
      }
    ],
    proTip: 'Haz clic en cualquier día del calendario para desglosar sus transacciones al instante.'
  },

  vault: {
    id: 'vault',
    title: 'Bóveda Obsidian / Second Brain',
    badge: 'Alt + 3',
    description: 'Gestor y editor táctico de notas Markdown directamente sobre tu sistema de archivos.',
    prerequisites: [
      { label: 'Carpeta de Bóveda', status: 'Carpeta con archivos .md', required: true },
      { label: 'Obsidian App', status: 'Opcional (Aegis es 100% autónomo)', required: false }
    ],
    steps: [
      {
        title: 'Árbol Jerárquico & Drag and Drop',
        desc: 'Organiza carpetas y archivos locales con fluidez.',
        details: [
          'Arrastra notas y carpetas para reubicarlas en el disco.',
          'Ctrl + B para abrir o cerrar la barra lateral de archivos.',
          'Modales seguros para renombrar y eliminar sin errores.'
        ]
      },
      {
        title: 'Editor Táctico & Mermaid Diagrams',
        desc: 'Escribe en Markdown con renderizado enriquecido en tiempo real.',
        details: [
          'Soporte completo GitHub Flavored Markdown (tablas, checklists, código).',
          'Renderizado automático de diagramas Mermaid (flowcharts, sequence, state).',
          'Guardado seguro en disco local con atajo Ctrl + S.'
        ]
      },
      {
        title: 'Panel de Red & Micro-grafo',
        desc: 'Descubre conexiones entre tus pensamientos e ideas.',
        details: [
          'Ctrl + M para desplegar el panel de conexiones.',
          'Muestra backlinks entrantes y enlaces salientes ([[nota]]).',
          'Navegación instantánea entre notas vinculadas al hacer clic.'
        ]
      }
    ],
    proTip: 'Puedes configurar tu carpeta de notas en Ajustes > Rutas de Entorno.'
  },

  devops: {
    id: 'devops',
    title: 'DevOps & Git Fleet Radar',
    badge: 'Alt + 4',
    description: 'Radar de flota de repositorios Git, lanzadores de IDE/Terminal y catálogo de skills.',
    prerequisites: [
      { label: 'git CLI', status: 'Instalado en el sistema (git --version)', required: true },
      { label: 'IDE & Terminal', status: 'Configurados en Ajustes (ej. cursor, code)', required: false }
    ],
    steps: [
      {
        title: 'Radar de Repositorios',
        desc: 'Visibilidad en tiempo real de todos tus proyectos de software.',
        details: [
          'Muestra la rama activa de cada repo y si tiene cambios sucios (dirty).',
          'Contadores de commits adelantados/atrasados respecto al remoto.',
          'Filtros por estado para ubicar ramas pendientes de commit.'
        ]
      },
      {
        title: 'Lanzadores Tácticos de IDE y Terminal',
        desc: 'Abre cualquier proyecto en tu entorno preferido con 1 clic.',
        details: [
          'Botón IDE: Abre la carpeta en Cursor, VS Code, Zed o Neovim.',
          'Botón Terminal: Spawnea una consola nativa en la raíz del repo.',
          'Diff Inspector: Revisa archivos modificados sin salir de Aegis.'
        ]
      },
      {
        title: 'Catálogo de Agent Skills',
        desc: 'Directorio dinámico de capacidades de inteligencia artificial instaladas.',
        details: [
          'Inspecciona skills activas en ~/.agents/skills/.',
          'Buscador instantáneo por nombre o funcionalidad.',
          'Visor integrado de especificaciones SKILL.md.'
        ]
      }
    ],
    proTip: 'Configura tus ejecutables de IDE y Terminal en Ajustes para lanzar proyectos al instante.'
  },

  tasks: {
    id: 'tasks',
    title: 'Daily Tasks & Checkbox Engine',
    badge: 'Alt + 5',
    description: 'Extractor global de tareas Markdown en toda la bóveda con marcado atómico.',
    prerequisites: [
      { label: 'Carpeta de Bóveda', status: 'Archivos .md con casillas - [ ]', required: true }
    ],
    steps: [
      {
        title: 'Marcado Atómico en Disco',
        desc: 'Edita físicamente tus archivos Markdown con un solo clic.',
        details: [
          'Hacer clic en una casilla en Aegis modifica el archivo .md al instante.',
          'Cero sincronizaciones diferidas: cambio real en NVMe.',
          'Respeta sangrías, formato y contexto de cada tarea.'
        ]
      },
      {
        title: 'Filtros y Búsqueda por Archivo',
        desc: 'Ubica compromisos específicos entre miles de líneas.',
        details: [
          'Filtra por estado: Solo Pendientes o Solo Completadas.',
          'Agrupación por nota o archivo de origen.',
          'Barra de búsqueda para filtrar tareas por palabras clave.'
        ]
      },
      {
        title: 'Velocímetro de Progreso Diario',
        desc: 'Mide tu avance del día sin fricción cognitiva.',
        details: [
          'Porcentaje de cumplimiento global de tareas.',
          'Historial de tareas completadas recientemente.'
        ]
      }
    ],
    proTip: 'Crea tareas en cualquier nota de tu bóveda usando "- [ ] Mi tarea" y aparecerán aquí.'
  },

  sentinel: {
    id: 'sentinel',
    title: 'Hardware Sentinel & Process Killer',
    badge: 'Alt + 6',
    description: 'Telemetría de hardware en tiempo real sin sobrecarga leyendo directo de /proc del kernel.',
    prerequisites: [
      { label: 'Linux Kernel', status: 'Acceso a /proc y /sys (nativo)', required: true }
    ],
    steps: [
      {
        title: 'CPU por Hilos & Sensor Térmico',
        desc: 'Monitorea el uso de cada núcleo y la temperatura del paquete.',
        details: [
          'Barras de carga en tiempo real por cada núcleo Gracemont/P-core.',
          'Sensor de temperatura con alertas visuales de riesgo térmico.',
          'Consumo computacional casi nulo (O(1) en C/Rust).'
        ]
      },
      {
        title: 'Memoria RAM & ZRAM Swap',
        desc: 'Controla el consumo de memoria física y swap comprimido.',
        details: [
          'Monitoreo detallado de RAM física DDR5 usada y libre.',
          'Estado de ZRAM comprimido para evitar congelamientos del SO.'
        ]
      },
      {
        title: 'Process Killer Integrado',
        desc: 'Identifica y termina procesos rebeldes con 1 clic.',
        details: [
          'Lista los procesos que más RAM y CPU están consumiendo.',
          'Botón de terminación directa (SIGKILL) para liberar recursos.',
          'Ideal para limpiar compiladores colgados o navegadores pesados.'
        ]
      }
    ],
    proTip: 'El Hardware Sentinel consume menos del 0.2% de CPU para medir todo tu sistema.'
  },

  gaming: {
    id: 'gaming',
    title: 'Gaming Nexus & System Optimizer',
    badge: 'Alt + 7',
    description: 'Lanzador de juegos y optimizador de rendimiento del sistema para Linux.',
    prerequisites: [
      { label: 'Steam (Opcional)', status: 'Detecta juegos instalados vía .acf', required: false },
      { label: 'GameMode / Gamescope', status: 'Opcional para governor y FSR', required: false }
    ],
    steps: [
      {
        title: 'Descubrimiento Local de Juegos',
        desc: 'Explora tu catálogo sin abrir el cliente de Steam.',
        details: [
          'Lee automáticamente appmanifest_*.acf de tus carpetas de Steam.',
          'Muestra carátulas, tamaños en disco y estado de instalación.',
          'Lanzamiento rápido de ejecutables locales y emuladores.'
        ]
      },
      {
        title: '1-Click GameMode & Gobernadores',
        desc: 'Maximiza los FPS priorizando el planificador del kernel.',
        details: [
          'Bloquea el gobernador de CPU en modo rendimiento (performance).',
          'Prioriza hilos de juego frente a tareas en segundo plano.'
        ]
      },
      {
        title: 'Preset Gamescope FSR',
        desc: 'Escalado por hardware para pantallas de alta resolución.',
        details: [
          'Renderiza a 720p y escala a 1080p con AMD FidelityFX Super Resolution.',
          'Gana hasta 30-40% más fluidez en procesadores de bajo consumo.'
        ]
      }
    ],
    proTip: 'Puedes agregar juegos independientes y títulos nativos de Linux directamente.'
  },

  settings: {
    id: 'settings',
    title: 'Ajustes Maestros & Ecosistema',
    badge: 'Ctrl + ,',
    description: 'Configuración global, temas visuales, conmutación de módulos y rutas del sistema.',
    prerequisites: [
      { label: 'Archivo de Configuración', status: '~/.config/aegis/config.json', required: true }
    ],
    steps: [
      {
        title: 'Personalización de Tema & Escala',
        desc: 'Adapta la interfaz a tu gusto visual y monitor.',
        details: [
          '12 temas soberanos integrados: Nordic Slate, Tokyo Night, OLED Pure Black, Amber Terminal, Dracula, Catppuccin, Gruvbox, Solarized, Synthwave \'84, Matrix, Nord Frost y Monokai Pro.',
          'Slider de escala de interfaz (zoom reactivo para pantallas pequeñas o ultrawide).'
        ]
      },
      {
        title: 'Conmutador de Módulos (Plugins)',
        desc: 'Habilita únicamente las herramientas que usas a diario.',
        details: [
          'Apaga módulos no utilizados para ocultar sus botones y ahorrar memoria.',
          'Las pestañas desactivadas no cargan procesos en segundo plano.'
        ]
      },
      {
        title: 'Estado de Borrador & Guardado Estricto',
        desc: 'Protección contra cambios accidentales.',
        details: [
          'Los cambios de tema, escala y ajustes quedan en borrador de vista previa.',
          'Usa "Guardar Todo" para confirmar o "Descartar" para revertir al disco.',
          'Si cambias de pestaña sin guardar, Aegis revierte automáticamente los cambios.'
        ]
      }
    ],
    proTip: 'Cualquier ajuste se guarda de forma segura en local sin enviar telemetría a la nube.'
  }
};
