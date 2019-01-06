# micro-mw

> a simple helper to add middleware to your zeit/micro or Now 2.0 functions.

This is a set of simple helpers to create and apply middleware to your functions 
using either [Zeit](https://zeit.co/)'s [micro](https://github.com/zeit/micro) framework
or Zeit Now 2.0 serverless functions.

The entire runtime is less than 100 lines long and only depends on `micro` itself.

## Install

Install with [npm](https://www.npmjs.com/)

```sh
$ npm i micro-mw
```

micro-mw requires Node.js v8.0.0 or higher.

## Concepts and usage

micro-mw operates in similar fashion to that of other JS frameworks (e.g. Express, Hapi).
In this case, when writing request handlers, middleware needs to be applied to the target
function via `applyMiddleware()`.

The most typical usage would looke something like:

```js
const { applyMiddleware } = require('micro-mw');

module.exports = applyMiddleware([ middlewareFn1, middlewareFn2 ], (req, res) => {
  // Normal request / response handling logic here
});
```

### Sets
Often, the same middleware needs to be applied to most request handlers within an application
or set of serverless functions. For those situations, middleware can be pre-registered as a
logical "set" and then applied to each function via `applyMiddleware()`.

Registering a set is as simple as giving it a name and passing in references to the middleware
functions that need to be called.

```js
const { createSet } = require('micro-mw');

createSet('my-route-mw', [ middlewareFn1, middlewareFn2 ]);
```

Then just use the middleware like this:

```js
const { applyMiddleware } = require('micro-mw');

module.exports = applyMiddleware('my-route-mw', (req, res) => {
  // Normal request / response handling logic here
});
```

#### Default set / middleware
If you want to apply a set of middleware to all routes automatically (unless otherwise specified),
you can define a set of default middleware by using the special keyword `default`:

```js
const { createSet } = require('micro-mw');

createSet('default', [ middlewareFn1, middlewareFn2 ]);
```

Then, when creating a route handler, don't specify any middleware at all:

```js
const { applyMiddleware } = require('micro-mw');

module.exports = applyMiddleware((req, res) => {
  // Normal request / response handling logic here
});
```

#### Set references
Often, the default middleware is enough for most functions, but occasionally, there
is a need to include other middleware in the request flow. For example, you might
want to include the default authorization middleware on all requests, but only need
database init logic in certain places.

In this case, micro-mw allows references to pre-defined middleware sets anywhere that
a middleware function could be specified.

Here are a couple of different ways this feature could be used:

- Reference one set from another
    ```
    const { createSet } = require('micro-mw');
    
    createSet('auth', [ authUserMw, getProfileMw, checkScopesMw ]);
    createSet('db', [ initDbMw ]);
    
    createSet('default', [ 'auth', 'db' ]);
    ```

- Chain sets together
    ```
    const { applyMiddleware } = require('micro-mw');
    
    module.exports = applyMiddleware([ 'db', 'auth', myCustomMwFn ], (req, res) => {
      // Normal route logic
    });
    ```

Whenever micro-mw encounters a string where a middleware function was expected, it
will automatically assume that it is a set reference. Order is important here, as
the referenced set will replace the string pointer in that exact location within
the array.

If a referenced set doesn't exist, a runtime error will occur and will be processed
by the default error handler.

## Error handling
By default, micro-mw will catch all sync and async errors that occur within a
middleware or route handler and return a response to the client.

To override this, simply create a set called `errorHandler` and pass in one or
more middleware functions that will be triggered in the case that an error is
thrown. Be sure to read [creating error middleware](#creating-error-middleware)
prior to writing your custom error handlers.

If not overridden, the default error handler will look for the following properties
on the error object:

- **err.statusCode**: The numeric HTTP status code to send to the client. *(default: 500)*
- **err.body**: The content to set as the response body. This could be a string, object, etc.
  If a body isn't provided, the value of `err.message` will be used instead.
- **err.headers**: An optional JS object containing keys and values that should be added as
  HTTP headers in the response.

Additionally, the error handler will output the status code, request method and path, and the 
error stack trace to the logs via a call to `console.error`.

You can turn this off or provide your own logging function if desired. Simply override
the internal error handler like this:

```js
const { createSet, errorHandler } = require('micro-mw');

createSet('errorHandler', [ errorHandler({ logErrors: true, logger: myLoggerObj }) ]);
```

*Note: Any custom logging object must provide an `error` function, as the handler will
call it like: `logger.error(msg)`.*


## Writing middleware
Writing middleware that is consumable by micro-mw is really no different than writing
a normal request handler. micro-mw uses async/await in order to handle synchronous
and asyncrhonous middleware in the same manner.

A typical middleware function looks like this:

```js
async function myMiddleware(req, res) {
  // Do some action based on the request
  let someObj = async requestPromise(url, { json: true });
  req.someObj = someObj;
}
```

Then use it per the patterns mentioned above. For example:

```js
const { applyMiddleware } = require('micro-mw');

module.exports = applyMiddleware([ myMiddleware ], (req, res) {
  // Typical request handling
});
```

That's it!

You can, of course, do much more complicated things than this.

### Creating error handling middleware
Error handling middleware is almost exactly like "normal" middleware, but make
note of a few key differences:

- The thrown error will be passed into the middleware function as a third param,
  i.e. `(req, res, err) => { ... }`

- The error handler is responsible for sending a response to the client.

- Error handlers should typically avoid throwing errors themselves, as that will
  likely result in no response being sent to the client.


## Contributing

Pull requests and stars are always welcome. For bugs and feature requests, 
[please create an issue](https://github.com/mhamann/micro-mw/issues)

## Author

**Matt Hamann**

* [github/mhamann](https://github.com/mhamann)
* [twitter/mhamann](http://twitter.com/mhamann)

Thanks also to [Mathias Karstädt](https://github.com/webmatze) for some inspiration
in his work on [micro-middleware](https://github.com/webmatze/micro-middleware).
