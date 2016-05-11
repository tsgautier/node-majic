var approotpath = require('app-root-path');
var majic = require(`${approotpath}/index.js`);
var expect = require('chai').expect;

describe('auto require', () => {
    it('should load coffee natively', () => {
        var inject = majic.test({ scan: [ 'test/roots/coffee/**' ] });
        return inject((cup) => {
            expect(cup).to.eql({ foo: "bar" });
        })();
    });
});
