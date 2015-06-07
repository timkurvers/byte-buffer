const chai   = require('chai')
const sinon  = require('sinon')
const bridge = require('sinon-chai')

chai.use(bridge)

module.exports = {
  expect: chai.expect,
  sinon:  sinon,
  ByteBuffer: require('../')
}

beforeEach(function() {
  this.sandbox = sinon.sandbox.create()
})

afterEach(function() {
  this.sandbox.restore()
})
