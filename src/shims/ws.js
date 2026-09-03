// Polyfill shim pour ws vers WebSocket global React Native
module.exports = global.WebSocket || class WebSocket {};
