var gulp = require('gulp'), plumber = require('gulp-plumber'), rename = require('gulp-rename');
var autoprefixer = require('gulp-autoprefixer');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var imagemin = require('gulp-imagemin'), cache = require('gulp-cache');
var minifycss = require('gulp-minify-css');
var sass = require('gulp-sass');
var browserSync = require('browser-sync');
var webpack = require('webpack-stream');
var concatCss = require('gulp-concat-css');

gulp.task('browser-sync', function() {
  browserSync({
    server : {
      baseDir : "./"
    }
  });
});

gulp.task('bs-reload', function() {
  browserSync.reload();
});

gulp.task('images', function() {
  gulp.src('src/images/**/*')
      .pipe(cache(imagemin({optimizationLevel : 3, progressive : true, interlaced : true})))
      .pipe(gulp.dest('dist/images/'));
});

gulp.task('styles', function() {
  gulp.src([

    'bower_components/jquery-ui/themes/base/jquery-ui.css',

    'bower_components/angular-material/angular-material.css',

    'src/styles/**/*.scss',

  ])
      .pipe(plumber({
        errorHandler : function(error) {
          console.log(error.message);
          this.emit('end');
        }
      }))
      .pipe(sass())
      .pipe(autoprefixer('last 2 versions'))
      .pipe(concatCss("bundle.css"))
      .pipe(gulp.dest('dist/styles/'))
      .pipe(rename({suffix : '.min'}))
      .pipe(minifycss())
      .pipe(gulp.dest('dist/styles/'))
      .pipe(browserSync.reload({stream : true}))

});

gulp.task('scripts-dependencies', function() {

  return gulp.src('./visualization.dep.js')
      .pipe(plumber({
        errorHandler : function(error) {
          console.log(error.message);
          this.emit('end');
        }
      }))
      .pipe(webpack({

        entry : './visualization.dep.js',

        resolve : {
          modulesDirectories : ["web_modules", "node_modules", "bower_components"]
        },

        output : {
          filename : './visualization.dep.js'
        }

      }))
      .pipe(gulp.dest('dist/scripts/'))
      .pipe(rename({suffix : '.min'}))
      .pipe(uglify())
      .pipe(gulp.dest('dist/scripts/'))
      .pipe(browserSync.reload({stream : true}))
});

gulp.task('scripts', function() {
  return gulp.src('src/scripts/**/*.js')

      .pipe(plumber({
        errorHandler : function(error) {
          console.log(error.message);
          this.emit('end');
        }
      }))
      .pipe(webpack({

        entry : './src/scripts/visualization.js',

        loaders: [
          { test: /\.html$/, loader: "extract-loader" }
        ],

        resolve : {
          modulesDirectories : ["web_modules", "node_modules", "bower_components"]
        },

        output : {
          filename : './visualization.js'
        }

      }))
      .pipe(gulp.dest('dist/scripts/'))
      .pipe(rename({suffix : '.min'}))
      .pipe(uglify())
      .pipe(gulp.dest('dist/scripts/'))
      .pipe(browserSync.reload({stream : true}))
});

gulp.task('default', ['browser-sync', 'scripts-dependencies', "scripts", "styles"], function() {

  gulp.watch("src/styles/**/*.scss", ['styles']);
  gulp.watch("src/scripts/**/*", ['scripts']);
  gulp.watch("*.html", ['bs-reload']);
});