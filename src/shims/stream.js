// Polyfill shim pour Metro bundler en environnement React Native
class EventEmitter {
  on() { return this; }
  once() { return this; }
  off() { return this; }
  emit() { return false; }
  removeListener() { return this; }
  removeAllListeners() { return this; }
}

class Stream extends EventEmitter {
  pipe(dest) { return dest; }
}

class Duplex extends Stream {}
class Readable extends Stream {}
class Writable extends Stream {}
class Transform extends Stream {}
class PassThrough extends Stream {}

module.exports = Stream;
module.exports.Stream = Stream;
module.exports.Duplex = Duplex;
module.exports.Readable = Readable;
module.exports.Writable = Writable;
module.exports.Transform = Transform;
module.exports.PassThrough = PassThrough;
