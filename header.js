import header from 'gulp-header';

export default function(pkg) {
  return header(`/**
 * ${pkg.name} v${pkg.version}
 * Copyright (c) 2012-2020 ${pkg.author}
 *
 * ${pkg.description}.
 *
 * Licensed under the ${pkg.license} license.
 */\n\n`);
}
