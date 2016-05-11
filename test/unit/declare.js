var inject = require('../../index.js').test();

describe('declare', () => {
    it('should inject a declared object', inject((expect, fs) => {
        expect(fs).to.equal(require('fs'));
    }));
});
