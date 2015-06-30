var babel      = require('gulp-babel')
var browserify = require('gulp-browserify')
var del        = require('del')
var gulp       = require('gulp')
var header     = require('./header')
var mocha      = require('gulp-mocha')
var pkg        = require('./package.json')
var plumber    = require('gulp-plumber')
var rename     = require('gulp-rename')
var uglify     = require('gulp-uglify')

gulp.task('clean', function(cb) {
  return del([
    'lib/**/*',
    'spec/**/*'
  ], cb)
})

gulp.task('build', function() {
  return gulp.src('src/**/*.js')
    .pipe(plumber())
    .pipe(babel())
    .pipe(gulp.dest('.'))
})

gulp.task('spec', function() {
  return gulp.src('spec/**/*.js', {read: false})
    .pipe(plumber())
    .pipe(mocha({bail: true}))
})

gulp.task('rebuild', gulp.series(
  'clean', 'build'
))

gulp.task('release', gulp.series('rebuild', function() {
  return gulp.src('lib/byte-buffer.js')
    .pipe(browserify({standalone: 'ByteBuffer'}))
    .pipe(rename(`${pkg.name}.js`))
    .pipe(header(pkg))
    .pipe(gulp.dest('dist'))
    .pipe(uglify())
    .pipe(header(pkg))
    .pipe(rename(`${pkg.name}.min.js`))
    .pipe(gulp.dest('dist'))
}))

gulp.task('watch', function() {
  gulp.watch('src/**/*.js', gulp.series(
    'build', 'spec'
  ))
})

gulp.task('default', gulp.series(
  'rebuild', 'spec', 'watch'
))
