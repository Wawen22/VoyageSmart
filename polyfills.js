// Polyfills for server-side rendering

if (typeof global !== 'undefined' && typeof global.self === 'undefined') {
  global.self = global;
}

if (typeof window === 'undefined') {
  global.window = {};
}

if (typeof document === 'undefined') {
  global.document = {};
}

if (typeof navigator === 'undefined') {
  global.navigator = {};
}
