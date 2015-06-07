const header = require('gulp-header')

module.exports = function(pkg) {
  return header(`/**
 * ${pkg.name} v${pkg.version}
 * Copyright (c) 2012-2014 ${pkg.author}
 *
 * ${pkg.description}.
 *
 * Licensed under the ${pkg.license} license.
 */\n\n`)
}
