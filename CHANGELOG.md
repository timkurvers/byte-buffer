# Changelog

### v2.0.0 - March 16, 2020

- Dropped support for deprecated Node 8.
- Uses `@timkurvers/eslint-config` for linting.
- Removed `ByteBuffer.prototype.toString`.
- Usable as an ECMAScript module using `import`.

### v1.0.3 - October 27, 2014

- Configures `attr-accessor` as runtime dependency.

### v1.0.2 - October 25, 2014

- Node support.

### v1.0.1 - January 4, 2014

- Work around `Uint8Array`'s constructor behaviour when given strings.

### v1.0.0 - December 20, 2012

- Stable release.
- Byte order is now maintained when reading, slicing and cloning buffers.
- Implicit growth strategy is now maintained when cloning a buffer.
