var approotpath = require('app-root-path');
var majic = require(`${approotpath}/index.js`);
var chai = require('chai');
var expect = chai.expect;

describe('config', () => {
    it('should declare modules specified in the package.json', () => {
        var inject = majic.test({ root: `${approotpath}/test/roots/declare` });
        return inject((fs) => {
            expect(fs).to.equal(require('fs'));
        })();
    });

    it('should mock modules before loading them via declare', () => {
        var inject = majic.test({ root: `${approotpath}/test/roots/declare`, scan: [ 'mock/**' ] });
        return inject((fs) => {
            expect(fs).to.eql({});
        })();
    });

    it('should accept root configuration',() => {
        var inject = majic.test({ root: `${approotpath}/test/roots/config`})
        return inject((rootconfig) => {
            expect(rootconfig).to.equal("test root config");
        })();
    });

    it('should accept pkgroot configuration',() => {
        var inject = majic.test({ pkgroot: `${approotpath}/test/roots/package` });
        return inject((package) => {
            expect(package.version).to.equal("test");
        })();
    });

    it('should accept scan configuration', () => {
        var inject = majic.test({ scan: [ `test/roots/scan/**` ] });
        return inject((scan) => {
            expect(scan).to.equal("scanned");
        })();
    });

    it('should accept filter configuration', () => {
        return majic.start({ root: `${approotpath}/test/roots/filter`, filter: 'foo', verbose: false }).then((instance) => {
            return expect(instance.declared('bar')).to.be.undefined;
        });
    });
});
