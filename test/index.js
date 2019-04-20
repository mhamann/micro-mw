const test = require('ava');
const { applyMiddleware, createSet, getSet } = require('../lib');
const httpMocks = require('node-mocks-http');
const { run } = require('micro');

function reqUserMiddleware(req, res) {
    req.user = { id: 'foobar' };
}

async function asyncMiddleware(req, res) {
    return new Promise((resolve, reject) => {
        req.asyncThing = 'foobar';
        resolve();
    });
}

test('Default config should include error handler', t => {
    t.plan(1);
    
    let set = getSet('errorHandler');
    t.is(set.length, 1);
});

test('Register default middleware', t => {
    t.plan(1);
    
    createSet('default', [ reqUserMiddleware, asyncMiddleware ]);
    
    let set = getSet('default');
    t.is(set.length, 2);
});

test('Register a single middleware function without array notation', t => {
    t.plan(1);
    
    createSet('singleMiddleware', reqUserMiddleware);
    
    let set = getSet('singleMiddleware');
    t.is(set.length, 1);
});

test('Apply default middleware to a request', async t => {
    t.plan(2);
    createSet('default', [ reqUserMiddleware, asyncMiddleware ]);
    
    const mockReq = httpMocks.createRequest();
    const mockRes = httpMocks.createResponse();
    
    let fn = applyMiddleware((req, res) => {
        t.is(req.user.id, 'foobar');
        t.is(req.asyncThing, 'foobar');
    });
    
    await fn(mockReq, mockRes);
});

test('Apply a pre-defined set of middleware to a request', async t => {
    t.plan(1);
    createSet('my-set-1', [ reqUserMiddleware ]);
    
    const mockReq = httpMocks.createRequest();
    const mockRes = httpMocks.createResponse();
    
    let fn = applyMiddleware('my-set-1', (req, res) => {
        t.is(req.user.id, 'foobar');
    });
    
    await fn(mockReq, mockRes);
});

test('Apply middleware directly to the function', async t => {
    t.plan(1);
    
    const mockReq = httpMocks.createRequest();
    const mockRes = httpMocks.createResponse();
    
    let fn = applyMiddleware([ asyncMiddleware ], (req, res) => {
        t.is(req.asyncThing, 'foobar');
    });
    
    await fn(mockReq, mockRes);
});

test('Default errorHandler middleware should be triggered when an error is thrown', async t => {
    t.plan(3);
    
    const mockReq = httpMocks.createRequest();
    const mockRes = httpMocks.createResponse();
    
    let fn = applyMiddleware([ asyncMiddleware ], (req, res) => {
        let err = new Error('404 not found');
        err.statusCode = 404;
        err.headers = {
            foo: 'bar'
        };
        throw err;
    });
    
    await fn(mockReq, mockRes);
    
    t.is(mockRes.statusCode, 404);
    t.is(mockRes._getData(), '404 not found');
    t.is(mockRes._getHeaders().foo, 'bar');
});

test('Sets that references other sets', async t => {
    t.plan(3);

    const mockReq = httpMocks.createRequest();
    const mockRes = httpMocks.createResponse();

    createSet('base', [ (req, res) => req.base = true ]);
    createSet('level1', [ 'base', (req, res) => req.level1 = true ]);
    createSet('level2', [ 'level1', (req, res) => req.level2 = true ]);

    let fn = applyMiddleware('level2', (req, res) => {
        t.true(req.base);
        t.true(req.level1);
        t.true(req.level2);
    });

    await fn(mockReq, mockRes);
});

test('Async/Await function with return', async t => {
    t.plan(1);

    const mockReq = httpMocks.createRequest();
    const mockRes = httpMocks.createResponse();

    let fn = applyMiddleware([], async (req, res) => {
        return {
            hello: 'world',
        };
    });

    await run(mockReq, mockRes, fn);

    t.deepEqual(JSON.parse(mockRes._getData()), { hello: 'world' });
});
