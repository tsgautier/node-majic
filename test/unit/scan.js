var inject = require('../../index.js').test({ scan: [ 'src/scan/**' ], verbose: false });

describe('options', () => {
    it('should accept scan configuration', inject((expect, scan) => {
        expect(scan).to.equal("scanned");
    }));
});
