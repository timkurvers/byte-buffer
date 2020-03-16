/**
* byte-buffer v2.0.0
* Copyright (c) 2012-2020 Tim Kurvers <tim@moonsphere.net>
* @license MIT
*
* Wrapper for JavaScript's ArrayBuffer/DataView.
*
* https://github.com/timkurvers/byte-buffer
*/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.ByteBuffer = factory());
}(this, (function () { 'use strict';

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  /* eslint-disable import/prefer-default-export */
  // Extracts buffer from given source and optionally clones it
  var extractBuffer = function extractBuffer(source) {
    var clone = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    // Source is a byte-aware object
    if (source && typeof source.byteLength !== 'undefined') {
      // Determine whether source is a view or a raw buffer
      if (typeof source.buffer !== 'undefined') {
        return clone ? source.buffer.slice(0) : source.buffer;
      }

      return clone ? source.slice(0) : source;
    } // Source is a sequence of bytes


    if (source && typeof source.length !== 'undefined') {
      // Although Uint8Array's constructor succeeds when given strings,
      // it does not correctly instantiate the buffer
      if (source.constructor === String) {
        return null;
      }

      try {
        return new Uint8Array(source).buffer;
      } catch (error) {
        return null;
      }
    } // No buffer found


    return null;
  };

  var ByteBuffer = /*#__PURE__*/function () {
    // Creates a new ByteBuffer
    // - from given source (assumed to be number of bytes when numeric)
    // - with given byte order (defaults to big-endian)
    // - with given implicit growth strategy (defaults to false)
    function ByteBuffer() {
      var source = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var order = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.constructor.BIG_ENDIAN;
      var implicitGrowth = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      _classCallCheck(this, ByteBuffer);

      // Holds buffer
      this._buffer = null; // Holds raw buffer

      this._raw = null; // Holds internal view for reading/writing

      this._view = null; // Holds byte order

      this._order = !!order; // Holds implicit growth strategy

      this._implicitGrowth = !!implicitGrowth; // Holds read/write index

      this._index = 0; // Attempt to extract a buffer from given source

      var buffer = extractBuffer(source, true); // On failure, assume source is a primitive indicating the number of bytes

      if (!buffer) {
        buffer = new ArrayBuffer(source);
      } // Assign new buffer


      this.buffer = buffer;
    } // Sanitizes read/write index


    _createClass(ByteBuffer, [{
      key: "_sanitizeIndex",
      value: function _sanitizeIndex() {
        if (this._index < 0) {
          this._index = 0;
        }

        if (this._index > this.length) {
          this._index = this.length;
        }
      } // Retrieves buffer

    }, {
      key: "front",
      // Sets index to front of the buffer
      value: function front() {
        this._index = 0;
        return this;
      } // Sets index to end of the buffer

    }, {
      key: "end",
      value: function end() {
        this._index = this.length;
        return this;
      } // Seeks given number of bytes
      // Note: Backwards seeking is supported

    }, {
      key: "seek",
      value: function seek() {
        var bytes = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
        this.index += bytes;
        return this;
      } // Reads sequence of given number of bytes (defaults to number of bytes available)

    }, {
      key: "read",
      value: function read() {
        var bytes = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.available;

        if (bytes > this.available) {
          throw new Error("Cannot read ".concat(bytes, " byte(s), ").concat(this.available, " available"));
        }

        if (bytes <= 0) {
          throw new RangeError("Invalid number of bytes ".concat(bytes));
        }

        var value = new ByteBuffer(this._buffer.slice(this._index, this._index + bytes), this.order);
        this._index += bytes;
        return value;
      } // Writes sequence of bytes

    }, {
      key: "write",
      value: function write(sequence) {
        var view; // Ensure we're dealing with a Uint8Array view

        if (!(sequence instanceof Uint8Array)) {
          // Extract the buffer from the sequence
          var buffer = extractBuffer(sequence);

          if (!buffer) {
            throw new TypeError("Cannot write ".concat(sequence, ", not a sequence"));
          } // And create a new Uint8Array view for it


          view = new Uint8Array(buffer);
        } else {
          view = sequence;
        }

        var available = this.available;

        if (view.byteLength > available) {
          if (this._implicitGrowth) {
            this.append(view.byteLength - available);
          } else {
            throw new Error("Cannot write ".concat(sequence, " using ").concat(view.byteLength, " byte(s), ").concat(this.available, " available"));
          }
        }

        this._raw.set(view, this._index);

        this._index += view.byteLength;
        return this;
      } // Reads UTF-8 encoded string of given number of bytes (defaults to number of bytes available)
      //
      // Based on David Flanagan's BufferView (https://github.com/davidflanagan/BufferView/blob/master/BufferView.js//L195)

    }, {
      key: "readString",
      value: function readString() {
        var bytes = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.available;

        if (bytes > this.available) {
          throw new Error("Cannot read ".concat(bytes, " byte(s), ").concat(this.available, " available"));
        }

        if (bytes <= 0) {
          throw new RangeError("Invalid number of bytes ".concat(bytes));
        } // Local reference


        var raw = this._raw; // Holds decoded characters

        var codepoints = []; // Index into codepoints

        var c = 0; // Bytes

        var b1 = null;
        var b2 = null;
        var b3 = null;
        var b4 = null; // Target index

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

            var cp = ((b1 & 0x07) << 18) + ((b2 & 0x3F) << 12) + ((b3 & 0x3F) << 6) + (b4 & 0x3F);
            cp -= 0x10000; // Turn code point into two surrogate pairs

            codepoints[c++] = 0xD800 + ((cp & 0x0FFC00) >>> 10);
            codepoints[c++] = 0xDC00 + (cp & 0x0003FF);
            this._index += 4;
          } else {
            throw new Error('Illegal byte');
          }
        } // Browsers may have hardcoded or implicit limits on the array length when applying a function
        // See: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/apply//apply_and_built-in_functions


        var limit = 1 << 16;
        var length = codepoints.length;

        if (length < limit) {
          return String.fromCharCode.apply(String, codepoints);
        }

        var chars = [];
        var i = 0;

        while (i < length) {
          chars.push(String.fromCharCode.apply(String, codepoints.slice(i, i + limit)));
          i += limit;
        }

        return chars.join('');
      } // Writes UTF-8 encoded string
      // Note: Does not write string length or terminator
      //
      // Based on David Flanagan's BufferView (https://github.com/davidflanagan/BufferView/blob/master/BufferView.js//L264)

    }, {
      key: "writeString",
      value: function writeString(string) {
        // Encoded UTF-8 bytes
        var bytes = []; // String length, offset and byte offset

        var length = string.length;
        var i = 0;
        var b = 0;

        while (i < length) {
          var c = string.charCodeAt(i);

          if (c <= 0x7F) {
            // One byte sequence
            bytes[b++] = c;
          } else if (c <= 0x7FF) {
            // Two byte sequence
            bytes[b++] = 0xC0 | (c & 0x7C0) >>> 6;
            bytes[b++] = 0x80 | c & 0x3F;
          } else if (c <= 0xD7FF || c >= 0xE000 && c <= 0xFFFF) {
            // Three byte sequence
            // Source character is not a UTF-16 surrogate
            bytes[b++] = 0xE0 | (c & 0xF000) >>> 12;
            bytes[b++] = 0x80 | (c & 0x0FC0) >>> 6;
            bytes[b++] = 0x80 | c & 0x3F;
          } else {
            // Four byte sequence
            if (i === length - 1) {
              throw new Error("Unpaired surrogate ".concat(string[i], " (index ").concat(i, ")"));
            } // Retrieve surrogate


            var d = string.charCodeAt(++i);

            if (c < 0xD800 || c > 0xDBFF || d < 0xDC00 || d > 0xDFFF) {
              throw new Error("Unpaired surrogate ".concat(string[i], " (index ").concat(i, ")"));
            }

            var cp = ((c & 0x03FF) << 10) + (d & 0x03FF) + 0x10000;
            bytes[b++] = 0xF0 | (cp & 0x1C0000) >>> 18;
            bytes[b++] = 0x80 | (cp & 0x03F000) >>> 12;
            bytes[b++] = 0x80 | (cp & 0x000FC0) >>> 6;
            bytes[b++] = 0x80 | cp & 0x3F;
          }

          ++i;
        }

        this.write(bytes);
        return bytes.length;
      } // Aliases for reading/writing UTF-8 encoded strings
      // readUTFChars: this.::readString
      // writeUTFChars: this.::writeString
      // Reads UTF-8 encoded C-string (excluding the actual NULL-byte)

    }, {
      key: "readCString",
      value: function readCString() {
        var bytes = this._raw;
        var length = bytes.length;
        var i = this._index;

        while (bytes[i] !== 0x00 && i < length) {
          ++i;
        }

        length = i - this._index;

        if (length > 0) {
          var string = this.readString(length);
          this.readByte();
          return string;
        }

        return null;
      } // Writes UTF-8 encoded C-string (NULL-terminated)

    }, {
      key: "writeCString",
      value: function writeCString(string) {
        var bytes = this.writeString(string);
        this.writeByte(0x00);
        return ++bytes;
      } // Prepends given number of bytes

    }, {
      key: "prepend",
      value: function prepend(bytes) {
        if (bytes <= 0) {
          throw new RangeError("Invalid number of bytes ".concat(bytes));
        }

        var view = new Uint8Array(this.length + bytes);
        view.set(this._raw, bytes);
        this._index += bytes;
        this.buffer = view.buffer;
        return this;
      } // Appends given number of bytes

    }, {
      key: "append",
      value: function append(bytes) {
        if (bytes <= 0) {
          throw new RangeError("Invalid number of bytes ".concat(bytes));
        }

        var view = new Uint8Array(this.length + bytes);
        view.set(this._raw, 0);
        this.buffer = view.buffer;
        return this;
      } // Clips this buffer

    }, {
      key: "clip",
      value: function clip() {
        var begin = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this._index;
        var end = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.length;

        if (begin < 0) {
          begin = this.length + begin;
        }

        var buffer = this._buffer.slice(begin, end);

        this._index -= begin;
        this.buffer = buffer;
        return this;
      } // Slices this buffer

    }, {
      key: "slice",
      value: function slice() {
        var begin = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var end = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.length;
        var slice = new ByteBuffer(this._buffer.slice(begin, end), this.order);
        return slice;
      } // Clones this buffer

    }, {
      key: "clone",
      value: function clone() {
        var clone = new ByteBuffer(this._buffer.slice(0), this.order, this.implicitGrowth);
        clone.index = this._index;
        return clone;
      } // Reverses this buffer

    }, {
      key: "reverse",
      value: function reverse() {
        Array.prototype.reverse.call(this._raw);
        this._index = 0;
        return this;
      } // Array of bytes in this buffer

    }, {
      key: "toArray",
      value: function toArray() {
        return Array.prototype.slice.call(this._raw, 0);
      } // Hex representation of this buffer with given spacer

    }, {
      key: "toHex",
      value: function toHex() {
        var spacer = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : ' ';
        return Array.prototype.map.call(this._raw, function (byte) {
          return "00".concat(byte.toString(16).toUpperCase()).slice(-2);
        }).join(spacer);
      } // ASCII representation of this buffer with given spacer and optional byte alignment

    }, {
      key: "toASCII",
      value: function toASCII() {
        var spacer = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : ' ';
        var align = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
        var unknown = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "\uFFFD";
        var prefix = align ? ' ' : '';
        return Array.prototype.map.call(this._raw, function (byte) {
          return byte < 0x20 || byte > 0x7E ? prefix + unknown : prefix + String.fromCharCode(byte);
        }).join(spacer);
      }
    }, {
      key: "buffer",
      get: function get() {
        return this._buffer;
      } // Sets new buffer and sanitizes read/write index
      ,
      set: function set(buffer) {
        this._buffer = buffer;
        this._raw = new Uint8Array(this._buffer);
        this._view = new DataView(this._buffer);

        this._sanitizeIndex();
      } // Retrieves raw buffer

    }, {
      key: "raw",
      get: function get() {
        return this._raw;
      } // Retrieves view

    }, {
      key: "view",
      get: function get() {
        return this._view;
      } // Retrieves number of bytes

    }, {
      key: "length",
      get: function get() {
        return this._buffer.byteLength;
      } // Retrieves number of bytes
      // Note: This allows for ByteBuffer to be detected as a proper source by its own constructor

    }, {
      key: "byteLength",
      get: function get() {
        return this.length;
      } // Retrieves byte order

    }, {
      key: "order",
      get: function get() {
        return this._order;
      } // Sets byte order
      ,
      set: function set(order) {
        this._order = !!order;
      } // Retrieves implicit growth strategy

    }, {
      key: "implicitGrowth",
      get: function get() {
        return this._implicitGrowth;
      } // Sets implicit growth strategy
      ,
      set: function set(implicitGrowth) {
        this._implicitGrowth = !!implicitGrowth;
      } // Retrieves read/write index

    }, {
      key: "index",
      get: function get() {
        return this._index;
      } // Sets read/write index
      ,
      set: function set(index) {
        if (index < 0 || index > this.length) {
          throw new RangeError("Invalid index ".concat(index, ", should be between 0 and ").concat(this.length));
        }

        this._index = index;
      } // Retrieves number of available bytes

    }, {
      key: "available",
      get: function get() {
        return this.length - this._index;
      }
    }]);

    return ByteBuffer;
  }(); // Generic reader


  var reader = function reader(method, bytes) {
    return function () {
      var order = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this._order;

      if (bytes > this.available) {
        throw new Error("Cannot read ".concat(bytes, " byte(s), ").concat(this.available, " available"));
      }

      var value = this._view[method](this._index, order);

      this._index += bytes;
      return value;
    };
  }; // Generic writer


  var writer = function writer(method, bytes) {
    return function (value) {
      var order = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this._order;
      var available = this.available;

      if (bytes > available) {
        if (this._implicitGrowth) {
          this.append(bytes - available);
        } else {
          throw new Error("Cannot write ".concat(value, " using ").concat(bytes, " byte(s), ").concat(available, " available"));
        }
      }

      this._view[method](this._index, value, order);

      this._index += bytes;
      return this;
    };
  }; // Byte order constants


  ByteBuffer.LITTLE_ENDIAN = true;
  ByteBuffer.BIG_ENDIAN = false; // Readers for bytes, shorts, integers, floats and doubles

  ByteBuffer.prototype.readByte = reader('getInt8', 1);
  ByteBuffer.prototype.readUnsignedByte = reader('getUint8', 1);
  ByteBuffer.prototype.readShort = reader('getInt16', 2);
  ByteBuffer.prototype.readUnsignedShort = reader('getUint16', 2);
  ByteBuffer.prototype.readInt = reader('getInt32', 4);
  ByteBuffer.prototype.readUnsignedInt = reader('getUint32', 4);
  ByteBuffer.prototype.readFloat = reader('getFloat32', 4);
  ByteBuffer.prototype.readDouble = reader('getFloat64', 8); // Writers for bytes, shorts, integers, floats and doubles

  ByteBuffer.prototype.writeByte = writer('setInt8', 1);
  ByteBuffer.prototype.writeUnsignedByte = writer('setUint8', 1);
  ByteBuffer.prototype.writeShort = writer('setInt16', 2);
  ByteBuffer.prototype.writeUnsignedShort = writer('setUint16', 2);
  ByteBuffer.prototype.writeInt = writer('setInt32', 4);
  ByteBuffer.prototype.writeUnsignedInt = writer('setUint32', 4);
  ByteBuffer.prototype.writeFloat = writer('setFloat32', 4);
  ByteBuffer.prototype.writeDouble = writer('setFloat64', 8);

  return ByteBuffer;

})));
