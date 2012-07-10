var config = module.exports;

config['ByteBuffer tests'] = {
  env: 'browser',
  rootPath: '../',
  sources: [
    'build/byte-buffer.js'
  ],
  specs: [
    'build-spec/byte-buffer-test.js'
  ]
};
