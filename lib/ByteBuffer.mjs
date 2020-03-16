/* eslint-disable lines-between-class-members, no-param-reassign, prefer-spread */

import { extractBuffer } from './utils';

class ByteBuffer {
  // Creates a new ByteBuffer
  // - from given source (assumed to be number of bytes when numeric)
  // - with given byte order (defaults to big-endian)
  // - with given implicit growth strategy (defaults to false)
  constructor(source = 0, order = this.constructor.BIG_ENDIAN, implicitGrowth = false) {
    // Holds buffer
    this._buffer = null;

    // Holds raw buffer
    this._raw = null;

    // Holds internal view for reading/writing
    this._view = null;

    // Holds byte order
    this._order = !!order;

    // Holds implicit growth strategy
    this._implicitGrowth = !!implicitGrowth;

    // Holds read/write index
    this._index = 0;

    // Attempt to extract a buffer from given source
    let buffer = extractBuffer(source, true);

    // On failure, assume source is a primitive indicating the number of bytes
    if (!buffer) {
      buffer = new ArrayBuffer(source);
    }

    // Assign new buffer
    this.buffer = buffer;
  }

  // Sanitizes read/write index
  _sanitizeIndex() {
    if (this._index < 0) {
      this._index = 0;
    }
    if (this._index > this.length) {
      this._index = this.length;
    }
  }

  // Retrieves buffer
  get buffer() {
    return this._buffer;
  }

  // Sets new buffer and sanitizes read/write index
  set buffer(buffer) {
    this._buffer = buffer;
    this._raw = new Uint8Array(this._buffer);
    this._view = new DataView(this._buffer);
    this._sanitizeIndex();
  }

  // Retrieves raw buffer
  get raw() {
    return this._raw;
  }

  // Retrieves view
  get view() {
    return this._view;
  }

  // Retrieves number of bytes
  get length() {
    return this._buffer.byteLength;
  }

  // Retrieves number of bytes
  // Note: This allows for ByteBuffer to be detected as a proper source by its own constructor
  get byteLength() {
    return this.length;
  }

  // Retrieves byte order
  get order() {
    return this._order;
  }

  // Sets byte order
  set order(order) {
    this._order = !!order;
  }

  // Retrieves implicit growth strategy
  get implicitGrowth() {
    return this._implicitGrowth;
  }

  // Sets implicit growth strategy
  set implicitGrowth(implicitGrowth) {
    this._implicitGrowth = !!implicitGrowth;
  }

  // Retrieves read/write index
  get index() {
    return this._index;
  }

  // Sets read/write index
  set index(index) {
    if (index < 0 || index > this.length) {
      throw new RangeError(`Invalid index ${index}, should be between 0 and ${this.length}`);
    }

    this._index = index;
  }

  // Retrieves number of available bytes
  get available() {
    return this.length - this._index;
  }

  // Sets index to front of the buffer
  front() {
    this._index = 0;
    return this;
  }

  // Sets index to end of the buffer
  end() {
    this._index = this.length;
    return this;
  }

  // Seeks given number of bytes
  // Note: Backwards seeking is supported
  seek(bytes = 1) {
    this.index += bytes;
    return this;
  }

  // Reads sequence of given number of bytes (defaults to number of bytes available)
  read(bytes = this.available) {
    if (bytes > this.available) {
      throw new Error(`Cannot read ${bytes} byte(s), ${this.available} available`);
    }

    if (bytes <= 0) {
      throw new RangeError(`Invalid number of bytes ${bytes}`);
    }

    const value = new ByteBuffer(this._buffer.slice(this._index, this._index + bytes), this.order);
    this._index += bytes;
    return value;
  }

  // Writes sequence of bytes
  write(sequence) {
    let view;

    // Ensure we're dealing with a Uint8Array view
    if (!(sequence instanceof Uint8Array)) {
      // Extract the buffer from the sequence
      const buffer = extractBuffer(sequence);
      if (!buffer) {
        throw new TypeError(`Cannot write ${sequence}, not a sequence`);
      }

      // And create a new Uint8Array view for it
      view = new Uint8Array(buffer);
    } else {
      view = sequence;
    }

    const { available } = this;
    if (view.byteLength > available) {
      if (this._implicitGrowth) {
        this.append(view.byteLength - available);
      } else {
        throw new Error(`Cannot write ${sequence} using ${view.byteLength} byte(s), ${this.available} available`);
      }
    }

    this._raw.set(view, this._index);
    this._index += view.byteLength;
    return this;
  }

