ByteBuffer
==========

Copyright (c) 2012 Tim Kurvers <http://www.moonsphere.net>

Wrapper for JavaScript's ArrayBuffer/DataView maintaining index and default endianness. Supports arbitrary reading/writing, automatic growth, slicing, cloning and reversing as well as UTF-8 characters and NULL-terminated C-strings.

Licensed under the **MIT** license, see LICENSE for more information.

Browser Support
---------------

Theoretically any browser supporting [JavaScript's typed arrays](http://caniuse.com/#search=typed%20arrays) is supported. Unfortunately, the spec hasn't been finalized yet and as such support is limited for now.

### Fully functional

* Chrome v20.0.1132.47 (OSX)
* Safari v5.1.7 (OSX)

### Partially broken

* Opera v12.0 (OSX)
  * Does not support ArrayBuffer.slice

### Broken

* Firefox v14.0 (OSX)
  * Does not yet [support DataView](https://developer.mozilla.org/en/JavaScript_typed_arrays/DataView#Browser_compatibility)
  * Using David Flanagan's [DataView polyfill](https://github.com/davidflanagan/DataView.js) for Firefox 4.x may be useful

### Not yet tested

* Chrome (Windows)
* Safari (Windows)
* Opera (Windows)
* Firefox (Windows)
* Internet Explorer 10 (Windows)

Do you have any of these setups? Please run the tests and report your findings.


Node Support
------------

No considerations have been made to make this project compatible with Node.. yet! Contributions are more than welcome.


Development & Contribution
--------------------------

ByteBuffer is written in [CoffeeScript](http://coffeescript.org/), developed with [Grunt](http://gruntjs.com/) and tested through [BusterJS](http://busterjs.org/).

Getting this toolchain up and running, is easy and straight-forward:

1. Get the code `git clone git://github.com/timkurvers/byte-buffer.git`

2. Download and install [NodeJS](http://nodejs.org/#download) (includes NPM) for your platform.

3. Install the following modules:

   ```shell
   npm install coffee-script
   npm install grunt
   npm install buster
   ```
   
   Note: If you'd rather install these modules globally, append the -g flag to the above commands.

4. Verify availability of the following binaries:
   
   ```shell
   which coffee
   which grunt
   which buster
   ```

5. Testing requires running `buster server` in a separate separate terminal window.

6. Navigate to the listed address (normally localhost:1111) with at least one browser and hit the capture button. Each browser you capture will be tested against.

7. Run `grunt` which - when source files change - will automatically compile the CoffeeScript source files, lint these as well as run tests using BusterJS.

When contributing, please:

* Fork the repository
* Accompany each logical unit of operation with at least one test
* Open a pull request
* Do *not* include any distribution files (such as byte-buffer.min.js)


Alternative Comparisons
-----------------------

Comparisons will be added shortly.

* [jDataView](https://github.com/vjeux/jDataView/)
* [BufferView](https://github.com/davidflanagan/BufferView)
