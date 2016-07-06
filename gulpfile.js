/**
 *
 *  No comment
 *  https://www.youtube.com/watch?v=He82NBjJqf8
 *
 */

var gulp = require('gulp')
var shell = require('gulp-shell')

gulp.task('get-configuration',
    shell.task(['rsync -av --files-from=utils/configuration.list im.silverpeas.net:/ .']));

gulp.task('jsxc-grunt-jsdoc',
    shell.task(['export PATH=$PATH:/opt/nodejs4/bin && cd var/www/djoe/jsxc/ && grunt jsdoc']));

gulp.task('jsxc-grunt-build',
    shell.task(['export PATH=$PATH:/opt/nodejs4/bin && cd var/www/djoe/jsxc/ && grunt build']));

gulp.task('jsxc-grunt',
    shell.task(['export PATH=$PATH:/opt/nodejs4/bin && cd var/www/djoe/jsxc/ && grunt']));

gulp.task('mirror-local', shell.task(
    ['rsync -az "var/www/djoe/jsxc/dev/" "/home/remipassmoilesel/projects/javaee/silverpeas/Silverpeas-Core/core-war/src/main/webapp/chatclient/"',
      'rsync -az "var/www/djoe/jsxc/dev/" "/opt/silverpeas-6.0-SNAPSHOT-wildfly10/bin/build/dist/chatclient/"']));

gulp.task('mirror-distant', shell.task(
    ['rsync -az "var/www/djoe/jsxc/dev/" im.silverpeas.net:"/opt/silverpeas-sources/Silverpeas-Core/core-war/src/main/webapp/chatclient/"',
      'rsync -az "var/www/djoe/jsxc/dev/" im.silverpeas.net:"/opt/silverpeas-6.0-SNAPSHOT-wildfly10/bin/build/dist/chatclient/"',]));

gulp.task('mirror-demo',
    shell.task(['rsync -az "var/www/djoe/" im.silverpeas.net:"/var/www/djoe/"']));

