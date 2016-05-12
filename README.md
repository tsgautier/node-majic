[![Build Status](https://travis-ci.org/tsgautier/node-majic.svg?branch=master)](https://travis-ci.org/tsgautier/node-majic)
[![Coverage Status](https://coveralls.io/repos/github/tsgautier/node-majic/badge.svg?branch=master)](https://coveralls.io/github/tsgautier/node-majic?branch=master)
[![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)


# Majic
[![Join the chat at https://gitter.im/tsgautier/node-majic](https://badges.gitter.im/tsgautier/node-majic.svg)](https://gitter.im/tsgautier/node-majic?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

A lightweight javascript ioc container that favors source scanning and convention over configuration, provides native support for promises, coffeescript, mocha, chai and sinon.

Majic uses Angular style dependency injection, automatic source directory scanning, and promised based asynchronous module loading to make modularizing, running, and testing your application drop dead simple.

Out of the box, majic supports convention based configuration to make application modularization and startup a snap - no boilerplate required!  It also supports unit testing via a simple injection method and component overrides to make declaring and using mocks easy.

## How to use

Bootstrap majic in one simple line by declaring it as the npm start script in your *package.json* file:

```javascript
{
    "dependencies": {
        "majic": "^0.0.36"
    },
    "scripts": {
        "start": "./node_modules/majic/bin/majic"
    }
}
```

Then you can run your app as simply as:

```
$ npm start
```

Alternatively, you can bootstrap majic from any js file, e.g.:

*server.js*
``` javascript
require('majic').start();
```

## Generate a majic app

**Step 1: initialize your application directory**

```
$ mkdir myapp; cd myapp; npm init
```

**Step 2: install majic**

```
$ npm install --save majic
```

**Step 3: setup package.json for running npm commands**

*./package.json*

``` javascript
   ...
   "scripts": {
       "start": "./node_modules/majic/bin/majic",
       "test": "./node_modules/mocha/bin/mocha test/unit"
   },
   ...
```

**Step 4: setup an application file**

*./src/main/helloworld.js*

``` javascript
module.exports = function() {
    console.log("Hello World!");
}
```

**Step 5: run it**

```
$ npm start

majic: scanning path ./config/** for modules
majic: scanning path ./src/lib/** for modules
majic: scanning path ./src/main/** for modules
majic: loading module helloworld from ./src/main/helloworld.js
majic: resolving module helloworld with args []
Hello World!
```

## Automatic dependency injection

Majic automatically names dependencies, and injects them into module declarations (functions).  Try adding the following file:

*./src/main/config.js*
``` javascript
module.exports = {
    "greeting": "Hello World!"
}
```

And change the *./src/main/helloworld.js* file to:

``` javascript
module.exports = (config) => {
    console.log(config.greeting);
}
```

Then re-run the application.


```
$ npm start

majic: scanning path ./config/** for modules
majic: scanning path ./src/lib/** for modules
majic: scanning path ./src/main/** for modules
majic: defined module config from ./src/main/config.js
majic: loading module helloworld from ./src/main/helloworld.js
majic: resolving module helloworld with args [ 'config' ]
Hello World!
```

Notice that the new config.js file was auto-scanned automatically injected into the helloworld component which declared it as a dependency.

## Automatic package.json inclusion
Majic will autoscan and require all dependencies declared in your package.json.

**Example: ./package.json**

``` javascript
{
    "dependencies": {
        "bluebird": "^2.3.2",
        "lodash": "^2.4.1",
        "majic": "0.0.10",
        "express": "^4.10.2"
    }
}
```

The above example would automatically require the bluebird, lodash, majic, and express libraries available (by name) for dependency injection.

#### Declare additional dependencies (node modules)

If you need to declare additional modules to load that are not defined in the dependencies section of your package.json, such as node modules (e.g. fs, http, etc.), then you can add a "declare" section to your package.json.  

This is an array of strings.  For each string majic will 'require' the declared dependency and expose the package as an injectable majic dependency (note that you can later mock these, so prefer this method to raw require).

**Example: ./package.json**

``` javascript
{
    "declare": [
        "fs",
        "http"
    ]
}
```

#### Package available as a dependency

Majic will automatically declare a dependency named 'package' which corresponds to your application's package.json.

#### Name mangling

Since package naming conventions allow characters that are not allowed in javascript variable naming syntax, majic will automatically convert illegal characters to the underscore ('_') character.

In the above example, some-package would be available to your modules as "some_package".

#### Automajic aliases

Majic will automajically alias common libraries for you.  the common aliases are listed below:

* bluebird: 'q'
* underscore: '_'
* lodash: '_'

## Automajic source scanning
After including dependencies from package.json, majic will autoscan any files in the ./config, ./src/lib and ./src/main directories (this is configurable).

Due to the asynchronous and promise based dependency chains, your application will start in whatever order your dependencies are available, as fast as they are available.

## Native coffee support

Majic natively supports coffee-script. If you put coffee-script as a dependency in your package.json, majic will bootstrap coffee and register it automajically.

## Module naming

The name of your modules will be determined from the filename of your module, less the extension, so for example the module located at ./config/myconfig.coffee would be named 'myconfig'.

## Declaring static modules

You can declare static values simply by exporting them via module.exports.  This is a good idea for configuration files, which you might want to put into the config directory.

**Example: ./config/myconfig.coffee**

``` javascript
module.exports =
    host: 'localhost'
    port: '8080'
```

## Declaring dynamic modules

You can declare modules which have dependencies injected by exporting a function rather than a static object.

**Example: ./src/myapp.js**

``` javascript
module.exports = (myconfig) => {
    console.log("app will start on ${myconfig.host} and port ${myconfig.port}");
}
```

The function exported in module.exports will only be executed once all the dependencies it declares are resolved.

The value your function returns is what will be injected into other callers.

## Native promise support

If you return a promise from your module, the resolved value (when ready) will be used as the injectable value.

## Module locations

Majic scans both ./src/lib and ./src/main to allow you to declare modular non-executable components in ./src/lib and executable components in ./src/main.

When testing, majic will only scan ./src/lib, so that your application will not start by default when testing.

## Using Majic manually

If you need or want to get an instance of majic, the result of the start() method returns the instance of majic.

**Example:**

``` javascript
majic = require('majic').start();
majic.inject((_) => {
    console.log('resolved _ to', _);
}
```

## Testing

Majic makes testing your application easier by autoloading components and mocks.

To test a component, using a framework such as [Mocha](https://github.com/mochajs/mocha), simply declare an instance of Majic via the test() method.

Once this is done, the instance returned can inject parameters into your test methods, just like it can into dynamic module functions.

**Example: ./test/unit/logger.js**

``` javascript
var inject = require('majic').test();

describe('logger', () => {
    it('should inject a mock instance of winston', inject((expect, winston) => {
        expect(winston.mock).to.equal(true);
    }));
});
```

The result of the inject method is a promise, so you will need a unit testing library that supports promises, such as [Mocha](https://github.com/mochajs/mocha), to use majic testing.

## Automatic devDependency inclusion

During test execution, after scanning the dependencies in your package.json like in the regular startup sequence for majic, the test startup sequence will automatically scan the devDependencies section of your package.json.

## Chai expect and chai-as-promised support

If you declare [Chai](http://chaijs.com/) as a devDependency, majic will automatically declare an 'expect' alias to the Chai.expect library.

If you declare [chai-as-promised](http://chaijs.com/plugins/chai-as-promised) then majic will automatically configure chai to use it.

## Automatic mock inclusion

During test execution, Majic will autoscan the directory "./test/mock" before scanning for components to allow for mocks to override component definitions.

## Recommended setup

It is recommended to use [Mocha](https://github.com/mochajs/mocha) as your test runner and Chai for expect.

To set this up, your package.json should have the following entries:

**Example: ./package.json**
``` json
{
  "devDependencies": {
    "mocha": "^2.0.1",
    "chai": "^1.10.0",
    "chai-as-promised": "^4.1.1"
  },
  "scripts": {
    "test": "./node_modules/mocha/bin/mocha test/unit"
  }
}
```

And setup your mocha installation for recursive scanning and nice reporting:

**Example: ./test/mocha.opts**
```
-c
-R spec
--recursive
--globals currentContext
--compilers coffee:coffee-script/register
```

Now, place your unit tests in ./test/unit and your mocks in ./test/mock and majic will take care of the rest when you test it all with npm test:

```
$ npm test

> @ test
> ./node_modules/mocha/bin/mocha test/unit

  logger
    ✓ should inject a mock instance of winston


  1 passing (83ms)
```
