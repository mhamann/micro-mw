const { createSet } = require('./sets');
const { send } = require('micro');

const errorHandler = module.exports = function(opts = {}) {
    opts = Object.assign({
        logErrors: true,
        logger: console
    }, opts);
    
    return function(req, res, err) {
        if (err.headers) {
            Object.keys(err.headers).forEach(header => {
                res.setHeader(header, err.headers[header]);
            });
        }
        
        send(res, err.statusCode || err.status || 500, err.body || err.message);
        
        if (opts.logErrors) {
            opts.logger.error(`${req.method} ${req.url} - Error ${err.status || err.statusCode || 500}: ${err.body || err.message}`, err.stack);
        }
    };
};

createSet('errorHandler', [errorHandler()]);