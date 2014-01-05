var config = module.exports;

config['ByteBuffer specs'] = {
  env: 'browser',
  rootPath: '../',
  sources: [
    'build/byte-buffer.js'
  ],
  specs: [
    'build/byte-buffer-spec.js'
  ],
  specHelpers: [
    'spec/helper.js'
  ]
};
