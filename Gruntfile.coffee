module.exports = (grunt) ->

  # ByteBuffer configuration
  grunt.initConfig
    pkg: grunt.file.readJSON('package.json')

    # Metadata
    meta:
      banner: '/**\n' +
              ' * ByteBuffer v<%= pkg.version %>\n' +
              ' * Copyright (c) 2012-<%= grunt.template.today("yyyy") %> <%= pkg.author.name %> <<%= pkg.homepage %>>\n' +
              ' *\n' +
              ' * Wrapper for ArrayBuffer/DataView maintaining index and default endianness.\n' +
              ' * Supports arbitrary reading/writing, implicit growth, clipping, cloning and\n' +
              ' * reversing as well as UTF-8 characters and NULL-terminated C-strings.\n' +
              ' *\n' +
              ' * The contents of this file are subject to the MIT License, under which\n' +
              ' * this library is licensed. See the LICENSE file for the full license.\n' +
              ' */\n\n'

    # BusterJS specs
    buster:
      spec:
        test:
          reporter: 'specification'

    # Cleans build folder
    clean:
      all: ['build']

    # Compiles CoffeeScript sources and specs
    coffee:
      options:
        bare: true
      dist:
        expand: true
        cwd: 'src'
        src: '**/*.coffee'
        dest: 'build'
        ext: '.js'
      spec:
        expand: true
        cwd: 'spec'
        src: '**/*.coffee'
        dest: 'build'
        ext: '.js'

    # Concatenates release files
    concat:
      options:
        banner: '<%= meta.banner %>'
      dist:
        src: ['build/byte-buffer.js']
        dest: 'dist/<%= pkg.name %>.js'

    # Lints project files using JSHint
    jshint:
      options:
        jshintrc: true
      all: ['build/**/*.js']

    # Minified distribution
    uglify:
      options:
        banner: '<%= meta.banner %>'
      dist:
        src: ['<%= concat.dist.dest %>']
        dest: 'dist/<%= pkg.name %>.min.js'

    # Watch for file changes
    watch:
      options:
        atBegin: true
      files: [
        'Gruntfile.coffee'
        'src/**/*.coffee'
        'spec/buster.js'
        'spec/**/*.coffee'
      ]
      tasks: ['spec']

  grunt.loadNpmTasks 'grunt-buster'
  grunt.loadNpmTasks 'grunt-contrib-clean'
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-concat'
  grunt.loadNpmTasks 'grunt-contrib-jshint'
  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-contrib-watch'

  grunt.registerTask 'default', ['watch']
  grunt.registerTask 'build',   ['clean', 'coffee', 'jshint', 'concat']
  grunt.registerTask 'spec',    ['build', 'buster::test']
  grunt.registerTask 'release', ['spec', 'uglify']
