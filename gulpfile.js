var gulp = require('gulp');
var ts = require('gulp-typescript');
var tsProject = ts.createProject('src/tsconfig.json');
var sourcemaps = require('gulp-sourcemaps');
var shell = require('gulp-shell');

var spawn = require('child_process').spawn;

gulp.task('transpile', function () {
  return tsProject.src()
    .pipe(sourcemaps.init())
    .pipe(ts(tsProject))
    .js
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('dist'));
});

gulp.task('copy-package', function () {
  return gulp.src('package.json')
    .pipe(gulp.dest('dist'));
});

gulp.task('copy-credentials', function () {
  return gulp.src('credentials/*')
    .pipe(gulp.dest('dist/credentials'));
});

gulp.task('copy-scripts', function () {
  return gulp.src('src/scripts/*')
    .pipe(gulp.dest('dist/scripts'));
});

gulp.task('copy-src-files', ['copy-package', 'copy-credentials', 'copy-scripts']);

gulp.task('copy-api-dockerfile', function () {
  return gulp.src('src/dockerfile/api.dockerfile')
    .pipe(gulp.dest('dist'));
});

gulp.task('build-api', ['transpile', 'copy-src-files', 'copy-api-dockerfile'], shell.task(
  'docker build -t api -f ./dist/api.dockerfile ./dist'));

// Starts / restarts the api container
gulp.task('start-api', ['build-api', 'stop-api'], shell.task(
  'docker run -d --name api -p 3006:80 -v /var/run/docker.sock:/var/run/docker.sock api'));

// '2>/dev/null' ignores stderr
// '|| true' "forces" a 0 exit code
gulp.task('stop-api', shell.task([
  'docker kill api 2>/dev/null || true',
  'docker rm api 2>/dev/null || true'
]));

gulp.task('build-compiler', shell.task(
  'docker build -t compiler -f ./src/dockerfile/compiler.dockerfile .'));
