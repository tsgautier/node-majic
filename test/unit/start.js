var approotpath = require('app-root-path');
var majic = require(`${approotpath}/index.js`);

describe('start script', () => {
    it('should start with non null opts', () => {
        return majic.start({ verbose: false, scan: [] });
    });
});
