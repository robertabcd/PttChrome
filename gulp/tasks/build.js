var gulp = require('gulp');
var config = require('../config').watch;

gulp.task('build', ['styles', 'jade'], function() {
  gulp.src(config.src);
});
