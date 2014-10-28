define(
    function (require) {
        var DataLoader = require('er/DataLoader');
        var Promise = require('promise');
        var Model = require('emc/Model');

        function createAsyncTask(value, timeout, results) {
            return function () {
                return new Promise(function (resolve) {
                    setTimeout(function () {
                        if (results) {
                            results.push(value);
                        }
                        resolve(value);
                    }, timeout);
                });
            };
        }

        function createErrorTask(error, timeout) {
            return function () {
                return new Promise(function (resolve, reject) {
                    setTimeout(function () {
                        reject(error);
                    }, timeout);
                });
            };
        }

        describe('DataLoader', function () {
            it('should be a constructor', function () {
                expect(typeof DataLoader).toBe('function');
            });

            describe('put method', function () {
                it('should accept an object', function () {
                    var loader = new DataLoader();
                    var config = {
                        x: function () {
                            return 1;
                        }
                    };
                    expect(function () { loader.put(config) }).not.toThrow();
                });

                it('should accept an array', function () {
                    var loader = new DataLoader();
                    var config = [
                        {
                            x: function () {
                                return 1;
                            }
                        },
                        {
                            y: function () {
                                return 2;
                            }
                        }
                    ];
                    expect(function () { loader.put(config) }).not.toThrow();
                });

                it('should throw if config is not provided', function () {
                    var loader = new DataLoader();
                    expect(function () { loader.put(); }).toThrow();
                });

                it('should throw if config is not an acceptable type', function () {
                    var loader = new DataLoader();
                    expect(function () { loader.put(null); }).toThrow();
                    expect(function () { loader.put(undefined); }).toThrow();
                    expect(function () { loader.put(1); }).toThrow();
                    expect(function () { loader.put('string'); }).toThrow();
                    expect(function () { loader.put(true); }).toThrow();
                });
            });

            describe('load method', function () {
                it('should accept a single function as a retrieve function', function (done) {
                    var loader = new DataLoader();
                    var store = new Model();
                    loader.setStore(store);
                    loader.put({ x: createAsyncTask(1, 0) });
                    loader.load().then(function () {
                        expect(store.get('x')).toBe(1);
                        done();
                    });
                });

                it('should accept a DataLoaderItem', function (done) {
                    var loader = new DataLoader();
                    var store = new Model();
                    loader.setStore(store);
                    loader.put({ x: { name: 'y', retrieve: createAsyncTask(1, 0) } });
                    loader.load().then(function () {
                        expect(store.get('y')).toBe(1);
                        done();
                    });
                });

                it('should load sequentialy for different slots', function (done) {
                    var loader = new DataLoader();
                    var store = new Model();
                    loader.setStore(store);
                    var results = [];
                    loader.put({ x: createAsyncTask(1, 10, results) });
                    loader.put({ y: createAsyncTask(2, 0, results) });
                    loader.load().then(function () {
                        expect(store.get('x')).toBe(1);
                        expect(store.get('y')).toBe(2);
                        expect(results).toEqual([1, 2]);
                        done();
                    });
                });

                it('should load parallely for same slot', function (done) {
                    var loader = new DataLoader();
                    var store = new Model();
                    loader.setStore(store);
                    var results = [];
                    loader.put({ x: createAsyncTask(1, 10, results) }, 0);
                    loader.put({ y: createAsyncTask(2, 0, results) }, 0);
                    loader.load().then(function () {
                        expect(store.get('x')).toBe(1);
                        expect(store.get('y')).toBe(2);
                        expect(results).toEqual([2, 1]);
                        done();
                    });
                });

                it('should work with complex config', function (done) {
                    var loader = new DataLoader();
                    var store = new Model();
                    loader.setStore(store);
                    var results = [];
                    var sequence = [
                        {
                            x: createAsyncTask(1, 0, results)
                        },
                        {
                            y: {
                                name: 'y',
                                retrieve: createAsyncTask(2, 20, results)
                            }
                        }
                    ];
                    loader.put(sequence, 0);
                    loader.put({ z: createAsyncTask(3, 10, results) }, 0);
                    loader.put({ a: createAsyncTask(4, 10, results) }, 1);
                    loader.put({ b: createAsyncTask(5, 0, results) }, 1);
                    loader.load().then(function () {
                        expect(results).toEqual([1, 3, 2, 5, 4]);
                        expect(store.get('x')).toBe(1);
                        expect(store.get('y')).toBe(2);
                        expect(store.get('z')).toBe(3);
                        expect(store.get('a')).toBe(4);
                        expect(store.get('b')).toBe(5);
                        done();
                    });
                });

                it('should report load results', function (done) {
                    var loader = new DataLoader();
                    var store = new Model();
                    loader.setStore(store);
                    var results = [];
                    loader.put({ x: createAsyncTask(1, 10, results) }, 0);
                    loader.put({ y: createAsyncTask(2, 0, results) }, 0);
                    loader.load().then(function (results) {
                        expect(results.length).toBe(2);
                        expect(results[0].name).toBe('x');
                        expect(results[0].success).toBe(true);
                        expect(results[0].value).toBe(1);
                        expect(results[0].options.name).toBe('x');
                        expect(results[1].name).toBe('y');
                        expect(results[1].success).toBe(true);
                        expect(results[1].value).toBe(2);
                        expect(results[1].options.name).toBe('y');
                        done();
                    });
                });

                it('should expand object to store if dump property is specified', function (done) {
                    var loader = new DataLoader();
                    var store = new Model();
                    loader.setStore(store);
                    loader.put({
                        x: {
                            retrieve: function () {
                                return {
                                    x: 1,
                                    y: 2
                                };
                            },
                            dump: true
                        }
                    });
                    loader.load().then(function () {
                        expect(store.get('x')).toBe(1);
                        expect(store.get('y')).toBe(2);
                        done();
                    });
                });

                it('should accept a single function as load item as if dump property is specified', function (done) {
                    var loader = new DataLoader();
                    var store = new Model();
                    loader.setStore(store);
                    loader.put(function () {
                        return {
                            x: 1,
                            y: 2
                        };
                    });
                    loader.load().then(function () {
                        expect(store.get('x')).toBe(1);
                        expect(store.get('y')).toBe(2);
                        done();
                    });
                });

                it('should fail if data items are invalid', function (done) {
                    var loader = new DataLoader();
                    var store = new Model();
                    loader.setStore(store);
                    loader.put({x: null});
                    loader.load().then(null, done);
                });
            });

            describe('dispose method', function () {
                it('should abort all working tasks', function (done) {
                    var loader = new DataLoader();
                    var store = new Model();
                    loader.setStore(store);
                    var promise = new Promise(function () {});
                    promise.abort = jasmine.createSpy('abort');
                    loader.put({x: function () { return promise; }});
                    loader.load();
                    setTimeout(function () {
                        loader.dispose();
                        expect(promise.abort).toHaveBeenCalled();
                        done();
                    }, 0);
                });

                it('shout reject further configuration', function () {
                    var loader = new DataLoader();
                    var store = new Model();
                    loader.setStore(store);
                    loader.dispose();
                    expect(function () { loader.put({x: createAsyncTask(1, 0)}); }).toThrow();
                });

                it('should reject load', function () {
                    var loader = new DataLoader();
                    var store = new Model();
                    loader.setStore(store);
                    loader.dispose();
                    expect(function () { loader.load(); }).toThrow();
                });
            });

            describe('error handling', function () {
                it('should call handleError each time a retrieve function rejects a promise', function (done) {
                    var loader = new DataLoader();
                    var store = new Model();
                    loader.setStore(store);
                    loader.put({ x: createErrorTask(1, 0) });
                    spyOn(loader, 'handleError').and.callThrough();
                    loader.load().then(null, function () {
                        expect(loader.handleError).toHaveBeenCalled();
                        var errorObject = loader.handleError.calls.mostRecent().args[0];
                        expect(errorObject.success).toBe(false);
                        expect(errorObject.name).toBe('x');
                        expect(errorObject.error).toBe(1);
                        var item = loader.handleError.calls.mostRecent().args[1];
                        expect(item.name).toBe('x');
                        done();
                    });
                });

                it('shoud call handleError each time a retrieve function throws', function (done) {
                    var loader = new DataLoader();
                    var store = new Model();
                    loader.setStore(store);
                    loader.put({ x: function () { throw 1; } });
                    spyOn(loader, 'handleError').and.callThrough();
                    loader.load().then(null, function () {
                        expect(loader.handleError).toHaveBeenCalled();
                        var errorObject = loader.handleError.calls.mostRecent().args[0];
                        expect(errorObject.success).toBe(false);
                        expect(errorObject.name).toBe('x');
                        expect(errorObject.error).toBe(1);
                        var item = loader.handleError.calls.mostRecent().args[1];
                        expect(item.name).toBe('x');
                        done();
                    });
                });

                it('should rescue load process if handleError exits normally', function (done) {
                    var loader = new DataLoader();
                    var store = new Model();
                    loader.setStore(store);
                    loader.put({ x: createErrorTask(1, 0) });
                    spyOn(loader, 'handleError').and.returnValue(0);
                    loader.load().then(function (results) {
                        expect(results[0].success).toBe(true);
                        expect(results[0].value).toBe(0);
                        done();
                    });
                });

                it('should rescue load process if handleError fulfills returned Promise', function (done) {
                    var loader = new DataLoader();
                    var store = new Model();
                    loader.setStore(store);
                    loader.put({ x: createErrorTask(1, 0) });
                    spyOn(loader, 'handleError').and.callFake(function () { return Promise.resolve(0); });
                    loader.load().then(function (results) {
                        expect(results[0].success).toBe(true);
                        expect(results[0].value).toBe(0);
                        done();
                    });
                });

                it('should report error if handleError throws', function (done) {
                    var loader = new DataLoader();
                    var store = new Model();
                    loader.setStore(store);
                    loader.put({ x: createErrorTask(1, 0) });
                    spyOn(loader, 'handleError').and.callFake(function () { throw 0; });
                    loader.load().then(null, function (results) {
                        expect(results[0].success).toBe(false);
                        expect(results[0].error).toBe(0);
                        done();
                    });
                });

                it('should report error if handleError rejects returned Promise', function (done) {
                    var loader = new DataLoader();
                    var store = new Model();
                    loader.setStore(store);
                    loader.put({ x: createErrorTask(1, 0) });
                    spyOn(loader, 'handleError').and.callFake(function () { return Promise.reject(0); });
                    loader.load().then(null, function (results) {
                        expect(results[0].success).toBe(false);
                        expect(results[0].error).toBe(0);
                        done();
                    });
                });
            });
        });
    }
);
