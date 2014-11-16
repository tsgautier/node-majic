var _ = require('lodash'),
    q = require('bluebird'),
    fs = require('fs'),
    glob = require('glob'),
    introspect = require('introspect'),
    TimeoutError = q.TimeoutError;

function defer() {
    var deferred = { };
    deferred.promise = new q(function() {
        deferred.resolve = arguments[0];
        deferred.reject = arguments[1];
    });
    return deferred;
}

var Majic = function options(opts, defs) {
    if (!_.isObject(opts)) opts = { root: opts };

    _.defaults(this, opts, defs, {
        PREFIX: "majic:",
        ready: defer(),
        container: {},
        root: __dirname,
        verbose: true,
        scan: [ "config/**", "src/lib/**", "src/main/**" ]
    });
}

Majic.prototype.declare = function(name, timeout, override) {
    var v = override ? undefined : this.container[name];
    if (!v) {
        this.container[name] = v = defer();
        if (timeout) {
            v.promise.timeout(timeout).catch(TimeoutError, function() {
                if (this.verbose) console.warn(this.PREFIX, "timeout resolving " + name);
            }.bind(this));
        }
    }
    return v;
}

Majic.prototype.resolve = function(name, timeout) {
    return this.declare(name, timeout).promise;
}

Majic.prototype.alias = function(src, dst) {
    this.resolve(src).then(function(v) {
        if (this.verbose) console.log(this.PREFIX, "aliased module", dst, "from", src);
        this.declare(dst).resolve(v);
    }.bind(this));
}

Majic.prototype.inject = function(fn, name) {
    var params = introspect(fn);

    return this.ready.promise.then(function() {
        return q.all(_.map(params, function(p) { return this.resolve(p, 2000) }.bind(this))).then(function(args) {
            if (this.verbose && name) console.log(this.PREFIX, "resolving module", name, "with args", params);
            return fn.apply(null, args);
        }.bind(this));
    }.bind(this));
}

Majic.prototype.crequire = function(name, path, module, override) {
    name = name.replace(/\-/gi, '_');

    var from = module ? "from npm" : "from"
    var deferred = this.declare(name, module ? undefined : 2000, override);
    var req = require(path);

    if (_.isFunction(req) && !module) {
        if (this.verbose) console.log(this.PREFIX, "loading module", name, from, path);
        this.inject(req, name).then(deferred.resolve);
    } else {
        if (this.verbose) console.log(this.PREFIX, "defined module", name, from, path);
        deferred.resolve(req);
    }

    return deferred.promise;
}

Majic.prototype.load_module = function(file, override) {
    return new q(function(resolve, reject) {
        fs.stat(file, function(err, stats) {
            if (err) { return reject(err); }

            var path = file.split("/");
            var name = path[path.length-1].split('.')[0]

            if (stats.isFile() && !_.contains(this.exclude, name)) {
                this.crequire(name, file, false, override);
            }
            resolve(true);
        }.bind(this));
    }.bind(this));
}

Majic.prototype.scan_paths = function(globs, override) {
    return q.all(_.map(globs, function(pattern) {
        return new q(function(resolve, reject) {
            var path = this.root+"/"+pattern
            if (this.verbose) console.log(this.PREFIX, "scanning path", path, "for modules")
            glob(path, function(err, files) {
                if (err) { return reject(err); }
                q.all(_.map(files, function(f) {
                    return this.load_module(f, override);
                }.bind(this))).then(resolve, reject);
            }.bind(this));
        }.bind(this));
    }.bind(this)));
}

Majic.prototype.dependencies = function(dependencies) {
    _.each(dependencies, function (version, name) {
        if (name == 'Majic') { return; }

        resolved = this.crequire(name, name, true);

        if (name == "coffee-script") {
            require('coffee-script/register');
        }

        if (name == "chai") {
            resolved.then(function (chai) {
                this.declare('expect').resolve(chai.expect);
            }.bind(this));
        }
    }.bind(this));
}

Majic.prototype.init = function() {
    this.alias('bluebird', 'q');
    this.alias('lodash', '_');
    this.alias('underscore', '_');

    this.package = require(this.root+'/package.json');

    if (this.package.dependencies) { this.dependencies(this.package.dependencies); }

    if (!this.package.cio) { this.package.cio = {} };
    return this.scan_paths(this.package.cio.scan || this.scan);
}

Majic.prototype.start = function() {
    this.ready.resolve();
    return this.ready.promise;
}

module.exports = {
    start: function (opts) {
        var majic = new Majic(opts);
        return majic.init().then(majic.start.bind(majic));
    },
    test: function test(opts) {
        var majic = new Majic(opts, { scan: [ "config/**", "src/lib/**" ], verbose: false });

        majic.init().then(function() {
            if (majic.package.devDependencies) { majic.dependencies(majic.package.devDependencies); }
            return majic.scan_paths([ "test/mock/**" ], true).then(majic.start.bind(majic));
        });

        return function(fn) {
            return function() { return majic.inject(fn, "injected test"); }
        }
    }
}
