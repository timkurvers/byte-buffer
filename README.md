# ByteBuffer

[![Version](https://img.shields.io/npm/v/byte-buffer.svg?style=flat)](https://www.npmjs.org/package/byte-buffer)
[![Build Status](https://img.shields.io/travis/timkurvers/byte-buffer.svg?style=flat)](https://travis-ci.org/timkurvers/byte-buffer)
[![Dependency Status](https://img.shields.io/gemnasium/timkurvers/byte-buffer.svg?style=flat)](https://gemnasium.com/timkurvers/byte-buffer)
[![Code Climate](https://img.shields.io/codeclimate/github/timkurvers/byte-buffer.svg?style=flat)](https://codeclimate.com/github/timkurvers/byte-buffer)

Wrapper for JavaScript's ArrayBuffer/DataView maintaining index and default endianness. Supports arbitrary reading/writing, implicit growth, clipping, cloning and reversing as well as UTF-8 characters and NULL-terminated C-strings.

Licensed under the **MIT** license, see LICENSE for more information.


## Usage & API

ByteBuffer's API borrows heavily from Adobe's [IDataInput](http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/flash/utils/IDataInput.html) and [IDataOutput](http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/flash/utils/IDataOutput.html) as well as David Flanagan's [BufferView](https://github.com/davidflanagan/BufferView).

The concept of separate buffers and views - as outlined in MDN's [JavaScript typed arrays](https://developer.mozilla.org/en/JavaScript_typed_arrays) - is *not* used. ByteBuffer handles this separation for you.


### Constants

Use the following constants to indicate endianness:

```javascript
ByteBuffer.BIG_ENDIAN
ByteBuffer.LITTLE_ENDIAN
```


### Construction

```javascript
new ByteBuffer(1) // Buffer of one byte with big-endian byte order
new ByteBuffer(1, ByteBuffer.LITTLE_ENDIAN) // Little-endian byte order instead
```

ByteBuffers may also be constructed from other byte-aware sources:

```javascript
new ByteBuffer(new ArrayBuffer(2))
new ByteBuffer(new Uint8Array(3))
new ByteBuffer(new DataView(new ArrayBuffer(4)))
new ByteBuffer(new ByteBuffer(5))
```

Or from generic sequences:

```javascript
new ByteBuffer([0, 1, 2, 3])
```

After construction a ByteBuffer's read/write index is always at the front of the buffer.

Hereafter ```b``` is assumed to be an instance of ByteBuffer.


### Properties

```javascript
b.buffer // Reference to internal ArrayBuffer
b.buffer = new ArrayBuffer(3) // Sets new buffer
```

```javascript
b.raw // Reference to raw buffer (read-only)
```

```javascript
b.view // Reference to internal DataView (read-only)
```

```javascript
b.length // Number of bytes in the buffer (read-only)
b.byteLength // Alias
```

```javascript
b.order // Buffer's current default byte order
b.order = ByteBuffer.BIG_ENDIAN // Sets byte order
```

```javascript
b.available // Number of available bytes (read-only)
```


### Index Manipulation

ByteBuffer maintains a read/write index to simplify usage.

```javascript
b.index // Current read/write index
b.index = 4 // Sets index
```

If the index is out of bounds, a RangeError will be thrown.

```javascript
b.front() // Sets index to front of the buffer
```

```javascript
b.end() // Sets index to end of the buffer
```

```javascript
b.seek(10) // Forwards ten bytes
b.seek(-2) // Backs two bytes
```

These methods may be chained:

```javascript
b.front().seek(2)
```


### Read API

All read methods default to the ByteBuffer's byte order if not given.

```javascript
b.readByte()
```
```javascript
b.readUnsignedByte()
```
```javascript
b.readShort() // Buffer's default byte order
b.readShort(ByteBuffer.LITTLE_ENDIAN) // Explicit byte order
```
```javascript
b.readUnsignedShort()
```
```javascript
b.readInt()
```
```javascript
b.readUnsignedInt()
```
```javascript
b.readFloat()
```
```javascript
b.readDouble()
```
```javascript
b.read(6) // Reads 6 bytes
b.read() // Reads all remaining bytes
```
```javascript
b.readString(5) // Reads 5 bytes as a string
b.readString() // Reads all remaining bytes as a string
b.readUTFChars() // Alias
```
```javascript
b.readCString() // Reads string up to NULL-byte or end of buffer
```


### Write API

All write methods default to the ByteBuffer's byte order if not given.

```javascript
b.writeByte(10)
```
```javascript
b.writeUnsignedByte(-10)
```
```javascript
b.writeShort(-2048)
b.writeShort(-2048, ByteBuffer.LITTLE_ENDIAN) // Explicit byte order
```
```javascript
b.writeUnsignedShort(4096)
```
```javascript
b.writeInt(-524288)
```
```javascript
b.writeUnsignedInt(1048576)
```
```javascript
b.writeFloat(13.37)
```
```javascript
b.writeDouble(1048576.89)
```
```javascript
b.write([1, 2, 3])
b.write(new ArrayBuffer(2))
b.write(new Uint8Array(3))
b.write(new ByteBuffer(5))
```

Additionally, all the above write methods may be chained:

```javascript
b.writeShort(0x2020).write([1, 2, 3])
```

The following string related methods do not return the buffer itself, but rather provide the number of bytes that were written to it. More on this under implicit growth strategy a bit further down.

```javascript
b.writeString('ByteBuffer') // Writes given string and returns number of bytes
b.writeUTFChars('ByteBuffer') // Alias
```
```javascript
b.writeCString('ByteBuffer') // Writes given string and returns number of bytes (including NULL-byte)
```


### Size Manipulation

#### Growth

The buffer may be grown at the front or at the end. When prepending, the buffer's index is adjusted accordingly.

```javascript
b.prepend(2) // Prepends given number of bytes
```
```javascript
b.append(2) // Appends given number of bytes
```


#### Implicit Growth

This feature allows a ByteBuffer to grow implicitly when writing arbitrary data. Since every implicit growth requires the buffer to be rebuilt from scratch, care must be taken when using this feature. Writing low byte-length pieces of data in rapid succession is not recommended.

To protect the unaware from harm, this feature needs to be explicitly enabled, like so:

```javascript
b = new ByteBuffer(2, ByteBuffer.BIG_ENDIAN, true) // Last argument indicates implicit growth strategy
b.writeUnsignedInt(2345102) // Implicitly makes room for 4 bytes - by growing with 2 - prior to writing
```

The implicit growth strategy can also be enabled and disabled after construction:

```javascript
b.implicitGrowth = true/false
```

Implicit growth is a must when dealing with UTF-8 encoded strings, as dealing with arbitrary user data - e.g. names or addresses - *may* include various characters that require to be encoded in multiple bytes, which would be relatively verbose to calculate beforehand.


#### Clipping

The buffer may be truncated at the front, end or both. Both arguments are optional and may be negative in which case the offsets are calculated from the respective boundaries of the buffer. The `begin`-argument defaults to the current index, allowing efficient clipping in various scenarios, e.g. when used in combination with network sockets to shift off read data. The `end`-argument defaults to the end of the buffer.

```javascript
b.clip(2, -2)
b.clip(-2, 4)
```


### Miscellaneous

```javascript
b.slice(2, 4) // Independent clone of given slice of the buffer
```
```javascript
b.clone() // Independent clone of the entire buffer
```
```javascript
b.reverse() // Reverses buffer in place
```
```javascript
b.toArray() // Changes to this array are not backed
```
```javascript
b.toString() // String representation of this buffer
```
```javascript
b.toHex() // Hexadecimal representation of this buffer, e.g: 42 79 74 65 42 75 66 66 65 72
```
```javascript
b.toASCII() // ASCII representation of this buffer, e.g:  B  y  t  e  B  u  f  f  e  r
```


## Browser Support

Theoretically any browser supporting [JavaScript's typed arrays](http://caniuse.com/#search=typed%20arrays) is supported. Unfortunately, the spec hasn't been finalized yet and as such support is limited for now.

### Fully functional

* Google Chrome 20+
* Safari 5+
* Mozilla Firefox 15+
* Opera 12.11+

### Broken

* Internet Explorer 10
  * Does not support `ArrayBuffer.slice`. Use Tim Taubert's [polyfill](https://github.com/ttaubert/node-arraybuffer-slice/blob/master/index.js).

### Not supported

* Firefox 14 and lower
  * Use David Flanagan's [DataView polyfill](https://github.com/davidflanagan/DataView.js).
* Opera 12.10 and lower
* Internet Explorer 9 and lower

### Unknown

* Internet Explorer 11

Do you have any of these setups? Please run the tests and report your findings.


## Node Support

No considerations have been made to make this project compatible with Node.. yet! Contributions are more than welcome.


## Development & Contribution

ByteBuffer is written in [CoffeeScript](http://coffeescript.org/), developed with [Grunt](http://gruntjs.com/) and tested through [BusterJS](http://busterjs.org/).

Getting this toolchain up and running, is easy and straight-forward:

1. Get the code `git clone git://github.com/timkurvers/byte-buffer.git`

2. Download and install [NodeJS](http://nodejs.org/#download) (includes NPM) for your platform.

3. Install dependencies:

   ```shell
   npm install
   ```

4. Make sure you have installed `grunt-cli` globally:

   ```shell
   npm install -g grunt-cli
   ````

5. Run `grunt` which will launch a BusterJS server, a headless PhantomJS instance and automatically build and test the project when source files change.

6. Test on actual browsers by navigating to `http://localhost:1111` and hit the capture button.


When contributing, please:

* Fork the repository
* Accompany each logical unit of operation with at least one test
* Open a pull request
* Do *not* include any distribution files (such as byte-buffer.min.js)


## Alternative Comparisons

### Christopher Chedeau's [jDataView](https://github.com/vjeux/jDataView/)

* Maintains read-index and supports seeking
* Various string/char utilities (may support UTF-8)
* Does *not* support writing values
* Does *not* support NULL-terminated C-strings
* Does *not* support growing, clipping, cloning and reversing
* Supports a wide range of browsers/setups

### David Flanagan's [BufferView](https://github.com/davidflanagan/BufferView)

* Supports reading/writing values
* Maintains index and supports seeking
* Supports UTF-8 characters
* Does *not* support NULL-terminated C-strings
* Does *not* support growing, clipping, cloning and reversing as view and buffer are immutable
