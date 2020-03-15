/* eslint-disable import/prefer-default-export */

// Extracts buffer from given source and optionally clones it
export const extractBuffer = (source, clone = false) => {
  // Source is a byte-aware object
  if (source && typeof source.byteLength !== 'undefined') {
    // Determine whether source is a view or a raw buffer
    if (typeof source.buffer !== 'undefined') {
      return clone ? source.buffer.slice(0) : source.buffer;
    }
    return clone ? source.slice(0) : source;
  }

  // Source is a sequence of bytes
  if (source && typeof source.length !== 'undefined') {
    // Although Uint8Array's constructor succeeds when given strings,
    // it does not correctly instantiate the buffer
    if (source.constructor === String) {
      return null;
    }

    try {
      return (new Uint8Array(source)).buffer;
    } catch (error) {
      return null;
    }
  }

  // No buffer found
  return null;
};
