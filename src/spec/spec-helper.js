import bridge from 'sinon-chai';
import chai from 'chai';
import sinon from 'sinon';

chai.use(bridge);

beforeEach(function () {
  this.sandbox = sinon.sandbox.create();
});

afterEach(function () {
  this.sandbox.restore();
});

export ByteBuffer from '../lib/byte-buffer';
export const { expect } = chai;
export { sinon };
