/* eslint-disable guard-for-in, no-restricted-syntax */

import { ByteBuffer } from './spec-helper';

describe('ByteBuffer', () => {
  describe('constructor', () => {
    it('initializes by length', () => {
      const b = new ByteBuffer(1);
      expect(b.length).toEqual(1);
    });

    it('initializes from an ArrayBuffer', () => {
      const b = new ByteBuffer(new ArrayBuffer(2));
      expect(b.length).toBe(2);
    });

    it('initializes from an Uint8Array', () => {
      const b = new ByteBuffer(new Uint8Array(3));
      expect(b.length).toBe(3);
    });

    it('initializes from an Uint16Array', () => {
      const b = new ByteBuffer(new Uint16Array(1));
      expect(b.length).toBe(2);
    });

    it('initializes from an array', () => {
      const b = new ByteBuffer([0, 1, 2, 3]);
      expect(b.length).toBe(4);
    });

    it('initializes from another ByteBuffer', () => {
      const b = new ByteBuffer(new ByteBuffer(4));
      expect(b.length).toBe(4);
    });

    it('initializes without crashing when given odd objects', () => {
      const b = new ByteBuffer({ length: Infinity });
      expect(b.length).toBe(0);
    });
  });

  describe('get/set buffer', () => {
    const original = new ByteBuffer([1, 2, 3]);
    const { buffer } = original;

    it('sets and returns raw buffer', () => {
      const b = new ByteBuffer(buffer);
      expect(b.buffer).not.toBe(buffer);
      expect(b.buffer).toBeInstanceOf(ArrayBuffer);
    });

    it('does not mutate given buffer', () => {
      const b = new ByteBuffer(buffer);
      b.write([4, 5, 6]);
      expect(original.toArray()).toEqual([1, 2, 3]);
    });

    it('ensures index is within bounds', () => {
      const b = new ByteBuffer();

      b._index = -1;
      b.buffer = buffer;
      expect(b.index).toBe(0);

      b._index = 4;
      b.buffer = buffer;
      expect(b.index).toBe(3);
    });
  });

  describe('get raw', () => {
    it('returns raw Uint8Array', () => {
      const b = new ByteBuffer([1, 2]);
      expect(b.raw).toBeInstanceOf(Uint8Array);
    });
  });

  describe('get view', () => {
    it('returns underlying view', () => {
      const b = new ByteBuffer(1);
      expect(b.view).toBeInstanceOf(DataView);
    });
  });

  describe('get length / byteLength', () => {
    it('returns number of bytes in buffer', () => {
      const b = new ByteBuffer(42);
      expect(b.length).toBe(42);
      expect(b.byteLength).toBe(42);
    });
  });

  describe('get/set order', () => {
    it('sets and gets byte order', () => {
      const b = new ByteBuffer(1, ByteBuffer.LITTLE_ENDIAN);
      expect(b.order).toBe(ByteBuffer.LITTLE_ENDIAN);
      b.order = ByteBuffer.BIG_ENDIAN;
      expect(b.order).toBe(ByteBuffer.BIG_ENDIAN);
    });

    it('exposes byte order constants', () => {
      expect(ByteBuffer.BIG_ENDIAN).toBe(false);
      expect(ByteBuffer.LITTLE_ENDIAN).toBe(true);
    });

    it('defaults to big endian', () => {
      const b = new ByteBuffer(1);
      expect(b.order).toBe(ByteBuffer.BIG_ENDIAN);
    });

    it('may be provided during initialization', () => {
      const b = new ByteBuffer(1, ByteBuffer.BIG_ENDIAN);
      expect(b.order).toBe(ByteBuffer.BIG_ENDIAN);
    });

    it('maintains byte order when reading, slicing and cloning', () => {
      let b = new ByteBuffer(1);
      expect(b.read().order).toBe(ByteBuffer.BIG_ENDIAN);
      expect(b.slice().order).toBe(ByteBuffer.BIG_ENDIAN);
      expect(b.clone().order).toBe(ByteBuffer.BIG_ENDIAN);

      b = new ByteBuffer(1, ByteBuffer.LITTLE_ENDIAN);
      expect(b.read().order).toBe(ByteBuffer.LITTLE_ENDIAN);
      expect(b.slice().order).toBe(ByteBuffer.LITTLE_ENDIAN);
      expect(b.clone().order).toBe(ByteBuffer.LITTLE_ENDIAN);
    });
  });

  describe('implicitGrowth', () => {
    describe('when disabled', () => {
      it('throws Error when writing', () => {
        const b = new ByteBuffer(1);
        expect(b.implicitGrowth).toBe(false);
        expect(() => {
          b.writeDouble(0);
        }).toThrow(Error);
      });
    });

    describe('when enabled', () => {
      it('grows implicitly when writing', () => {
        const b = new ByteBuffer(2, ByteBuffer.BIG_ENDIAN, true);
        expect(b.implicitGrowth).toBe(true);
        expect(b.writeUnsignedInt(0).length).toBe(4);
        expect(b.writeString('Byte $\u00A2\u20AC\uD834\uDDC7 Buffer')).toBe(22);
        expect(b.length).toBe(26);
      });
    });

    it('maintains implicit growth strategy when cloning', () => {
      const b = new ByteBuffer(1);
      expect(b.clone().implicitGrowth).toBe(false);
      b.implicitGrowth = true;
      expect(b.clone().implicitGrowth).toBe(true);
    });
  });

  describe('get/set index', () => {
    describe('when within valid range', () => {
      it('returns read/write index', () => {
        const b = new ByteBuffer(8);
        expect(b.index).toBe(0);
      });
    });

    describe('when outside of valid range', () => {
      it('throws RangeError', () => {
        const b = new ByteBuffer(8);
        expect(() => {
          b.index = -1;
        }).toThrow(RangeError);

        expect(() => {
          b.index = 9;
        }).toThrow(RangeError);
      });
    });
  });

  describe('get available', () => {
    it('returns number of bytes available', () => {
      const b = new ByteBuffer(8);
      expect(b.available).toBe(8);

      b.index = 4;
      expect(b.available).toBe(4);

      expect(b.end().available).toBe(0);
    });
  });

  describe('front()', () => {
    it('sets read/write index to front of buffer', () => {
      const b = new ByteBuffer(8);
      expect(b.front().index).toBe(0);
    });
  });

  describe('end()', () => {
    it('sets read/write index to end of buffer', () => {
      const b = new ByteBuffer(8);
      expect(b.end().index).toBe(8);
    });
  });

  describe('seek()', () => {
    describe('when within valid range', () => {
      it('seeks by relative offset', () => {
        const b = new ByteBuffer(4);
        expect(b.seek().index).toBe(1);
        expect(b.seek(2).index).toBe(3);
        expect(b.seek(-1).index).toBe(2);
      });
    });

    describe('when outside of valid range', () => {
      it('throws RangeError', () => {
        const b = new ByteBuffer(2);
        expect(() => {
          b.seek(3);
        }).toThrow(RangeError);
      });
    });
  });

  const types = { /* eslint-disable key-spacing */
    Byte:          -1 << 7,
    UnsignedByte:   1 << 7,
    Short:         -1 << 15,
    UnsignedShort:  1 << 15,
    Int:           -1 << 30,
    UnsignedInt:    1 << 30,
    Float:          Math.PI,
    Double:         Math.PI,
  };

  for (const type in types) {
    const value = types[type];
    const writer = `write${type}`;
    const reader = `read${type}`;

    describe(`write${type}() / read${type}()`, () => {
      it('writes value, returns buffer and reads value', () => {
        const b = new ByteBuffer(8);
        const result = b[writer](value);
        expect(result).toBe(b);

        if (['Float', 'Double'].indexOf(type) !== -1) {
          expect(b.front()[reader]()).toBeCloseTo(value, 0.0000001);
        } else {
          expect(b.front()[reader]()).toBe(value);
        }
      });

      describe('when writing and no bytes available', () => {
        it('throws Error', () => {
          const b = new ByteBuffer(1);
          b.end();
          expect(() => {
            b[writer](value);
          }).toThrow(Error);
        });
      });

      describe('when reading and no bytes available', () => {
        it('throws Error', () => {
          const b = new ByteBuffer(1);
          b.end();
          expect(() => {
            b[reader]();
          }).toThrow(Error);
        });
      });
    });
  }

  describe('write() / read()', () => {
    it('writes Uint8Arrays, returns buffer and reads sequence', () => {
      const b = new ByteBuffer(2);
      const result = b.write(new Uint8Array([1, 2]));
      expect(result).toBe(b);
      expect(b.front().read(2).toArray()).toEqual([1, 2]);
    });

    it('writes Uint16Arrays, returns buffer and reads sequence', () => {
      const b = new ByteBuffer(2);
      const result = b.write(new Uint16Array([(1 << 16) - 1]));
      expect(result).toBe(b);
      expect(b.front().read(2).toArray()).toEqual([255, 255]);
    });

    it('writes another ByteBuffer, returns buffer and reads sequence', () => {
      const b = new ByteBuffer(2);
      const result = b.write(new ByteBuffer([3, 4]));
      expect(result).toBe(b);
      expect(b.front().read(2).toArray()).toEqual([3, 4]);
    });

    it('writes arrays, returns buffer and reads sequence', () => {
      const b = new ByteBuffer(2);
      const result = b.write([13, 37]);
      expect(result).toBe(b);
      expect(b.front().read(2).toArray()).toEqual([13, 37]);
    });

    describe('when writing non-sequences', () => {
      it('throws TypeError', () => {
        const b = new ByteBuffer(8);

        expect(() => {
          b.write(666);
        }).toThrow(TypeError);

        expect(() => {
          b.write('unwritable');
        }).toThrow(TypeError);
      });
    });

    describe('when writing and no bytes available', () => {
      it('throws Error', () => {
        const b = new ByteBuffer(1);
        b.end();
        expect(() => {
          b.write([1]);
        }).toThrow(Error);
      });
    });

    describe('when reading and no bytes available', () => {
      it('throws Error', () => {
        const b = new ByteBuffer(1);
        b.end();
        expect(() => {
          b.read(1);
        }).toThrow(Error);
      });
    });

    describe('when reading outside of valid range', () => {
      it('throws RangeError', () => {
        const b = new ByteBuffer(1);
        expect(() => {
          b.read(-1);
        }).toThrow(RangeError);
      });
    });
  });

  describe('writeString() / readString()', () => {
    it('writes utf-8 strings, returns bytes used and reads strings', () => {
      let b = new ByteBuffer(22);

      expect(b.writeString('Byte $\u00A2\u20AC\uD834\uDDC7 Buffer')).toBe(22);
      expect(b.index).toBe(22);
      expect(b.toHex()).toBe('42 79 74 65 20 24 C2 A2 E2 82 AC F0 9D 87 87 20 42 75 66 66 65 72');

      b.front();

      expect(b.readString()).toBe('Byte $\u00A2\u20AC\uD834\uDDC7 Buffer');

      b = new ByteBuffer(262140);
      const long = (new Array(1 << 16)).join('\uD834\uDDC7');
      expect(b.writeString(long)).toBe(262140);

      b.front();

      expect(b.readString()).toBe(long);
    });

    describe('when writing and no bytes available', () => {
      it('throws Error', () => {
        const b = new ByteBuffer(1);
        b.end();
        expect(() => {
          b.writeString('foo');
        }).toThrow(Error);
      });
    });

    describe('when reading and no bytes available', () => {
      it('throws Error', () => {
        const b = new ByteBuffer(1);
        b.end();
        expect(() => {
          b.readString(1);
        }).toThrow(Error);
      });
    });

    describe('when reading outside of valid range', () => {
      it('throws RangeError', () => {
        const b = new ByteBuffer(1);
        expect(() => {
          b.readString(-1);
        }).toThrow(RangeError);
      });
    });
  });

  describe('writeCString() / readCString()', () => {
    it('writes NULL-terminated C-strings, returns bytes used and reads strings', () => {
      const b = new ByteBuffer(27);

      expect(b.writeCString('Byte $\u00A2\u20AC\uD834\uDDC7 Buffer')).toBe(23);
      b.writeUnsignedInt(10);

      b.front();

      expect(b.readCString()).toBe('Byte $\u00A2\u20AC\uD834\uDDC7 Buffer');
      expect(b.available).toBe(4);
    });

    describe('when writing and no bytes available', () => {
      it('throws Error', () => {
        const b = new ByteBuffer(1);
        b.end();
        expect(() => {
          b.writeCString('foo');
        }).toThrow(Error);
      });
    });

    describe('when reading and null byte immediately encountered', () => {
      it('returns null', () => {
        const b = new ByteBuffer([0]);
        expect(b.readCString()).toBeNull();
      });
    });
  });

  describe('prepend()', () => {
    it('grows buffer at the front', () => {
      const b = new ByteBuffer([1, 2]);
      expect(b.prepend(2).toArray()).toEqual([0, 0, 1, 2]);
      expect(b.index).toBe(2);
    });

    describe('when given invalid number of bytes', () => {
      it('throws Error', () => {
        const b = new ByteBuffer();
        expect(() => {
          b.prepend(-1);
        }).toThrow(Error);
      });
    });
  });

  describe('append()', () => {
    it('grows buffer at the end', () => {
      const b = new ByteBuffer([1, 2]);
      expect(b.append(2).toArray()).toEqual([1, 2, 0, 0]);
      expect(b.index).toBe(0);
    });

    describe('when given invalid number of bytes', () => {
      it('throws Error', () => {
        const b = new ByteBuffer();
        expect(() => {
          b.append(-1);
        }).toThrow(Error);
      });
    });
  });

  describe('clip()', () => {
    it('clips buffer from current index until end', () => {
      const b = new ByteBuffer([1, 2, 3, 4, 5, 6]);
      b.index = 3;
      expect(b.clip().toArray()).toEqual([4, 5, 6]);
      expect(b.index).toBe(0);
    });

    it('clips buffer from given index until end', () => {
      const b = new ByteBuffer([1, 2, 3, 4, 5, 6]);
      b.index = 3;
      expect(b.clip(2).toArray()).toEqual([3, 4, 5, 6]);
      expect(b.index).toBe(1);
    });

    it('clips buffer from given negative index until end', () => {
      const b = new ByteBuffer([1, 2, 3, 4, 5, 6]);
      b.index = 4;
      expect(b.clip(-4).toArray()).toEqual([3, 4, 5, 6]);
      expect(b.index).toBe(2);
    });

    it('clips buffer from given index until given negative end', () => {
      const b = new ByteBuffer([1, 2, 3, 4, 5, 6]);
      b.index = 3;
      expect(b.clip(2, -2).toArray()).toEqual([3, 4]);
      expect(b.index).toBe(1);
    });
  });

  describe('slice()', () => {
    it('slices buffer returning a new copy', () => {
      const b = new ByteBuffer([1, 2, 3, 4, 5, 6]);

      expect(b.slice().toArray()).toEqual([1, 2, 3, 4, 5, 6]);
      expect(b.slice(1).toArray()).toEqual([2, 3, 4, 5, 6]);
      expect(b.slice(2, -2).toArray()).toEqual([3, 4]);

      expect(b.slice()).not.toBe(b);
    });
  });

  describe('clone()', () => {
    it('clones buffer', () => {
      const b = new ByteBuffer(3);
      b.end();

      const clone = b.clone();
      expect(clone).toEqual(b);
      expect(clone).not.toBe(b);
    });
  });

  describe('reverse()', () => {
    it('reverses/flips buffer', () => {
      const b = new ByteBuffer([1, 2, 3]);
      b.end();

      expect(b.reverse().toArray()).toEqual([3, 2, 1]);
      expect(b.index).toBe(0);
    });
  });

  describe('representations', () => {
    const b = new ByteBuffer([245, 66, 121, 116, 101, 215, 66, 117, 102, 102, 101, 114, 0]);

    describe('toArray()', () => {
      it('returns buffer contents as an array', () => {
        expect(b.toArray()).toEqual([245, 66, 121, 116, 101, 215, 66, 117, 102, 102, 101, 114, 0]);
      });
    });

    describe('toHex()', () => {
      it('returns hex string representation of buffer', () => {
        expect(b.toHex()).toBe('F5 42 79 74 65 D7 42 75 66 66 65 72 00');
        expect(b.toHex('')).toBe('F542797465D742756666657200');
      });
    });

    describe('toASCII()', () => {
      it('returns ASCII string representation of buffer', () => {
        expect(b.toASCII()).toBe(' \uFFFD  B  y  t  e  \uFFFD  B  u  f  f  e  r  \uFFFD');
        expect(b.toASCII('')).toBe(' \uFFFD B y t e \uFFFD B u f f e r \uFFFD');
        expect(b.toASCII('', false)).toBe('\uFFFDByte\uFFFDBuffer\uFFFD');
      });
    });
  });

  describe('class inheritance', () => {
    class NetworkPacket extends ByteBuffer {}
    const p = new NetworkPacket(1);

    it('maintains byte order', () => {
      expect(p.order).toBe(ByteBuffer.BIG_ENDIAN);
    });

    it('returns ByteBuffer when reading', () => {
      expect(p.read().constructor).toBe(ByteBuffer);
    });

    it('returns ByteBuffer when cloning', () => {
      expect(p.clone().constructor).toBe(ByteBuffer);
    });
  });
});
