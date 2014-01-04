buster.spec.expose()
expect = buster.expect

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

    b = new ByteBuffer(new Uint16Array(1))
    expect(b.length).toEqual(2)

    b = new ByteBuffer([0, 1, 2, 3])
    expect(b.length).toEqual(4)

    b = new ByteBuffer(b)
    expect(b.length).toEqual(4)

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

  it 'will maintain byte order when reading, slicing and cloning', ->
    b = new ByteBuffer(1)
    expect(b.read().order).toEqual(ByteBuffer.BIG_ENDIAN)
    expect(b.slice().order).toEqual(ByteBuffer.BIG_ENDIAN)
    expect(b.clone().order).toEqual(ByteBuffer.BIG_ENDIAN)

    b = new ByteBuffer(1, ByteBuffer.LITTLE_ENDIAN)
    expect(b.read().order).toEqual(ByteBuffer.LITTLE_ENDIAN)
    expect(b.slice().order).toEqual(ByteBuffer.LITTLE_ENDIAN)
    expect(b.clone().order).toEqual(ByteBuffer.LITTLE_ENDIAN)

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

  it 'can seek', ->
    b = new ByteBuffer(4)
    expect(b.seek().index).toEqual(1)
    expect(b.seek(2).index).toEqual(3)
    expect(b.seek(-1).index).toEqual(2)

    expect(->
      b.seek(3)
    ).toThrow('RangeError')

  it 'has the number of bytes available', ->
    b = new ByteBuffer(8)
    expect(b.available).toEqual(8)

    b.index = 4
    expect(b.available).toEqual(4)

    expect(b.end().available).toEqual(0)

  it 'can read and write in big-endian', ->
    b = new ByteBuffer(26)

    b.writeByte(-1 << 7)
    b.writeUnsignedByte(1 << 7)
    b.writeShort(-1 << 15)
    b.writeUnsignedShort(1 << 15)
    b.writeInt(-1 << 30)
    b.writeUnsignedInt(1 << 30)
    b.writeFloat(Math.PI)
    b.writeDouble(Math.PI)

    b.front()

    expect(b.readByte()).toEqual(-1 << 7)
    expect(b.readUnsignedByte()).toEqual(1 << 7)
    expect(b.readShort()).toEqual(-1 << 15)
    expect(b.readUnsignedShort()).toEqual(1 << 15)
    expect(b.readInt()).toEqual(-1 << 30)
    expect(b.readUnsignedInt()).toEqual(1 << 30)
    expect(b.readFloat()).toBeNear(Math.PI, 0.0000001)
    expect(b.readDouble()).toBeNear(Math.PI, 0)

  it 'can read and write in little-endian', ->
    b = new ByteBuffer(26, ByteBuffer.LITTLE_ENDIAN)

    b.writeByte(-1 << 7)
    b.writeUnsignedByte(1 << 7)
    b.writeShort(-1 << 15)
    b.writeUnsignedShort(1 << 15)
    b.writeInt(-1 << 30)
    b.writeUnsignedInt(1 << 30)
    b.writeFloat(Math.PI)
    b.writeDouble(Math.PI)

    b.front()

    expect(b.readByte()).toEqual(-1 << 7)
    expect(b.readUnsignedByte()).toEqual(1 << 7)
    expect(b.readShort()).toEqual(-1 << 15)
    expect(b.readUnsignedShort()).toEqual(1 << 15)
    expect(b.readInt()).toEqual(-1 << 30)
    expect(b.readUnsignedInt()).toEqual(1 << 30)
    expect(b.readFloat()).toBeNear(Math.PI, 0.0000001)
    expect(b.readDouble()).toBeNear(Math.PI, 0)

  it 'can read and write with different byte orders arbitrarily', ->
    b = new ByteBuffer(4, ByteBuffer.LITTLE_ENDIAN)

    b.writeShort(-128, ByteBuffer.BIG_ENDIAN)
    b.writeUnsignedShort(128, ByteBuffer.LITTLE_ENDIAN)

    b.front()

    expect(b.readShort(ByteBuffer.LITTLE_ENDIAN)).toEqual(-32513)
    expect(b.readUnsignedShort(ByteBuffer.BIG_ENDIAN)).toEqual(32768)

    b.front()

    expect(b.readShort(ByteBuffer.BIG_ENDIAN)).toEqual(-128)
    expect(b.readUnsignedShort(ByteBuffer.LITTLE_ENDIAN)).toEqual(128)

    expect(->
      b.readByte()
    ).toThrow('Error')

  it 'can read and write byte sequences', ->
    b = new ByteBuffer(8)

    expect(->
      b.write(666)
    ).toThrow('TypeError')

    expect(->
      b.write('unwritable')
    ).toThrow('TypeError')

    b.write(new Uint8Array([1, 2]))
    b.write(new Uint16Array([(1 << 16) - 1]))
    b.write(new ByteBuffer([3, 4]))
    b.write([13, 37])

    b.front()

    expect(b.read(1).toArray()).toEqual([1])

    b.seek(1)

    expect(b.read(2).toArray()).toEqual([255, 255])
    expect(b.read().toArray()).toEqual([3, 4, 13, 37])

    expect(->
      b.read(1)
    ).toThrow('Error')

    expect(->
      b.read(-1)
    ).toThrow('RangeError')

  it 'can read and write UTF-8 strings', ->
    b = new ByteBuffer(22)

    expect(b.writeString('Byte $\u00A2\u20AC\uD834\uDDC7 Buffer')).toEqual(22)
    expect(b.index).toEqual(22)
    expect(b.toHex()).toEqual('42 79 74 65 20 24 C2 A2 E2 82 AC F0 9D 87 87 20 42 75 66 66 65 72')

    b.front()

    expect(b.readString()).toEqual('Byte $\u00A2\u20AC\uD834\uDDC7 Buffer')

    b = new ByteBuffer(262140)
    long = (new Array(1 << 16)).join('\uD834\uDDC7')
    expect(b.writeString(long)).toEqual(262140)

    b.front()

    expect(b.readString()).toEqual(long)

    expect(->
      b.readString(-1)
    ).toThrow('RangeError')

  it 'can read and write NULL-terminated C-strings', ->
    b = new ByteBuffer(27)

    expect(b.writeCString('Byte $\u00A2\u20AC\uD834\uDDC7 Buffer')).toEqual(23)
    b.writeUnsignedInt(10)

    b.front()

    expect(b.readCString()).toEqual('Byte $\u00A2\u20AC\uD834\uDDC7 Buffer')
    expect(b.available).toEqual(4)

  it 'has writers that can be chained', ->
    b = new ByteBuffer(28)
    expect(
      b.writeByte(0)
       .writeUnsignedByte(0)
       .writeShort(0)
       .writeUnsignedShort(0)
       .writeInt(0)
       .writeUnsignedInt(0)
       .writeFloat(0)
       .writeDouble(0)
       .write([0, 0])
    ).toBe(b)

  it 'can grow', ->
    b = new ByteBuffer([1, 2])

    expect(b.prepend(2).toArray()).toEqual([0, 0, 1, 2])
    expect(b.index).toEqual(2)

    expect(b.append(2).toArray()).toEqual([0, 0, 1, 2, 0, 0])
    expect(b.index).toEqual(2)

  it 'will grow implicitly', ->
    b = new ByteBuffer(2, ByteBuffer.BIG_ENDIAN, true)
    expect(b.implicitGrowth).toEqual(true)
    expect(b.writeUnsignedInt(0).length).toEqual(4)

    b.implicitGrowth = false

    expect(->
      b.writeDouble(0)
    ).toThrow('Error')

    b.implicitGrowth = true
    b.append(1)

    expect(b.writeString('Byte $\u00A2\u20AC\uD834\uDDC7 Buffer')).toEqual(22)
    expect(b.length).toEqual(26)

  it 'will maintain implicit growth strategy when cloning', ->
    b = new ByteBuffer()
    expect(b.clone().implicitGrowth).toEqual(false)

    b.implicitGrowth = true

    expect(b.clone().implicitGrowth).toEqual(true)

  it 'can be clipped', ->
    b = new ByteBuffer([1, 2, 3, 4, 5, 6])

    b.index = 1

    expect(b.clip().toArray()).toEqual([2, 3, 4, 5, 6])
    expect(b.index).toEqual(0)

    b.index = 2

    expect(b.clip(1).toArray()).toEqual([3, 4, 5, 6])
    expect(b.index).toEqual(1)

    b.end()

    expect(b.clip(0, -2).toArray()).toEqual([3, 4])
    expect(b.index).toEqual(2)

  it 'can be sliced', ->
    b = new ByteBuffer([1, 2, 3, 4, 5, 6])

    expect(b.slice().toArray()).toEqual([1, 2, 3, 4, 5, 6])
    expect(b.slice(1).toArray()).toEqual([2, 3, 4, 5, 6])
    expect(b.slice(2, -2).toArray()).toEqual([3, 4])

    expect(b.slice()).not.toBe(b)

  it 'can be cloned', ->
    b = new ByteBuffer(3)
    b.end()

    clone = b.clone()
    expect(clone).toEqual(b)
    expect(clone).not.toBe(b)

  it 'can be reversed', ->
    b = new ByteBuffer([1, 2, 3])
    b.end()

    expect(b.reverse().toArray()).toEqual([3, 2, 1])
    expect(b.index).toEqual(0)

  it 'has various representations', ->
    b = new ByteBuffer([245, 66, 121, 116, 101, 215, 66, 117, 102, 102, 101, 114, 0])

    expect(b.toArray()).toEqual([245, 66, 121, 116, 101, 215, 66, 117, 102, 102, 101, 114, 0])

    expect(b.toHex())  .toEqual('F5 42 79 74 65 D7 42 75 66 66 65 72 00')
    expect(b.toASCII()).toEqual(' \uFFFD  B  y  t  e  \uFFFD  B  u  f  f  e  r  \uFFFD')

    expect(b.toHex(''))  .toEqual('F542797465D742756666657200')
    expect(b.toASCII('')).toEqual(' \uFFFD B y t e \uFFFD B u f f e r \uFFFD')

    expect(b.toASCII('', false)).toEqual('\uFFFDByte\uFFFDBuffer\uFFFD')

  it 'can be extended', ->

    class NetworkPacket extends ByteBuffer

    p = new NetworkPacket(1)

    expect(p.order).toEqual(ByteBuffer.BIG_ENDIAN)
    expect(p.read().constructor).toEqual(ByteBuffer)
    expect(p.clone().constructor).toEqual(ByteBuffer)