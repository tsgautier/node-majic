var TIMEOUT = 4000;

var _ = require('lodash'),
    q = require('bluebird'),
    fs = require('fs'),
    glob = require('glob'),
    introspect = require('introspect'),
    appRootPath = require('app-root-path'),
    TimeoutError = q.TimeoutError;

function defer() {
    var deferred = { };
    deferred.promise = new q(function() {
        deferred.resolve = arguments[0];
        deferred.reject = arguments[1];
    });
    return deferred;
}

function isClass(v) {
     return typeof v === 'function' && /^\s*class\s+/.test(v.toString());
}

var Majic = function options(opts, defs) {
    if (!_.isObject(opts)) opts = { root: opts };

    _.defaults(this, opts, defs, {
        PREFIX: "majic:",
        ready: defer(),
        container: {},
        root: appRootPath,
        pkgroot: appRootPath,
        verbose: true,
        scan: [ "src/config/**", "src/lib/**", "src/main/**" ]
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

Majic.prototype.define = function(name, object) {
    this.declare(name).resolve(object);
    if (this.verbose) console.log(this.PREFIX, "defined module", name, "from global")
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
        return q.all(_.map(params, function(p) { return this.resolve(p, TIMEOUT) }.bind(this))).then(function(args) {
            if (this.verbose && name) console.log(this.PREFIX, "resolving module", name, "with args", params);
            return fn.apply(null, args);
        }.bind(this));
    }.bind(this));
}

Majic.prototype.crequire = function(name, path, module, override) {
    name = name.replace(/\-/gi, '_');

    var from = module ? "from npm" : "from"
    if (this.container[name] && !override) { return this.container[name].promise; }
    var deferred = this.declare(name, module ? undefined : TIMEOUT, false);
    var req = require(path);

    if (_.isFunction(req) && !module && !isClass(req)) {
        if (this.verbose) console.log(this.PREFIX, "loading module", name, from, path);
        this.inject(req, name).then(deferred.resolve);
    } else {
        if (this.verbose) console.log(this.PREFIX, "defined module", name, from, path);
        deferred.resolve(req);
    }

    return deferred.promise;
}

Majic.prototype.nrequire = function(name) {
    this.declare(name).resolve(require(name));
    if (this.verbose) console.log(this.PREFIX, "defined module", name, "from node require");
}

Majic.prototype.load_module = function(file, override) {
    return new q(function(resolve, reject) {
        fs.stat(file, function(err, stats) {
            if (err) { return reject(err); }

            var path = file.split("/");
            var name = path[path.length-1].split('.')[0]

            if (stats.isFile() && _.find(this.exclude, name) === undefined) {
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
                    // hack for startup specifiers
                    if (this.filter && pattern == 'src/main/**') {
                        if (f.indexOf(this.filter) < 0) { return; }
                    }
                    return this.load_module(f, override);
                }.bind(this))).then(resolve, reject);
            }.bind(this));
        }.bind(this));
    }.bind(this)));
}

Majic.prototype.dependencies = function(dependencies) {
    return q.all(_.map(dependencies, function (version, name) {
        if (name == 'Majic') { return; }

        var resolved = this.crequire(name, name, true, true);
        var done = [ resolved ];

        if (name == "coffee-script") {
            require('coffee-script/register');
        }

        if (name == "chai") {
            done.push(resolved.then(function (chai) {
                this.declare('expect').resolve(chai.expect);
            }.bind(this)));
        }

        if (name == "chai-as-promised") {
            done.push(q.all([this.resolve("chai"), resolved]).spread(function (chai, p) {
                chai.use(p);
            }));
        }

        return q.all(done);
    }.bind(this)));
}

Majic.prototype.init = function() {
    this.package = require(this.pkgroot + '/package.json');

    this.alias('bluebird', 'q');
    this.alias('lodash', '_');
    this.alias('underscore', '_');
    this.define('process', process)
    this.define('argv', process.argv);
    this.define('package', this.package);

    // node dependencies
    _.each(this.package.declare, function (dependency) {
        this.nrequire(dependency);
    }.bind(this));

    return new q(function (resolve) {
        if (this.package.dependencies) {
            resolve(this.dependencies(this.package.dependencies));
        } else {
            resolve(undefined);
        }
    }.bind(this)).then(function () {
        if (!this.package.cio) { this.package.cio = {} };
        return this.scan_paths(this.package.cio.scan || this.scan);
    }.bind(this));
}

Majic.prototype.start = function() {
    this.ready.resolve(this);
    return this;
}

module.exports = {
    start: function (opts) {
        if (opts === null || opts === void(0)) { opts = {}; }
        var majic = new Majic(opts);
        return majic.init().then(majic.start.bind(majic));
    },
    test: function test(opts) {
        var majic = new Majic(opts, { scan: [ "src/test/mock/**", "src/config/**", "src/lib/**" ], verbose: false });

        majic.init().then(function() {
            return new q(function (resolve) {
                if (majic.package.devDependencies) {
                    resolve(majic.dependencies(majic.package.devDependencies));
                } else {
                    resolve(undefined);
                }
            }).then(majic.start.bind(majic));
        });

        return function(fn) {
            return function() { return majic.inject(fn, "injected test"); }
        }
    }
}
