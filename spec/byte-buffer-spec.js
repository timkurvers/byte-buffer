var ByteBuffer, expect, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

_ref = require('./spec-helper'), expect = _ref.expect, ByteBuffer = _ref.ByteBuffer;

describe('ByteBuffer', function() {
  it('can be constructed in various ways', function() {
    var b;
    b = new ByteBuffer(1);
    expect(b.length).to.eq(1);
    b = new ByteBuffer(new ArrayBuffer(2));
    expect(b.length).to.eq(2);
    b = new ByteBuffer(new Uint8Array(3));
    expect(b.length).to.eq(3);
    b = new ByteBuffer(new Uint16Array(1));
    expect(b.length).to.eq(2);
    b = new ByteBuffer([0, 1, 2, 3]);
    expect(b.length).to.eq(4);
    b = new ByteBuffer(b);
    return expect(b.length).to.eq(4);
  });
  it('has a (default) byte order', function() {
    var b;
    expect(ByteBuffer.BIG_ENDIAN).to.eq(false);
    expect(ByteBuffer.LITTLE_ENDIAN).to.eq(true);
    b = new ByteBuffer(1);
    expect(b.order).to.eq(ByteBuffer.BIG_ENDIAN);
    b = new ByteBuffer(1, ByteBuffer.BIG_ENDIAN);
    expect(b.order).to.eq(ByteBuffer.BIG_ENDIAN);
    b = new ByteBuffer(1, ByteBuffer.LITTLE_ENDIAN);
    expect(b.order).to.eq(ByteBuffer.LITTLE_ENDIAN);
    b.order = ByteBuffer.BIG_ENDIAN;
    return expect(b.order).to.eq(ByteBuffer.BIG_ENDIAN);
  });
  it('will maintain byte order when reading, slicing and cloning', function() {
    var b;
    b = new ByteBuffer(1);
    expect(b.read().order).to.eq(ByteBuffer.BIG_ENDIAN);
    expect(b.slice().order).to.eq(ByteBuffer.BIG_ENDIAN);
    expect(b.clone().order).to.eq(ByteBuffer.BIG_ENDIAN);
    b = new ByteBuffer(1, ByteBuffer.LITTLE_ENDIAN);
    expect(b.read().order).to.eq(ByteBuffer.LITTLE_ENDIAN);
    expect(b.slice().order).to.eq(ByteBuffer.LITTLE_ENDIAN);
    return expect(b.clone().order).to.eq(ByteBuffer.LITTLE_ENDIAN);
  });
  it('has a controllable read/write index', function() {
    var b;
    b = new ByteBuffer(8);
    expect(b.index).to.eq(0);
    expect(function() {
      return b.index = -1;
    }).to["throw"](RangeError);
    expect(function() {
      return b.index = 9;
    }).to["throw"](RangeError);
    expect(b.front().index).to.eq(0);
    return expect(b.end().index).to.eq(8);
  });
  it('can seek', function() {
    var b;
    b = new ByteBuffer(4);
    expect(b.seek().index).to.eq(1);
    expect(b.seek(2).index).to.eq(3);
    expect(b.seek(-1).index).to.eq(2);
    return expect(function() {
      return b.seek(3);
    }).to["throw"](RangeError);
  });
  it('has the number of bytes available', function() {
    var b;
    b = new ByteBuffer(8);
    expect(b.available).to.eq(8);
    b.index = 4;
    expect(b.available).to.eq(4);
    return expect(b.end().available).to.eq(0);
  });
  it('can read and write in big-endian', function() {
    var b;
    b = new ByteBuffer(26);
    b.writeByte(-1 << 7);
    b.writeUnsignedByte(1 << 7);
    b.writeShort(-1 << 15);
    b.writeUnsignedShort(1 << 15);
    b.writeInt(-1 << 30);
    b.writeUnsignedInt(1 << 30);
    b.writeFloat(Math.PI);
    b.writeDouble(Math.PI);
    b.front();
    expect(b.readByte()).to.eq(-1 << 7);
    expect(b.readUnsignedByte()).to.eq(1 << 7);
    expect(b.readShort()).to.eq(-1 << 15);
    expect(b.readUnsignedShort()).to.eq(1 << 15);
    expect(b.readInt()).to.eq(-1 << 30);
    expect(b.readUnsignedInt()).to.eq(1 << 30);
    expect(b.readFloat()).to.be.closeTo(Math.PI, 0.0000001);
    return expect(b.readDouble()).to.be.closeTo(Math.PI, 0);
  });
  it('can read and write in little-endian', function() {
    var b;
    b = new ByteBuffer(26, ByteBuffer.LITTLE_ENDIAN);
    b.writeByte(-1 << 7);
    b.writeUnsignedByte(1 << 7);
    b.writeShort(-1 << 15);
    b.writeUnsignedShort(1 << 15);
    b.writeInt(-1 << 30);
    b.writeUnsignedInt(1 << 30);
    b.writeFloat(Math.PI);
    b.writeDouble(Math.PI);
    b.front();
    expect(b.readByte()).to.eq(-1 << 7);
    expect(b.readUnsignedByte()).to.eq(1 << 7);
    expect(b.readShort()).to.eq(-1 << 15);
    expect(b.readUnsignedShort()).to.eq(1 << 15);
    expect(b.readInt()).to.eq(-1 << 30);
    expect(b.readUnsignedInt()).to.eq(1 << 30);
    expect(b.readFloat()).to.be.closeTo(Math.PI, 0.0000001);
    return expect(b.readDouble()).to.be.closeTo(Math.PI, 0);
  });
  it('can read and write with different byte orders arbitrarily', function() {
    var b;
    b = new ByteBuffer(4, ByteBuffer.LITTLE_ENDIAN);
    b.writeShort(-128, ByteBuffer.BIG_ENDIAN);
    b.writeUnsignedShort(128, ByteBuffer.LITTLE_ENDIAN);
    b.front();
    expect(b.readShort(ByteBuffer.LITTLE_ENDIAN)).to.eq(-32513);
    expect(b.readUnsignedShort(ByteBuffer.BIG_ENDIAN)).to.eq(32768);
    b.front();
    expect(b.readShort(ByteBuffer.BIG_ENDIAN)).to.eq(-128);
    expect(b.readUnsignedShort(ByteBuffer.LITTLE_ENDIAN)).to.eq(128);
    return expect(function() {
      return b.readByte();
    }).to["throw"](Error);
  });
  it('can read and write byte sequences', function() {
    var b;
    b = new ByteBuffer(8);
    expect(function() {
      return b.write(666);
    }).to["throw"](TypeError);
    expect(function() {
      return b.write('unwritable');
    }).to["throw"](TypeError);
    b.write(new Uint8Array([1, 2]));
    b.write(new Uint16Array([(1 << 16) - 1]));
    b.write(new ByteBuffer([3, 4]));
    b.write([13, 37]);
    b.front();
    expect(b.read(1).toArray()).to.deep.eq([1]);
    b.seek(1);
    expect(b.read(2).toArray()).to.deep.eq([255, 255]);
    expect(b.read().toArray()).to.deep.eq([3, 4, 13, 37]);
    expect(function() {
      return b.read(1);
    }).to["throw"](Error);
    return expect(function() {
      return b.read(-1);
    }).to["throw"](RangeError);
  });
  it('can read and write UTF-8 strings', function() {
    var b, long;
    b = new ByteBuffer(22);
    expect(b.writeString('Byte $\u00A2\u20AC\uD834\uDDC7 Buffer')).to.eq(22);
    expect(b.index).to.eq(22);
    expect(b.toHex()).to.eq('42 79 74 65 20 24 C2 A2 E2 82 AC F0 9D 87 87 20 42 75 66 66 65 72');
    b.front();
    expect(b.readString()).to.eq('Byte $\u00A2\u20AC\uD834\uDDC7 Buffer');
    b = new ByteBuffer(262140);
    long = (new Array(1 << 16)).join('\uD834\uDDC7');
    expect(b.writeString(long)).to.eq(262140);
    b.front();
    expect(b.readString()).to.eq(long);
    return expect(function() {
      return b.readString(-1);
    }).to["throw"](RangeError);
  });
  it('can read and write NULL-terminated C-strings', function() {
    var b;
    b = new ByteBuffer(27);
    expect(b.writeCString('Byte $\u00A2\u20AC\uD834\uDDC7 Buffer')).to.eq(23);
    b.writeUnsignedInt(10);
    b.front();
    expect(b.readCString()).to.eq('Byte $\u00A2\u20AC\uD834\uDDC7 Buffer');
    return expect(b.available).to.eq(4);
  });
  it('has writers that can be chained', function() {
    var b;
    b = new ByteBuffer(28);
    return expect(b.writeByte(0).writeUnsignedByte(0).writeShort(0).writeUnsignedShort(0).writeInt(0).writeUnsignedInt(0).writeFloat(0).writeDouble(0).write([0, 0])).to.eq(b);
  });
  it('can grow', function() {
    var b;
    b = new ByteBuffer([1, 2]);
    expect(b.prepend(2).toArray()).to.deep.eq([0, 0, 1, 2]);
    expect(b.index).to.eq(2);
    expect(b.append(2).toArray()).to.deep.eq([0, 0, 1, 2, 0, 0]);
    return expect(b.index).to.eq(2);
  });
  it('will grow implicitly', function() {
    var b;
    b = new ByteBuffer(2, ByteBuffer.BIG_ENDIAN, true);
    expect(b.implicitGrowth).to.eq(true);
    expect(b.writeUnsignedInt(0).length).to.eq(4);
    b.implicitGrowth = false;
    expect(function() {
      return b.writeDouble(0);
    }).to["throw"](Error);
    b.implicitGrowth = true;
    b.append(1);
    expect(b.writeString('Byte $\u00A2\u20AC\uD834\uDDC7 Buffer')).to.eq(22);
    return expect(b.length).to.eq(26);
  });
  it('will maintain implicit growth strategy when cloning', function() {
    var b;
    b = new ByteBuffer(1);
    expect(b.clone().implicitGrowth).to.eq(false);
    b.implicitGrowth = true;
    return expect(b.clone().implicitGrowth).to.eq(true);
  });
  it('can be clipped', function() {
    var b;
    b = new ByteBuffer([1, 2, 3, 4, 5, 6]);
    b.index = 1;
    expect(b.clip().toArray()).to.deep.eq([2, 3, 4, 5, 6]);
    expect(b.index).to.eq(0);
    b.index = 2;
    expect(b.clip(1).toArray()).to.deep.eq([3, 4, 5, 6]);
    expect(b.index).to.eq(1);
    b.end();
    expect(b.clip(0, -2).toArray()).to.deep.eq([3, 4]);
    return expect(b.index).to.eq(2);
  });
  it('can be sliced', function() {
    var b;
    b = new ByteBuffer([1, 2, 3, 4, 5, 6]);
    expect(b.slice().toArray()).to.deep.eq([1, 2, 3, 4, 5, 6]);
    expect(b.slice(1).toArray()).to.deep.eq([2, 3, 4, 5, 6]);
    expect(b.slice(2, -2).toArray()).to.deep.eq([3, 4]);
    return expect(b.slice()).not.to.eq(b);
  });
  it('can be cloned', function() {
    var b, clone;
    b = new ByteBuffer(3);
    b.end();
    clone = b.clone();
    expect(clone).to.deep.eq(b);
    return expect(clone).not.to.eq(b);
  });
  it('can be reversed', function() {
    var b;
    b = new ByteBuffer([1, 2, 3]);
    b.end();
    expect(b.reverse().toArray()).to.deep.eq([3, 2, 1]);
    return expect(b.index).to.eq(0);
  });
  it('has various representations', function() {
    var b;
    b = new ByteBuffer([245, 66, 121, 116, 101, 215, 66, 117, 102, 102, 101, 114, 0]);
    expect(b.toArray()).to.deep.eq([245, 66, 121, 116, 101, 215, 66, 117, 102, 102, 101, 114, 0]);
    expect(b.toHex()).to.eq('F5 42 79 74 65 D7 42 75 66 66 65 72 00');
    expect(b.toASCII()).to.eq(' \uFFFD  B  y  t  e  \uFFFD  B  u  f  f  e  r  \uFFFD');
    expect(b.toHex('')).to.eq('F542797465D742756666657200');
    expect(b.toASCII('')).to.eq(' \uFFFD B y t e \uFFFD B u f f e r \uFFFD');
    return expect(b.toASCII('', false)).to.eq('\uFFFDByte\uFFFDBuffer\uFFFD');
  });
  return it('can be extended', function() {
    var NetworkPacket, p;
    NetworkPacket = (function(_super) {
      __extends(NetworkPacket, _super);

      function NetworkPacket() {
        return NetworkPacket.__super__.constructor.apply(this, arguments);
      }

      return NetworkPacket;

    })(ByteBuffer);
    p = new NetworkPacket(1);
    expect(p.order).to.eq(ByteBuffer.BIG_ENDIAN);
    expect(p.read().constructor).to.eq(ByteBuffer);
    return expect(p.clone().constructor).to.eq(ByteBuffer);
  });
});
