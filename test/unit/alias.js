var inject = require('../../index.js').test();
var expect = require('chai').expect;

describe('alias', () => {
    it('should alias bluebird to q', inject((bluebird, q) => {
        expect(q).to.equal(bluebird);
    }));
    it('should alias lodash to _', inject((lodash, _) => {
        expect(_).to.equal(lodash);
    }));
});
