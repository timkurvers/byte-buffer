/**
 * BusterJS testing task
 * http://busterjs.org
 */

module.exports = function(grunt) {

  var exec = require('child_process').exec;

  var log = grunt.log;

  grunt.registerTask('buster', 'runs BusterJS tests.', function() {
    var done = this.async();

    exec('buster test --reporter specification', [], function(error, stdout, stderr) {
      if(!error && !stdout.length && !stderr.length) {
        log.writeln('Run `buster server` separately to enable BusterJS testing');
        done(false);
      }else if(error) {
        if(stderr.length) {
          log.writeln(stderr);
          done(false);
        }else{
          log.writeln(stdout);
          done(false);
        }
      }else{
        log.writeln(stdout);
        done(true);
      }
    });
  });

};
