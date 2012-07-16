ByteBuffer
==========

Wrapper for JavaScript's ArrayBuffer/DataView maintaining index and default endianness. Supports arbitrary reading/writing, automatic growth, slicing, cloning and reversing as well as UTF-8 characters and NULL-terminated C-strings.

Licensed under the **MIT** license, see LICENSE for more information.


Usage & API
-----------

ByteBuffer's API borrows heavily from Adobe's [IDataInput](http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/flash/utils/IDataInput.html) and [IDataOutput](http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/flash/utils/IDataOutput.html) as well as David Flanagan's [BufferView](https://github.com/davidflanagan/BufferView).

The concept of separate buffers and views - as outlined in MDN's [JavaScript typed arrays](https://developer.mozilla.org/en/JavaScript_typed_arrays) - is *not* used. ByteBuffer handles this separation for you.


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
b.buffer // Reference to internal ArrayBuffer (read-only)
```

```javascript
b.view // Reference to internal DataView (read-only)
```

```javascript
b.length // Number of bytes in the buffer (read-only)
b.byteLength
```

```javascript
b.order // Default byte order
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
b.front() : ByteBuffer // Sets index to front of the buffer, returns buffer itself
```

```javascript
b.end() : ByteBuffer // Sets index to end of the buffer, returns buffer itself
```

```javascript
b.skip(10) : ByteBuffer // Skips ten bytes
b.skip(-2) : ByteBuffer // Reverts two bytes
```


### Read API

All read methods default to the ByteBuffer's byte order if not given.

```javascript
b.readByte(optional order) : byte
```
```javascript
b.readUnsignedByte(optional order) : byte
```
```javascript
b.readShort(optional order) : short
```
```javascript
b.readUnsignedShort(optional order) : short
```
```javascript
b.readInt(optional order) : int
```
```javascript
b.readUnsignedInt(optional order) : int
```
```javascript
b.readFloat(optional order) : float
```
```javascript
b.readDouble(optional order) : double
```
```javascript
b.read(optional bytes) : ByteBuffer // Defaults to available number of bytes
```
```javascript
b.readString(optional bytes) : String // Defaults to available number of bytes
b.readUTFChars(optional bytes) : String
```
```javascript
b.readCString() : String // Reads string up to NULL-byte or end of buffer
```


### Write API

All write methods default to the ByteBuffer's byte order if not given.

```javascript
b.writeByte(byte, optional order) : ByteBuffer
```
```javascript
b.writeUnsignedByte(byte, optional order) : ByteBuffer
```
```javascript
b.writeShort(short, optional order) : ByteBuffer
```
```javascript
b.writeUnsignedShort(short, optional order) : ByteBuffer
```
```javascript
b.writeInt(int, optional order) : ByteBuffer
```
```javascript
b.writeUnsignedInt(int, optional order) : ByteBuffer
```
```javascript
b.writeFloat(float, optional order) : ByteBuffer
```
```javascript
b.writeDouble(double, optional order) : ByteBuffer
```
```javascript
b.write(byte sequence) : ByteBuffer
```
```javascript
b.writeString(string) : int // Returns number of bytes
b.writeUTFChars(string) : int
```
```javascript
b.writeCString(string) : int // Returns number of bytes (including NULL-byte)
```


### Miscellaneous

```javascript
b.toArray() : Array // Changes to this array are not backed
```
```javascript
b.toString() : String
```
```javascript
b.toHex(optional spacer) : String
```
```javascript
b.toASCII(optional spacer) : String
```


Browser Support
---------------

Theoretically any browser supporting [JavaScript's typed arrays](http://caniuse.com/#search=typed%20arrays) is supported. Unfortunately, the spec hasn't been finalized yet and as such support is limited for now.

### Fully functional

* Chrome v20.0.1132 (OSX / Windows)
* Safari v5.1.7 (OSX)

### Partially broken

* Opera v12.0 (OSX)
  * Does not support ArrayBuffer.slice

### Broken

* Firefox v14.0 (OSX / Windows)
  * Does not yet [support DataView](https://developer.mozilla.org/en/JavaScript_typed_arrays/DataView#Browser_compatibility)
  * Using David Flanagan's [DataView polyfill](https://github.com/davidflanagan/DataView.js) for Firefox 4.x may be useful

### Not yet tested

* Internet Explorer 10 (Windows)

### Not supported

* Internet Explorer 9 and lower (Windows)

Do you have any of these setups? Please run the tests and report your findings.


Node Support
------------

No considerations have been made to make this project compatible with Node.. yet! Contributions are more than welcome.


Development & Contribution
--------------------------

ByteBuffer is written in [CoffeeScript](http://coffeescript.org/), developed with [Grunt](http://gruntjs.com/) and tested through [BusterJS](http://busterjs.org/).

Getting this toolchain up and running, is easy and straight-forward:

1. Get the code `git clone git://github.com/timkurvers/byte-buffer.git`

2. Download and install [NodeJS](http://nodejs.org/#download) (includes NPM) for your platform.

3. Install the following modules:

   ```shell
   npm install coffee-script
   npm install grunt
   npm install buster
   ```
   
   Note: If you'd rather install these modules globally, append the -g flag to the above commands.

4. Verify availability of the following binaries:
   
   ```shell
   which coffee
   which grunt
   which buster
   ```

5. Testing requires running `buster server` in a separate terminal window.

6. Navigate to the listed address (normally localhost:1111) with at least one browser and hit the capture button. Each browser you capture will be tested against.

7. Run `grunt` which - when source files change - will automatically compile the CoffeeScript source files, lint these as well as run tests using BusterJS.

When contributing, please:

* Fork the repository
* Accompany each logical unit of operation with at least one test
* Open a pull request
* Do *not* include any distribution files (such as byte-buffer.min.js)


Alternative Comparisons
-----------------------

### Christopher Chedeau's [jDataView](https://github.com/vjeux/jDataView/)

* Maintains read-index and supports seeking
* Various string/char utilities (may support UTF-8)
* Does *not* support writing values
* Does *not* support NULL-terminated C-strings
* Does *not* support growing, slicing, cloning and reversing
* Supports a wide range of browsers/setups

### David Flanagan's [BufferView](https://github.com/davidflanagan/BufferView)

* Supports reading/writing values
* Maintains index and supports seeking
* Supports UTF-8 characters
* Does *not* support NULL-terminated C-strings
* Does *not* support growing, slicing, cloning and reversing as view and buffer are immutable
