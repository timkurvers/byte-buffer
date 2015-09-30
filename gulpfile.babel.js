import babel from 'gulp-babel';
import browserify from 'gulp-browserify';
import del from 'del';
import gulp from 'gulp';
import header from './header';
import mocha from 'gulp-mocha';
import pkg from './package.json';
import plumber from 'gulp-plumber';
import rename from 'gulp-rename';
import uglify from 'gulp-uglify';

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
