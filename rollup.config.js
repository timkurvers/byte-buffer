import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';

import pkg from './package.json';

const banner = `/**
* ${pkg.name} v${pkg.version}
* Copyright (c) 2012-2020 ${pkg.author}
* @license ${pkg.license}
*
* ${pkg.description}.
*
* https://github.com/${pkg.repository}
*/`;

export default {
  input: 'lib/ByteBuffer.mjs',
  plugins: [babel()],
  output: [
    {
      banner,
      file: 'dist/byte-buffer.js',
      format: 'umd',
      name: 'ByteBuffer',
    },
    {
      banner,
      file: 'dist/byte-buffer.min.js',
      format: 'umd',
      name: 'ByteBuffer',
      plugins: [terser()],
    },
  ],
};
