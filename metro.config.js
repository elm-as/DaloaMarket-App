const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const { FileStore } = require('metro-cache');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

const packagesDir = path.resolve(projectRoot, 'packages');

// 1. Regarder les packages locaux du projet
config.watchFolders = [
  path.resolve(packagesDir, 'ui'),
  path.resolve(packagesDir, 'api'),
  path.resolve(packagesDir, 'types'),
  path.resolve(packagesDir, 'config'),
  path.resolve(packagesDir, 'utils'),
];

// 2. Résolution node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Désactiver package exports qui charge les versions Node de Supabase
config.resolver.unstable_enablePackageExports = false;

// 4. Extra node modules avec shims pour l'environnement React Native
config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  stream: path.resolve(projectRoot, 'src/shims/stream.js'),
  ws: path.resolve(projectRoot, 'src/shims/ws.js'),
  '@daloa/ui': path.resolve(packagesDir, 'ui'),
  '@daloa/api': path.resolve(packagesDir, 'api'),
  '@daloa/types': path.resolve(packagesDir, 'types'),
  '@daloa/config': path.resolve(packagesDir, 'config'),
  '@daloa/utils': path.resolve(packagesDir, 'utils'),
};

// 3. Cache local isolé pour éviter les verrous Windows Temp
config.cacheStores = [
  new FileStore({
    root: path.join(projectRoot, '.metro-cache'),
  }),
];

module.exports = config;
