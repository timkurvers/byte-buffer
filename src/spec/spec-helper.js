import ByteBuffer from '../';
import chai from 'chai';
import sinon from 'sinon';
import bridge from 'sinon-chai';

chai.use(bridge);

export default {
  expect: chai.expect,
  sinon: sinon,
  ByteBuffer: ByteBuffer
};

beforeEach(function() {
  this.sandbox = sinon.sandbox.create();
});

afterEach(function() {
  this.sandbox.restore();
});
