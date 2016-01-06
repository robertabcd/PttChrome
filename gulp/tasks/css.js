var gulp = require('gulp');
var sass = require('gulp-sass');
var config = require('../config.js').sass;

gulp.task('styles', function() {
  gulp.src(config.src)
    .pipe(sass(config.settings).on('error', sass.logError))
    .pipe(gulp.dest(config.dest));
});
