const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const packagePath = path.join(root, 'package.json');
const tauriConfigPath = path.join(root, 'src-tauri', 'tauri.conf.json');
const cargoPath = path.join(root, 'src-tauri', 'Cargo.toml');

const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const version = packageJson.version;
if (!version) {
  throw new Error('Missing package.json version.');
}

const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf8'));
if (tauriConfig.version !== version) {
  tauriConfig.version = version;
  fs.writeFileSync(tauriConfigPath, `${JSON.stringify(tauriConfig, null, 2)}\n`);
}

const cargoToml = fs.readFileSync(cargoPath, 'utf8');
const packageVersionPattern = /(^\[package\][\s\S]*?^version\s*=\s*")[^"]+(")/m;
if (!packageVersionPattern.test(cargoToml)) {
  throw new Error('Could not find [package].version in src-tauri/Cargo.toml.');
}

const nextCargoToml = cargoToml.replace(
  packageVersionPattern,
  (_match, prefix, suffix) => `${prefix}${version}${suffix}`,
);
if (nextCargoToml !== cargoToml) {
  fs.writeFileSync(cargoPath, nextCargoToml);
}

console.log(`Synced Tauri versions to ${version}`);