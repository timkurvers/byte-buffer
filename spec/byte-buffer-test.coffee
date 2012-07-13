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
    b.order = ByteBuffer.BIG_ENDIAN
    expect(b.order).toEqual(ByteBuffer.BIG_ENDIAN)

  it 'has a controllable read/write index', ->
    b = new ByteBuffer(8)
    expect(b.index).toEqual(0)
    
    expect(->
      b.index = -1
    ).toThrow('RangeError')
    
    expect(->
      b.index = 9
    ).toThrow('RangeError')
    
    expect(b.front().index).toEqual(0)
    expect(b.end().index).toEqual(8)
  
  it 'can be written to and read from in big-endian', ->
    b = new ByteBuffer(26)
    
    b.writeByte(-1 << 7)
    b.writeUnsignedByte(1 << 7)
    b.writeShort(-1 << 15)
    b.writeUnsignedShort(1 << 15)
    b.writeInt(-1 << 30)
    b.writeUnsignedInt(1 << 30)
    b.writeFloat(Math.PI)
    b.writeDouble(Math.PI)
    
    b.index = 0
    
    expect(b.readByte()).toEqual(-1 << 7)
    expect(b.readUnsignedByte()).toEqual(1 << 7)
    expect(b.readShort()).toEqual(-1 << 15)
    expect(b.readUnsignedShort()).toEqual(1 << 15)
    expect(b.readInt()).toEqual(-1 << 30)
    expect(b.readUnsignedInt()).toEqual(1 << 30)
    expect(b.readFloat()).toBeNear(Math.PI, 0.0000001)
    expect(b.readDouble()).toBeNear(Math.PI, 0)

  it 'can be written to and read from in little-endian', ->
    b = new ByteBuffer(26, ByteBuffer.LITTLE_ENDIAN)
    
    b.writeByte(-1 << 7)
    b.writeUnsignedByte(1 << 7)
    b.writeShort(-1 << 15)
    b.writeUnsignedShort(1 << 15)
    b.writeInt(-1 << 30)
    b.writeUnsignedInt(1 << 30)
    b.writeFloat(Math.PI)
    b.writeDouble(Math.PI)
    
    b.index = 0
    
    expect(b.readByte()).toEqual(-1 << 7)
    expect(b.readUnsignedByte()).toEqual(1 << 7)
    expect(b.readShort()).toEqual(-1 << 15)
    expect(b.readUnsignedShort()).toEqual(1 << 15)
    expect(b.readInt()).toEqual(-1 << 30)
    expect(b.readUnsignedInt()).toEqual(1 << 30)
    expect(b.readFloat()).toBeNear(Math.PI, 0.0000001)
    expect(b.readDouble()).toBeNear(Math.PI, 0)

  it 'can be written to and read from with different byte orders', ->
    b = new ByteBuffer(8, ByteBuffer.LITTLE_ENDIAN)
    
    b.writeShort(-128, ByteBuffer.BIG_ENDIAN)
    b.writeUnsignedShort(128, ByteBuffer.LITTLE_ENDIAN)
    
    b.index = 0
    
    expect(b.readShort(ByteBuffer.LITTLE_ENDIAN)).toEqual(-32513)
    expect(b.readUnsignedShort(ByteBuffer.BIG_ENDIAN)).toEqual(32768)
    
    b.index = 0

    expect(b.readShort(ByteBuffer.BIG_ENDIAN)).toEqual(-128)
    expect(b.readUnsignedShort(ByteBuffer.LITTLE_ENDIAN)).toEqual(128)
  
  it '//can read and write UTF-8 strings', ->
    # TODO: Assertions
  
  it '//can read and write NULL-terminated C-strings', ->
    # TODO: Assertions
  
  it 'can skip bytes', ->
    b = new ByteBuffer(4)
    expect(b.skip().index).toEqual(1)
    expect(b.skip(2).index).toEqual(3)
    
    expect(->
      b.skip(2)
    ).toThrow('RangeError')
  
  it 'has the amount of bytes available', ->
    b = new ByteBuffer(8)
    expect(b.available).toEqual(8)
    
    b.index = 4
    expect(b.available).toEqual(4)
    
    expect(b.end().available).toEqual(0)
  
  it 'has writers that can be chained', ->
    b = new ByteBuffer(26)
    expect(
      b.writeByte(0)
       .writeUnsignedByte(0)
       .writeShort(0)
       .writeUnsignedShort(0)
       .writeInt(0)
       .writeUnsignedInt(0)
       .writeFloat(0)
       .writeDouble(0)
    ).toBe(b)
