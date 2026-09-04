const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const { FileStore } = require('metro-cache');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Shims pour modules Node.js (ws, zlib, stream)
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  stream: path.resolve(projectRoot, 'src/shims/stream.js'),
  ws: path.resolve(projectRoot, 'src/shims/ws.js'),
  zlib: path.resolve(projectRoot, 'src/shims/zlib.js'),
};

const originalResolveRequest = config.resolver.resolveRequest;
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
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

config.cacheStores = [
  new FileStore({
    root: path.join(projectRoot, '.metro-cache'),
  }),
];

module.exports = config;
