const middlewareSets = {};

module.exports.createSet = function createSet (name, middleware = []) {
    if (!Array.isArray(middleware)) {
        middleware = [middleware];
    }
    
    middlewareSets[name] = middleware;
};

module.exports.getSet = function getSet(name) {
    return middlewareSets[name];
};