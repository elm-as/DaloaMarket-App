const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
let FileStore;
try {
  FileStore = require('metro-cache').FileStore;
} catch {
  // Expo getDefaultConfig handles caching by default if metro-cache is not found
}

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Support monorepo pnpm : on s'en remet aux valeurs par défaut d'Expo.
//
// Depuis que les paquets partagés vivent à la racine et sont déclarés en
// `workspace:*`, `getDefaultConfig` résout tout seul la bonne liste : le
// node_modules de la racine, les deux apps, et les cinq paquets. L'ancien
// `watchFolders = [monorepoRoot]` écrasait cette liste par le dépôt entier —
// d'où la surveillance de 300 000 fichiers hors périmètre, et l'alerte
// d'expo-doctor sur les entrées manquantes.

// Exclusion des dépôts non-Expo du monorepo, et de l'app sœur : rien ne doit
// se résoudre depuis ces arbres.
const exclusionPattern =
  /[/\\](DaloaDelivery|DaloaMarket-v2|partners\.daloamarket\.com|docs\.daloamarket\.ci|status\.daloamarket\.ci|tuto\.daloamarket\.com|screeshots_app|docs|apps[/\\]daloadelivery)([/\\]|$)/;

const currentBlockList = config.resolver.blockList;
config.resolver.blockList = Array.isArray(currentBlockList)
  ? [...currentBlockList, exclusionPattern]
  : currentBlockList
    ? [currentBlockList, exclusionPattern]
    : [exclusionPattern];


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
  try {
    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  } catch (err) {
    try {
      const resolved = require.resolve(moduleName, { paths: [projectRoot] });
      return {
        filePath: resolved,
        type: 'sourceFile',
      };
    } catch {
      throw err;
    }
  }
};

if (FileStore) {
  config.cacheStores = [
    new FileStore({
      root: path.join(projectRoot, '.metro-cache'),
    }),
  ];
}

module.exports = config;
