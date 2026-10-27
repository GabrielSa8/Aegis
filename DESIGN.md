# 🛡️ Aegis Design System — Nordic Slate & Moss

> **Modo de Superficie:** `Operate` (Herramienta de trabajo táctica, uso continuo de 8+ horas, escaneo rápido, cero fatiga ocular, cero AI-slop).

---

## 🎨 1. Tokens de Color (Paleta Nórdica & Pizarra)

| Token CSS | Valor Hex | Rol / Propósito |
| :--- | :--- | :--- |
| `--bg-canvas` | `#0f1211` | Fondo general de la ventana (Pizarra basalto mate con tinte musgo mínimo). |
| `--surface-panel` | `#161a19` | Paneles, barras laterales y módulos de trabajo. |
| `--surface-hover` | `#1c2220` | Estados interactivos hover / activos suaves. |
| `--border-wire` | `#242b29` | Divisores y contornos mecánicos nítidos de 1px. |
| `--border-focus` | `#10b981` | Foco de teclado activo y compuertas verificadas. |
| `--accent-moss` | `#10b981` | Acento primario (Verde esmeralda salvia apagado; foco y confirmación). |
| `--accent-ochre` | `#d97706` | Acento secundario (Ocre arcilla; alertas, fechas y avisos). |
| `--accent-danger` | `#ef4444` | Alertas críticas y borrado irreversible. |
| `--text-high` | `#e6edea` | Texto principal de alta legibilidad (Tiza mineral). |
| `--text-muted` | `#788882` | Etiquetas secundarias, rutas y metadatos (Grafito musgo). |

---

## 🔤 2. Tipografía & Jerarquía

* **Fuente de Interfaz:** `'Plus Jakarta Sans', -apple-system, system-ui, sans-serif`
* **Fuente de Datos y Terminal:** `'JetBrains Mono', 'Fira Code', monospace` (alineación tabular estricta).
* **Reglas:**
  * Mayúsculas restringidas exclusivamente a acrónimos técnicos reales (`TADÚ`, `MELI`, `AWS`, `PTY`, `SAM`).
  * Cero etiquetas flotantes ALL-CAPS como adorno decorativo.
  * Jerarquía clara con pesos `500`, `600` y `700` sin saltos tipográficos abruptos.

---

## 📐 3. Geometría y Layout

* **Radios de Borde:** `4px` para elementos pequeños/botones, `6px` para paneles contenedores. Prohibidos bordes de `20px` estilo píldora móvil.
* **Profundidad y Capas:** La profundidad se define por bordes de 1px (`--border-wire`) y diferencias sutiles de tono, nunca por sombras difusas flotantes (`box-shadow: none`).
* **Espaciado:** Cuadrícula de 8px estricta (`8px`, `16px`, `24px`).

---

## 🚫 4. Prohibiciones Absolutas (Anti-Slop Checklist)

- [x] Cero azul/indigo genérico (`#6366f1` erradicado).
- [x] Cero gradientes decorativos morados o rosas.
- [x] Cero kit de tarjetas idénticas repetidas con sombras suaves.
- [x] Cero animaciones intrusivas no solicitadas.
- [x] Solo micro-interacciones de respuesta (click físico, foco visible).
