var inject = require('../../index.js').test();

describe('config', () => {
    it('should inject a config object', inject((expect, config) => {
        expect(config.greeting).to.equal("Hello Majic!");
    }));
});
