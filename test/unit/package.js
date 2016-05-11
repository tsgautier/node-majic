expect = require('chai').expect;

describe('package.json', () => {
    it('should read package.json from a specified location',() => {
        var inject = require('../../index.js').test({ pkgroot: `${__dirname}/../root` });
        return inject((package) => {
            expect(package.version).to.equal("test");
        });
    });
});
