#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const packageJsonPath = path.join(rootDir, 'package.json');
const tauriConfPath = path.join(rootDir, 'src-tauri', 'tauri.conf.json');
const cargoTomlPath = path.join(rootDir, 'src-tauri', 'Cargo.toml');

const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const currentVersion = pkg.version;

const targetArg = (process.argv[2] || 'patch').toLowerCase().trim();

function calculateNewVersion(current, target) {
  const match = current.match(/^(\d+)\.(\d+)\.(\d+)(.*)$/);
  if (!match) {
    throw new Error(`Current version "${current}" does not match SemVer format.`);
  }

  let [, major, minor, patch, extra] = match;
  major = parseInt(major, 10);
  minor = parseInt(minor, 10);
  patch = parseInt(patch, 10);

  if (target === 'patch') {
    return `${major}.${minor}.${patch + 1}`;
  }
  if (target === 'minor') {
    return `${major}.${minor + 1}.0`;
  }
  if (target === 'major') {
    return `${major + 1}.0.0`;
  }

  if (/^\d+\.\d+\.\d+.*$/.test(target)) {
    return target;
  }

  throw new Error(`Invalid version or target type: "${target}". Expected 'patch', 'minor', 'major', or 'X.Y.Z'.`);
}

const newVersion = calculateNewVersion(currentVersion, targetArg);

// 1. Update package.json
pkg.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

// 2. Update src-tauri/tauri.conf.json
const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
tauriConf.version = newVersion;
fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n', 'utf8');

// 3. Update src-tauri/Cargo.toml ([package] section version)
let cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
cargoToml = cargoToml.replace(
  /(\[package\][\s\S]*?version\s*=\s*")[^"]+(")/,
  `$1${newVersion}$2`
);
fs.writeFileSync(cargoTomlPath, cargoToml, 'utf8');

console.log(`[Aegis Bump] Version updated: v${currentVersion} -> v${newVersion}`);
console.log(`  ✓ package.json`);
console.log(`  ✓ src-tauri/tauri.conf.json`);
console.log(`  ✓ src-tauri/Cargo.toml`);