  // Reads UTF-8 encoded string of given number of bytes (defaults to number of bytes available)
  //
  // Based on David Flanagan's BufferView (https://github.com/davidflanagan/BufferView/blob/master/BufferView.js//L195)
  readString(bytes = this.available) {
    if (bytes > this.available) {
      throw new Error(`Cannot read ${bytes} byte(s), ${this.available} available`);
    }

    if (bytes <= 0) {
      throw new RangeError(`Invalid number of bytes ${bytes}`);
    }

    // Local reference
    const raw = this._raw;

    // Holds decoded characters
    const codepoints = [];

    // Index into codepoints
    let c = 0;

    // Bytes
    let b1 = null;
    let b2 = null;
    let b3 = null;
    let b4 = null;

    // Target index
    const target = this._index + bytes;

    while (this._index < target) {
      b1 = raw[this._index];

      if (b1 < 128) {
        // One byte sequence
        codepoints[c++] = b1;
        this._index++;
      } else if (b1 < 194) {
        throw new Error('Unexpected continuation byte');
      } else if (b1 < 224) {
        // Two byte sequence
        b2 = raw[this._index + 1];

        if (b2 < 128 || b2 > 191) {
          throw new Error('Bad continuation byte');
        }

        codepoints[c++] = ((b1 & 0x1F) << 6) + (b2 & 0x3F);

        this._index += 2;
      } else if (b1 < 240) {
        // Three byte sequence
        b2 = raw[this._index + 1];

        if (b2 < 128 || b2 > 191) {
          throw new Error('Bad continuation byte');
        }

        b3 = raw[this._index + 2];

        if (b3 < 128 || b3 > 191) {
          throw new Error('Bad continuation byte');
        }

        codepoints[c++] = ((b1 & 0x0F) << 12) + ((b2 & 0x3F) << 6) + (b3 & 0x3F);

        this._index += 3;
      } else if (b1 < 245) {
        // Four byte sequence
        b2 = raw[this._index + 1];

        if (b2 < 128 || b2 > 191) {
          throw new Error('Bad continuation byte');
        }

        b3 = raw[this._index + 2];

        if (b3 < 128 || b3 > 191) {
          throw new Error('Bad continuation byte');
        }

        b4 = raw[this._index + 3];

        if (b4 < 128 || b4 > 191) {
          throw new Error('Bad continuation byte');
        }

        let cp = ((b1 & 0x07) << 18) + ((b2 & 0x3F) << 12) + ((b3 & 0x3F) << 6) + (b4 & 0x3F);
        cp -= 0x10000;

        // Turn code point into two surrogate pairs
        codepoints[c++] = 0xD800 + ((cp & 0x0FFC00) >>> 10);
        codepoints[c++] = 0xDC00 + (cp & 0x0003FF);

        this._index += 4;
      } else {
        throw new Error('Illegal byte');
      }
    }

    // Browsers may have hardcoded or implicit limits on the array length when applying a function
    // See: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/apply//apply_and_built-in_functions
    const limit = 1 << 16;
    const { length } = codepoints;
    if (length < limit) {
      return String.fromCharCode.apply(String, codepoints);
    }
    const chars = [];
    let i = 0;
    while (i < length) {
      chars.push(String.fromCharCode.apply(String, codepoints.slice(i, i + limit)));
      i += limit;
    }
    return chars.join('');
  }

  // Writes UTF-8 encoded string
  // Note: Does not write string length or terminator
  //
  // Based on David Flanagan's BufferView (https://github.com/davidflanagan/BufferView/blob/master/BufferView.js//L264)
  writeString(string) {
    // Encoded UTF-8 bytes
    const bytes = [];

    // String length, offset and byte offset
    const { length } = string;
    let i = 0;
    let b = 0;

    while (i < length) {
      const c = string.charCodeAt(i);

      if (c <= 0x7F) {
        // One byte sequence
        bytes[b++] = c;
      } else if (c <= 0x7FF) {
        // Two byte sequence
        bytes[b++] = 0xC0 | ((c & 0x7C0) >>> 6);
        bytes[b++] = 0x80 | (c & 0x3F);
      } else if (c <= 0xD7FF || (c >= 0xE000 && c <= 0xFFFF)) {
        // Three byte sequence
        // Source character is not a UTF-16 surrogate
        bytes[b++] = 0xE0 | ((c & 0xF000) >>> 12);
        bytes[b++] = 0x80 | ((c & 0x0FC0) >>> 6);
        bytes[b++] = 0x80 | (c & 0x3F);
      } else {
        // Four byte sequence
        if (i === length - 1) {
          throw new Error(`Unpaired surrogate ${string[i]} (index ${i})`);
        }

        // Retrieve surrogate
        const d = string.charCodeAt(++i);
        if (c < 0xD800 || c > 0xDBFF || d < 0xDC00 || d > 0xDFFF) {
          throw new Error(`Unpaired surrogate ${string[i]} (index ${i})`);
        }

        const cp = ((c & 0x03FF) << 10) + (d & 0x03FF) + 0x10000;

        bytes[b++] = 0xF0 | ((cp & 0x1C0000) >>> 18);
        bytes[b++] = 0x80 | ((cp & 0x03F000) >>> 12);
        bytes[b++] = 0x80 | ((cp & 0x000FC0) >>> 6);
        bytes[b++] = 0x80 | (cp & 0x3F);
      }

      ++i;
    }

    this.write(bytes);

    return bytes.length;
  }

  // Aliases for reading/writing UTF-8 encoded strings
  // readUTFChars: this.::readString
  // writeUTFChars: this.::writeString

