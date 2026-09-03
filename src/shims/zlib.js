// Shim pour le module zlib de Node.js dans l'environnement React Native
module.exports = {
  deflate: (buf, cb) => cb && cb(null, buf),
  inflate: (buf, cb) => cb && cb(null, buf),
  deflateRaw: (buf, cb) => cb && cb(null, buf),
  inflateRaw: (buf, cb) => cb && cb(null, buf),
  gzip: (buf, cb) => cb && cb(null, buf),
  gunzip: (buf, cb) => cb && cb(null, buf),
  createDeflate: () => ({ on: () => {}, write: () => {}, end: () => {}, pipe: () => {} }),
  createInflate: () => ({ on: () => {}, write: () => {}, end: () => {}, pipe: () => {} }),
  createDeflateRaw: () => ({ on: () => {}, write: () => {}, end: () => {}, pipe: () => {} }),
  createInflateRaw: () => ({ on: () => {}, write: () => {}, end: () => {}, pipe: () => {} }),
  createGzip: () => ({ on: () => {}, write: () => {}, end: () => {}, pipe: () => {} }),
  createGunzip: () => ({ on: () => {}, write: () => {}, end: () => {}, pipe: () => {} }),
  constants: {},
};
