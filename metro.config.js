const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const { FileStore } = require('metro-cache');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Regarder tous les dossiers du monorepo
config.watchFolders = [workspaceRoot];

// 2. Résolution stricte à instance unique (empêche le conflit Dual React et findNodeHandle)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];


config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  '@daloa/ui': path.resolve(workspaceRoot, 'packages/ui'),
  '@daloa/api': path.resolve(workspaceRoot, 'packages/api'),
  '@daloa/types': path.resolve(workspaceRoot, 'packages/types'),
  '@daloa/config': path.resolve(workspaceRoot, 'packages/config'),
  '@daloa/utils': path.resolve(workspaceRoot, 'packages/utils'),
};

// 3. Cache local isolé pour éviter les verrous Windows Temp
config.cacheStores = [
  new FileStore({
    root: path.join(projectRoot, '.metro-cache'),
  }),
];

module.exports = config;
