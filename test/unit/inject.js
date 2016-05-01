var inject = require('../../index.js').test();

describe('inject', () => {
    it('should inject a mock object', inject((expect, mock) => {
        expect(mock.mock).to.be.true;
    }));
});
