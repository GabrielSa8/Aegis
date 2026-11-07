# 🛡️ Aegis — The Sovereign Cognitive Desktop Cockpit

<div align="center">

![Version](https://img.shields.io/badge/version-v2.13.4-10b981?style=for-the-badge&logo=shield)
![Tauri v2](https://img.shields.io/badge/Tauri-v2.0-24C8D8?style=for-the-badge&logo=tauri&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-1.80%2B-DEA584?style=for-the-badge&logo=rust&logoColor=white)
![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![JavaScript](https://img.shields.io/badge/JavaScript-ESNext-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Platform](https://img.shields.io/badge/Platform-Linux%20%7C%20Wayland-FCC624?style=for-the-badge&logo=linux&logoColor=black)
![Binary Size](https://img.shields.io/badge/Binary%20Size-12%20MB-emerald?style=for-the-badge)
![RAM Footprint](https://img.shields.io/badge/RAM-%E2%89%A4%2050%20MB-emerald?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-a855f7?style=for-the-badge)

**A sovereign, hyper-efficient personal operating cockpit and command center engineered in Rust and React 19.**  
*Unified Multi-Engine AI Agents, Obsidian Second Brain, Git Fleet DevOps, Sovereign SQLite Finances, Symmetric Tasks Kanban, Local P2P Sync, and Real-Time Hardware Telemetry in a 38px ultra-dense canvas.*

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

[One-Line Install](#-instant-installation-linux) • [Architecture](#-architecture) • [The 8 Pillars](#-the-8-pillars-of-sovereignty) • [User Guide](docs/USER_GUIDE.md) • [Benchmarks](#-benchmarks--performance) • [Themes](#-12-ergonomic-themes) • [Source Build](#-manual-compilation-from-source)

</div>

---

## 🎯 Executive Overview

Modern software engineers suffer from extreme cognitive fragmentation: bouncing between an IDE, terminal CLI AI tools, markdown note-taking apps, system performance monitors, gaming launchers, and personal finance spreadsheets.

**Aegis** consolidates this entire workflow into a **single, unified, local-first desktop application**. Engineered with **Tauri v2** and **Rust**, it delivers native system performance with zero remote telemetry, zero third-party cloud lock-in, and an ultralight memory footprint of **~48–52 MB RAM** (less than an empty browser tab).

Everything runs locally on your NVMe storage through human-readable Markdown or zero-overhead SQLite.

---

## 🏗️ Architecture

Aegis is built on a 3-dock spatial interface with native Rust background engines:

```mermaid
flowchart TD
    subgraph UI ["🖥️ Aegis Frontend (React 19 + Vite + ESNext)"]
        Top["🧭 Unified Header Dock (38px Navigation, Git Fleet & Telemetry Pill)"]
        NavLeft["📑 Left Dock (8 Sovereign Pillars · Alt + 1..8)"]
        ContextsRight["🎯 Right Contexts Dock (Dynamic Skill Isolation & Token Pruning)"]
        Canvas["🚀 Ultra-Dense Canvas (95% Active Viewport)"]
        Omnibar["⚡ Command Palette / Omnibar (Ctrl + K)"]
    end

    subgraph RustCore ["🦀 Aegis Native Core (Tauri v2 / Tokio Async)"]
        PTY["🤖 Multi-AI PTY Engine (Ollama, Claude, DeepSeek, Gemini, OpenAI)"]
        VaultEngine["📚 Vault Engine (Obsidian Markdown, Frontmatter & Tasks I/O)"]
        SQLiteEngine["💾 Sovereign DB (Embedded SQLite via Rusqlite)"]
        DevOpsEngine["🚀 Git Fleet Radar (Direct libgit2 / CLI Telemetry)"]
        SentinelEngine["🛡️ Hardware Sentinel (/proc Differential Telemetry)"]
        LeisureEngine["🎮 Gaming Engine (Steam ACF Parser & GameMode / FSR)"]
        MeshEngine["🔄 Local P2P Sync (Encrypted LAN mDNS Mesh)"]
        GateEngine["📱 Telegram Remote Gateway (Local Daemon Bridge)"]
    end

    subgraph Storage ["💾 Local Sovereign Storage"]
        Vault[("Bóveda Obsidian\nMarkdown Files")]
        DB[("Embedded SQLite\n~/.local/share/aegis/aegis_lifeos.db")]
        Cfg[("User Config\n~/.config/aegis/config.json")]
    end

    UI <-->|Tauri IPC & Events| RustCore
    RustCore <--> Storage
```

---

## 🛡️ The 8 Pillars of Sovereignty

### 1. 🤖 Omnichannel AI Agent (`Alt + 1`)
- **Multi-Provider & Local Support:** Seamlessly route between local models via **Ollama**, or cloud providers (**Anthropic Claude 3.5 Sonnet/Haiku**, **DeepSeek V3/R1**, **OpenAI GPT-4o/o3-mini**, **Google Gemini**, and **OpenRouter**).
- **Execution Tiers:** Instant toggle between **Flash** (rapid single-turn edits), **Balanceado**, **Profundo** (deep planning), and **Razonamiento** (R1/o3 chain-of-thought).
- **Dynamic Context Isolation:** Reduces token consumption by **~60%** (from ~25k to ~6.9k tokens) by automatically pruning and symlinking only context-relevant skills.
- **Interactive Prompt Deck:** Multi-line elastic input, `/` slash commands palette (`/model`, `/usage`, `/skills`, `/compact`), dynamic macro variables (`{{clip}}`, `{{diff}}`, `@vault:`, `@file:`), multimodal drag-and-drop screenshots, and floating SQLite thread history.

### 2. 💰 Sovereign Finances & LifeOS Timeline (`Alt + 2`)
- **Embedded SQLite Core:** High-performance local database (`aegis_lifeos.db`) replacing browser IndexedDB with zero telemetry.
- **Burn-Rate Cockpit:** Real-time monthly spending cap vs. actual gauge, runway calculation, and overrun alerts.
- **Multi-Card & Cutoff Deadlines:** Credit card cutoffs (e.g. Day 8, Day 15) and installment plans (MSI) tracking.
- **Cross-Domain Master Timeline:** Intertwines engineering sprints, operational deliverables, certifications, and personal milestones in an interactive calendar with category badges.

### 3. 📚 Obsidian Second Brain (`Alt + 3`)
- **Bidirectional Vault Sync:** Direct filesystem reading and writing on local Markdown vaults without cloud dependencies.
- **Hierarchical Tree (`Ctrl + B`):** Collapsible sidebar with Drag-and-Drop file organization.
- **Live Markdown & Mermaid Renderer:** Real-time GitHub Flavored Markdown (GFM), table editing, callouts (`[!NOTE]`, `[!WARNING]`), and native **Mermaid diagrams** rendering.
- **Network & Backlinks (`Ctrl + M`):** Interactive graph visualizing incoming and outgoing note links.

### 4. 🚀 DevOps & Git Fleet Radar (`Alt + 4`)
- **Fleet Overview:** Real-time monitoring across all local repositories (active branch, uncommitted dirty files, ahead/behind sync counters, last commit metadata).
- **One-Click Workflows:** Launch your preferred IDE (`cursor`, `code`, `zed`, `nvim`) or spawn a native terminal in the project directory.
- **Repository Safety Gates:** Visual guardrails preventing catastrophic actions in critical production branches.
- **Agent Skills Directory:** Introspects installed Agent Skills in `~/.agents/skills/` with instant search and `SKILL.md` viewer.

### 5. 📋 Daily Workflow & Tasks Kanban (`Alt + 5`)
- **Universal Vault Parser:** High-speed scanner extracting `- [ ]` and `- [x]` markdown tasks across the entire vault.
- **Symmetric Project Swimlanes:** Predefined 220px swimlane containers showing up to 4 tasks cleanly with independent vertical scrolling—preventing card compression with 300+ items.
- **Interactive HUD Filters:** Clickable status chips (**Total**, **En Cola**, **En Foco**, **Completadas**) for instant filtering.
- **Focus Zoom & Full-Width Expansion:** One-click project zoom (`Maximize2`) expanding the swimlane to full viewport height (`calc(100vh - 270px)`) and single-column 100% width mode.
- **Atomic Disk Toggling:** Checking any checkbox in Aegis immediately mutates the physical markdown file on disk.

### 6. 🛡️ Hardware Sentinel (`Alt + 6`)
- **Zero-Overhead ($O(1)$) Telemetry:** Reads directly from `/proc/stat`, `/proc/meminfo`, and `/sys/class/thermal` (< 0.1% CPU cost).
- **Thermal & Memory Gauges:** Per-core CPU load, CPU package temperature with throttling risk classification, physical DDR5 RAM, and compressed ZRAM swap monitoring.
- **Process Killer:** Live inspection of top memory and CPU consuming processes with 1-click `SIGTERM`/`SIGKILL` termination.
- **Tactical Memory Purge:** Instant OS disk cache sync and ZRAM compaction button.

### 7. 🎮 Gaming Nexus & System Optimizer (`Alt + 7`)
- **Offline Steam Auto-Discovery:** Parses local `appmanifest_*.acf` files to catalog installed Steam titles with icons, AppIDs, and disk sizes without running the Steam client.
- **1-Click GameMode Integration:** Toggles Linux `gamemoded` for CPU governor locking and real-time scheduler prioritization.
- **Gamescope FSR Upscaling:** Launch preset scaling 720p 60fps renders to crisp 1080p using AMD FidelityFX Super Resolution.
- **Local Emulators & Launchers:** Direct launchers for standalone native Wayland games, PokéRogue, and emulators.

### 8. ⚙️ Master Settings, Soberanía & Control (`Ctrl + ,`)
- **Master Profile & Token Limits:** Enforce daily token consumption ceilings, audit saved API keys, and configure identity preferences.
- **Strict Draft State:** Settings changes remain in preview until clicking **Guardar Todo** (*Save All*); discard with 1-click rollback.
- **Module Dock Toggles:** Enable or disable any of the 8 pillars dynamically to reclaim screen estate and memory.
- **Interactive Tour Guides (`[?]`):** In-app walkthroughs for each module powered by `tourCatalog`.

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
