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

buster.spec.expose()

describe 'ByteBuffer', ->

  it 'can be constructed in various ways', ->
    b = new ByteBuffer()
    expect(b.length).toEqual(0)
    
    b = new ByteBuffer(1)
    expect(b.length).toEqual(1)
    
    b = new ByteBuffer(new ArrayBuffer(2))
    expect(b.length).toEqual(2)
    
    b = new ByteBuffer(new Uint8Array(3))
    expect(b.length).toEqual(3)

  it 'has a (default) byte order', ->
    expect(ByteBuffer.BIG_ENDIAN).toEqual(false)
    expect(ByteBuffer.LITTLE_ENDIAN).toEqual(true)
  
    b = new ByteBuffer()
    expect(b.order).toEqual(ByteBuffer.BIG_ENDIAN)
  
    b = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN)
    expect(b.order).toEqual(ByteBuffer.BIG_ENDIAN)
    
    b = new ByteBuffer(0, ByteBuffer.LITTLE_ENDIAN)
    expect(b.order).toEqual(ByteBuffer.LITTLE_ENDIAN)
