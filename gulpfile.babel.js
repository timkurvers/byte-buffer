const babel      = require('gulp-babel');
const browserify = require('gulp-browserify');
const del        = require('del');
const gulp       = require('gulp');
const header     = require('./header');
const mocha      = require('gulp-mocha');
const pkg        = require('./package.json');
const plumber    = require('gulp-plumber');
const rename     = require('gulp-rename');
const uglify     = require('gulp-uglify');

gulp.task('clean', function(cb) {
  return del([
    'lib/**/*',
    'spec/**/*'
  ], cb);
});

gulp.task('build', function() {
  return gulp.src('src/**/*.js')
    .pipe(plumber())
    .pipe(babel())
    .pipe(gulp.dest('.'));
});

gulp.task('spec', function() {
  return gulp.src('spec/**/*.js', { read: false })
    .pipe(plumber())
    .pipe(mocha({ bail: true }));
});

gulp.task('rebuild', gulp.series(
  'clean', 'build'
));

gulp.task('release', gulp.series('rebuild', function() {
  return gulp.src('lib/byte-buffer.js')
    .pipe(browserify({ standalone: 'ByteBuffer' }))
    .pipe(rename(`${pkg.name}.js`))
    .pipe(header(pkg))
    .pipe(gulp.dest('dist'))
    .pipe(uglify())
    .pipe(header(pkg))
    .pipe(rename(`${pkg.name}.min.js`))
    .pipe(gulp.dest('dist'));
}));

gulp.task('watch', function(done) {
  gulp.watch('src/**/*.js', gulp.series(
    'build', 'spec'
  ));
  done();
});

gulp.task('default', gulp.series(
  'rebuild', 'spec', 'watch'
));
