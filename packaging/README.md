# Aegis Packaging & Distribution Pipeline

Aegis is distributed across multiple formats for sovereign, offline-ready installation:

## 1. AUR (Arch Linux / Manjaro)
Located in `packaging/aur/`:
* `PKGBUILD`: Arch build recipe using GitHub release binaries (`aegis-bin`).
* `.SRCINFO`: AUR metadata.

To publish/test:
```bash
cd packaging/aur
makepkg -si
```

## 2. Flatpak (Flathub)
Located in `packaging/flatpak/`:
* `com.aegis.cockpit.yaml`: Flatpak builder manifest using GNOME 47 runtime.
* `com.aegis.cockpit.metainfo.xml`: AppStream metadata conforming to Flathub specs.
* `com.aegis.cockpit.desktop`: Desktop launcher.

To build locally with `flatpak-builder`:
```bash
flatpak-builder --user --install --force-clean build-dir packaging/flatpak/com.aegis.cockpit.yaml
```

## 3. AppImage, DEB (.deb) & RPM (.rpm)
Generated directly via Tauri bundler:
```bash
npm run tauri:build
```
Outputs in `src-tauri/target/release/bundle/`:
* `appimage/Aegis_*.AppImage`
* `deb/Aegis_*_amd64.deb`
* `rpm/Aegis-*.x86_64.rpm`

## 4. GitHub Releases & Auto-Updater
Tauri auto-updater consumes `latest.json` published on GitHub releases:
* Endpoint: `https://github.com/GabrielSa8/Aegis/releases/latest/download/latest.json`
* Public Key configured in `src-tauri/tauri.conf.json`.