  // Reads UTF-8 encoded C-string (excluding the actual NULL-byte)
  readCString() {
    const bytes = this._raw;
    let { length } = bytes;
    let i = this._index;
    while (bytes[i] !== 0x00 && i < length) {
      ++i;
    }

    length = i - this._index;
    if (length > 0) {
      const string = this.readString(length);
      this.readByte();
      return string;
    }

    return null;
  }

  // Writes UTF-8 encoded C-string (NULL-terminated)
  writeCString(string) {
    let bytes = this.writeString(string);
    this.writeByte(0x00);
    return ++bytes;
  }

  // Prepends given number of bytes
  prepend(bytes) {
    if (bytes <= 0) {
      throw new RangeError(`Invalid number of bytes ${bytes}`);
    }

    const view = new Uint8Array(this.length + bytes);
    view.set(this._raw, bytes);
    this._index += bytes;
    this.buffer = view.buffer;
    return this;
  }

  // Appends given number of bytes
  append(bytes) {
    if (bytes <= 0) {
      throw new RangeError(`Invalid number of bytes ${bytes}`);
    }

    const view = new Uint8Array(this.length + bytes);
    view.set(this._raw, 0);
    this.buffer = view.buffer;
    return this;
  }

  // Clips this buffer
  clip(begin = this._index, end = this.length) {
    if (begin < 0) {
      begin = this.length + begin;
    }
    const buffer = this._buffer.slice(begin, end);
    this._index -= begin;
    this.buffer = buffer;
    return this;
  }

  // Slices this buffer
  slice(begin = 0, end = this.length) {
    const slice = new ByteBuffer(this._buffer.slice(begin, end), this.order);
    return slice;
  }

  // Clones this buffer
  clone() {
    const clone = new ByteBuffer(this._buffer.slice(0), this.order, this.implicitGrowth);
    clone.index = this._index;
    return clone;
  }

  // Reverses this buffer
  reverse() {
    Array.prototype.reverse.call(this._raw);
    this._index = 0;
    return this;
  }

  // Array of bytes in this buffer
  toArray() {
    return Array.prototype.slice.call(this._raw, 0);
  }

  // Hex representation of this buffer with given spacer
  toHex(spacer = ' ') {
    return Array.prototype.map.call(this._raw, (byte) => (
      `00${byte.toString(16).toUpperCase()}`.slice(-2)
    )).join(spacer);
  }

  // ASCII representation of this buffer with given spacer and optional byte alignment
  toASCII(spacer = ' ', align = true, unknown = '\uFFFD') {
    const prefix = (align) ? ' ' : '';
    return Array.prototype.map.call(this._raw, (byte) => (
      (byte < 0x20 || byte > 0x7E) ? prefix + unknown : prefix + String.fromCharCode(byte)
    )).join(spacer);
  }
}

// Generic reader
const reader = function (method, bytes) {
  return function (order = this._order) {
    if (bytes > this.available) {
      throw new Error(`Cannot read ${bytes} byte(s), ${this.available} available`);
    }

    const value = this._view[method](this._index, order);
    this._index += bytes;
    return value;
  };
};

// Generic writer
const writer = function (method, bytes) {
  return function (value, order = this._order) {
    const { available } = this;
    if (bytes > available) {
      if (this._implicitGrowth) {
        this.append(bytes - available);
      } else {
        throw new Error(`Cannot write ${value} using ${bytes} byte(s), ${available} available`);
      }
    }

    this._view[method](this._index, value, order);
    this._index += bytes;
    return this;
  };
};

// Byte order constants
ByteBuffer.LITTLE_ENDIAN = true;
ByteBuffer.BIG_ENDIAN = false;

// Readers for bytes, shorts, integers, floats and doubles
ByteBuffer.prototype.readByte = reader('getInt8', 1);
ByteBuffer.prototype.readUnsignedByte = reader('getUint8', 1);
ByteBuffer.prototype.readShort = reader('getInt16', 2);
ByteBuffer.prototype.readUnsignedShort = reader('getUint16', 2);
ByteBuffer.prototype.readInt = reader('getInt32', 4);
ByteBuffer.prototype.readUnsignedInt = reader('getUint32', 4);
ByteBuffer.prototype.readFloat = reader('getFloat32', 4);
ByteBuffer.prototype.readDouble = reader('getFloat64', 8);

// Writers for bytes, shorts, integers, floats and doubles
ByteBuffer.prototype.writeByte = writer('setInt8', 1);
ByteBuffer.prototype.writeUnsignedByte = writer('setUint8', 1);
ByteBuffer.prototype.writeShort = writer('setInt16', 2);
ByteBuffer.prototype.writeUnsignedShort = writer('setUint16', 2);
ByteBuffer.prototype.writeInt = writer('setInt32', 4);
ByteBuffer.prototype.writeUnsignedInt = writer('setUint32', 4);
ByteBuffer.prototype.writeFloat = writer('setFloat32', 4);
ByteBuffer.prototype.writeDouble = writer('setFloat64', 8);

export default ByteBuffer;
