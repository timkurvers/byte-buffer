'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _require = require('./spec-helper');

var expect = _require.expect;
var ByteBuffer = _require.ByteBuffer;

describe('ByteBuffer', function () {

  describe('#constructor', function () {
    it('initializes by length', function () {
      var b = new ByteBuffer(1);
      expect(b.length).to.eq(1);
    });

    it('initializes from an ArrayBuffer', function () {
      var b = new ByteBuffer(new ArrayBuffer(2));
      expect(b.length).to.eq(2);
    });

    it('initializes from an Uint8Array', function () {
      var b = new ByteBuffer(new Uint8Array(3));
      expect(b.length).to.eq(3);
    });

    it('initializes from an Uint16Array', function () {
      var b = new ByteBuffer(new Uint16Array(1));
      expect(b.length).to.eq(2);
    });

    it('initializes from an array', function () {
      var b = new ByteBuffer([0, 1, 2, 3]);
      expect(b.length).to.eq(4);
    });

    it('initializes from another ByteBuffer', function () {
      var b = new ByteBuffer(new ByteBuffer(4));
      expect(b.length).to.eq(4);
    });
  });

  describe('#order', function () {
    it('exposes byte order constants', function () {
      expect(ByteBuffer.BIG_ENDIAN).to.eq(false);
      expect(ByteBuffer.LITTLE_ENDIAN).to.eq(true);
    });

    it('defaults to big endian', function () {
      var b = new ByteBuffer(1);
      expect(b.order).to.eq(ByteBuffer.BIG_ENDIAN);
    });

    it('may be provided during initialization', function () {
      var b = new ByteBuffer(1, ByteBuffer.BIG_ENDIAN);
      expect(b.order).to.eq(ByteBuffer.BIG_ENDIAN);
    });

    it('maintains byte order when reading, slicing and cloning', function () {
      var b = new ByteBuffer(1);
      expect(b.read().order).to.eq(ByteBuffer.BIG_ENDIAN);
      expect(b.slice().order).to.eq(ByteBuffer.BIG_ENDIAN);
      expect(b.clone().order).to.eq(ByteBuffer.BIG_ENDIAN);

      b = new ByteBuffer(1, ByteBuffer.LITTLE_ENDIAN);
      expect(b.read().order).to.eq(ByteBuffer.LITTLE_ENDIAN);
      expect(b.slice().order).to.eq(ByteBuffer.LITTLE_ENDIAN);
      expect(b.clone().order).to.eq(ByteBuffer.LITTLE_ENDIAN);
    });
  });

  describe('#order=', function () {
    it('sets byte order', function () {
      var b = new ByteBuffer(1, ByteBuffer.LITTLE_ENDIAN);
      expect(b.order).to.eq(ByteBuffer.LITTLE_ENDIAN);
      b.order = ByteBuffer.BIG_ENDIAN;
      expect(b.order).to.eq(ByteBuffer.BIG_ENDIAN);
    });
  });

  describe('#index', function () {
    context('when within valid range', function () {
      it('returns read/write index', function () {
        var b = new ByteBuffer(8);
        expect(b.index).to.eq(0);
      });
    });

    context('when outside of valid range', function () {
      it('throws RangeError', function () {
        var b = new ByteBuffer(8);
        expect(function () {
          b.index = -1;
        }).to['throw'](RangeError);

        expect(function () {
          b.index = 9;
        }).to['throw'](RangeError);
      });
    });
  });

  describe('#front', function () {
    it('sets read/write index to front of buffer', function () {
      var b = new ByteBuffer(8);
      expect(b.front().index).to.eq(0);
    });
  });

  describe('#end', function () {
    it('sets read/write index to end of buffer', function () {
      var b = new ByteBuffer(8);
      expect(b.end().index).to.eq(8);
    });
  });

  describe('#seek', function () {
    context('when within valid range', function () {
      it('seeks by relative offset', function () {
        var b = new ByteBuffer(4);
        expect(b.seek().index).to.eq(1);
        expect(b.seek(2).index).to.eq(3);
        expect(b.seek(-1).index).to.eq(2);
      });
    });

    context('when outside of valid range', function () {
      it('throws RangeError', function () {
        var b = new ByteBuffer(2);
        expect(function () {
          b.seek(3);
        }).to['throw'](RangeError);
      });
    });
  });

  describe('#available', function () {
    it('returns number of bytes available', function () {
      var b = new ByteBuffer(8);
      expect(b.available).to.eq(8);

      b.index = 4;
      expect(b.available).to.eq(4);

      expect(b.end().available).to.eq(0);
    });
  });

  var types = {
    Byte: -1 << 7,
    UnsignedByte: 1 << 7,
    Short: -1 << 15,
    UnsignedShort: 1 << 15,
    Int: -1 << 30,
    UnsignedInt: 1 << 30,
    Float: Math.PI,
    Double: Math.PI
  };

  var _loop = function (type) {
    var value = types[type];
    var writer = 'write' + type;
    var reader = 'read' + type;

    describe('#write' + type + ' / #read' + type, function () {
      it('writes value, returns buffer and reads value', function () {
        var b = new ByteBuffer(8);
        var result = b[writer](value);
        expect(result).to.eq(b);

        if (['Float', 'Double'].indexOf(type) !== -1) {
          expect(b.front()[reader]()).to.be.closeTo(value, 1e-7);
        } else {
          expect(b.front()[reader]()).to.eq(value);
        }
      });

      context('when writing and no bytes available', function () {
        it('throws Error', function () {
          var b = new ByteBuffer(1);
          b.end();
          expect(function () {
            b[writer](value);
          }).to['throw'](Error);
        });
      });

      context('when reading and no bytes available', function () {
        it('throws Error', function () {
          var b = new ByteBuffer(1);
          b.end();
          expect(function () {
            b[reader]();
          }).to['throw'](Error);
        });
      });
    });
  };

  for (var type in types) {
    _loop(type);
  }

  describe('#write / #read', function () {
    it('writes Uint8Arrays, returns buffer and reads sequence', function () {
      var b = new ByteBuffer(2);
      var result = b.write(new Uint8Array([1, 2]));
      expect(result).to.eq(b);
      expect(b.front().read(2).toArray()).to.deep.eq([1, 2]);
    });

    it('writes Uint16Arrays, returns buffer and reads sequence', function () {
      var b = new ByteBuffer(2);
      var result = b.write(new Uint16Array([(1 << 16) - 1]));
      expect(result).to.eq(b);
      expect(b.front().read(2).toArray()).to.deep.eq([255, 255]);
    });

    it('writes another ByteBuffer, returns buffer and reads sequence', function () {
      var b = new ByteBuffer(2);
      var result = b.write(new ByteBuffer([3, 4]));
      expect(result).to.eq(b);
      expect(b.front().read(2).toArray()).to.deep.eq([3, 4]);
    });

    it('writes arrays, returns buffer and reads sequence', function () {
      var b = new ByteBuffer(2);
      var result = b.write([13, 37]);
      expect(result).to.eq(b);
      expect(b.front().read(2).toArray()).to.deep.eq([13, 37]);
    });

    context('when writing non-sequences', function () {
      it('throws TypeError', function () {
        var b = new ByteBuffer(8);

        expect(function () {
          b.write(666);
        }).to['throw'](TypeError);

        expect(function () {
          b.write('unwritable');
        }).to['throw'](TypeError);
      });
    });

    context('when writing and no bytes available', function () {
      it('throws Error', function () {
        var b = new ByteBuffer(1);
        b.end();
        expect(function () {
          b.write([1]);
        }).to['throw'](Error);
      });
    });

    context('when reading and no bytes available', function () {
      it('throws Error', function () {
        var b = new ByteBuffer(1);
        b.end();
        expect(function () {
          b.read(1);
        }).to['throw'](Error);
      });
    });

    context('when reading outside of valid range', function () {
      it('throws RangeError', function () {
        var b = new ByteBuffer(1);
        expect(function () {
          b.read(-1);
        }).to['throw'](RangeError);
      });
    });
  });

  describe('#writeString / #readString', function () {
    it('writes utf-8 strings, returns bytes used and reads strings', function () {
      var b = new ByteBuffer(22);

      expect(b.writeString('Byte $¢€𝇇 Buffer')).to.eq(22);
      expect(b.index).to.eq(22);
      expect(b.toHex()).to.eq('42 79 74 65 20 24 C2 A2 E2 82 AC F0 9D 87 87 20 42 75 66 66 65 72');

      b.front();

      expect(b.readString()).to.eq('Byte $¢€𝇇 Buffer');

      b = new ByteBuffer(262140);
      var long = new Array(1 << 16).join('𝇇');
      expect(b.writeString(long)).to.eq(262140);

      b.front();

      expect(b.readString()).to.eq(long);
    });

    context('when writing and no bytes available', function () {
      it('throws Error', function () {
        var b = new ByteBuffer(1);
        b.end();
        expect(function () {
          b.writeString('foo');
        }).to['throw'](Error);
      });
    });

    context('when reading and no bytes available', function () {
      it('throws Error', function () {
        var b = new ByteBuffer(1);
        b.end();
        expect(function () {
          b.readString(1);
        }).to['throw'](Error);
      });
    });

    context('when reading outside of valid range', function () {
      it('throws RangeError', function () {
        var b = new ByteBuffer(1);
        expect(function () {
          b.readString(-1);
        }).to['throw'](RangeError);
      });
    });
  });

  describe('#writeCString / #readCString', function () {
    it('writes NULL-terminated C-strings, returns bytes used and reads strings', function () {
      var b = new ByteBuffer(27);

      expect(b.writeCString('Byte $¢€𝇇 Buffer')).to.eq(23);
      b.writeUnsignedInt(10);

      b.front();

      expect(b.readCString()).to.eq('Byte $¢€𝇇 Buffer');
      expect(b.available).to.eq(4);
    });

    context('when writing and no bytes available', function () {
      it('throws Error', function () {
        var b = new ByteBuffer(1);
        b.end();
        expect(function () {
          b.writeCString('foo');
        }).to['throw'](Error);
      });
    });
  });

  describe('#prepend', function () {
    it('grows buffer at the front', function () {
      var b = new ByteBuffer([1, 2]);
      expect(b.prepend(2).toArray()).to.deep.eq([0, 0, 1, 2]);
      expect(b.index).to.eq(2);
    });
  });

  describe('#append', function () {
    it('grows buffer at the end', function () {
      var b = new ByteBuffer([1, 2]);
      expect(b.append(2).toArray()).to.deep.eq([1, 2, 0, 0]);
      expect(b.index).to.eq(0);
    });
  });

  describe('#implicitGrowth=', function () {
    context('when disabled', function () {
      it('throws Error when writing', function () {
        var b = new ByteBuffer(1);
        expect(b.implicitGrowth).to.eq(false);
        expect(function () {
          b.writeDouble(0);
        }).to['throw'](Error);
      });
    });

    context('when enabled', function () {
      it('grows implicitly when writing', function () {
        var b = new ByteBuffer(2, ByteBuffer.BIG_ENDIAN, true);
        expect(b.implicitGrowth).to.eq(true);
        expect(b.writeUnsignedInt(0).length).to.eq(4);
        expect(b.writeString('Byte $¢€𝇇 Buffer')).to.eq(22);
        expect(b.length).to.eq(26);
      });
    });

    it('maintains implicit(growth strategy when cloning', function () {
      var b = new ByteBuffer(1);
      expect(b.clone().implicitGrowth).to.eq(false);
      b.implicitGrowth = true;
      expect(b.clone().implicitGrowth).to.eq(true);
    });
  });

  describe('#clip', function () {
    it('clips buffer in place', function () {
      var b = new ByteBuffer([1, 2, 3, 4, 5, 6]);

      b.index = 1;

      expect(b.clip().toArray()).to.deep.eq([2, 3, 4, 5, 6]);
      expect(b.index).to.eq(0);

      b.index = 2;

      expect(b.clip(1).toArray()).to.deep.eq([3, 4, 5, 6]);
      expect(b.index).to.eq(1);

      b.end();

      expect(b.clip(0, -2).toArray()).to.deep.eq([3, 4]);
      expect(b.index).to.eq(2);
    });
  });

  describe('#slice', function () {
    it('slices buffer returning a new copy', function () {
      var b = new ByteBuffer([1, 2, 3, 4, 5, 6]);

      expect(b.slice().toArray()).to.deep.eq([1, 2, 3, 4, 5, 6]);
      expect(b.slice(1).toArray()).to.deep.eq([2, 3, 4, 5, 6]);
      expect(b.slice(2, -2).toArray()).to.deep.eq([3, 4]);

      expect(b.slice()).not.to.eq(b);
    });
  });

  describe('#clone', function () {
    it('clones buffer', function () {
      var b = new ByteBuffer(3);
      b.end();

      var clone = b.clone();
      expect(clone).to.deep.eq(b);
      expect(clone).not.to.eq(b);
    });
  });

  describe('#reverse', function () {
    it('reverses/flips buffer', function () {
      var b = new ByteBuffer([1, 2, 3]);
      b.end();

      expect(b.reverse().toArray()).to.deep.eq([3, 2, 1]);
      expect(b.index).to.eq(0);
    });
  });

  describe('#toArray / #toHex / #toASCII', function () {
    it('returns various representations', function () {
      var b = new ByteBuffer([245, 66, 121, 116, 101, 215, 66, 117, 102, 102, 101, 114, 0]);

      expect(b.toArray()).to.deep.eq([245, 66, 121, 116, 101, 215, 66, 117, 102, 102, 101, 114, 0]);

      expect(b.toHex()).to.eq('F5 42 79 74 65 D7 42 75 66 66 65 72 00');
      expect(b.toASCII()).to.eq(' �  B  y  t  e  �  B  u  f  f  e  r  �');

      expect(b.toHex('')).to.eq('F542797465D742756666657200');
      expect(b.toASCII('')).to.eq(' � B y t e � B u f f e r �');

      expect(b.toASCII('', false)).to.eq('�Byte�Buffer�');
    });
  });

  describe('class inheritance', function () {
    var NetworkPacket = (function (_ByteBuffer) {
      function NetworkPacket() {
        _classCallCheck(this, NetworkPacket);

        if (_ByteBuffer != null) {
          _ByteBuffer.apply(this, arguments);
        }
      }

      _inherits(NetworkPacket, _ByteBuffer);

      return NetworkPacket;
    })(ByteBuffer);

    var p = new NetworkPacket(1);

    it('maintains byte order', function () {
      expect(p.order).to.eq(ByteBuffer.BIG_ENDIAN);
    });

    it('returns ByteBuffer when reading', function () {
      expect(p.read().constructor).to.eq(ByteBuffer);
    });

    it('returns ByteBuffer when cloning', function () {
      expect(p.clone().constructor).to.eq(ByteBuffer);
    });
  });
});