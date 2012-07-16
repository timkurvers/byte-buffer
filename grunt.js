/*global module:false*/
module.exports = function(grunt) {

  // ByteBuffer configuration
  grunt.initConfig({
    pkg: '<json:package.json>',
    meta: {
      
      // Banner prepended to distribution
      banner: '/**\n' +
              ' * ByteBuffer v<%= pkg.version %>\n' +
              ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %> <<%= pkg.homepage %>>\n' +
              ' *\n' +
              ' * Wrapper for ArrayBuffer/DataView maintaining index and default endianness.\n' + 
              ' * Supports arbitrary reading/writing, automatic growth, clipping, cloning and\n' + 
              ' * reversing as well as UTF-8 characters and NULL-terminated C-strings.\n' + 
              ' *\n' +
              ' * The contents of this file are subject to the MIT License, under which\n' +
              ' * this library is licensed. See the LICENSE file for the full license.\n' +
              ' */'
    },
    
    // Compiles CoffeeScript source and specs
    coffee: {
      src: {
        dir: 'src',
        dest: 'build'
      },
      spec: {
        dir: 'spec',
        dest: 'build-spec'
      }
    },
    
    // Lints compiled JavaScript files
    lint: {
      files: [
        'grunt.js',
        'build/**/*.js',
        'build-spec/**/*.js',
        'vendor/**/*.js'
      ]
    },
    
    // Concatenate compiled JavaScript files
    concat: {
      dist: {
        src: [
          '<banner:meta.banner>',
          'build/byte-buffer.js'
        ],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    
    // Minified distribution
    min: {
      dist: {
        src: ['<banner:meta.banner>', '<config:concat.dist.dest>'],
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },
    
    // Watch for changes to CoffeeScript files
    watch: {
      files: [
        'src/**/*.coffee',
        'spec/**/*.coffee'
      ],
      tasks: 'coffee lint buster concat'
    },
    
    // JSHint options
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: false,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        shadow: true
      },
      globals: {
        ByteBuffer: true,
        ArrayBuffer: true,
        DataView: true,
        Uint8Array: true,
        Uint16Array: true,
        
        // BusterJS
        buster: true,
        describe: true,
        it: true,
        before: true,
        expect: true
      }
    },
    uglify: {}
  });
  
  grunt.loadTasks('tasks');
  
  grunt.registerTask('default', 'watch');
  grunt.registerTask('release', 'coffee lint buster concat min');

};
