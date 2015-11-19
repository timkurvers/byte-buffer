import { ByteBuffer, expect } from './spec-helper';

describe('ByteBuffer', function() {

  describe('#constructor', function() {
    it('initializes by length', function() {
      const b = new ByteBuffer(1);
      expect(b.length).to.eq(1);
    });

    it('initializes from an ArrayBuffer', function() {
      const b = new ByteBuffer(new ArrayBuffer(2));
      expect(b.length).to.eq(2);
    });

    it('initializes from an Uint8Array', function() {
      const b = new ByteBuffer(new Uint8Array(3));
      expect(b.length).to.eq(3);
    });

    it('initializes from an Uint16Array', function() {
      const b = new ByteBuffer(new Uint16Array(1));
      expect(b.length).to.eq(2);
    });

    it('initializes from an array', function() {
      const b = new ByteBuffer([0, 1, 2, 3]);
      expect(b.length).to.eq(4);
    });

    it('initializes from another ByteBuffer', function() {
      const b = new ByteBuffer(new ByteBuffer(4));
      expect(b.length).to.eq(4);
    });
  });

  describe('#order', function() {
    it('exposes byte order constants', function() {
      expect(ByteBuffer.BIG_ENDIAN).to.eq(false);
      expect(ByteBuffer.LITTLE_ENDIAN).to.eq(true);
    });

    it('defaults to big endian', function() {
      const b = new ByteBuffer(1);
      expect(b.order).to.eq(ByteBuffer.BIG_ENDIAN);
    });

    it('may be provided during initialization', function() {
      const b = new ByteBuffer(1, ByteBuffer.BIG_ENDIAN);
      expect(b.order).to.eq(ByteBuffer.BIG_ENDIAN);
    });

    it('maintains byte order when reading, slicing and cloning', function() {
      let b = new ByteBuffer(1);
      expect(b.read().order).to.eq(ByteBuffer.BIG_ENDIAN);
      expect(b.slice().order).to.eq(ByteBuffer.BIG_ENDIAN);
      expect(b.clone().order).to.eq(ByteBuffer.BIG_ENDIAN);

      b = new ByteBuffer(1, ByteBuffer.LITTLE_ENDIAN);
      expect(b.read().order).to.eq(ByteBuffer.LITTLE_ENDIAN);
      expect(b.slice().order).to.eq(ByteBuffer.LITTLE_ENDIAN);
      expect(b.clone().order).to.eq(ByteBuffer.LITTLE_ENDIAN);
    });
  });

  describe('#order=', function() {
    it('sets byte order', function() {
      const b = new ByteBuffer(1, ByteBuffer.LITTLE_ENDIAN);
      expect(b.order).to.eq(ByteBuffer.LITTLE_ENDIAN);
      b.order = ByteBuffer.BIG_ENDIAN;
      expect(b.order).to.eq(ByteBuffer.BIG_ENDIAN);
    });
  });

  describe('#index', function() {
    context('when within valid range', function() {
      it('returns read/write index', function() {
        const b = new ByteBuffer(8);
        expect(b.index).to.eq(0);
      });
    });

    context('when outside of valid range', function() {
      it('throws RangeError', function() {
        const b = new ByteBuffer(8);
        expect(function() {
          b.index = -1;
        }).to.throw(RangeError);

        expect(function() {
          b.index = 9;
        }).to.throw(RangeError);
      });
    });
  });

  describe('#front', function() {
    it('sets read/write index to front of buffer', function() {
      const b = new ByteBuffer(8);
      expect(b.front().index).to.eq(0);
    });
  });

  describe('#end', function() {
    it('sets read/write index to end of buffer', function() {
      const b = new ByteBuffer(8);
      expect(b.end().index).to.eq(8);
    });
  });

  describe('#seek', function() {
    context('when within valid range', function() {
      it('seeks by relative offset', function() {
        const b = new ByteBuffer(4);
        expect(b.seek().index).to.eq(1);
        expect(b.seek(2).index).to.eq(3);
        expect(b.seek(-1).index).to.eq(2);
      });
    });

    context('when outside of valid range', function() {
      it('throws RangeError', function() {
        const b = new ByteBuffer(2);
        expect(function() {
          b.seek(3);
        }).to.throw(RangeError);
      });
    });
  });

  describe('#available', function() {
    it('returns number of bytes available', function() {
      const b = new ByteBuffer(8);
      expect(b.available).to.eq(8);

      b.index = 4;
      expect(b.available).to.eq(4);

      expect(b.end().available).to.eq(0);
    });
  });

  const types = {
    Byte:          -1 << 7,
    UnsignedByte:   1 << 7,
    Short:         -1 << 15,
    UnsignedShort:  1 << 15,
    Int:           -1 << 30,
    UnsignedInt:    1 << 30,
    Float:          Math.PI,
    Double:         Math.PI
  };

  for (const type in types) {
    const value = types[type];
    const writer = `write${type}`;
    const reader = `read${type}`;

    describe(`#write${type} / #read${type}`, function() {
      it('writes value, returns buffer and reads value', function() {
        const b = new ByteBuffer(8);
        const result = b[writer](value);
        expect(result).to.eq(b);

        if (['Float', 'Double'].indexOf(type) !== -1) {
          expect(b.front()[reader]()).to.be.closeTo(value, 0.0000001);
        } else {
          expect(b.front()[reader]()).to.eq(value);
        }
      });

      context('when writing and no bytes available', function() {
        it('throws Error', function() {
          const b = new ByteBuffer(1);
          b.end();
          expect(function() {
            b[writer](value);
          }).to.throw(Error);
        });
      });

      context('when reading and no bytes available', function() {
        it('throws Error', function() {
          const b = new ByteBuffer(1);
          b.end();
          expect(function() {
            b[reader]();
          }).to.throw(Error);
        });
      });
    });
  }

  describe('#write / #read', function() {
    it('writes Uint8Arrays, returns buffer and reads sequence', function() {
      const b = new ByteBuffer(2);
      const result = b.write(new Uint8Array([1, 2]));
      expect(result).to.eq(b);
      expect(b.front().read(2).toArray()).to.deep.eq([1, 2]);
    });

    it('writes Uint16Arrays, returns buffer and reads sequence', function() {
      const b = new ByteBuffer(2);
      const result = b.write(new Uint16Array([(1 << 16) - 1]));
      expect(result).to.eq(b);
      expect(b.front().read(2).toArray()).to.deep.eq([255, 255]);
    });

    it('writes another ByteBuffer, returns buffer and reads sequence', function() {
      const b = new ByteBuffer(2);
      const result = b.write(new ByteBuffer([3, 4]));
      expect(result).to.eq(b);
      expect(b.front().read(2).toArray()).to.deep.eq([3, 4]);
    });

    it('writes arrays, returns buffer and reads sequence', function() {
      const b = new ByteBuffer(2);
      const result = b.write([13, 37]);
      expect(result).to.eq(b);
      expect(b.front().read(2).toArray()).to.deep.eq([13, 37]);
    });

    context('when writing non-sequences', function() {
      it('throws TypeError', function() {
        const b = new ByteBuffer(8);

        expect(function() {
          b.write(666);
        }).to.throw(TypeError);

        expect(function() {
          b.write('unwritable');
        }).to.throw(TypeError);
      });
    });

    context('when writing and no bytes available', function() {
      it('throws Error', function() {
        const b = new ByteBuffer(1);
        b.end();
        expect(function() {
          b.write([1]);
        }).to.throw(Error);
      });
    });

    context('when reading and no bytes available', function() {
      it('throws Error', function() {
        const b = new ByteBuffer(1);
        b.end();
        expect(function() {
          b.read(1);
        }).to.throw(Error);
      });
    });

    context('when reading outside of valid range', function() {
      it('throws RangeError', function() {
        const b = new ByteBuffer(1);
        expect(function() {
          b.read(-1);
        }).to.throw(RangeError);
      });
    });
  });

  describe('#writeString / #readString', function() {
    it('writes utf-8 strings, returns bytes used and reads strings', function() {
      let b = new ByteBuffer(22);

      expect(b.writeString('Byte $\u00A2\u20AC\uD834\uDDC7 Buffer')).to.eq(22);
      expect(b.index).to.eq(22);
      expect(b.toHex()).to.eq('42 79 74 65 20 24 C2 A2 E2 82 AC F0 9D 87 87 20 42 75 66 66 65 72');

      b.front();

      expect(b.readString()).to.eq('Byte $\u00A2\u20AC\uD834\uDDC7 Buffer');

      b = new ByteBuffer(262140);
      const long = (new Array(1 << 16)).join('\uD834\uDDC7');
      expect(b.writeString(long)).to.eq(262140);

      b.front();

      expect(b.readString()).to.eq(long);
    });

    context('when writing and no bytes available', function() {
      it('throws Error', function() {
        const b = new ByteBuffer(1);
        b.end();
        expect(function() {
          b.writeString('foo');
        }).to.throw(Error);
      });
    });

    context('when reading and no bytes available', function() {
      it('throws Error', function() {
        const b = new ByteBuffer(1);
        b.end();
        expect(function() {
          b.readString(1);
        }).to.throw(Error);
      });
    });

    context('when reading outside of valid range', function() {
      it('throws RangeError', function() {
        const b = new ByteBuffer(1);
        expect(function() {
          b.readString(-1);
        }).to.throw(RangeError);
      });
    });
  });

  describe('#writeCString / #readCString', function() {
    it('writes NULL-terminated C-strings, returns bytes used and reads strings', function() {
      const b = new ByteBuffer(27);

      expect(b.writeCString('Byte $\u00A2\u20AC\uD834\uDDC7 Buffer')).to.eq(23);
      b.writeUnsignedInt(10);

      b.front();

      expect(b.readCString()).to.eq('Byte $\u00A2\u20AC\uD834\uDDC7 Buffer');
      expect(b.available).to.eq(4);
    });

    context('when writing and no bytes available', function() {
      it('throws Error', function() {
        const b = new ByteBuffer(1);
        b.end();
        expect(function() {
          b.writeCString('foo');
        }).to.throw(Error);
      });
    });
  });

  describe('#prepend', function() {
    it('grows buffer at the front', function() {
      const b = new ByteBuffer([1, 2]);
      expect(b.prepend(2).toArray()).to.deep.eq([0, 0, 1, 2]);
      expect(b.index).to.eq(2);
    });
  });

  describe('#append', function() {
    it('grows buffer at the end', function() {
      const b = new ByteBuffer([1, 2]);
      expect(b.append(2).toArray()).to.deep.eq([1, 2, 0, 0]);
      expect(b.index).to.eq(0);
    });
  });

  describe('#implicitGrowth=', function() {
    context('when disabled', function() {
      it('throws Error when writing', function() {
        const b = new ByteBuffer(1);
        expect(b.implicitGrowth).to.eq(false);
        expect(function() {
          b.writeDouble(0);
        }).to.throw(Error);
      });
    });

    context('when enabled', function() {
      it('grows implicitly when writing', function() {
        const b = new ByteBuffer(2, ByteBuffer.BIG_ENDIAN, true);
        expect(b.implicitGrowth).to.eq(true);
        expect(b.writeUnsignedInt(0).length).to.eq(4);
        expect(b.writeString('Byte $\u00A2\u20AC\uD834\uDDC7 Buffer')).to.eq(22);
        expect(b.length).to.eq(26);
      });
    });

    it('maintains implicit(growth strategy when cloning', function() {
      const b = new ByteBuffer(1);
      expect(b.clone().implicitGrowth).to.eq(false);
      b.implicitGrowth = true;
      expect(b.clone().implicitGrowth).to.eq(true);
    });
  });

  describe('#clip', function() {
    it('clips buffer in place', function() {
      const b = new ByteBuffer([1, 2, 3, 4, 5, 6]);

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

  describe('#slice', function() {
    it('slices buffer returning a new copy', function() {
      const b = new ByteBuffer([1, 2, 3, 4, 5, 6]);

      expect(b.slice().toArray()).to.deep.eq([1, 2, 3, 4, 5, 6]);
      expect(b.slice(1).toArray()).to.deep.eq([2, 3, 4, 5, 6]);
      expect(b.slice(2, -2).toArray()).to.deep.eq([3, 4]);

      expect(b.slice()).not.to.eq(b);
    });
  });

  describe('#clone', function() {
    it('clones buffer', function() {
      const b = new ByteBuffer(3);
      b.end();

      const clone = b.clone();
      expect(clone).to.deep.eq(b);
      expect(clone).not.to.eq(b);
    });
  });

  describe('#reverse', function() {
    it('reverses/flips buffer', function() {
      const b = new ByteBuffer([1, 2, 3]);
      b.end();

      expect(b.reverse().toArray()).to.deep.eq([3, 2, 1]);
      expect(b.index).to.eq(0);
    });
  });

  describe('#toArray / #toHex / #toASCII', function() {
    it('returns various representations', function() {
      const b = new ByteBuffer([245, 66, 121, 116, 101, 215, 66, 117, 102, 102, 101, 114, 0]);

      expect(b.toArray()).to.deep.eq([245, 66, 121, 116, 101, 215, 66, 117, 102, 102, 101, 114, 0]);

      expect(b.toHex()).to.eq('F5 42 79 74 65 D7 42 75 66 66 65 72 00');
      expect(b.toASCII()).to.eq(' \uFFFD  B  y  t  e  \uFFFD  B  u  f  f  e  r  \uFFFD');

      expect(b.toHex('')).to.eq('F542797465D742756666657200');
      expect(b.toASCII('')).to.eq(' \uFFFD B y t e \uFFFD B u f f e r \uFFFD');

      expect(b.toASCII('', false)).to.eq('\uFFFDByte\uFFFDBuffer\uFFFD');
    });
  });

  describe('class inheritance', function() {
    class NetworkPacket extends ByteBuffer {}
    const p = new NetworkPacket(1);

    it('maintains byte order', function() {
      expect(p.order).to.eq(ByteBuffer.BIG_ENDIAN);
    });

    it('returns ByteBuffer when reading', function() {
      expect(p.read().constructor).to.eq(ByteBuffer);
    });

    it('returns ByteBuffer when cloning', function() {
      expect(p.clone().constructor).to.eq(ByteBuffer);
    });
  });

});
