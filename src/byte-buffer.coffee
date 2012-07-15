#
# ByteBuffer v0.0.1
# Copyright (c) 2012 Tim Kurvers <http://moonsphere.net>
#
# Wrapper for ArrayBuffer/DataView maintaining index and default endianness.
# Supports arbitrary reading/writing, automatic growth, slicing, cloning and
# reversing as well as UTF-8 characters and NULL-terminated C-strings.
#
# The contents of this file are subject to the MIT License, under which
# this library is licensed. See the LICENSE file for the full license.
#

class ByteBuffer
  'use strict'
  
  # Byte order constants
  @LITTLE_ENDIAN = true
  @BIG_ENDIAN    = false
  
  # Shielded utility methods for creating getters/setters on the prototype
  getter = (name, getter) =>
    Object.defineProperty @::, name, get: getter, enumerable: true, configurable: true
  
  setter = (name, setter) =>
    Object.defineProperty @::, name, set: setter, enumerable: true, configurable: true
  
  # Creates a new ByteBuffer
  # - from given source (assumed to be amount of bytes when numeric)
  # - with given byte order (defaults to big-endian)
  constructor: (source=0, order=@constructor.BIG_ENDIAN, implicitGrowth=true) ->
    
    # Holds buffer
    @_buffer = null
    
    # Holds raw buffer
    @_raw = null
    
    # Holds internal view for reading/writing
    @_view = null
    
    # Holds byte order
    @_order = order
    
    # Holds read/write index
    @_index = 0
    
    # Attempt to extract a buffer from given source
    buffer = extractBuffer(source, true)
    
    # On failure, assume source is a primitive indicating the number of bytes
    if not buffer
      buffer = new ArrayBuffer(source)
    
    # Set up state
    @_setup(buffer)
  
  # Sets up properties for given buffer
  _setup: (buffer) ->
    @_buffer = buffer
    @_raw = new Uint8Array(@_buffer)
    @_view = new DataView(@_buffer)
  
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
      try
        return (new Uint8Array(source)).buffer
      catch error
        return null
    
    # No buffer found
    else
      return null
  
  # Retrieves buffer
  getter 'buffer', ->
    return @_buffer
  
  # Retrieves view
  getter 'view', ->
    return @_view
  
  # Retrieves number of bytes
  getter 'length', ->
    return @_buffer.byteLength
  
  # Retrieves number of bytes
  # Note: This allows for ByteBuffer to be detected as a proper source by its own constructor
  getter 'byteLength', ->
    return @length

  # Retrieves byte order
  getter 'order', ->
    return @_order
  
  # Sets byte order
  setter 'order', (order) ->
    @_order = !!order

  # Retrieves read/write index
  getter 'index', ->
    return @_index
  
  # Sets read/write index
  setter 'index', (index) ->
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
  
  # Skips given number of bytes
  skip: (bytes=1) ->
    @index += bytes
    return @
  
  # Retrieves number of available bytes
  getter 'available', ->
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
      if bytes > @available
        throw new Error('Cannot write ' + value + ' using ' + bytes + ' byte(s), ' + @available + ' available')
      
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
  
  # Reads sequence of given number of bytes
  read: (bytes=@available) ->
    if bytes > @available
      throw new Error('Cannot read ' + bytes + ' byte(s), ' + @available + ' available')
    
    value = new @constructor(@_buffer.slice(@_index, @_index + bytes))
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
      sequence = new Uint8Array(buffer)
    
    if sequence.byteLength > @available
      throw new Error('Cannot write ' + sequence + ' using ' + sequence.byteLength + ' byte(s), ' + @available + ' available')
    
    @_raw.set(sequence, @_index)
    @_index += sequence.byteLength
    return @
  
  # Generates an array of bytes of this buffer
  toArray: ->
    return Array::slice.call(@_raw, 0)

  # Generates (short) string representation of this buffer
  toString: ->
    order = if @_order is @constructor.BIG_ENDIAN then 'big-endian' else 'little-endian'
    return '[ByteBuffer; Order: ' + order + '; Length: ' + @length + '; Index: ' + @_index + ']'
