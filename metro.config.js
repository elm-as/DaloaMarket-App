const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Regarder tous les fichiers dans le monorepo
config.watchFolders = [workspaceRoot];

// 2. Laisser Metro résoudre les packages node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Forcer Metro à résoudre les packages du workspace
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
