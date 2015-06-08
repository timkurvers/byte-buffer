/**
 * byte-buffer v1.0.3
 * Copyright (c) 2012-2015 Tim Kurvers <tim@moonsphere.net>
 *
 * Wrapper for JavaScript's ArrayBuffer/DataView.
 *
 * Licensed under the MIT license.
 */

!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.ByteBuffer=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var ByteBuffer = (function () {

  // Creates a new ByteBuffer
  // - from given source (assumed to be number of bytes when numeric)
  // - with given byte order (defaults to big-endian)
  // - with given implicit growth strategy (defaults to false)

  function ByteBuffer() {
    var source = arguments[0] === undefined ? 0 : arguments[0];
    var order = arguments[1] === undefined ? this.constructor.BIG_ENDIAN : arguments[1];
    var implicitGrowth = arguments[2] === undefined ? false : arguments[2];

    _classCallCheck(this, ByteBuffer);

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
    var buffer = this._extractBuffer(source, true);

    // On failure, assume source is a primitive indicating the number of bytes
    if (!buffer) {
      buffer = new ArrayBuffer(source);
    }

    // Assign new buffer
    this.buffer = buffer;
  }

  _createClass(ByteBuffer, [{
    key: '_sanitizeIndex',

    // Sanitizes read/write index
    value: function _sanitizeIndex() {
      if (this._index < 0) {
        this._index = 0;
      }
      if (this._index > this.length) {
        this._index = this.length;
      }
    }
  }, {
    key: '_extractBuffer',

    // Extracts buffer from given source and optionally clones it
    value: function _extractBuffer(source) {
      var clone = arguments[1] === undefined ? false : arguments[1];

      // Whether source is a byte-aware object
      if (source && typeof source.byteLength !== 'undefined') {

        // Determine whether source is a view or a raw buffer
        if (typeof source.buffer !== 'undefined') {
          return clone ? source.buffer.slice(0) : source.buffer;
        } else {
          return clone ? source.slice(0) : source;
        }

        // Whether source is a sequence of bytes
      } else if (source && typeof source.length !== 'undefined') {

        // Although Uint8Array's constructor succeeds when given strings,
        // it does not correctly instantiate the buffer
        if (source.constructor == String) {
          return null;
        }

        try {
          return new Uint8Array(source).buffer;
        } catch (error) {
          return null;
        }

        // No buffer found
      } else {
        return null;
      }
    }
  }, {
    key: 'front',

    // Sets index to front of the buffer
    value: function front() {
      this._index = 0;
      return this;
    }
  }, {
    key: 'end',

    // Sets index to end of the buffer
    value: function end() {
      this._index = this.length;
      return this;
    }
  }, {
    key: 'seek',

    // Seeks given number of bytes
    // Note: Backwards seeking is supported
    value: function seek() {
      var bytes = arguments[0] === undefined ? 1 : arguments[0];

      this.index += bytes;
      return this;
    }
  }, {
    key: 'read',

    // Reads sequence of given number of bytes (defaults to number of bytes available)
    value: function read() {
      var bytes = arguments[0] === undefined ? this.available : arguments[0];

      if (bytes > this.available) {
        throw new Error('Cannot read ' + bytes + ' byte(s), ' + this.available + ' available');
      }

      if (bytes <= 0) {
        throw new RangeError('Invalid number of bytes ' + bytes);
      }

      var value = new ByteBuffer(this._buffer.slice(this._index, this._index + bytes), this.order);
      this._index += bytes;
      return value;
    }
  }, {
    key: 'write',

    // Writes sequence of bytes
    value: function write(sequence) {
      var view;

      // Ensure we're dealing with a Uint8Array view
      if (!(sequence instanceof Uint8Array)) {

        // Extract the buffer from the sequence
        var buffer = this._extractBuffer(sequence);
        if (!buffer) {
          throw new TypeError('Cannot write ' + sequence + ', not a sequence');
        }

        // And create a new Uint8Array view for it
        view = new Uint8Array(buffer);
      } else {
        view = sequence;
      }

      var available = this.available;
      if (view.byteLength > available) {
        if (this._implicitGrowth) {
          this.append(view.byteLength - available);
        } else {
          throw new Error('Cannot write ' + sequence + ' using ' + view.byteLength + ' byte(s), ' + this.available + ' available');
        }
      }

      this._raw.set(view, this._index);
      this._index += view.byteLength;
      return this;
    }
  }, {
    key: 'readString',

    // Reads UTF-8 encoded string of given number of bytes (defaults to number of bytes available)
    //
    // Based on David Flanagan's BufferView (https://github.com/davidflanagan/BufferView/blob/master/BufferView.js//L195)
    value: function readString() {
      var bytes = arguments[0] === undefined ? this.available : arguments[0];

      if (bytes > this.available) {
        throw new Error('Cannot read ' + bytes + ' byte(s), ' + this.available + ' available');
      }

      if (bytes <= 0) {
        throw new RangeError('Invalid number of bytes ' + bytes);
      }

      // Local reference
      var raw = this._raw;

      // Holds decoded characters
      var codepoints = [];

      // Index into codepoints
      var c = 0;

      // Bytes
      var b1,
          b2,
          b3,
          b4 = null;

      // Target index
      var target = this._index + bytes;

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

          codepoints[c++] = ((b1 & 31) << 6) + (b2 & 63);

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

          codepoints[c++] = ((b1 & 15) << 12) + ((b2 & 63) << 6) + (b3 & 63);

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

          var cp = ((b1 & 7) << 18) + ((b2 & 63) << 12) + ((b3 & 63) << 6) + (b4 & 63);
          cp -= 65536;

          // Turn code point into two surrogate pairs
          codepoints[c++] = 55296 + ((cp & 1047552) >>> 10);
          codepoints[c++] = 56320 + (cp & 1023);

          this._index += 4;
        } else {
          throw new Error('Illegal byte');
        }
      }

      // Browsers may have hardcoded or implicit limits on the array length when applying a function
      // See: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/apply//apply_and_built-in_functions
      var limit = 1 << 16;
      var length = codepoints.length;
      if (length < limit) {
        return String.fromCharCode.apply(String, codepoints);
      } else {
        var chars = [];
        var i = 0;
        while (i < length) {
          chars.push(String.fromCharCode.apply(String, codepoints.slice(i, i + limit)));
          i += limit;
        }
        return chars.join('');
      }
    }
  }, {
    key: 'writeString',

    // Writes UTF-8 encoded string
    // Note: Does not write string length or terminator
    //
    // Based on David Flanagan's BufferView (https://github.com/davidflanagan/BufferView/blob/master/BufferView.js//L264)
    value: function writeString(string) {

      // Encoded UTF-8 bytes
      var bytes = [];

      // String length, offset and byte offset
      var length = string.length;
      var i = 0;
      var b = 0;

      while (i < length) {
        var c = string.charCodeAt(i);

        if (c <= 127) {
          // One byte sequence
          bytes[b++] = c;
        } else if (c <= 2047) {
          // Two byte sequence
          bytes[b++] = 192 | (c & 1984) >>> 6;
          bytes[b++] = 128 | c & 63;
        } else if (c <= 55295 || c >= 57344 && c <= 65535) {
          // Three byte sequence
          // Source character is not a UTF-16 surrogate
          bytes[b++] = 224 | (c & 61440) >>> 12;
          bytes[b++] = 128 | (c & 4032) >>> 6;
          bytes[b++] = 128 | c & 63;
        } else {
          // Four byte sequence
          if (i == length - 1) {
            throw new Error('Unpaired surrogate ' + string[i] + ' (index ' + i + ')');
          }

          // Retrieve surrogate
          var d = string.charCodeAt(++i);
          if (c < 55296 || c > 56319 || d < 56320 || d > 57343) {
            throw new Error('Unpaired surrogate ' + string[i] + ' (index ' + i + ')');
          }

          var cp = ((c & 1023) << 10) + (d & 1023) + 65536;

          bytes[b++] = 240 | (cp & 1835008) >>> 18;
          bytes[b++] = 128 | (cp & 258048) >>> 12;
          bytes[b++] = 128 | (cp & 4032) >>> 6;
          bytes[b++] = 128 | cp & 63;
        }

        ++i;
      }

      this.write(bytes);

      return bytes.length;
    }
  }, {
    key: 'readCString',

    // Aliases for reading/writing UTF-8 encoded strings
    // readUTFChars: this.::readString
    // writeUTFChars: this.::writeString

    // Reads UTF-8 encoded C-string (excluding the actual NULL-byte)
    value: function readCString() {
      var bytes = this._raw;
      var length = bytes.length;
      var i = this._index;
      while (bytes[i] != 0 && i < length) {
        ++i;
      }

      length = i - this._index;
      if (length > 0) {
        var string = this.readString(length);
        this.readByte();
        return string;
      }

      return null;
    }
  }, {
    key: 'writeCString',

    // Writes UTF-8 encoded C-string (NULL-terminated)
    value: function writeCString(string) {
      var bytes = this.writeString(string);
      this.writeByte(0);
      return ++bytes;
    }
  }, {
    key: 'prepend',

    // Prepends given number of bytes
    value: function prepend(bytes) {
      if (bytes <= 0) {
        throw new RangeError('Invalid number of bytes ' + bytes);
      }

      var view = new Uint8Array(this.length + bytes);
      view.set(this._raw, bytes);
      this._index += bytes;
      this.buffer = view.buffer;
      return this;
    }
  }, {
    key: 'append',

    // Appends given number of bytes
    value: function append(bytes) {
      if (bytes <= 0) {
        throw new RangeError('Invalid number of bytes ' + bytes);
      }

      var view = new Uint8Array(this.length + bytes);
      view.set(this._raw, 0);
      this.buffer = view.buffer;
      return this;
    }
  }, {
    key: 'clip',

    // Clips this buffer
    value: function clip() {
      var begin = arguments[0] === undefined ? this._index : arguments[0];
      var end = arguments[1] === undefined ? this.length : arguments[1];

      if (begin < 0) {
        begin = this.length + begin;
      }
      var buffer = this._buffer.slice(begin, end);
      this._index -= begin;
      this.buffer = buffer;
      return this;
    }
  }, {
    key: 'slice',

    // Slices this buffer
    value: function slice() {
      var begin = arguments[0] === undefined ? 0 : arguments[0];
      var end = arguments[1] === undefined ? this.length : arguments[1];

      var slice = new ByteBuffer(this._buffer.slice(begin, end), this.order);
      return slice;
    }
  }, {
    key: 'clone',

    // Clones this buffer
    value: function clone() {
      var clone = new ByteBuffer(this._buffer.slice(0), this.order, this.implicitGrowth);
      clone.index = this._index;
      return clone;
    }
  }, {
    key: 'reverse',

    // Reverses this buffer
    value: function reverse() {
      Array.prototype.reverse.call(this._raw);
      this._index = 0;
      return this;
    }
  }, {
    key: 'toArray',

    // Array of bytes in this buffer
    value: function toArray() {
      return Array.prototype.slice.call(this._raw, 0);
    }
  }, {
    key: 'toString',

    // Short string representation of this buffer
    value: function toString() {
      var order = this._order == this.constructor.BIG_ENDIAN ? 'big-endian' : 'little-endian';
      return '[ByteBuffer; Order: ' + order + '; Length: ' + this.length + '; Index: ' + this._index + '; Available: ' + this.available + ']';
    }
  }, {
    key: 'toHex',

    // Hex representation of this buffer with given spacer
    value: function toHex() {
      var spacer = arguments[0] === undefined ? ' ' : arguments[0];

      return Array.prototype.map.call(this._raw, function (byte) {
        return ('00' + byte.toString(16).toUpperCase()).slice(-2);
      }).join(spacer);
    }
  }, {
    key: 'toASCII',

    // ASCII representation of this buffer with given spacer and optional byte alignment
    value: function toASCII() {
      var spacer = arguments[0] === undefined ? ' ' : arguments[0];
      var align = arguments[1] === undefined ? true : arguments[1];
      var unknown = arguments[2] === undefined ? '�' : arguments[2];

      var prefix = align ? ' ' : '';
      return Array.prototype.map.call(this._raw, function (byte) {
        return byte < 32 || byte > 126 ? prefix + unknown : prefix + String.fromCharCode(byte);
      }).join(spacer);
    }
  }, {
    key: 'buffer',

    // Retrieves buffer
    get: function () {
      return this._buffer;
    },

    // Sets new buffer and sanitizes read/write index
    set: function (buffer) {
      this._buffer = buffer;
      this._raw = new Uint8Array(this._buffer);
      this._view = new DataView(this._buffer);
      this._sanitizeIndex();
    }
  }, {
    key: 'raw',

    // Retrieves raw buffer
    get: function () {
      return this._raw;
    }
  }, {
    key: 'view',

    // Retrieves view
    get: function () {
      return this._view;
    }
  }, {
    key: 'length',

    // Retrieves number of bytes
    get: function () {
      return this._buffer.byteLength;
    }
  }, {
    key: 'byteLength',

    // Retrieves number of bytes
    // Note: This allows for ByteBuffer to be detected as a proper source by its own constructor
    get: function () {
      return this.length;
    }
  }, {
    key: 'order',

    // Retrieves byte order
    get: function () {
      return this._order;
    },

    // Sets byte order
    set: function (order) {
      this._order = !!order;
    }
  }, {
    key: 'implicitGrowth',

    // Retrieves implicit growth strategy
    get: function () {
      return this._implicitGrowth;
    },

    // Sets implicit growth strategy
    set: function (implicitGrowth) {
      this._implicitGrowth = !!implicitGrowth;
    }
  }, {
    key: 'index',

    // Retrieves read/write index
    get: function () {
      return this._index;
    },

    // Sets read/write index
    set: function (index) {
      if (index < 0 || index > this.length) {
        throw new RangeError('Invalid index ' + index + ', should be between 0 and ' + this.length);
      }

      this._index = index;
    }
  }, {
    key: 'available',

    // Retrieves number of available bytes
    get: function () {
      return this.length - this._index;
    }
  }], [{
    key: 'LITTLE_ENDIAN',

    // Byte order constants
    value: true,
    enumerable: true
  }, {
    key: 'BIG_ENDIAN',
    value: false,
    enumerable: true
  }]);

  return ByteBuffer;
})();

// Generic reader
var reader = function reader(method, bytes) {
  return function () {
    var order = arguments[0] === undefined ? this._order : arguments[0];

    if (bytes > this.available) {
      throw new Error('Cannot read ' + bytes + ' byte(s), ' + this.available + ' available');
    }

    var value = this._view[method](this._index, order);
    this._index += bytes;
    return value;
  };
};

// Generic writer
var writer = function writer(method, bytes) {
  return function (value) {
    var order = arguments[1] === undefined ? this._order : arguments[1];

    var available = this.available;
    if (bytes > available) {
      if (this._implicitGrowth) {
        this.append(bytes - available);
      } else {
        throw new Error('Cannot write ' + value + ' using ' + bytes + ' byte(s), ' + available + ' available');
      }
    }

    this._view[method](this._index, value, order);
    this._index += bytes;
    return this;
  };
};

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

module.exports = ByteBuffer;
},{}]},{},[1])
(1)
});