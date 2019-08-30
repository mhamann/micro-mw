module.exports = function stopRequest(req) {
    req._microMwTerminate = true;
}