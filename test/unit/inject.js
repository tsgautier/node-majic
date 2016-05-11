var approotpath = require('app-root-path');
var inject = require(`${approotpath}/index.js`).test({ scan: [ 'test/mock/*', 'config/**', 'test/roots/inject/**' ]});
var expect = require('chai').expect;

describe('inject', () => {
    it('should inject a config object', inject((config) => {
        expect(config.greeting).to.equal("Hello Majic!");
    }));
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
    it('should resolve the package.json as package', inject((package) => {
        expect(package.dependencies).to.be.a('object');
        expect(package.devDependencies).to.be.a('object');
        expect(package.name).to.equal('majic');
    }));
});
