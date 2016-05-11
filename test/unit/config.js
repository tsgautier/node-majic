var approotpath = require('app-root-path');
var majic = require(`${approotpath}/index.js`);

describe('config', () => {
    it('should declare modules specified in the package.json', () => {
        var inject = majic.test({ root: `${approotpath}/test/roots/declare` });
        return inject((fs) => {
            expect(fs).to.equal(require('fs'));
        });
    });

    it('should accept root configuration',() => {
        var inject = majic.test({ root: `${approotpath}/test/roots/config`})
        return inject((expect, rootconfig) => {
            expect(rootconfig).to.equal("test root config");
        });
    });

    it('should accept pkgroot configuration',() => {
        var inject = majic.test({ pkgroot: `${approotpath}/test/roots/package` });
        return inject((expect, package) => {
            expect(package.version).to.equal("test");
        });
    });

    it('should accept scan configuration', () => {
        var inject = majic.test({ scan: [ `test/roots/scan/**` ] });
        return inject((scan) => {
            expect(scan).to.equal("scanned");
        });
    });
});
