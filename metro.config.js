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

// Support monorepo pnpm : inclure la racine du monorepo pour résoudre les packages partagés
config.watchFolders = [monorepoRoot];
config.resolver.unstable_enableSymlinks = true;
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

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

// Force a single canonical module instance across monorepo workspace packages (prevents duplicate React hooks crashes on web)
const SINGLETON_PACKAGES = [
  'react',
  'react-dom',
  'react-native',
  'react-native-web',
  'react-native-svg',
  'react-native-safe-area-context',
  '@tanstack/react-query',
  'zustand',
  '@supabase/supabase-js',
];
const SINGLETON_PROJECT_ENTRY = path.join(projectRoot, 'package.json');

function isSingletonModule(moduleName) {
  return SINGLETON_PACKAGES.some(
    (pkg) => moduleName === pkg || moduleName.startsWith(`${pkg}/`),
  );
}

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
  const effectiveContext = isSingletonModule(moduleName)
    ? { ...context, originModulePath: SINGLETON_PROJECT_ENTRY }
    : context;
  try {
    if (originalResolveRequest) {
      return originalResolveRequest(effectiveContext, moduleName, platform);
    }
    return effectiveContext.resolveRequest(effectiveContext, moduleName, platform);
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

const NON_BUNDLE_PATHS = new Set(['/hot', '/symbolicate', '/assets']);

/**
 * Redirige les routes SPA envoyées par le client HMR Web (?platform=web sans .bundle)
 * vers /index.bundle pour empêcher HmrServer de résoudre une URL de page comme module.
 */
function rewriteHmrSpaUrl(urlString) {
  let parsed;
  try {
    parsed = urlString.startsWith('/') ? new URL(urlString, 'http://localhost') : new URL(urlString);
  } catch {
    return urlString;
  }
  if (!parsed.searchParams.has('platform')) return urlString;

  const entry = parsed.searchParams.get('bundleEntry');
  if (entry && (entry === '/' || (entry.startsWith('/') && !/\.(bundle|js|ts|tsx|jsx)$/.test(entry)))) {
    parsed.searchParams.set('bundleEntry', 'index.bundle');
    return urlString.startsWith('/') ? `${parsed.pathname}${parsed.search}${parsed.hash}` : parsed.toString();
  }

  const { pathname } = parsed;
  const isMetroAssetOrBundle =
    NON_BUNDLE_PATHS.has(pathname) ||
    pathname.startsWith('/assets/') ||
    /\.(bundle|map|delta|assets)$/.test(pathname);
  if (isMetroAssetOrBundle) return urlString;

  parsed.pathname = '/index.bundle';
  return urlString.startsWith('/') ? `${parsed.pathname}${parsed.search}${parsed.hash}` : parsed.toString();
}

const defaultRewriteRequestUrl = config.server?.rewriteRequestUrl;
config.server = {
  ...config.server,
  rewriteRequestUrl: (requestUrl) => {
    const rewritten = defaultRewriteRequestUrl ? defaultRewriteRequestUrl(requestUrl) : requestUrl;
    return rewriteHmrSpaUrl(rewritten);
  },
};

module.exports = config;
