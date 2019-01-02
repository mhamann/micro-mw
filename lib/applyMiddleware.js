const sets = require('./sets');

module.exports = function applyMiddleware (middleware, handler) {
  if (!handler) { 
    handler = middleware;
    middleware = null;
  }
  
  if (!middleware) {
    middleware = sets.getSet('default');
  }
  
  if (typeof middleware === 'string') {
    middleware = sets.getSet(middleware);
  }
  
  return async function(req, res) {
    
    try {
  
      for (const mwFn in middleware) {
        await middleware[mwFn](req, res);
      }
    
      await handler(req, res);
    
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
