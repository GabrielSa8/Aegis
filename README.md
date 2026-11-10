# 🛡️ Aegis — The Sovereign Cognitive Desktop Cockpit

<div align="center">

![Version](https://img.shields.io/badge/version-v2.19.0-10b981?style=for-the-badge&logo=shield)
![Tauri v2](https://img.shields.io/badge/Tauri-v2.0-24C8D8?style=for-the-badge&logo=tauri&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-1.80%2B-DEA584?style=for-the-badge&logo=rust&logoColor=white)
![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![JavaScript](https://img.shields.io/badge/JavaScript-ESNext-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Platform](https://img.shields.io/badge/Platform-Linux%20%7C%20Wayland-FCC624?style=for-the-badge&logo=linux&logoColor=black)
![Binary Size](https://img.shields.io/badge/Binary%20Size-12%20MB-emerald?style=for-the-badge)
![RAM Footprint](https://img.shields.io/badge/RAM-%E2%89%A4%2050%20MB-emerald?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-a855f7?style=for-the-badge)

**A sovereign, hyper-efficient personal operating cockpit and command center engineered in Rust and React 19.**  
*Unified Multi-Engine AI Agents, Adaptive Harness (L1⇄L3), Obsidian Second Brain with Granular Encryption, Git Fleet DevOps, Sovereign SQLite Finances, Symmetric Tasks Kanban, Local P2P Sync Mesh, and Real-Time Hardware Telemetry in an ultra-dense canvas.*

<br/>

### ⚡ Sovereign One-Line Installation (Linux)

Install or update with desktop integration, high-resolution icons, and automated dependency checks (no root required):

```bash
curl -fsSL https://raw.githubusercontent.com/GabrielSa8/Aegis/main/scripts/install.sh | bash
```

*Or using `wget`:*
```bash
wget -qO- https://raw.githubusercontent.com/GabrielSa8/Aegis/main/scripts/install.sh | bash
```

[One-Line Install](#-instant-installation-linux) • [Architecture](#-architecture) • [The 8 Pillars](#-the-8-pillars-of-sovereignty) • [Adaptive Harness](#-aegis-adaptive-harness-6-pilars) • [Community Plugins](#-community-plugins-architecture) • [Benchmarks](#-benchmarks--performance) • [Themes](#-12-ergonomic-themes) • [Source Build](#-manual-compilation-from-source)

</div>

---

## 🎯 Executive Overview

Modern software engineers suffer from extreme cognitive fragmentation: bouncing between an IDE, terminal CLI AI tools, markdown note-taking apps, system performance monitors, gaming launchers, and personal finance spreadsheets.

**Aegis** consolidates this entire workflow into a **single, unified, local-first desktop application**. Engineered with **Tauri v2** and **Rust**, it delivers native system performance with zero remote telemetry, zero third-party cloud lock-in, and an ultralight memory footprint of **~48–52 MB RAM** (less than an empty browser tab).

Everything runs locally on your NVMe storage through human-readable Markdown, granular AES-256-GCM encryption, or zero-overhead SQLite.

---

## 🏗️ Architecture

Aegis is built on an ultra-dense spatial interface with native Rust background engines running asynchronously via Tokio:

```mermaid
flowchart TD
    subgraph UI ["🖥️ Aegis Frontend (React 19 + Vite + ESNext)"]
        Top["🧭 Unified Header Dock (Navigation, Git Fleet, Search & Telemetry)"]
        NavLeft["📑 Left Dock (8 Sovereign Pillars · Alt + 1..8)"]
        HarnessUI["🛡️ Adaptive Harness UI (L1⇄L3 Effort Switch & Telemetry Badges)"]
        Canvas["🚀 Ultra-Dense Canvas (95% Active Viewport)"]
        Omnibar["⚡ Command Palette / Omnibar (Ctrl + K)"]
    end

    subgraph RustCore ["🦀 Aegis Native Core (Tauri v2 / Tokio Async)"]
        PTY["🤖 Multi-AI PTY Engine (Ollama, Claude, DeepSeek, Gemini, OpenAI)"]
        HarnessCore["🛡️ Adaptive Harness (AST Repo-Map, Context Pruning, Hot-Handoff)"]
        VaultEngine["📚 Vault Engine (Obsidian Markdown, AES-256-GCM & Tasks I/O)"]
        SQLiteEngine["💾 Sovereign DB (Embedded SQLite via Rusqlite)"]
        DevOpsEngine["🚀 Git Fleet Radar (Direct libgit2 / CLI Telemetry)"]
        SentinelEngine["🛡️ Hardware Sentinel (/proc Differential Telemetry)"]
        LeisureEngine["🎮 Gaming Engine (Steam ACF Parser, GameMode / FSR)"]
        MeshEngine["🔄 Local P2P Sync (Encrypted LAN mDNS Mesh · Isolated UI)"]
        GateEngine["📱 Telegram Remote Gateway (Local Daemon Bridge & SQLite Ops)"]
    end

    subgraph Storage ["💾 Local Sovereign Storage"]
        Vault[("Bóveda Obsidian\nMarkdown Files + .md.enc")]
        DB[("Embedded SQLite\n~/.local/share/aegis/aegis_lifeos.db")]
        Cfg[("User Config\n~/.config/aegis/config.json")]
        PluginsDir[("Community Plugins\n~/.config/aegis/plugins/")]
    end

    UI <-->|Tauri IPC & Events| RustCore
    RustCore <--> Storage
```

---

## 🛡️ The 8 Pillars of Sovereignty

### 1. 🤖 Omnichannel AI Agent & Adaptive Harness (`Alt + 1`)
- **Multi-Provider & Local Support:** Seamlessly route between local models via **Ollama**, or cloud providers (**Anthropic Claude 3.5 Sonnet/Haiku**, **DeepSeek V3/R1**, **OpenAI GPT-4o/o3-mini**, **Google Gemini**, and **OpenRouter**).
- **Execution Tiers & Hot-Handoff:** Dynamically scale between **L1 (Flash)** for surgical single-line fixes, **L2 (Balanceado)**, and **L3 (Profundo/Reasoning)** for architecture and complex debugging. Includes automated fallback escalation (`L1 ➔ L3`) on test failure.
- **Dynamic Context Isolation:** Reduces token consumption by **~60%** (from ~25k to ~6.9k tokens) by automatically pruning and symlinking only context-relevant skills.
- **Interactive Prompt Deck:** Multi-line elastic input, `/` slash commands palette (`/model`, `/usage`, `/skills`, `/pack`, `/context`, `/compact`), dynamic macro variables (`{{clip}}`, `{{diff}}`, `@vault:`, `@file:`), multimodal image analysis, and background native desktop notifications upon task completion.

### 2. 💰 Sovereign Finances & LifeOS Timeline (`Alt + 2`)
- **Embedded SQLite Core:** High-performance local database (`aegis_lifeos.db`) replacing browser IndexedDB with zero telemetry and automatic schema migrations (`db_metadata`).
- **Burn-Rate Cockpit:** Real-time monthly spending cap vs. actual gauge, runway calculation, and overrun alerts.
- **Multi-Card & Cutoff Deadlines:** Credit card cutoffs (e.g. Day 8, Day 15, Day 22) and installment plans (MSI) tracking with dedicated semantic categories (`Planes MSI`, `Gastos Fijos`).
- **Cross-Domain Master Timeline:** Intertwines engineering sprints, operational deliverables, certifications, and personal milestones in an interactive calendar with category badges.

### 3. 📚 Obsidian Second Brain & Granular Encryption (`Alt + 3`)
- **Bidirectional Vault Sync:** Direct filesystem reading and writing on local Markdown vaults without cloud dependencies.
- **Granular Encryption (Dual Scheme):** Notes can remain plain text or be selectively encrypted into `.md.enc` using **AES-256-GCM + Argon2id** (Master Key vs. Independent Note Passphrase) with in-memory preview and scoped auto-lock.
- **Hierarchical Tree (`Ctrl + B`):** Collapsible sidebar with Drag-and-Drop file organization and tactical note creation.
- **Live Markdown & Mermaid Renderer:** Real-time GitHub Flavored Markdown (GFM), table editing, callouts (`[!NOTE]`, `[!WARNING]`), and native **Mermaid diagrams** rendering.
- **Network & Backlinks (`Ctrl + M`):** Interactive graph visualizing incoming and outgoing note links.

### 4. 🚀 DevOps & Git Fleet Radar (`Alt + 4`)
- **Fleet Overview:** Real-time monitoring across all local repositories (active branch, uncommitted dirty files, ahead/behind sync counters, last commit metadata).
- **One-Click Workflows:** Launch your preferred IDE (`cursor`, `code`, `zed`, `nvim`) or spawn a native terminal in the project directory.
- **Repository Safety Gates:** Visual guardrails preventing catastrophic actions in critical production branches.
- **Agent Skills Directory:** Introspects installed Agent Skills in `~/.agents/skills/` with instant search and `SKILL.md` viewer.

### 5. 📋 Daily Workflow & Tasks Kanban (`Alt + 5`)
- **Universal Vault Parser:** High-speed scanner extracting `- [ ]` and `- [x]` markdown tasks across the entire vault.
- **Symmetric Project Swimlanes:** Predefined 220px swimlane containers showing tasks cleanly with independent vertical scrolling—preventing card compression with 300+ items.
- **Interactive HUD Filters:** Clickable status chips (**Total**, **En Cola**, **En Foco**, **Completadas**) for instant filtering.
- **Focus Zoom & Full-Width Expansion:** One-click project zoom (`Maximize2`) expanding the swimlane to full viewport height (`calc(100vh - 270px)`) and single-column 100% width mode.
- **Atomic Disk Toggling:** Checking any checkbox in Aegis immediately mutates the physical markdown file on disk.

### 6. 🛡️ Hardware Sentinel (`Alt + 6`)
- **Zero-Overhead ($O(1)$) Telemetry:** Reads directly from `/proc/stat`, `/proc/meminfo`, and `/sys/class/thermal` (< 0.1% CPU cost). Suspends polling automatically when minimized (`visibilitychange`).
- **Thermal & Memory Gauges:** Per-core CPU load, CPU package temperature with throttling risk classification, physical DDR5 RAM, and compressed ZRAM swap monitoring.
- **Process Killer:** Live inspection of top memory and CPU consuming processes with 1-click `SIGTERM`/`SIGKILL` termination.
- **Tactical Memory Purge:** Instant OS disk cache sync and ZRAM compaction button.

### 7. 🎮 Gaming Nexus & System Optimizer (`Alt + 7`)
- **Offline Steam Auto-Discovery:** Parses local `appmanifest_*.acf` files to catalog installed Steam titles with icons, AppIDs, and disk sizes without running the Steam client.
- **1-Click GameMode Integration:** Toggles Linux `gamemoded` for CPU governor locking and real-time scheduler prioritization.
- **Gamescope FSR Upscaling:** Launch preset scaling 720p 60fps renders to crisp 1080p using AMD FidelityFX Super Resolution.
- **Companion Notes & Vault Sync:** Logs achievements, review ratings, hours played, and syncs tactical companion notes directly with the Obsidian Vault.

### 8. ⚙️ Master Settings, P2P Sync & Community Hub (`Ctrl + ,`)
- **Strict Local UI Isolation in P2P:** Local preferences (Theme, UI scale, active plugins, active modules) remain strictly isolated per machine during LAN P2P synchronizations.
- **Master Profile & Token Limits:** Enforce daily token consumption ceilings, audit saved API keys, and configure identity preferences.
- **Strict Draft State:** Settings changes remain in preview until clicking **Guardar Todo** (*Save All*); discard with 1-click rollback.
- **Interactive Tour Guides (`[?]`):** In-app walkthroughs for each module powered by `tourCatalog`.

---

## ⚡ Aegis Adaptive Harness (6 Pilares)

The built-in **Aegis Adaptive Harness** brings state-of-the-art agent engineering (inspired by SWE-bench top performers, Aider Repo-Map, and RouteLLM) directly into your desktop workflow:

1. **Pilar 1: Escalamiento Dinámico de Esfuerzo (Dynamic Effort Scaling L1⇄L2⇄L3):** Automatically categorizes prompts (surgical edits vs. architectural refactors) and switches models/temperatures to avoid burning high-tier reasoning tokens on trivial tasks.
2. **Pilar 2: AST Repo-Map & Compresión Semántica:** Extracts structural symbol maps (classes, functions, signatures) using ctags/AST analysis, giving the agent full codebase awareness at ~15% of the token cost of raw file dumping.
3. **Pilar 3: Monitoreo de Procesos en Vivo (`RuntimeProcessState`):** Tracks background commands, builds, and test runs with real-time log ingestion without blocking the user interface.
4. **Pilar 4: Hot-Handoff `L1 ➔ L3`:** If a fast lightweight model (L1) fails a linting check or test suite, Aegis automatically escalates the context and failure diff to the heavy reasoning model (L3) to recover cleanly.
5. **Pilar 5: Telemetría I/O & Indicadores de Contexto:** Live badges in the chat interface displaying exact prompt tokens, completion tokens, latency (ms), and cost estimations.
6. **Pilar 6: Sandbox & Execution Safety:** Guardrails intercepting destructive Git operations (`git clean -fdx`, `git push --force`) or unintended file deletions before terminal execution.

---

## 🧩 Community Plugins Architecture

Aegis features an open, sovereign extension architecture:

- **Zero Lock-In Manifest (`plugin.json`):** Every plugin defines its capabilities, requested permissions, views, and settings via a declarative manifest.
- **Isolated Execution & Sandbox:** Plugins run in isolated contexts with restricted Tauri IPC access, ensuring community extensions cannot tamper with private vault files or master credentials without explicit permission.
- **1-Click Packaging & P2P Sharing:** Export plugins as `.aegis-plugin.tar.gz` and distribute them peer-to-peer across your local mesh network or contribute them via GitHub pull requests.
- **Open Contribution Model:** Anyone in the community can build custom dashboards, specialized parsers, game launchers, or LLM providers and share them openly.

---

## 📱 Telegram Remote Gateway

Aegis includes an asynchronous Telegram bridge ([`gateway.rs`](file:///home/zabrielsa/Proyects/projects/Aegis/src-tauri/src/gateway.rs)) that lets you monitor and interact with your workstation remotely:

- **Dynamic Financial Operations:** Log expenses (`/gasto $45 cena bbva`), resolve credit card billing cycles (e.g. 22nd to 22nd), and query financial summaries (`/resumen`).
- **Remote Station Control:** Check system hardware health (`/status` with CPU %, RAM, and temperatures) or trigger immediate emergency locking (`/lock`).
- **Asynchronous AI Prompts:** Ask quick questions or trigger tasks (`/ai <prompt>`) using multi-model routing.
- **TTL Stale Message Protection:** Ephemeral commands older than 300 seconds are automatically discarded upon system reboot or reconnecting to prevent accidental burst execution.

---

## 🎨 12 Ergonomic Themes

Aegis includes 12 handcrafted high-contrast color schemes calibrated for maximum density, OLED efficiency, and eye comfort:

| Theme | Inspiration / Style | Primary Accent |
|---|---|---|
| **Nordic Slate & Moss** *(Default)* | Scandinavian slate with sage emerald | `#10b981` |
| **Tokyo Night** | Deep indigo with neon cyan & violet | `#7dcfff` |
| **OLED Pure Black** | 100% true black canvas with laser green | `#00ff88` |
| **Amber Terminal** | Classic amber monochrome hacker terminal | `#f59e0b` |
| **Dracula Dark** | Elegant gothic purple and vampire magenta | `#bd93f9` |
| **Catppuccin Mocha** | Warm pastels over soothing mocha slate | `#cba6f7` |
| **Gruvbox Retro** | Warm earthy tones, forest green, and vintage ochre | `#8ec07c` |
| **Solarized Cyan** | Calibrated cyan and teal on petroleum blue | `#2aa198` |
| **Synthwave '84** | Electric neon pink and cyan over retro-synth horizon | `#ff2a85` |
| **Matrix Cyber** | High-penetration phosphor green on carbon black | `#00ff66` |
| **Nord Arctic Frost** | Polar ice cyan on boreal blue-gray | `#88c0d0` |
| **Monokai Pro** | Vivid warm yellow and magenta over dark charcoal | `#ffd866` |

---

## ⚡ Benchmarks & Performance

Battle-tested on resource-constrained hardware (**Intel Processor N150, 4 Gracemont E-cores, 16 GB DDR5, Fedora Linux 43 Wayland**):

| Metric | Aegis (Tauri v2 + Rust) | Typical Electron App | Delta |
|---|---|---|---|
| **Idle Memory (VmRSS)** | **~48 – 52 MB** | 420 – 680 MB | **~89% less RAM** |
| **Startup Time (Cold Launch)** | **~180 ms** | 1,800 – 3,200 ms | **10x faster** |
| **Binary Size (Standalone)** | **12 MB** | 140 – 210 MB | **~94% smaller** |
| **Hardware Telemetry Cost** | **$O(1)$ ($<0.1\%$ CPU)** | 2 – 5% CPU polling | **Imperceptible overhead** |
| **Context Pruning (Harness)** | **~6.9k tokens** | ~25.4k tokens (raw dump) | **~73% token savings** |
| **Network Sockets (Offline)** | **0 open sockets** | Continuous telemetry pings | **100% Sovereign** |

---

## ⌨️ Tactical Keyboard Shortcuts

| Shortcut | Action | Scope |
|---|---|---|
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | Open Command Palette / Omnibar | Global |
| <kbd>Alt</kbd> + <kbd>1</kbd> .. <kbd>8</kbd> | Jump directly to Pillars 1 – 8 | Global |
| <kbd>Alt</kbd> + <kbd>Z</kbd> | Toggle Zen Mode (Full canvas view) | Global |
| <kbd>Alt</kbd> + <kbd>L</kbd> | Master Lock Screen | Global |
| <kbd>Ctrl</kbd> + <kbd>,</kbd> | Open Global Settings & Theme Switcher | Global |
| <kbd>Ctrl</kbd> + <kbd>B</kbd> | Toggle Obsidian Vault File Tree Sidebar | Vault View |
| <kbd>Ctrl</kbd> + <kbd>M</kbd> | Toggle Network & Backlinks Micrograph | Vault View |
| <kbd>Ctrl</kbd> + <kbd>S</kbd> | Atomic Save Note to Disk | Vault Editor |
| <kbd>Esc</kbd> | Close Modal / Exit Zen Mode / Cancel Palette | Global |

---

## ⚡ Instant Installation (Linux)

Install or update the latest precompiled release, register the desktop launcher, and download official tactical icons with a single sovereign command:

```bash
curl -fsSL https://raw.githubusercontent.com/GabrielSa8/Aegis/main/scripts/install.sh | bash
```

*Or via `wget`:*
```bash
wget -qO- https://raw.githubusercontent.com/GabrielSa8/Aegis/main/scripts/install.sh | bash
```

> **Requirements:** 64-bit Linux (Fedora, Debian, Ubuntu, Arch) with `webkit2gtk-4.1`. The script checks dependencies, installs binary to `~/.local/bin/aegis`, and creates `~/.local/share/applications/aegis.desktop`.  
> To uninstall at any time: `curl -fsSL https://raw.githubusercontent.com/GabrielSa8/Aegis/main/scripts/install.sh | bash -s -- --uninstall`

---

## 🚀 Manual Compilation from Source

### Prerequisites
- **Linux** (Fedora, Ubuntu, Arch, Debian) with Wayland or X11.
- **Rust toolchain** (`cargo`, `rustc` 1.80+): `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- **Node.js** (v18+) & `npm`: for Vite frontend compilation.
- **System WebKit libraries**:
  - Fedora/RHEL: `sudo dnf install webkit2gtk4.1-devel openssl-devel libappindicator-gtk3-devel`
  - Ubuntu/Debian: `sudo apt install libwebkit2gtk-4.1-dev libssl-dev libappindicator3-dev`
  - Arch Linux: `sudo pacman -S webkit2gtk-4.1 openssl`

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/GabrielSa8/Aegis.git aegis
cd aegis
npm install
```

### 2. Run in Development Mode (Live Hot Reload)
```bash
npm run tauri:dev
```

### 3. Build Autonomous Release Binary (Zero Node/Vite Dependencies)
```bash
npm run tauri -- build --no-bundle
```
The standalone binary will be generated at `src-tauri/target/release/aegis`.

---

## 📜 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for full details.

Developed with precision by **Gabriel** ([@GabrielSa8](https://github.com/GabrielSa8)).
