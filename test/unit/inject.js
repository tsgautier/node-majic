var inject = require('../../index.js').test();
var expect = require('chai').expect;

describe('inject', () => {
    it('should inject a mock object', inject((mock) => {
        expect(mock.mock).to.be.true;
    }));
    it('should resolve a promise', inject((promise) => {
        expect(promise).to.equal("promise resolved!");
    }));
    it('should inject other objects', inject((chain) => {
        expect(chain).to.equal("I got - Hello Majic!");
    }));
    it('should rename _\'s to -\'s', inject((name_with_dashes) => {
        expect(name_with_dashes).to.be.true;
    }));
});
