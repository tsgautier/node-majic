# majic

A mini ioc container for node/javascript.

majic is an opinionated ioc container that uses promises and directory
scanning to make bootstrapping your application drop dead simple.

## how to use

bootstrap majic in one simple line:

```javascript
require('majic').start();
```

if you make this the contents of your server.js file, then you can run your app as simply as:

```
$ npm start
```

## bootstrap a majic app

Step 1: initialize your application directory

```
$ npm init
```

Step 2: install majic

```
$ npm install --save majic
```

Step 3: setup some files

./server.js

```javascript
require('majic').start();
```

./src/helloworld.js

```javascript
module.exports = function() {
    console.log("Hello World!");
}
```

Step 4: run it

```
$ npm start

majic: defined module majic from npm majic
majic: scanning path ./config/** for modules
majic: scanning path ./src/** for modules
majic: loading module helloworld from ./src/helloworld.js
majic: resolving module helloworld with args []
Hello World!
```

## automatic package.json inclusion
majic will autoscan and require all dependencies declared in your package.json.

example: ./package.json

```js
{
    depenencies: {
        "bluebird": "*",
        "lodash": "*",
        "some-package": "*"
    }
}
```

the above example would automatically require and make the bluebird, lodash and some-package libraries available.

### name-mangling

since package naming conventions allow characters that are not allowed in javascript variable naming syntax, majic will automatically convert illegal characters to the underscore ('_') character.

in the above example, some-package would be available to your modules as "some_package".

## automajic source scanning
after that it will autoscan any files in the ./config and ./src directories (this is configurable).

due to the asynchronous and promise based dependency chains, your application will start in whatever order your dependencies are available, as fast as they are available.

## native coffee support

majic natively supports coffee-script. if you put coffee-script as a dependency in your package.json, majic will bootstrap coffee and register it automajically.

## module naming

the name of your modules will be determined from the filename of your module, less the extension, so for example the module located at ./config/myconfig.coffee would be named 'myconfig'.

## declaring static modules

you can declare static values simply by exporting them via module.exports.  this is a good idea for configuration files, which you might want to put into the config directory.

example: ./config/myconfig.coffee

```
module.exports =
    host: 'localhost'
    port: '8080'
```

## declaring dynamic modules

you can declare modules which have dependencies injected by exporting a function rather than a static object.

example: ./src/myapp.coffee

```
module.exports = (myconfig) ->
    console.log "app will start on #{myconfig.host} and port #{myconfig.port}"
```

the function exported in module.exports will only be executed once all the dependencies it declares are resolved.

the value your function returns is what will be injected into other callers.

## native promise support

if you return a promise from your module, the resolved value (when ready) will be used as the injectable value.
