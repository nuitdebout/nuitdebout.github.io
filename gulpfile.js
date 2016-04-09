var gulp = require('gulp');
var ghPages = require('gulp-gh-pages');

gulp.task('deploy-gh-pages', function() {
  return gulp.src('./public/**/*')
    .pipe(ghPages());
});
