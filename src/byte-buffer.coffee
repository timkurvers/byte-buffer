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
  
  # Byte order constants
  @LITTLE_ENDIAN = true
  @BIG_ENDIAN    = false
  
  # Shielded utility methods for creating getters/setters on the prototype
  getter = (name, getter) =>
    Object.defineProperty @::, name, get: getter, enumerable: true, configurable: true
  
  setter = (name, setter) =>
    Object.defineProperty @::, name, set: setter, enumerable: true, configurable: true
  
  # Creates a new ByteBuffer from given source (assumed to be amount of bytes when numeric)
  constructor: (source=0, order=@constructor.BIG_ENDIAN) ->
    
    # Holds raw buffer
    @_buffer = null
    
    # Holds internal view for reading/writing
    @_view = null
    
    # Holds byte order
    @order = order
    
    # Determine whether source is a byte-aware object or a primitive
    if source.byteLength?
      
      # Determine whether source is a view or a raw buffer
      if source.buffer?
        # TODO: Support creating ByteBuffer from another ByteBuffer
        @_buffer = source.buffer.slice(0)
      else
        @_buffer = source.slice(0)
      
    else
      
      # Let's assume number of bytes
      @_buffer = new ArrayBuffer(source)
    
    # Set up fresh view for buffer
    @_view = new DataView(@_buffer)
  
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
