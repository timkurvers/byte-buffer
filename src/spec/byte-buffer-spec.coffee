{expect, ByteBuffer} = require('./spec-helper')

describe 'ByteBuffer', ->

  describe '#constructor', ->
    it 'initializes by length', ->
      b = new ByteBuffer(1)
      expect(b.length).to.eq 1

    it 'initializes from an ArrayBuffer', ->
      b = new ByteBuffer(new ArrayBuffer(2))
      expect(b.length).to.eq 2

    it 'initializes from an Uint8Array', ->
      b = new ByteBuffer(new Uint8Array(3))
      expect(b.length).to.eq 3

    it 'initializes from an Uint16Array', ->
      b = new ByteBuffer(new Uint16Array(1))
      expect(b.length).to.eq 2

    it 'initializes from an array', ->
      b = new ByteBuffer([0, 1, 2, 3])
      expect(b.length).to.eq 4

    it 'initializes from another ByteBuffer', ->
      b = new ByteBuffer(new ByteBuffer(4))
      expect(b.length).to.eq 4

  describe '#order', ->
    it 'exposes byte order constants', ->
      expect(ByteBuffer.BIG_ENDIAN).to.eq false
      expect(ByteBuffer.LITTLE_ENDIAN).to.eq true

    it 'defaults to big endian', ->
      b = new ByteBuffer(1)
      expect(b.order).to.eq ByteBuffer.BIG_ENDIAN

    it 'may be provided during initialization', ->
      b = new ByteBuffer(1, ByteBuffer.BIG_ENDIAN)
      expect(b.order).to.eq ByteBuffer.BIG_ENDIAN

    it 'maintains byte order when reading, slicing and cloning', ->
      b = new ByteBuffer(1)
      expect(b.read().order).to.eq ByteBuffer.BIG_ENDIAN
      expect(b.slice().order).to.eq ByteBuffer.BIG_ENDIAN
      expect(b.clone().order).to.eq ByteBuffer.BIG_ENDIAN

      b = new ByteBuffer(1, ByteBuffer.LITTLE_ENDIAN)
      expect(b.read().order).to.eq ByteBuffer.LITTLE_ENDIAN
      expect(b.slice().order).to.eq ByteBuffer.LITTLE_ENDIAN
      expect(b.clone().order).to.eq ByteBuffer.LITTLE_ENDIAN

  describe '#order=', ->
    it 'sets byte order', ->
      b = new ByteBuffer(1, ByteBuffer.LITTLE_ENDIAN)
      expect(b.order).to.eq ByteBuffer.LITTLE_ENDIAN
      b.order = ByteBuffer.BIG_ENDIAN
      expect(b.order).to.eq ByteBuffer.BIG_ENDIAN

  describe '#index', ->
    context 'when within valid range', ->
      it 'returns read/write index', ->
        b = new ByteBuffer(8)
        expect(b.index).to.eq 0

    context 'when outside of valid range', ->
      it 'throws RangeError', ->
        b = new ByteBuffer(8)
        expect ->
          b.index = -1
        .to.throw RangeError

        expect ->
          b.index = 9
        .to.throw RangeError

  describe '#front', ->
    it 'sets read/write index to front of buffer', ->
      b = new ByteBuffer(8)
      expect(b.front().index).to.eq 0

  describe '#end', ->
    it 'sets read/write index to end of buffer', ->
      b = new ByteBuffer(8)
      expect(b.end().index).to.eq 8

  describe '#seek', ->
    context 'when within valid range', ->
      it 'seeks by relative offset', ->
        b = new ByteBuffer(4)
        expect(b.seek().index).to.eq 1
        expect(b.seek(2).index).to.eq 3
        expect(b.seek(-1).index).to.eq 2

    context 'when outside of valid range', ->
      it 'throws RangeError', ->
        b = new ByteBuffer(2)
        expect ->
          b.seek(3)
        .to.throw RangeError

  describe '#available', ->
    it 'returns number of bytes available', ->
      b = new ByteBuffer(8)
      expect(b.available).to.eq 8

      b.index = 4
      expect(b.available).to.eq 4

      expect(b.end().available).to.eq 0

  for type, value of {
    Byte:          -1 << 7
    UnsignedByte:   1 << 7
    Short:         -1 << 15
    UnsignedShort:  1 << 15
    Int:           -1 << 30
    UnsignedInt:    1 << 30
    Float:          Math.PI
    Double:         Math.PI
  }
    do (type, value) ->
      writer = "write#{type}"
      reader = "read#{type}"

      describe "#write#{type} / #read#{type}", ->
        it 'writes value, returns buffer and reads value', ->
          b = new ByteBuffer(8)
          result = b[writer](value)
          expect(result).to.eq b
          if type in ['Float', 'Double']
            expect(b.front()[reader]()).to.be.closeTo value, 0.0000001
          else
            expect(b.front()[reader]()).to.eq value

        context 'when writing and no bytes available', ->
          it 'throws Error', ->
            b = new ByteBuffer(1)
            b.end()
            expect ->
              b[writer](value)
            .to.throw Error

        context 'when reading and no bytes available', ->
          it 'throws Error', ->
            b = new ByteBuffer(1)
            b.end()
            expect ->
              b[reader]()
            .to.throw Error

  describe '#write / #read', ->
    it 'writes Uint8Arrays, returns buffer and reads sequence', ->
      b = new ByteBuffer(2)
      result = b.write(new Uint8Array([1, 2]))
      expect(result).to.eq b
      expect(b.front().read(2).toArray()).to.deep.eq [1, 2]

    it 'writes Uint16Arrays, returns buffer and reads sequence', ->
      b = new ByteBuffer(2)
      result = b.write(new Uint16Array([(1 << 16) - 1]))
      expect(result).to.eq b
      expect(b.front().read(2).toArray()).to.deep.eq [255, 255]

    it 'writes another ByteBuffer, returns buffer and reads sequence', ->
      b = new ByteBuffer(2)
      result = b.write(new ByteBuffer([3, 4]))
      expect(result).to.eq b
      expect(b.front().read(2).toArray()).to.deep.eq [3, 4]

    it 'writes arrays, returns buffer and reads sequence', ->
      b = new ByteBuffer(2)
      result = b.write([13, 37])
      expect(result).to.eq b
      expect(b.front().read(2).toArray()).to.deep.eq [13, 37]

    context 'when writing non-sequences', ->
      it 'throws TypeError', ->
        b = new ByteBuffer(8)

        expect ->
          b.write(666)
        .to.throw TypeError

        expect ->
          b.write('unwritable')
        .to.throw TypeError

    context 'when writing and no bytes available', ->
      it 'throws Error', ->
        b = new ByteBuffer(1)
        b.end()
        expect ->
          b.write([1])
        .to.throw Error

    context 'when reading and no bytes available', ->
      it 'throws Error', ->
        b = new ByteBuffer(1)
        b.end()
        expect ->
          b.read(1)
        .to.throw Error

    context 'when reading outside of valid range', ->
      it 'throws RangeError', ->
        b = new ByteBuffer(1)
        expect ->
          b.read(-1)
        .to.throw RangeError

  describe '#writeString / #readString', ->
    it 'writes utf-8 strings, returns bytes used and reads strings', ->
      b = new ByteBuffer(22)

      expect(b.writeString('Byte $\u00A2\u20AC\uD834\uDDC7 Buffer')).to.eq 22
      expect(b.index).to.eq 22
      expect(b.toHex()).to.eq '42 79 74 65 20 24 C2 A2 E2 82 AC F0 9D 87 87 20 42 75 66 66 65 72'

      b.front()

      expect(b.readString()).to.eq 'Byte $\u00A2\u20AC\uD834\uDDC7 Buffer'

      b = new ByteBuffer(262140)
      long = (new Array(1 << 16)).join('\uD834\uDDC7')
      expect(b.writeString(long)).to.eq 262140

      b.front()

      expect(b.readString()).to.eq long

    context 'when writing and no bytes available', ->
      it 'throws Error', ->
        b = new ByteBuffer(1)
        b.end()
        expect ->
          b.writeString('foo')
        .to.throw Error

    context 'when reading and no bytes available', ->
      it 'throws Error', ->
        b = new ByteBuffer(1)
        b.end()
        expect ->
          b.readString(1)
        .to.throw Error

    context 'when reading outside of valid range', ->
      it 'throws RangeError', ->
        b = new ByteBuffer(1)
        expect ->
          b.readString(-1)
        .to.throw RangeError

  describe '#writeCString / #readCString', ->
    it 'writes NULL-terminated C-strings, returns bytes used and reads strings', ->
      b = new ByteBuffer(27)

      expect(b.writeCString('Byte $\u00A2\u20AC\uD834\uDDC7 Buffer')).to.eq 23
      b.writeUnsignedInt(10)

      b.front()

      expect(b.readCString()).to.eq 'Byte $\u00A2\u20AC\uD834\uDDC7 Buffer'
      expect(b.available).to.eq 4

    context 'when writing and no bytes available', ->
      it 'throws Error', ->
        b = new ByteBuffer(1)
        b.end()
        expect ->
          b.writeCString('foo')
        .to.throw Error

  describe '#prepend', ->
    it 'grows buffer at the front', ->
      b = new ByteBuffer([1, 2])
      expect(b.prepend(2).toArray()).to.deep.eq [0, 0, 1, 2]
      expect(b.index).to.eq 2

  describe '#append', ->
    it 'grows buffer at the end', ->
      b = new ByteBuffer([1, 2])
      expect(b.append(2).toArray()).to.deep.eq [1, 2, 0, 0]
      expect(b.index).to.eq 0

  describe '#implicitGrowth=', ->
    context 'when disabled', ->
      it 'throws Error when writing', ->
        b = new ByteBuffer(1)
        expect(b.implicitGrowth).to.eq false
        expect ->
          b.writeDouble(0)
        .to.throw Error

    context 'when enabled', ->
      it 'grows implicitly when writing', ->
        b = new ByteBuffer(2, ByteBuffer.BIG_ENDIAN, true)
        expect(b.implicitGrowth).to.eq true
        expect(b.writeUnsignedInt(0).length).to.eq 4
        expect(b.writeString('Byte $\u00A2\u20AC\uD834\uDDC7 Buffer')).to.eq 22
        expect(b.length).to.eq 26

    it 'maintains implicit growth strategy when cloning', ->
      b = new ByteBuffer(1)
      expect(b.clone().implicitGrowth).to.eq false
      b.implicitGrowth = true
      expect(b.clone().implicitGrowth).to.eq true

  describe '#clip', ->
    it 'clips buffer in place', ->
      b = new ByteBuffer([1, 2, 3, 4, 5, 6])

      b.index = 1

      expect(b.clip().toArray()).to.deep.eq [2, 3, 4, 5, 6]
      expect(b.index).to.eq 0

      b.index = 2

      expect(b.clip(1).toArray()).to.deep.eq [3, 4, 5, 6]
      expect(b.index).to.eq 1

      b.end()

      expect(b.clip(0, -2).toArray()).to.deep.eq [3, 4]
      expect(b.index).to.eq 2

  describe '#slice', ->
    it 'slices buffer returning a new copy', ->
      b = new ByteBuffer([1, 2, 3, 4, 5, 6])

      expect(b.slice().toArray()).to.deep.eq [1, 2, 3, 4, 5, 6]
      expect(b.slice(1).toArray()).to.deep.eq [2, 3, 4, 5, 6]
      expect(b.slice(2, -2).toArray()).to.deep.eq [3, 4]

      expect(b.slice()).not.to.eq b

  describe '#clone', ->
    it 'clones buffer', ->
      b = new ByteBuffer(3)
      b.end()

      clone = b.clone()
      expect(clone).to.deep.eq b
      expect(clone).not.to.eq b

  describe '#reverse', ->
    it 'reverses/flips buffer', ->
      b = new ByteBuffer([1, 2, 3])
      b.end()

      expect(b.reverse().toArray()).to.deep.eq [3, 2, 1]
      expect(b.index).to.eq 0

  describe '#toArray / #toHex / #toASCII', ->
    it 'returns various representations', ->
      b = new ByteBuffer([245, 66, 121, 116, 101, 215, 66, 117, 102, 102, 101, 114, 0])

      expect(b.toArray()).to.deep.eq [245, 66, 121, 116, 101, 215, 66, 117, 102, 102, 101, 114, 0]

      expect(b.toHex())  .to.eq 'F5 42 79 74 65 D7 42 75 66 66 65 72 00'
      expect(b.toASCII()).to.eq ' \uFFFD  B  y  t  e  \uFFFD  B  u  f  f  e  r  \uFFFD'

      expect(b.toHex(''))  .to.eq 'F542797465D742756666657200'
      expect(b.toASCII('')).to.eq ' \uFFFD B y t e \uFFFD B u f f e r \uFFFD'

      expect(b.toASCII('', false)).to.eq '\uFFFDByte\uFFFDBuffer\uFFFD'

  describe 'class inheritance', ->
    class NetworkPacket extends ByteBuffer
    p = new NetworkPacket(1)

    it 'maintains byte order', ->
      expect(p.order).to.eq ByteBuffer.BIG_ENDIAN

    it 'returns ByteBuffer when reading', ->
      expect(p.read().constructor).to.eq ByteBuffer

    it 'returns ByteBuffer when cloning', ->
      expect(p.clone().constructor).to.eq ByteBuffer
