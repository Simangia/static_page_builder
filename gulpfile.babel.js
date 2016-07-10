import gulp         from 'gulp';
import browserify   from 'browserify';
import babel        from 'babelify';
import source       from 'vinyl-source-stream';
import notifier     from 'node-notifier';
import sass         from 'gulp-sass';
import autoprefixer from 'gulp-autoprefixer';
import concat       from 'gulp-concat';
import merge        from 'merge-stream';
import minify       from 'gulp-minify-css';
import jade         from 'gulp-jade';
import connect      from 'gulp-connect';
import imagemin     from 'gulp-imagemin';
import runSequence  from 'run-sequence';
import del          from 'del';
import size         from 'gulp-filesize';
import sourcemaps   from 'gulp-sourcemaps';
import buffer       from 'vinyl-buffer';
import watchify     from 'watchify';

function compile(watch) {
  var bundler = watchify(browserify('./src/js/app.js', { debug: true }).transform(babel));

  function rebundle() {
    bundler.bundle()
      .on('error', swallowError)
      .pipe(source('bundle.js'))
      .pipe(buffer())
      .pipe(gulp.dest('dist/assets/js'))
      .pipe(connect.reload())
  }

  if (watch) {
    bundler.on('update', function() {
      console.log('-> bundling...');
      rebundle();
    });
  }

  rebundle();
}

function watch() {
  return compile(true);
};

gulp.task('bundle', () => { return watch(); })

gulp.task('size', () => {
  console.log('Prod Filesize');
  return gulp.src('dist/**/*')
    .pipe(size())
});

gulp.task('devsize', () => {
  console.log('Dev Filesize');
  return gulp.src('src/**/*')
    .pipe(size())
});

gulp.task('clean', () => {
  return del([ 'dist/**/*' ]);
});

gulp.task('prod', () => {
  runSequence('devsize', 'clean', 'bundle', 'sass', 'jade', 'fonts', 'imgs', 'size');
});

gulp.task('connect', () => {
  connect.server({
    root: 'dist/',
    livereload: true
  })
});


gulp.task('sass', () => {
  let scssStream = gulp.src(['src/sass/**/*.scss'])
    .pipe(sass())
    .on('error', swallowError)
    .pipe(autoprefixer())
    .pipe(concat('scss-files.scss'));

  let mergedStream = merge(scssStream)
    .pipe(concat('site.css'))
    .pipe(minify())
    .pipe(gulp.dest('./dist/assets/css/'))
    .pipe(connect.reload())

    return mergedStream;
});

gulp.task('jade', () => {
  gulp.src('./src/jade/index.jade')
    .pipe(jade())
    .on('error', swallowError)
    .pipe(gulp.dest('./dist/'))
    .pipe(connect.reload())
});

gulp.task('fonts', () => {
  gulp.src('src/sass/fonts/*')
    .pipe(gulp.dest('dist/assets/fonts'))
    .on('error', swallowError);
});

gulp.task('imgs', () => {
  gulp.src('src/img/*')
    .pipe(imagemin())
    .pipe(gulp.dest('dist/assets/img'))
    .on('error', swallowError);
});

gulp.task('default', ['connect', 'bundle', 'sass', 'jade', 'fonts', 'imgs'], () => {
  gulp.watch('src/sass/**/*.scss', ['sass']);
  gulp.watch('src/jade/**/*.jade', ['jade']);
  gulp.watch('src/sass/fonts/**/*', ['fonts']);
  gulp.watch('src/img/*', ['imgs']);
});

function swallowError(err) {
  console.log(err.message);

  this.emit('end');

  gulp.task('default');
}
