var approotpath = require('app-root-path');
var inject = require(`${approotpath}/index.js`).test();
var _ = require('lodash');
var bluebird = require('bluebird');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var chai = require('chai');
var expect = chai.expect;
chai.use(sinonChai);

describe('timeout', () => {
    var clock;
    var log = require(`${approotpath}/log.js`);
    var stubs = [];

    before(() => {
        stubs.push(sinon.stub(log, 'info'));
        stubs.push(sinon.stub(log, 'warn'));
    });

    after(() => {
        _.each(stubs, (stub) => stub.restore());
    });

    it('should timeout when resolving non-existent dependencies', () => {
        var inject = require('../../index.js').test({ scan: [ 'test/roots/timeout/**' ], verbose: true, timeout: 1 });

        // tried to use sinon to advance the clock, but the bluebird timeout method used
        // by index.js does not seem to respect that -- how?
        //
        // so we have to really do real timeouts here, which is obviously not right
        return new bluebird(() => true).timeout(50).catch(() => {
            expect(log.warn).to.have.been.calledTwice;
        });
    });
});
