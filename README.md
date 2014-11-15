majic
=====

A mini ioc container for node/javascript.

majic is an opinionated ioc container that uses promises and directory
scanning to make bootstrapping your application simple.

bootstrap majic in one simple line:
``` javascript
require('majic').start();

majic will autoscan and require all dependencies declared in your package.json
dependencies section.

it will autoscan any files in the __dirname/config directory and it will
autoscan any files in the __dirname/src directory.

if you declare a function as your module.exports, majic will automatically
detect the names of the function arguments, and inject them for you.  

this is done using promises, so your modules will run as soon as the
dependencies for your module are available.

if you return a promise from your module, the resolved value (when ready)
will be used as the injetable value.
