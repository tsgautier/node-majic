var approotpath = require('app-root-path');
var inject = require('../../index.js').test({ root: approotpath + '/test/root', verbose: false });

describe('options', () => {
    it('should accept root configuration', inject((expect, rootconfig) => {
        expect(rootconfig).to.be.true;
    }));
});
