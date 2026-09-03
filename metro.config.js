const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const { FileStore } = require('metro-cache');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

const packagesDir = path.resolve(projectRoot, 'packages');

// 1. Regarder les dossiers du workspace (pour pnpm node_modules) et les packages locaux
config.watchFolders = [
  workspaceRoot,
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

// 4. Extra node modules avec shims pour l'environnement React Native
config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  stream: path.resolve(projectRoot, 'src/shims/stream.js'),
  ws: path.resolve(projectRoot, 'src/shims/ws.js'),
  zlib: path.resolve(projectRoot, 'src/shims/zlib.js'),
  '@daloa/ui': path.resolve(packagesDir, 'ui'),
  '@daloa/api': path.resolve(packagesDir, 'api'),
  '@daloa/types': path.resolve(packagesDir, 'types'),
  '@daloa/config': path.resolve(packagesDir, 'config'),
  '@daloa/utils': path.resolve(packagesDir, 'utils'),
};

// 5. Interception forcée des modules Node.js (ws, zlib, stream) pour React Native
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'ws') {
    return {
      filePath: path.resolve(projectRoot, 'src/shims/ws.js'),
      type: 'sourceFile',
    };
  }
  if (moduleName === 'zlib') {
    return {
      filePath: path.resolve(projectRoot, 'src/shims/zlib.js'),
      type: 'sourceFile',
    };
  }
  if (moduleName === 'stream') {
    return {
      filePath: path.resolve(projectRoot, 'src/shims/stream.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

// 3. Cache local isolé pour éviter les verrous Windows Temp
config.cacheStores = [
  new FileStore({
    root: path.join(projectRoot, '.metro-cache'),
  }),
];

module.exports = config;
