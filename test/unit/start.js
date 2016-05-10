describe('start script', () => {
    it('should start with non null opts', () => {
        require('../../index.js').start({ verbose: false, scan: [] });
    });
});
