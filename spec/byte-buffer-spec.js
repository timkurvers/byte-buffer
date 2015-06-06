var ByteBuffer, expect, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

_ref = require('./spec-helper'), expect = _ref.expect, ByteBuffer = _ref.ByteBuffer;

describe('ByteBuffer', function() {
  var type, value, _fn, _ref1;
  describe('#constructor', function() {
    it('initializes by length', function() {
      var b;
      b = new ByteBuffer(1);
      return expect(b.length).to.eq(1);
    });
    it('initializes from an ArrayBuffer', function() {
      var b;
      b = new ByteBuffer(new ArrayBuffer(2));
      return expect(b.length).to.eq(2);
    });
    it('initializes from an Uint8Array', function() {
      var b;
      b = new ByteBuffer(new Uint8Array(3));
      return expect(b.length).to.eq(3);
    });
    it('initializes from an Uint16Array', function() {
      var b;
      b = new ByteBuffer(new Uint16Array(1));
      return expect(b.length).to.eq(2);
    });
    it('initializes from an array', function() {
      var b;
      b = new ByteBuffer([0, 1, 2, 3]);
      return expect(b.length).to.eq(4);
    });
    return it('initializes from another ByteBuffer', function() {
      var b;
      b = new ByteBuffer(new ByteBuffer(4));
      return expect(b.length).to.eq(4);
    });
  });
  describe('#order', function() {
    it('exposes byte order constants', function() {
      expect(ByteBuffer.BIG_ENDIAN).to.eq(false);
      return expect(ByteBuffer.LITTLE_ENDIAN).to.eq(true);
    });
    it('defaults to big endian', function() {
      var b;
      b = new ByteBuffer(1);
      return expect(b.order).to.eq(ByteBuffer.BIG_ENDIAN);
    });
    it('may be provided during initialization', function() {
      var b;
      b = new ByteBuffer(1, ByteBuffer.BIG_ENDIAN);
      return expect(b.order).to.eq(ByteBuffer.BIG_ENDIAN);
    });
    return it('maintains byte order when reading, slicing and cloning', function() {
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
  });
  describe('#order=', function() {
    return it('sets byte order', function() {
      var b;
      b = new ByteBuffer(1, ByteBuffer.LITTLE_ENDIAN);
      expect(b.order).to.eq(ByteBuffer.LITTLE_ENDIAN);
      b.order = ByteBuffer.BIG_ENDIAN;
      return expect(b.order).to.eq(ByteBuffer.BIG_ENDIAN);
    });
  });
  describe('#index', function() {
    context('when within valid range', function() {
      return it('returns read/write index', function() {
        var b;
        b = new ByteBuffer(8);
        return expect(b.index).to.eq(0);
      });
    });
    return context('when outside of valid range', function() {
      return it('throws RangeError', function() {
        var b;
        b = new ByteBuffer(8);
        expect(function() {
          return b.index = -1;
        }).to["throw"](RangeError);
        return expect(function() {
          return b.index = 9;
        }).to["throw"](RangeError);
      });
    });
  });
  describe('#front', function() {
    return it('sets read/write index to front of buffer', function() {
      var b;
      b = new ByteBuffer(8);
      return expect(b.front().index).to.eq(0);
    });
  });
  describe('#end', function() {
    return it('sets read/write index to end of buffer', function() {
      var b;
      b = new ByteBuffer(8);
      return expect(b.end().index).to.eq(8);
    });
  });
  describe('#seek', function() {
    context('when within valid range', function() {
      return it('seeks by relative offset', function() {
        var b;
        b = new ByteBuffer(4);
        expect(b.seek().index).to.eq(1);
        expect(b.seek(2).index).to.eq(3);
        return expect(b.seek(-1).index).to.eq(2);
      });
    });
    return context('when outside of valid range', function() {
      return it('throws RangeError', function() {
        var b;
        b = new ByteBuffer(2);
        return expect(function() {
          return b.seek(3);
        }).to["throw"](RangeError);
      });
    });
  });
  describe('#available', function() {
    return it('returns number of bytes available', function() {
      var b;
      b = new ByteBuffer(8);
      expect(b.available).to.eq(8);
      b.index = 4;
      expect(b.available).to.eq(4);
      return expect(b.end().available).to.eq(0);
    });
  });
  _ref1 = {
    Byte: -1 << 7,
    UnsignedByte: 1 << 7,
    Short: -1 << 15,
    UnsignedShort: 1 << 15,
    Int: -1 << 30,
    UnsignedInt: 1 << 30,
    Float: Math.PI,
    Double: Math.PI
  };
  _fn = function(type, value) {
    var reader, writer;
    writer = "write" + type;
    reader = "read" + type;
    return describe("#write" + type + " / #read" + type, function() {
      it('writes value, returns buffer and reads value', function() {
        var b, result;
        b = new ByteBuffer(8);
        result = b[writer](value);
        expect(result).to.eq(b);
        if (type === 'Float' || type === 'Double') {
          return expect(b.front()[reader]()).to.be.closeTo(value, 0.0000001);
        } else {
          return expect(b.front()[reader]()).to.eq(value);
        }
      });
      context('when writing and no bytes available', function() {
        return it('throws Error', function() {
          var b;
          b = new ByteBuffer(1);
          b.end();
          return expect(function() {
            return b[writer](value);
          }).to["throw"](Error);
        });
      });
      return context('when reading and no bytes available', function() {
        return it('throws Error', function() {
          var b;
          b = new ByteBuffer(1);
          b.end();
          return expect(function() {
            return b[reader]();
          }).to["throw"](Error);
        });
      });
    });
  };
  for (type in _ref1) {
    value = _ref1[type];
    _fn(type, value);
  }
  describe('#write / #read', function() {
    it('writes Uint8Arrays, returns buffer and reads sequence', function() {
      var b, result;
      b = new ByteBuffer(2);
      result = b.write(new Uint8Array([1, 2]));
      expect(result).to.eq(b);
      return expect(b.front().read(2).toArray()).to.deep.eq([1, 2]);
    });
    it('writes Uint16Arrays, returns buffer and reads sequence', function() {
      var b, result;
      b = new ByteBuffer(2);
      result = b.write(new Uint16Array([(1 << 16) - 1]));
      expect(result).to.eq(b);
      return expect(b.front().read(2).toArray()).to.deep.eq([255, 255]);
    });
    it('writes another ByteBuffer, returns buffer and reads sequence', function() {
      var b, result;
      b = new ByteBuffer(2);
      result = b.write(new ByteBuffer([3, 4]));
      expect(result).to.eq(b);
      return expect(b.front().read(2).toArray()).to.deep.eq([3, 4]);
    });
    it('writes arrays, returns buffer and reads sequence', function() {
      var b, result;
      b = new ByteBuffer(2);
      result = b.write([13, 37]);
      expect(result).to.eq(b);
      return expect(b.front().read(2).toArray()).to.deep.eq([13, 37]);
    });
    context('when writing non-sequences', function() {
      return it('throws TypeError', function() {
        var b;
        b = new ByteBuffer(8);
        expect(function() {
          return b.write(666);
        }).to["throw"](TypeError);
        return expect(function() {
          return b.write('unwritable');
        }).to["throw"](TypeError);
      });
    });
    context('when writing and no bytes available', function() {
      return it('throws Error', function() {
        var b;
        b = new ByteBuffer(1);
        b.end();
        return expect(function() {
          return b.write([1]);
        }).to["throw"](Error);
      });
    });
    context('when reading and no bytes available', function() {
      return it('throws Error', function() {
        var b;
        b = new ByteBuffer(1);
        b.end();
        return expect(function() {
          return b.read(1);
        }).to["throw"](Error);
      });
    });
    return context('when reading outside of valid range', function() {
      return it('throws RangeError', function() {
        var b;
        b = new ByteBuffer(1);
        return expect(function() {
          return b.read(-1);
        }).to["throw"](RangeError);
      });
    });
  });
  describe('#writeString / #readString', function() {
    it('writes utf-8 strings, returns bytes used and reads strings', function() {
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
      return expect(b.readString()).to.eq(long);
    });
    context('when writing and no bytes available', function() {
      return it('throws Error', function() {
        var b;
        b = new ByteBuffer(1);
        b.end();
        return expect(function() {
          return b.writeString('foo');
        }).to["throw"](Error);
      });
    });
    context('when reading and no bytes available', function() {
      return it('throws Error', function() {
        var b;
        b = new ByteBuffer(1);
        b.end();
        return expect(function() {
          return b.readString(1);
        }).to["throw"](Error);
      });
    });
    return context('when reading outside of valid range', function() {
      return it('throws RangeError', function() {
        var b;
        b = new ByteBuffer(1);
        return expect(function() {
          return b.readString(-1);
        }).to["throw"](RangeError);
      });
    });
  });
  describe('#writeCString / #readCString', function() {
    it('writes NULL-terminated C-strings, returns bytes used and reads strings', function() {
      var b;
      b = new ByteBuffer(27);
      expect(b.writeCString('Byte $\u00A2\u20AC\uD834\uDDC7 Buffer')).to.eq(23);
      b.writeUnsignedInt(10);
      b.front();
      expect(b.readCString()).to.eq('Byte $\u00A2\u20AC\uD834\uDDC7 Buffer');
      return expect(b.available).to.eq(4);
    });
    return context('when writing and no bytes available', function() {
      return it('throws Error', function() {
        var b;
        b = new ByteBuffer(1);
        b.end();
        return expect(function() {
          return b.writeCString('foo');
        }).to["throw"](Error);
      });
    });
  });
  describe('#prepend', function() {
    return it('grows buffer at the front', function() {
      var b;
      b = new ByteBuffer([1, 2]);
      expect(b.prepend(2).toArray()).to.deep.eq([0, 0, 1, 2]);
      return expect(b.index).to.eq(2);
    });
  });
  describe('#append', function() {
    return it('grows buffer at the end', function() {
      var b;
      b = new ByteBuffer([1, 2]);
      expect(b.append(2).toArray()).to.deep.eq([1, 2, 0, 0]);
      return expect(b.index).to.eq(0);
    });
  });
  describe('#implicitGrowth=', function() {
    context('when disabled', function() {
      return it('throws Error when writing', function() {
        var b;
        b = new ByteBuffer(1);
        expect(b.implicitGrowth).to.eq(false);
        return expect(function() {
          return b.writeDouble(0);
        }).to["throw"](Error);
      });
    });
    context('when enabled', function() {
      return it('grows implicitly when writing', function() {
        var b;
        b = new ByteBuffer(2, ByteBuffer.BIG_ENDIAN, true);
        expect(b.implicitGrowth).to.eq(true);
        expect(b.writeUnsignedInt(0).length).to.eq(4);
        expect(b.writeString('Byte $\u00A2\u20AC\uD834\uDDC7 Buffer')).to.eq(22);
        return expect(b.length).to.eq(26);
      });
    });
    return it('maintains implicit growth strategy when cloning', function() {
      var b;
      b = new ByteBuffer(1);
      expect(b.clone().implicitGrowth).to.eq(false);
      b.implicitGrowth = true;
      return expect(b.clone().implicitGrowth).to.eq(true);
    });
  });
  describe('#clip', function() {
    return it('clips buffer in place', function() {
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
  });
  describe('#slice', function() {
    return it('slices buffer returning a new copy', function() {
      var b;
      b = new ByteBuffer([1, 2, 3, 4, 5, 6]);
      expect(b.slice().toArray()).to.deep.eq([1, 2, 3, 4, 5, 6]);
      expect(b.slice(1).toArray()).to.deep.eq([2, 3, 4, 5, 6]);
      expect(b.slice(2, -2).toArray()).to.deep.eq([3, 4]);
      return expect(b.slice()).not.to.eq(b);
    });
  });
  describe('#clone', function() {
    return it('clones buffer', function() {
      var b, clone;
      b = new ByteBuffer(3);
      b.end();
      clone = b.clone();
      expect(clone).to.deep.eq(b);
      return expect(clone).not.to.eq(b);
    });
  });
  describe('#reverse', function() {
    return it('reverses/flips buffer', function() {
      var b;
      b = new ByteBuffer([1, 2, 3]);
      b.end();
      expect(b.reverse().toArray()).to.deep.eq([3, 2, 1]);
      return expect(b.index).to.eq(0);
    });
  });
  describe('#toArray / #toHex / #toASCII', function() {
    return it('returns various representations', function() {
      var b;
      b = new ByteBuffer([245, 66, 121, 116, 101, 215, 66, 117, 102, 102, 101, 114, 0]);
      expect(b.toArray()).to.deep.eq([245, 66, 121, 116, 101, 215, 66, 117, 102, 102, 101, 114, 0]);
      expect(b.toHex()).to.eq('F5 42 79 74 65 D7 42 75 66 66 65 72 00');
      expect(b.toASCII()).to.eq(' \uFFFD  B  y  t  e  \uFFFD  B  u  f  f  e  r  \uFFFD');
      expect(b.toHex('')).to.eq('F542797465D742756666657200');
      expect(b.toASCII('')).to.eq(' \uFFFD B y t e \uFFFD B u f f e r \uFFFD');
      return expect(b.toASCII('', false)).to.eq('\uFFFDByte\uFFFDBuffer\uFFFD');
    });
  });
  return describe('class inheritance', function() {
    var NetworkPacket, p;
    NetworkPacket = (function(_super) {
      __extends(NetworkPacket, _super);

      function NetworkPacket() {
        return NetworkPacket.__super__.constructor.apply(this, arguments);
      }

      return NetworkPacket;

    })(ByteBuffer);
    p = new NetworkPacket(1);
    it('maintains byte order', function() {
      return expect(p.order).to.eq(ByteBuffer.BIG_ENDIAN);
    });
    it('returns ByteBuffer when reading', function() {
      return expect(p.read().constructor).to.eq(ByteBuffer);
    });
    return it('returns ByteBuffer when cloning', function() {
      return expect(p.clone().constructor).to.eq(ByteBuffer);
    });
  });
});
