# Majic

A mini ioc container for node/javascript.

Majic is an opinionated ioc container that uses promises and directory
scanning to make modularizing, running, and testing your application drop dead simple.

## How to use

Bootstrap majic in one simple line:

```javascript
require('majic').start(__dirname);
```

if you make this the contents of your server.js file, then you can run your app as simply as:

```
$ npm start
```

## Bootstrap a majic app

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
require('majic').start(__dirname);
```

./src/main/helloworld.js

```javascript
module.exports = function() {
    console.log("Hello World!");
}
```

Step 4: run it

```
$ npm start

majic: scanning path ./config/** for modules
majic: scanning path ./src/lib/** for modules
majic: scanning path ./src/main/** for modules
majic: loading module helloworld from ./src/main/helloworld.js
majic: resolving module helloworld with args []
Hello World!
```

## Automatic package.json inclusion
Majic will autoscan and require all dependencies declared in your package.json.

**Example: ./package.json**

```js
{
    depenencies: {
        "bluebird": "*",
        "lodash": "*",
        "some-package": "*"
    }
}
```

The above example would automatically require and make the bluebird, lodash and some-package libraries available.

#### Name mangling

Since package naming conventions allow characters that are not allowed in javascript variable naming syntax, majic will automatically convert illegal characters to the underscore ('_') character.

In the above example, some-package would be available to your modules as "some_package".

#### Automajic aliases

Majic will automajically alias common libraries for you.  the common aliases are listed below:

* bluebird: 'q'
* underscore: '_'
* lodash: '_'

## Automajic source scanning
After including dependencies from package.json, majic will will autoscan any files in the ./config, ./src/lib and ./src/main directories (this is configurable).

Due to the asynchronous and promise based dependency chains, your application will start in whatever order your dependencies are available, as fast as they are available.

## Native coffee support

Majic natively supports coffee-script. If you put coffee-script as a dependency in your package.json, majic will bootstrap coffee and register it automajically.

## Module naming

The name of your modules will be determined from the filename of your module, less the extension, so for example the module located at ./config/myconfig.coffee would be named 'myconfig'.

## Declaring static modules

You can declare static values simply by exporting them via module.exports.  This is a good idea for configuration files, which you might want to put into the config directory.

**Example: ./config/myconfig.coffee**

```
module.exports =
    host: 'localhost'
    port: '8080'
```

## Declaring dynamic modules

You can declare modules which have dependencies injected by exporting a function rather than a static object.

**Example: ./src/myapp.coffee**

```
module.exports = (myconfig) ->
    console.log "app will start on #{myconfig.host} and port #{myconfig.port}"
```

The function exported in module.exports will only be executed once all the dependencies it declares are resolved.

The value your function returns is what will be injected into other callers.

## Native promise support

If you return a promise from your module, the resolved value (when ready) will be used as the injectable value.

## Module locations

Majic scans both ./src/lib and ./src/main to allow you to declare modular non-executable components in ./src/lib and executable components in ./src/main.

When testing, majic will only scan ./src/lib, so that your application will not start by default when testing.

## Testing

Majic makes testing your application easier by autoloading components and mocks.

To test a component, using a framework such as [Mocha](https://github.com/mochajs/mocha), simply declare an instance of Majic via the test() method.

Once this is done, the instance returned can inject parameters into your test methods, just like it can into dynamic module functions.

**Example: ./test/unit/logger.coffee**

```coffee-script
describe 'logger', ->
    inject = require('majic').test __dirname+'/../..'

    it 'should inject a mock instance of winston', inject (expect, winston) ->
        expect(winston.mock).to.equal(true);
```

The result of the inject method is a promise, so you will need a unit testing library that supports promises, such as [Mocha](https://github.com/mochajs/mocha), to use majic testing.

## Automatic devDependency inclusion

During test execution, after scanning the dependencies in your package.json like in the regular startup sequence for majic, the test startup sequence will automatically scan the devDependencies section of your package.json.

## Automatic Chai expect and chai-as-promised support

If you declare [Chai](http://chaijs.com/) as a devDependency, majic will automatically declare an 'expect' alias to the Chai.expect library.

If you declare [chai-as-promised)(http://chaijs.com/plugins/chai-as-promised) then majic will automatically configure chai to use it.

## Automatic mock inclusion

After scanning your components, Majic will autoscan the directory "./test/mock" for mocks to allow mocks the ability to override components.

## Recommended setup

We recommend you use [Mocha](https://github.com/mochajs/mocha) as your test runner and Chai for expect.

To set this up, your package.json should have the following entries:

**Example: ./package.json**
```json
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
