/* global module:false */
module.exports = function (grunt) {

    // full without jquery and jquery ui 
    var dep = grunt.file.readJSON('jsdep-full.json');

    var depcss = grunt.file.readJSON('cssdep.json');

    // adapt target path
    var dep_files = dep.map(function (el) {
        return '<%= target %>/' + el.file;
    });

    var git_cached = [];

    // Project configuration.
    grunt.initConfig({
            app: grunt.file.readJSON('package.json'),
            meta: {
                banner: grunt.file.read('banner.js')
            },
            target: 'dev',
            jshint: {
                options: {
                    jshintrc: '.jshintrc'
                },
                gruntfile: {
                    src: 'Gruntfile.js'
                },
                files: ['src/jsxc.lib.*.js']
            },

            copy: {
                init: {
                    files: [{
                        expand: true,
                        src: [
                            'jsxc_init.js'
                        ],
                        dest: '<%= target %>/'
                    }]
                },
                main: {
                    /**
                     Copy dependencies, images, ... to dev/ or build/
                     */
                    files: [{
                        expand: true,
                        src: [
                            'lib/jquery/dist/*.js',
                            'lib/jquery-ui/*.js',
                            'lib/jquery-ui/themes/base/*.css',
                            'lib/jquery-ui/themes/base/images/*.png',
                            'lib/jquery-ui/themes/silverpeas/*.css',
                            'lib/jquery-ui/themes/silverpeas/images/*.png',
                            'lib/jquery-toast-plugin/src/*',
                            'lib/jquery-toast-plugin/dist/*',
                            'lib/perfect-scrollbar/js/*.js',
                            'lib/perfect-scrollbar/css/*.css',
                            'lib/jquery.eventconsole.js/*.js',
                            'lib/magnific-popup/dist/*.js',
                            'lib/favico.js/favico.js',
                            'lib/emojione/lib/js/*.js',
                            'lib/emojione/assets/svg/*.svg',
                            'lib/strophe.js/strophe.js',
                            'lib/strophe.x/*.js',
                            'lib/strophe.bookmarks/*.js',
                            'lib/strophe.vcard/*.js',
                            'lib/strophe.jinglejs/*-bundle.js',
                            'lib/otr/build/**',
                            'lib/otr/lib/dsa-webworker.js',
                            'lib/otr/lib/sm-webworker.js',
                            'lib/otr/lib/const.js',
                            'lib/otr/lib/helpers.js',
                            'lib/otr/lib/dsa.js',
                            'lib/otr/vendor/*.js',
                            'lib/sha1.js',
                            'lib/*.js',
                            'LICENSE',
                            'img/**',
                            'sound/**'
                        ],
                        dest: '<%= target %>/'
                    }]
                }
            },
            clean: ['<%= target %>/'],
            usebanner: {
                dist: {
                    options: {
                        position: 'top',
                        banner: '<%= meta.banner %>'
                    },
                    files: {
                        src: ['<%= target %>/*.js']
                    }
                }
            },
            replace: {
                version: {
                    src: ['<%= target %>/jsxc.js'],
                    overwrite: true,
                    replacements: [{
                        from: '< $ app.version $ >',
                        to: "<%= app.version %>"
                    }]
                },
                libraries: {
                    src: ['<%= target %>/jsxc.js'],
                    overwrite: true,
                    replacements: [{
                        from: '<$ dep.libraries $>',
                        to: function () {
                            var i, d, libraries = '';

                            for (i = 0; i < dep.length; i++) {
                                d = dep[i];
                                if (typeof d.name === 'string') {
                                    libraries += '<a href="' + d.url + '">' + d.name + '</a> (' + d.license + '), ';
                                }
                            }

                            return libraries.replace(/, $/, '');
                        }
                    }]
                },
                locales: {
                    src: ['<%= target %>/lib/translation.js'],
                    overwrite: true,
                    replacements: [{
                        from: /^{/g,
                        to: 'var chatclient_I18next_ressource_store = {'
                    }, {
                        from: /}$/g,
                        to: '};'
                    }]
                },
                template: {
                    src: ['tmp/template.js'],
                    overwrite: true,
                    replacements: [{
                        from: 'var jsxc.gui.template = {};',
                        to: ''
                    }]
                },
                imageUrl: {
                    src: ['tmp/*.css'],
                    overwrite: true,
                    replacements: [{
                        from: /image-url\(["'](.+)["']\)/g,
                        to: 'url(\'../img/$1\')'
                    }]
                },
                // IE 10 does not like comments starting with @
                todo: {
                    src: ['build/jsxc.js'],
                    overwrite: true,
                    replacements: [{
                        from: /\/\/@(.*)/g,
                        to: '//$1'
                    }]
                }
            },
            merge_data: {
                target: {
                    src: ['locales/*.{json,y{,a}ml}'],
                    dest: '<%= target %>/lib/translation.js'
                }
            },
            concat: {
                dep: {
                    options: {
                        banner: '/*!\n' +
                        ' * <%= app.name %> v<%= app.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
                        ' * \n' +
                        ' * This file concatenates all dependencies of <%= app.name %>.\n' +
                        ' * \n' +
                        ' */\n\n',
                        process: function (src, filepath) {
                            filepath = filepath.replace(/^[a-z]+\//i, '');

                            if (filepath === 'lib/otr/build/dep/crypto.js') {
                                src += ';';
                            }

                            var data = dep[dep_files.indexOf('<%= target %>/' + filepath)];

                            if (data) {
                                return '\n/*!\n * Source: ' + filepath + ', license: ' + data.license + ', url: ' + data.url + '\n */\n' + src;
                            } else {
                                return src;
                            }
                        }
                    },
                    src: dep_files,
                    dest: '<%= target %>/lib/jsxc.dep.js'
                },
                jsxc: {
                    options: {
                        banner: '/*! This file is concatenated for the browser. */\n\n'
                    },
                    src: ['src/jsxc.intro.js', 'src/jsxc.lib.js', 'src/jsxc.lib.xmpp.js', 'src/jsxc.lib.*.js', 'tmp/template.js', 'src/jsxc.outro.js'],
                    dest: 'tmp/jsxc.js'
                }
            },
            uglify: {
                jsxc: {
                    options: {
                        mangle: false,
                        sourceMap: true,
                        preserveComments: 'some'
                    },
                    files: {
                        '<%= target %>/lib/jsxc.dep.min.js': ['<%= target %>/lib/jsxc.dep.js'],
                        '<%= target %>/jsxc.min.js': ['<%= target %>/jsxc.js']
                    }
                }
            },
            search: {

                // Stop build if console.log is found
                console: {
                    files: {
                        src: ['src/*.js']
                    },
                    options: {
                        searchString: /console\.log\((?!'[<>]|msg)/g,
                        logFormat: 'console',
                        failOnMatch: true
                    }
                },

                // Stop build if no entry is found in CHANGELOG.md
                changelog: {
                    files: {
                        src: ['CHANGELOG.md']
                    },
                    options: {
                        searchString: "<%= app.version %>",
                        logFormat: 'console',
                        onComplete: function (m) {
                            if (m.numMatches === 0) {
                                grunt.fail.fatal("No entry in CHANGELOG.md for current version found.");
                            }
                        }
                    }
                }
            },
            compress: {
                main: {
                    options: {
                        archive: "archives/jsxc-<%= app.version %>.zip"
                    },
                    files: [{
                        src: ['**'],
                        expand: true,
                        dest: 'jsxc/',
                        cwd: 'build/'
                    }]
                }
            },
            jsdoc: {
                dist: {
                    src: ['src/jsxc.lib.*'],
                    dest: 'doc'
                }
            },
            autoprefixer: {
                no_dest: {
                    src: 'tmp/*.css'
                }
            },
            csslint: {
                strict: {
                    options: {
                        import: 2
                    },
                    src: ['tmp/*.css']
                }
            },
            sass: {
                dist: {
                    files: {
                        'tmp/jsxc.css': 'scss/jsxc.scss'
                    }
                }
            },
            watch: {
                locales: {
                    files: ['locales/*'],
                    tasks: ['merge_data', 'replace:locales', 'concat:dep']
                },
                css: {
                    files: ['scss/*'],
                    tasks: ['sass', 'autoprefixer', 'replace:imageUrl']
                },
                js: {
                    files: ['src/jsxc.lib.*'],
                    tasks: ['concat:jsxc']
                },
                copy: {
                    files: ['jsxc_init.js'],
                    tasks: ['copy:init']
                },
                template: {
                    files: ['template/*.html'],
                    tasks: ['htmlConvert', 'replace:template', 'concat:jsxc']
                },
                webpack: {
                    files: ['tmp/*.js'],
                    tasks: ['webpack']
                }
            },
            jsbeautifier: {
                files: ['Gruntfile.js',
                    'src/jsxc.lib.*',
                    'template/*.html',
                    'example/*.html',
                    'example/js/dev.js',
                    'example/js/example.js',
                    'example/css/example.css'],
                options: {
                    config: '.jsbeautifyrc'
                }
            },
            prettysass: {
                options: {
                    alphabetize: false,
                    indent: 4
                },
                jsxc: {
                    src: ['scss/*.scss']
                }
            },

            concat_css: {
                options: {
                    // Task-specific options go here. 
                },
                all: {
                    src: depcss,
                    dest: "<%= target %>/css/jsxc.css"
                },
            },


            htmlConvert: {
                options: {
                    target: 'js',
                    rename: function (name) {
                        return name.match(/([-_0-9a-z]+)\.html$/i)[1];
                    },
                    quoteChar: '\'',
                    indentString: '',
                    indentGlobal: ''
                },
                'jsxc.gui.template': {
                    src: 'template/*.html',
                    dest: 'tmp/template.js'
                }
            },

            webpack: {
                jsxc: {
                    // webpack options
                    entry: "./tmp/jsxc.js",
                    output: {
                        path: "<%= target %>/",
                        filename: "jsxc.js",
                        overwrite: true
                    },

                    stats: {
                        // Configure the console output
                        colors: true,
                        modules: true,
                        reasons: true
                    },
                    // stats: false disables the stats output

                    // storeStatsTo: "xyz", // writes the status to a variable named xyz
                    // you may use it later in grunt i.e. <%= xyz.hash %>

                    progress: true, // Don't show progress
                    // Defaults to true

                    failOnError: false, // don't report error to grunt if webpack find errors
                    // Use this if webpack errors are tolerable and grunt should continue

                    watch: false, // use webpacks watcher
                    // You need to keep the grunt process alive

                    // keepalive: true, // don't finish the grunt task
                    // Use this in combination with the watch option

                    // inline: true,  // embed the webpack-dev-server runtime into the bundle
                    // Defaults to false

                    // hot: true, // adds the HotModuleReplacementPlugin and switch the server to hot mode
                    // Use this in combination with the inline option

                }

            },

            shell: {
                'precommit-before': {
                    command: 'git diff --cached --name-only',
                    options: {
                        callback: function (err, stdout, stderr, cb) {
                            git_cached = stdout.trim().split(/\n/);

                            cb();
                        }
                    }
                },
                'precommit-after': {
                    command: 'git diff --name-only',
                    options: {
                        callback: function (err, stdout, stderr, cb) {
                            var git_diff = stdout.trim().split(/\n/);
                            var intersection = [];
                            var i;

                            for (i = 0; i < git_diff.length; i++) {
                                if (git_cached.indexOf(git_diff[i]) >= 0) {
                                    intersection.push(git_diff[i]);
                                }
                            }

                            if (intersection.length > 0) {
                                grunt.log.writeln();

                                for (i = 0; i < intersection.length; i++) {
                                    grunt.log.writeln('> ' + intersection[i]);
                                }

                                grunt.fail.warn('Some files changed during pre-commit hook!');
                            }

                            cb();
                        }
                    }
                }
            }
        }
    );

// These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-banner');
    grunt.loadNpmTasks('grunt-text-replace');
    grunt.loadNpmTasks('grunt-search');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-data-uri');
    grunt.loadNpmTasks('grunt-merge-data');
    grunt.loadNpmTasks('grunt-contrib-csslint');
    grunt.loadNpmTasks('grunt-sass');
    grunt.loadNpmTasks('grunt-autoprefixer');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-jsbeautifier');
    grunt.loadNpmTasks('grunt-prettysass');
    grunt.loadNpmTasks('grunt-html-convert');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-concat-css');
    grunt.loadNpmTasks('grunt-webpack');


    // Default task
    grunt.registerTask('default', ['build', 'watch']);

    grunt.registerTask('build',
        ['jshint', 'clean', 'sass', 'replace:imageUrl', 'autoprefixer', 'copy',
            'merge_data', 'replace:locales', 'htmlConvert', 'replace:template', 'concat',
            'webpack:jsxc',
            'concat_css']);

    grunt.registerTask('build:prerelease', 'Build a new pre-release', function () {
        grunt.config.set('target', 'build');

        // Ne pas empecher le build si des occurences de console sont trouvées.
        //grunt.task.run(['search:console', 'build', 'usebanner', 'replace:version', 'replace:libraries', 'replace:todo', 'uglify', 'compress']);
        grunt.task.run(['build', 'usebanner', 'replace:version', 'replace:libraries',
            'replace:todo', 'uglify', 'compress']);
    });

    grunt.registerTask('build:release', 'Build a new release', function () {
        grunt.config.set('target', 'build');

        //grunt.task.run(['search:changelog', 'build:prerelease', 'jsdoc']);
        grunt.task.run(['build:prerelease', 'jsdoc']);
    });

    // Create alpha/beta build @deprecated
    grunt.registerTask('pre', ['build:prerelease']);

    // before commit
    grunt.registerTask('commit', ['shell:precommit-before', 'search:console', 'jsbeautifier', 'prettysass',
        'jshint', 'shell:precommit-after']);
};
