const sets = require('./sets');

function resolveMiddleware(middleware) {
  if (typeof middleware === 'string') {
    middleware = sets.getSet(middleware);
  }

  if (!Array.isArray(middleware)) {
    middleware = [ middleware ];
  }

  return middleware.reduce((acc, item) => {
    if (typeof item !== 'string') {
      acc.push(item);
      return acc;
    }

    Array.prototype.push.apply(acc, resolveMiddleware(item));
    return acc;
  }, []);
}

module.exports = function applyMiddleware (middleware, handler) {
  if (!handler) { 
    handler = middleware;
    middleware = null;
  }
  
  if (!middleware) {
    middleware = 'default';
  }
  
  middleware = resolveMiddleware(middleware);
  
  return async function(req, res) {
    
    try {
  
      for (const mwFn in middleware) {
        await middleware[mwFn](req, res);

        // Terminate the request chain early if requested
        if (req._microMwTerminate) {
          return;
        }
      }
    
      return await handler(req, res);
    
    } catch (err) {
      let errorHandlers = sets.getSet('errorHandler');
      
      if (!errorHandlers || !errorHandlers.length) {
        throw err;
      }
      
      for (const errorFn in errorHandlers) {
        await errorHandlers[errorFn](req, res, err);
      }
    }
  }
};
