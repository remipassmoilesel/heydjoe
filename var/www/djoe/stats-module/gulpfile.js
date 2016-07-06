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
var shell = require('gulp-shell')
var merge = require('gulp-merge')
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');

gulp.task('browser-sync', function() {
  browserSync({
    server : {
      baseDir : "./public/"
    }
  });
});

gulp.task('bs-reload', function() {
  browserSync.reload();
});

gulp.task('start-server',
    shell.task(['cd server && export PATH=$PATH:/opt/nodejs4/bin/ ' + '&& node server.js']));

gulp.task('send-distant', shell.task(['rsync -av . im.silverpeas.net:/opt/stats-module/']));

gulp.task('images', function() {
  gulp.src('public/src/images/**/*')
      .pipe(cache(imagemin({optimizationLevel : 3, progressive : true, interlaced : true})))
      .pipe(gulp.dest('dist/images/'));
});

gulp.task('lint', function() {
  return gulp.src('public/src/scripts/**/*.js')
      .pipe(jshint())
      .pipe(jshint.reporter(stylish));
});

gulp.task('styles', function() {

  var sassStream, cssStream;

  var errorHandler = {
    errorHandler : function(error) {
      console.log(error.message);
      this.emit('end');
    }
  };

  //compile sass
  sassStream = gulp.src(['public/src/styles/**/*.scss'])
      .pipe(plumber(errorHandler))
      .pipe(sass({
        errLogToConsole : true
      }));

  //select additional css files
  cssStream = gulp.src([// css files must be loaded seprately
    'public/bower_components/jquery-ui/themes/base/jquery-ui.css',

    'public/bower_components/angular-material/angular-material.css'

  ]);

  //merge the two streams and concatenate their contents into a single file
  return merge(cssStream, sassStream)
      .pipe(autoprefixer('last 2 versions'))
      .pipe(concatCss("bundle.css"))
      .pipe(gulp.dest('public/dist/styles/'))
      .pipe(rename({suffix : '.min'}))
      .pipe(minifycss())
      .pipe(gulp.dest('public/dist/styles/'))
      .pipe(browserSync.reload({stream : true}))

});

gulp.task('scripts-dependencies', function() {

  return gulp.src('./public/src/scripts/visualization.dep.js')
      .pipe(plumber({
        errorHandler : function(error) {
          console.log(error.message);
          this.emit('end');
        }
      }))
      .pipe(webpack({

        entry : './public/src/scripts/visualization.dep.js',

        resolve : {
          modulesDirectories : ["web_modules", "node_modules", "bower_components"]
        },

        output : {
          filename : './visualization.dep.js'
        }

      }))
      .pipe(gulp.dest('public/dist/scripts/'))
      .pipe(rename({suffix : '.min'}))
      .pipe(uglify())
      .pipe(gulp.dest('public/dist/scripts/'))
      .pipe(browserSync.reload({stream : true}))
});

gulp.task('scripts', ['lint'], function() {
  
  gulp.src("public/src/scripts/Stats-embed.js")
      .pipe(gulp.dest('public/dist/scripts/'));

  gulp.src('public/src/scripts/**/*.js')

      .pipe(plumber({
        errorHandler : function(error) {
          console.log(error.message);
          this.emit('end');
        }
      }))
      .pipe(webpack({

        entry : './public/src/scripts/visualization.js',

        loaders : [{test : /\.html$/, loader : "extract-loader"}],

        resolve : {
          modulesDirectories : ["web_modules", "node_modules", "bower_components"]
        },

        output : {
          filename : './visualization.js'
        }

      }))
      .pipe(gulp.dest('public/dist/scripts/'))
      .pipe(rename({suffix : '.min'}))
      .pipe(uglify())
      .pipe(gulp.dest('public/dist/scripts/'))
      .pipe(browserSync.reload({stream : true}));

});

gulp.task('default', ['scripts-dependencies', "scripts", "styles", 'browser-sync'], function() {

  gulp.watch("public/src/styles/**/*.scss", ['styles']);
  gulp.watch("public/src/scripts/**/*", ['scripts']);
  gulp.watch("public/**/*.html", ['bs-reload']);

});