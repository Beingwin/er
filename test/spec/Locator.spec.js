define(
    function (require) {
        var Locator = require('er/Locator');

        describe('Locator', function () {
            it('should be a constructor', function () {
                expect(typeof Locator).toBe('function');
            });

            describe('start method', function () {
                it('should fire start event', function () {
                    var locator = new Locator();
                    var start = jasmine.createSpy('start');
                    locator.on('start', start);
                    locator.start();
                    expect(start).toHaveBeenCalled();
                    locator.stop();
                });

                it('should do nothing when already started', function () {
                    var locator = new Locator();
                    locator.start();
                    var start = jasmine.createSpy('start');
                    locator.on('start', start);
                    locator.start();
                    expect(start).not.toHaveBeenCalled();
                    locator.stop();
                });

                it('should start when stopped', function () {
                    var locator = new Locator();
                    locator.start();
                    locator.stop();
                    var start = jasmine.createSpy('start');
                    locator.on('start', start);
                    locator.start();
                    expect(start).toHaveBeenCalled();
                    locator.stop();
                });

                it('should resume when paused', function () {
                    var locator = new Locator();
                    locator.start();
                    locator.pause();
                    var start = jasmine.createSpy('start');
                    locator.on('start', start);
                    var resume = jasmine.createSpy('resume');
                    locator.on('resume', resume);
                    locator.start();
                    expect(start).not.toHaveBeenCalled();
                    expect(resume).toHaveBeenCalled();
                    locator.stop();
                });
            });

            describe('stop method', function () {
                it('should fire stop event', function () {
                    var locator = new Locator();
                    locator.start();
                    var stop = jasmine.createSpy('stop');
                    locator.on('stop', stop);
                    locator.stop();
                    expect(stop).toHaveBeenCalled();
                });

                it('should do nothing when not started', function () {
                    var locator = new Locator();
                    var stop = jasmine.createSpy('stop');
                    locator.on('stop', stop);
                    locator.stop();
                    expect(stop).not.toHaveBeenCalled();
                });

                it('should do nothing when stopped', function () {
                    var locator = new Locator();
                    locator.start();
                    locator.stop();
                    var stop = jasmine.createSpy('stop');
                    locator.on('stop', stop);
                    locator.stop();
                    expect(stop).not.toHaveBeenCalled();
                });

                it('should stop when paused', function () {
                    var locator = new Locator();
                    locator.start();
                    locator.pause();
                    var stop = jasmine.createSpy('stop');
                    locator.on('stop', stop);
                    locator.stop();
                    expect(stop).toHaveBeenCalled();
                });
            });

            describe('resume method', function () {
                it('should fire resume event', function () {
                    var locator = new Locator();
                    locator.start();
                    locator.pause();
                    var resume = jasmine.createSpy('resume');
                    locator.on('resume', resume);
                    locator.resume();
                    expect(resume).toHaveBeenCalled();
                    locator.stop();
                });

                it('should do nothing when started', function () {
                    var locator = new Locator();
                    locator.start();
                    var resume = jasmine.createSpy('resume');
                    locator.on('resume', resume);
                    locator.resume();
                    expect(resume).not.toHaveBeenCalled();
                    locator.stop();
                });

                it('should do nothing when stopped', function () {
                    var locator = new Locator();
                    locator.start();
                    locator.stop();
                    var resume = jasmine.createSpy('resume');
                    locator.on('resume', resume);
                    locator.resume();
                    expect(resume).not.toHaveBeenCalled();
                });

                it('should do nothing when not started', function () {
                    var locator = new Locator();
                    var resume = jasmine.createSpy('resume');
                    locator.on('resume', resume);
                    locator.resume();
                    expect(resume).not.toHaveBeenCalled();
                });
            });

            describe('pause method', function () {
                it('should fire pause event', function () {
                    var locator = new Locator();
                    locator.start();
                    var pause = jasmine.createSpy('pause');
                    locator.on('pause', pause);
                    locator.pause();
                    expect(pause).toHaveBeenCalled();
                    locator.stop();
                });

                it('should do nothing when paused', function () {
                    var locator = new Locator();
                    locator.start();
                    locator.pause();
                    var pause = jasmine.createSpy('pause');
                    locator.on('pause', pause);
                    locator.pause();
                    expect(pause).not.toHaveBeenCalled();
                    locator.stop();
                });

                it('should do nothing when stopped', function () {
                    var locator = new Locator();
                    locator.start();
                    locator.stop();
                    var pause = jasmine.createSpy('pause');
                    locator.on('pause', pause);
                    locator.pause();
                    expect(pause).not.toHaveBeenCalled();
                });

                it('should do nothing when not started', function () {
                    var locator = new Locator();
                    var pause = jasmine.createSpy('pause');
                    locator.on('pause', pause);
                    locator.pause();
                    expect(pause).not.toHaveBeenCalled();
                });
            });

            describe('on hash change', function () {
                var locator;
                var redirect;

                beforeEach(function () {
                    location.hash = '';
                    locator = new Locator();
                    locator.start();
                    redirect = jasmine.createSpy('redirect');
                    locator.on('redirect', redirect);
                });

                afterEach(function () {
                    locator.un('redirect', redirect);
                    locator.stop();
                    location.hash = '';
                });

                it('should fire redirect event', function (done) {
                    location.hash = 'x';
                    setTimeout(function () {
                        expect(redirect).toHaveBeenCalled();
                        var eventObject = redirect.calls.mostRecent().args[0];
                        expect(eventObject.url).toBe('x');
                        locator.un('redirect', redirect);
                        done();
                    }, 0);
                });

                it('should not fire redirect event if not started', function (done) {
                    var locator = new Locator();
                    var redirect = jasmine.createSpy('redirect');
                    locator.on('redirect', redirect);
                    location.hash = 'x';
                    setTimeout(function () {
                        expect(redirect).not.toHaveBeenCalled();
                        done();
                    }, 0);
                });

                it('should not fire redirect event if paused', function (done) {
                    locator.pause();
                    location.hash = 'x';
                    setTimeout(function () {
                        expect(redirect).not.toHaveBeenCalled();
                        done();
                    }, 0);
                });

                it('should not fire redirect event if stopped', function (done) {
                    locator.stop();
                    location.hash = 'x';
                    setTimeout(function () {
                        expect(redirect).not.toHaveBeenCalled();
                        done();
                    }, 0);
                });

                it('should log previous hash as referrer', function (done) {
                    location.hash = 'x';
                    setTimeout(function () {
                        location.hash = 'y';
                            setTimeout(function () {
                                var eventObject = redirect.calls.mostRecent().args[0];
                                expect(eventObject.url).toBe('y');
                                expect(eventObject.referrer).toBe('x');
                                done();
                            }, 0);
                    }, 0);
                });

                it('should log previous redirect call as referrer', function (done) {
                    locator.redirect('x');
                    location.hash = 'y';
                    setTimeout(function () {
                        var eventObject = redirect.calls.mostRecent().args[0];
                        expect(eventObject.url).toBe('y');
                        expect(eventObject.referrer).toBe('x');
                        done();
                    }, 0);
                });
            });

            describe('redirect method', function () {
                var locator;
                var redirect;

                beforeEach(function () {
                    location.hash = '';
                    locator = new Locator();
                    locator.start();
                    redirect = jasmine.createSpy('redirect');
                    locator.on('redirect', redirect);
                });

                afterEach(function () {
                    locator.un('redirect', redirect);
                    locator.stop();
                    location.hash = '';
                });

                it('should modify hash', function () {
                    locator.redirect('x');
                    expect(location.hash).toBe('#x');
                });

                it('should not modify hash if background flag is explicitly set', function () {
                    locator.redirect('x', { background: true });
                    expect(location.hash).toBe('');
                });

                it('should fire redirect event if location is changed', function () {
                    locator.redirect('x');
                    expect(redirect).toHaveBeenCalled();
                    var eventObject = redirect.calls.mostRecent().args[0];
                    expect(eventObject.url).toBe('x');
                });

                it('should fire redirect event if not started', function () {
                    var locator = new Locator();
                    var redirect = jasmine.createSpy('redirect');
                    locator.on('redirect', redirect);
                    locator.redirect('x');
                    expect(redirect).toHaveBeenCalled();
                });

                it('should fire redirect event if paused', function () {
                    locator.pause();
                    locator.on('redirect', redirect);
                    locator.redirect('x');
                    expect(redirect).toHaveBeenCalled();
                });

                it('should fire redirect event if stopped', function () {
                    locator.stop();
                    locator.on('redirect', redirect);
                    locator.redirect('x');
                    expect(redirect).toHaveBeenCalled();
                });

                it('should not fire redirect event if location is identical', function (done) {
                    setTimeout(function () {
                        // 因为`start`必定触发一次事件，这里弄个新的事件处理函数
                        var redirect = jasmine.createSpy('redirect');
                        locator.on('redirect', redirect);
                        locator.redirect('');
                        expect(redirect).not.toHaveBeenCalled();
                        done();
                    }, 0);
                });

                it('should not fire redirect event if silent flag is explicitly set', function () {
                    locator.redirect('x', { silent: true });
                    expect(redirect).not.toHaveBeenCalled();
                });

                it('should fire redirect event if force flag is explicitly set', function () {
                    locator.redirect('', { force: true });
                    expect(redirect).toHaveBeenCalled();
                });

                it('should log previous redirect call as referrer', function () {
                    locator.redirect('x');
                    locator.redirect('y');
                    var eventObject = redirect.calls.mostRecent().args[0];
                    expect(eventObject.url).toBe('y');
                    expect(eventObject.referrer).toBe('x');
                });

                it('should log previous hash as referrer', function (done) {
                    location.hash = 'x';
                    setTimeout(function () {
                        locator.redirect('y');
                        var eventObject = redirect.calls.mostRecent().args[0];
                        expect(eventObject.url).toBe('y');
                        expect(eventObject.referrer).toBe('x');
                        done();
                    }, 0);
                });
            });

            describe('reload method', function () {
                it('should fire redirect event', function () {
                    var locator = new Locator();
                    locator.start();
                    locator.redirect('x');
                    var redirect = jasmine.createSpy('redirect');
                    locator.on('redirect', redirect);
                    locator.reload();
                    expect(redirect).toHaveBeenCalled();
                    var eventObject = redirect.calls.mostRecent().args[0];
                    expect(eventObject.url).toBe('x');
                });

                it('should not modify hash', function () {
                    var locator = new Locator();
                    locator.start();
                    locator.redirect('x');
                    locator.reload();
                    expect(location.hash).toBe('#x');
                });

                it('should throw if not started', function () {
                    var locator = new Locator();
                    expect(function () { locator.reload(); }).toThrow();
                });
            });

            describe('dispose method', function () {
                it('should stop the object', function (done) {
                    var locator = new Locator();
                    locator.start();
                    var redirect = jasmine.createSpy('redirect');
                    locator.on('redirect', redirect);
                    locator.dispose();
                    location.hash = 'x';
                    setTimeout(function () {
                        expect(redirect).not.toHaveBeenCalled();
                        location.hash = '';
                        done();
                    }, 0);
                });

                it('should dispose when not started', function () {
                    var locator = new Locator();
                    expect(function () { locator.dispose(); }).not.toThrow();
                });

                it('should dispose when stopped', function () {
                    var locator = new Locator();
                    locator.start();
                    locator.stop();
                    expect(function () { locator.dispose(); }).not.toThrow();
                });

                it('should dispose when paused', function () {
                    var locator = new Locator();
                    locator.start();
                    locator.pause();
                    expect(function () { locator.dispose(); }).not.toThrow();
                });

                it('should throw on all public methods', function () {
                    var locator = new Locator();
                    locator.dispose();
                    expect(function () { locator.start(); }).toThrow();
                    expect(function () { locator.pause(); }).toThrow();
                    expect(function () { locator.stop(); }).toThrow();
                    expect(function () { locator.resume(); }).toThrow();
                    expect(function () { locator.redirect('x'); }).toThrow();
                    expect(function () { locator.reload(); }).toThrow();
                });

                it('should be safe to call multiple times', function () {
                    var locator = new Locator();
                    locator.dispose();
                    expect(function () { locator.dispose(); }).not.toThrow();
                });
            });
        });
    }
);
