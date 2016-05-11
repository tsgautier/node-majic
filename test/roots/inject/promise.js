module.exports = function(bluebird) {
    return new bluebird((resolve, reject) => {
        process.nextTick(() => resolve("promise resolved!"));
    });
}
