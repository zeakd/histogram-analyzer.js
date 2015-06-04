var gulp = require('gulp');
var mocha = require('gulp-mocha');
var concat = require('gulp-concat');
var mochaPhantomJS = require('gulp-mocha-phantomjs');

gulp.task('default', ['test'], function() {
  // place code for your default task here
});

gulp.task('test', function () {  
    gulp.src(['test/*.js'])  
        .pipe(mocha());  
    gulp.src(['test/*.html'])
        .pipe(mochaPhantomJS());
  
});  