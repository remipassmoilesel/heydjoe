/**
 *
 *  No comment
 *  https://www.youtube.com/watch?v=He82NBjJqf8
 *
 */

var gulp = require('gulp');
var shell = require('gulp-shell');

var server = "hey-djoe.fr";

gulp.task('get-configuration',
    shell.task(['rsync -av --files-from=opt/djoe/configuration.list ' + server + ':/ .']));

gulp.task('get-statsmodule',
    shell.task(['rsync -avz "var/www/djoe/stats-module/public/dist/" "var/www/djoe/jsxc/lib/stats-module/"']));

gulp.task('jsxc-grunt-jsdoc',
    shell.task(['export PATH=$PATH:/opt/nodejs4/bin && cd var/www/djoe/jsxc/ && grunt jsdoc']));

gulp.task('jsxc-grunt-build',
    shell.task(['export PATH=$PATH:/opt/nodejs4/bin && cd var/www/djoe/jsxc/ && grunt build:release']));

gulp.task('jsxc-grunt',
    shell.task(['export PATH=$PATH:/opt/nodejs4/bin && cd var/www/djoe/jsxc/ && grunt']));

gulp.task('deploy-demo',
    shell.task(['rsync -avz "var/www/djoe" admin@' + server + ':"/opt/djoe-project/var/www"']));

