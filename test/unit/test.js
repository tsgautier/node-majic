var approotpath = require('app-root-path');
var inject = require(`${approotpath}/index.js`).test();

describe('tests', () => {
    it('should inject expect', inject((expect) => {
        expect(expect).to.be.ok;
    }));
    it('should automatically configure chai as promised', inject((expect, bluebird) => {
        return expect(bluebird.resolve(true)).eventually.to.be.true;
    }));
});
