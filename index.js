var _ = require('lodash'),
    q = require('bluebird'),
    fs = require('fs'),
    glob = require('glob'),
    introspect = require('introspect'),
    TimeoutError = q.TimeoutError;

function options(opts, defs) {
    if (!_.isObject(opts)) opts = { root: opts };

    return _.defaults(opts, defs, {
        PREFIX: "majic:",
        ready: defer(),
        container: {},
        root: __dirname,
        verbose: true,
        scan: [ "config/**", "src/lib/**", "src/main/**" ]
    });
}

function defer() {
    var resolve, reject;
    var promise = new q(function() {
        resolve = arguments[0];
        reject = arguments[1];
    });

    return {
        resolve: resolve,
        reject: reject,
        promise: promise
    };
}

function declare(options, name, timeout, override) {
    var v = override ? undefined : options.container[name];
    if (!v) {
        options.container[name] = v = defer();
        if (timeout) {
            v.promise.timeout(timeout).catch(TimeoutError, function() {
                if (options.verbose) console.warn(options.PREFIX, "timeout resolving " + name);
            });
        }
    }
    return v;
}

function resolve(options, name, timeout) {
    return declare(options, name, timeout).promise;
}

function alias(options, src, dst) {
    resolve(options, src).then(function(v) {
        if (options.verbose) console.log(options.PREFIX, "aliased module", dst, "from", src);
        declare(options, dst).resolve(v);
    });
}

function inject(options, fn, name) {
    var params = introspect(fn);

    return options.ready.promise.then(function() {
        return q.all(_.map(params, function(p) { return resolve(options, p, 2000) })).then(function(args) {
            if (options.verbose && name) console.log(options.PREFIX, "resolving module", name, "with args", params);
            return fn.apply(null, args);
        });
    });
}

function crequire(options, name, path, module, override) {
    name = name.replace(/\-/gi, '_');

    var from = module ? "from npm" : "from"
    var deferred = declare(options, name, module ? undefined : 2000, override);
    var req = require(path);

    if (_.isFunction(req) && !module) {
        if (options.verbose) console.log(options.PREFIX, "loading module", name, from, path);
        inject(options, req, name).then(deferred.resolve);
    } else {
        if (options.verbose) console.log(options.PREFIX, "defined module", name, from, path);
        deferred.resolve(req);
    }

    return deferred.promise;
}

function load_module(options, file, override) {
    return new q(function(resolve, reject) {
        fs.stat(file, function(err, stats) {
            if (err) { return reject(err); }

            var path = file.split("/");
            var name = path[path.length-1].split('.')[0]

            if (stats.isFile() && !_.contains(options.exclude, name)) {
                crequire(options, name, file, false, override);
            }
            resolve(true);
        });
    });
}

function scan(options, globs, override) {
    return q.all(_.map(globs, function(pattern) {
        return new q(function(resolve, reject) {
            var path = options.root+"/"+pattern
            if (options.verbose) console.log(options.PREFIX, "scanning path", path, "for modules")
            glob(path, function(err, files) {
                if (err) { return reject(err); }
                q.all(_.map(files, function(f) {
                    return load_module(options, f, override);
                })).then(resolve, reject);
            });
        });
    }));
}

function dependencies(options, dependencies) {
    _.each(dependencies, function (version, name) {
        if (name == 'majic') { return; }

        resolved = crequire(options, name, name, true);

        if (name == "coffee-script") {
            require('coffee-script/register');
        }

        if (name == "chai") {
            resolved.then(function (chai) {
                declare(options, 'expect').resolve(chai.expect);
            });
        }
    });
}

function init(options) {
    alias(options, 'bluebird', 'q');
    alias(options, 'lodash', '_');
    alias(options, 'underscore', '_');

    options.package = require(options.root+'/package.json');

    if (options.package.dependencies) { dependencies(options, options.package.dependencies); }
    if (!options.package.cio) { options.package.cio = {} };

    return scan(options, options.package.cio.scan || options.scan);
}

function start(opts) {
    opts = options(opts);
    return init(opts).then(opts.ready.resolve);
}

function test(opts) {
    opts = options(opts, { scan: [ "config/**", "src/lib/**" ], verbose: false });

    init(opts).then(function() {
        if (opts.package.devDependencies) { dependencies(opts, opts.package.devDependencies); }

        return scan(opts, [ "test/mock/**" ], true).then(function() {
            opts.ready.resolve();
        });
    });



    return function(fn) {
        return function() { return inject(opts, fn, "injected test"); }
    }
}

module.exports = {
    start: start,
    test: test
}
