class ByteBuffer

  # Byte order constants
  @LITTLE_ENDIAN = true
  @BIG_ENDIAN    = false

  # Reference to ByteBuffer
  self = @

  # Shielded utility methods for creating getters/setters on the prototype
  get = (props) =>
    for name, getter of props
      Object.defineProperty @::, name, get: getter, enumerable: true, configurable: true

  set = (props) =>
    for name, setter of props
      Object.defineProperty @::, name, set: setter, enumerable: true, configurable: true

  # Creates a new ByteBuffer
  # - from given source (assumed to be number of bytes when numeric)
  # - with given byte order (defaults to big-endian)
  # - with given implicit growth strategy (defaults to false)
  constructor: (source=0, order=self.BIG_ENDIAN, implicitGrowth=false) ->

    # Holds buffer
    @_buffer = null

    # Holds raw buffer
    @_raw = null

    # Holds internal view for reading/writing
    @_view = null

    # Holds byte order
    @_order = !!order

    # Holds implicit growth strategy
    @_implicitGrowth = !!implicitGrowth

    # Holds read/write index
    @_index = 0

    # Attempt to extract a buffer from given source
    buffer = extractBuffer(source, true)

    # On failure, assume source is a primitive indicating the number of bytes
    if not buffer
      buffer = new ArrayBuffer(source)

    # Assign new buffer
    @buffer = buffer

  # Sanitizes read/write index
  _sanitizeIndex: ->
    if @_index < 0
      @_index = 0
    if @_index > @length
      @_index = @length

  # Extracts buffer from given source and optionally clones it
  extractBuffer = (source, clone=false) ->

    # Whether source is a byte-aware object
    if source.byteLength?

      # Determine whether source is a view or a raw buffer
      if source.buffer?
        return if clone then source.buffer.slice(0) else source.buffer
      else
        return if clone then source.slice(0) else source

    # Whether source is a sequence of bytes
    else if source.length?

      # Although Uint8Array's constructor succeeds when given strings,
      # it does not correctly instantiate the buffer
      return null if source.constructor is String

      try
        return (new Uint8Array(source)).buffer
      catch error
        return null

    # No buffer found
    else
      return null

  # Retrieves buffer
  get buffer: ->
    return @_buffer

  # Sets new buffer and sanitizes read/write index
  set buffer: (buffer) ->
    @_buffer = buffer
    @_raw = new Uint8Array(@_buffer)
    @_view = new DataView(@_buffer)
    @_sanitizeIndex()

  # Retrieves raw buffer
  get raw: ->
    return @_raw

  # Retrieves view
  get view: ->
    return @_view

  # Retrieves number of bytes
  get length: ->
    return @_buffer.byteLength

  # Retrieves number of bytes
  # Note: This allows for ByteBuffer to be detected as a proper source by its own constructor
  get byteLength: ->
    return @length

  # Retrieves byte order
  get order: ->
    return @_order

  # Sets byte order
  set order: (order) ->
    @_order = !!order

  # Retrieves implicit growth strategy
  get implicitGrowth: ->
    return @_implicitGrowth

  # Sets implicit growth strategy
  set implicitGrowth: (implicitGrowth) ->
    @_implicitGrowth = !!implicitGrowth

  # Retrieves read/write index
  get index: ->
    return @_index

  # Sets read/write index
  set index: (index) ->
    if index < 0 or index > @length
      throw new RangeError('Invalid index ' + index + ', should be between 0 and ' + @length)

    @_index = index

  # Sets index to front of the buffer
  front: ->
    @_index = 0
    return @

  # Sets index to end of the buffer
  end: ->
    @_index = @length
    return @

  # Seeks given number of bytes
  # Note: Backwards seeking is supported
  seek: (bytes=1) ->
    @index += bytes
    return @

  # Retrieves number of available bytes
  get available: ->
    return @length - @_index

  # Generic reader
  reader = (method, bytes) ->
    return (order=@_order) ->
      if bytes > @available
        throw new Error('Cannot read ' + bytes + ' byte(s), ' + @available + ' available')

      value = @_view[method](@_index, order)
      @_index += bytes
      return value

  # Generic writer
  writer = (method, bytes) ->
    return (value, order=@_order) ->
      available = @available
      if bytes > available
        if @_implicitGrowth
          @append(bytes - available)
        else
          throw new Error('Cannot write ' + value + ' using ' + bytes + ' byte(s), ' + available + ' available')

      @_view[method](@_index, value, order)
      @_index += bytes
      return @

  # Readers for bytes, shorts, integers, floats and doubles
  readByte: reader('getInt8', 1)
  readUnsignedByte: reader('getUint8', 1)
  readShort: reader('getInt16', 2)
  readUnsignedShort: reader('getUint16', 2)
  readInt: reader('getInt32', 4)
  readUnsignedInt: reader('getUint32', 4)
  readFloat: reader('getFloat32', 4)
  readDouble: reader('getFloat64', 8)

  # Writers for bytes, shorts, integers, floats and doubles
  writeByte: writer('setInt8', 1)
  writeUnsignedByte: writer('setUint8', 1)
  writeShort: writer('setInt16', 2)
  writeUnsignedShort: writer('setUint16', 2)
  writeInt: writer('setInt32', 4)
  writeUnsignedInt: writer('setUint32', 4)
  writeFloat: writer('setFloat32', 4)
  writeDouble: writer('setFloat64', 8)

  # Reads sequence of given number of bytes (defaults to number of bytes available)
  read: (bytes=@available) ->
    if bytes > @available
      throw new Error('Cannot read ' + bytes + ' byte(s), ' + @available + ' available')

    if bytes <= 0
      throw new RangeError('Invalid number of bytes ' + bytes)

    value = new self(@_buffer.slice(@_index, @_index + bytes), @order)
    @_index += bytes
    return value

  # Writes sequence of bytes
  write: (sequence) ->

    # Ensure we're dealing with a Uint8Array view
    if sequence not instanceof Uint8Array

      # Extract the buffer from the sequence
      buffer = extractBuffer(sequence)
      if not buffer
        throw new TypeError('Cannot write ' + sequence + ', not a sequence')

      # And create a new Uint8Array view for it
      view = new Uint8Array(buffer)

    else
      view = sequence

    available = @available
    if view.byteLength > available
      if @_implicitGrowth
        @append(view.byteLength - available)
      else
        throw new Error('Cannot write ' + sequence + ' using ' + view.byteLength + ' byte(s), ' + @available + ' available')

    @_raw.set(view, @_index)
    @_index += view.byteLength
    return @

  # Reads UTF-8 encoded string of given number of bytes (defaults to number of bytes available)
  #
  # Based on David Flanagan's BufferView (https://github.com/davidflanagan/BufferView/blob/master/BufferView.js#L195)
  readString: (bytes=@available) ->
    if bytes > @available
      throw new Error('Cannot read ' + bytes + ' byte(s), ' + @available + ' available')

    if bytes <= 0
      throw new RangeError('Invalid number of bytes ' + bytes)

    # Local reference
    raw = @_raw

    # Holds decoded characters
    codepoints = []

    # Index into codepoints
    c = 0

    # Bytes
    b1 = b2 = b3 = b4 = null

    # Target index
    target = @_index + bytes

    while @_index < target
      b1 = raw[@_index]

      if b1 < 128
        # One byte sequence
        codepoints[c++] = b1
        @_index++

      else if b1 < 194
        throw new Error('Unexpected continuation byte')

      else if b1 < 224
        # Two byte sequence
        b2 = raw[@_index + 1]

        if b2 < 128 || b2 > 191
          throw new Error('Bad continuation byte')

        codepoints[c++] = ((b1 & 0x1F) << 6) + (b2 & 0x3F)

        @_index += 2

      else if b1 < 240
        # Three byte sequence
        b2 = raw[@_index + 1]

        if b2 < 128 || b2 > 191
          throw new Error('Bad continuation byte')

        b3 = raw[@_index + 2]

        if b3 < 128 || b3 > 191
          throw new Error('Bad continuation byte')

        codepoints[c++] = ((b1 & 0x0F) << 12) + ((b2 & 0x3F) << 6) + (b3 & 0x3F)

        @_index += 3

      else if b1 < 245
        # Four byte sequence
        b2 = raw[@_index + 1]

        if b2 < 128 || b2 > 191
          throw new Error('Bad continuation byte')

        b3 = raw[@_index + 2]

        if b3 < 128 || b3 > 191
          throw new Error('Bad continuation byte')

        b4 = raw[@_index + 3]

        if b4 < 128 || b4 > 191
          throw new Error('Bad continuation byte')

        cp = ((b1 & 0x07) << 18) + ((b2 & 0x3F) << 12) + ((b3 & 0x3F) << 6) + (b4 & 0x3F)
        cp -= 0x10000

        # Turn code point into two surrogate pairs
        codepoints[c++] = 0xD800 + ((cp & 0x0FFC00) >>> 10)
        codepoints[c++] = 0xDC00 + (cp & 0x0003FF)

        @_index += 4

      else
        throw new Error('Illegal byte')

    # Browsers may have hardcoded or implicit limits on the array length when applying a function
    # See: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/apply#apply_and_built-in_functions
    limit = 1 << 16
    length = codepoints.length
    if length < limit
      return String.fromCharCode.apply(String, codepoints)
    else
      chars = []
      i = 0
      while i < length
        chars.push String.fromCharCode.apply(String, codepoints.slice(i, i + limit))
        i += limit
      return chars.join('')

  # Writes UTF-8 encoded string
  # Note: Does not write string length or terminator
  #
  # Based on David Flanagan's BufferView (https://github.com/davidflanagan/BufferView/blob/master/BufferView.js#L264)
  writeString: (string) ->

    # Encoded UTF-8 bytes
    bytes = []

    # String length, offset and byte offset
    length = string.length
    i = 0
    b = 0

    while i < length
      c = string.charCodeAt(i)

      if c <= 0x7F
        # One byte sequence
        bytes[b++] = c

      else if c <= 0x7FF
        # Two byte sequence
        bytes[b++] = 0xC0 | ((c & 0x7C0) >>> 6)
        bytes[b++] = 0x80 | (c & 0x3F)

      else if c <= 0xD7FF || (c >= 0xE000 && c <= 0xFFFF)
        # Three byte sequence
        # Source character is not a UTF-16 surrogate
        bytes[b++] = 0xE0 | ((c & 0xF000) >>> 12)
        bytes[b++] = 0x80 | ((c & 0x0FC0) >>> 6)
        bytes[b++] = 0x80 | (c & 0x3F)

      else
        # Four byte sequence
        if i is length - 1
          throw new Error('Unpaired surrogate ' + string[i] + ' (index ' + i + ')')

        # Retrieve surrogate
        d = string.charCodeAt(++i)
        if c < 0xD800 || c > 0xDBFF || d < 0xDC00 || d > 0xDFFF
          throw new Error('Unpaired surrogate ' + string[i] + ' (index ' + i + ')')

        cp = ((c & 0x03FF) << 10) + (d & 0x03FF) + 0x10000

        bytes[b++] = 0xF0 | ((cp & 0x1C0000) >>> 18)
        bytes[b++] = 0x80 | ((cp & 0x03F000) >>> 12)
        bytes[b++] = 0x80 | ((cp & 0x000FC0) >>> 6)
        bytes[b++] = 0x80 | (cp & 0x3F)

      ++i

    @write(bytes)

    return bytes.length

  # Aliases for reading/writing UTF-8 encoded strings
  readUTFChars: @::readString
  writeUTFChars: @::writeString

  # Reads UTF-8 encoded C-string (excluding the actual NULL-byte)
  readCString: ->
    bytes = @_raw
    length = bytes.length
    i = @_index
    while bytes[i] isnt 0x00 && i < length
      ++i

    length = i - @_index
    if length > 0
      string = @readString(length)
      @readByte()
      return string

    return null

  # Writes UTF-8 encoded C-string (NULL-terminated)
  writeCString: (string) ->
    bytes = @writeString(string)
    @writeByte(0x00)
    return ++bytes

  # Prepends given number of bytes
  prepend: (bytes) ->
    if bytes <= 0
      throw new RangeError('Invalid number of bytes ' + bytes)

    view = new Uint8Array(@length + bytes)
    view.set(@_raw, bytes)
    @_index += bytes
    @buffer = view.buffer
    return @

  # Appends given number of bytes
  append: (bytes) ->
    if bytes <= 0
      throw new RangeError('Invalid number of bytes ' + bytes)

    view = new Uint8Array(@length + bytes)
    view.set(@_raw, 0)
    @buffer = view.buffer
    return @

  # Clips this buffer
  clip: (begin=@_index, end=@length) ->
    if begin < 0
      begin = @length + begin
    buffer = @_buffer.slice(begin, end)
    @_index -= begin
    @buffer = buffer
    return @

  # Slices this buffer
  slice: (begin=0, end=@length) ->
    slice = new self(@_buffer.slice(begin, end), @order)
    return slice

  # Clones this buffer
  clone: ->
    clone = new self(@_buffer.slice(0), @order, @implicitGrowth)
    clone.index = @_index
    return clone

  # Reverses this buffer
  reverse: ->
    Array::reverse.call(@_raw)
    @_index = 0
    return @

  # Array of bytes in this buffer
  toArray: ->
    return Array::slice.call(@_raw, 0)

  # Short string representation of this buffer
  toString: ->
    order = if @_order is self.BIG_ENDIAN then 'big-endian' else 'little-endian'
    return '[ByteBuffer; Order: ' + order + '; Length: ' + @length + '; Index: ' + @_index + '; Available: ' + @available + ']'

  # Hex representation of this buffer with given spacer
  toHex: (spacer=' ') ->
    return Array::map.call(@_raw, (byte) ->
      ('00' + byte.toString(16).toUpperCase()).slice(-2)
    ).join(spacer)

  # ASCII representation of this buffer with given spacer and optional byte alignment
  toASCII: (spacer=' ', align=true, unknown='\uFFFD') ->
    prefix = if align then ' ' else ''
    return Array::map.call(@_raw, (byte) ->
      return if (byte < 0x20 || byte > 0x7E) then prefix + unknown else prefix + String.fromCharCode(byte)
    ).join(spacer)
