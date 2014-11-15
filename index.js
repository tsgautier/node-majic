var _ = require('lodash'),
    q = require('bluebird'),
    fs = require('fs'),
    glob = require('glob'),
    introspect = require('introspect'),
    package = require(__dirname + '/../../package.json'),
    TimeoutError = q.TimeoutError,
    container = {};

var PREFIX = "majic:"

function defer() {
    var resolve, reject;
    var promise = new q(function() {
        resolve = arguments[0];
        reject = arguments[1];
    })

    return {
        resolve: resolve,
        reject: reject,
        promise: promise
    };
}

function declare(name) {
    var v = container[name];
    if (!v) {
        container[name] = v = defer();
        v.promise.timeout(2000).catch(TimeoutError, function() {
            console.warn(PREFIX, "timeout resolving " + name);
        });
    }
    return v;
}

function resolve(name) {
    return declare(name).promise;
}

function alias(src, dst) {
    resolve(src).then(function(v) {
        console.log(PREFIX, "aliased module", dst, "from", src);
        declare(dst).resolve(v);
    });
}

function crequire(name, path, module) {
    name = name.replace(/\-/gi, '_');

    var deferred = declare(name);
    var req = require(path);

    if (_.isFunction(req) && !module) {
        console.log(PREFIX, "loading module", name, "from", path);
        var params = introspect(req);

        q.all(_.map(params, resolve)).then(function(args) {
            console.log(PREFIX, "resolving module", name, "with args", params);
            deferred.resolve(req.apply(null, args));
        });
    } else {
        console.log(PREFIX, "defined module", name, "from npm", path);
        deferred.resolve(req);
    }
}

function inject(file) {
    fs.stat(file, function(err, stats) {
        if (err) { return console.error(err); }

        if (stats.isFile()) {
            var path = file.split("/");
            var name = path[path.length-1].split('.')[0]
            crequire(name, file);
        }
    });

}

module.exports = {
    start: function() {
        alias('bluebird', 'q');
        alias('lodash', '_');

        if (package.dependencies) {
            _.each(package.dependencies, function (version, name) {
                crequire(name, name, true);

                if (name == "coffee-script") {
                    require('coffee-script/register');
                }
            });
        }

        if (!package.cio) { package.cio = {} };
        if (!package.cio.scan) { package.cio.scan = [ "config/**", "src/**" ]; }

        _.each(package.cio.scan, function(pattern) {
            var path = __dirname+"/../../"+pattern
            console.log(PREFIX, "scanning path", path, "for modules")
            glob(path, function(err, files) {
                if (err) { return console.error(er); }
                _.each(files, inject)
            });
        });
    }
}
