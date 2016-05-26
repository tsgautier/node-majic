var approotpath = require('app-root-path');
var majic = require(`${approotpath}/index.js`);
var expect = require('chai').expect;

describe('mock', () => {
    it('should allow mocks to be passed in during instantiation', () => {
        var mocked = { some: "mock" };
        var mocks = {
            glob: mocked
        }
        var inject = majic.test({ mocks: mocks });
        return inject((glob) => {
            expect(glob).to.equal(mocked);
        })();
    });
});
