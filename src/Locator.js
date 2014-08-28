/**
 * ER (EFE RIA)
 * Copyright 2014 Baidu Inc. All rights reserved.
 *
 * @author otakustay
 */
define(
    function (require) {
        var STATE = {
            STARTED: 'started',
            STOPPED: 'stopped',
            PAUSED: 'paused',
            DISPOSED: 'disposed'
        };

        /**
         * 地址监听抽象类
         *
         *
         * 对于子类，需要实现以下方法：
         *
         * - {@link Locator#.registerChangeListener|registerChangeListener方法}注册事件来监听地址栏的变化
         * - {@link Locator#.unregisterChangeListener|unregisterChangeListener方法}销毁原来注册的事件，用于停止对象工作
         * - {@link Locator#.getVisibleLocation|getVisibleLocation方法}获取地址栏上的地址用于MVC的部分
         * - {@link Locator#.updateLocation|updateLocation方法}将用户通过编程跳转提供的URL推送到地址栏上
         *
         * @class Locator
         * @extends mini-event.EventTarget
         *
         * @alias Locator.prototype
         */
        var exports = {};

        // `Locator`的基本逻辑有2条路线：
        //
        // 1. 用户操作修改了地址栏的地址
        // 2. `Locator`子类通过一定的事件接收到修改
        // 3. 调用`processChange`方法
        // 4. 获取当前浏览器中的地址，调用`redirect`方法，通过`background: true`使这地址不再更新回浏览器避免产生死循环
        // 5. 根据地址是否有变化：
        //     1. 如果地址发生了变化，触发`redirect`事件
        //     2. 未发生变化，什么也不做
        //
        // 1. 调用`redirect`指定跳转
        // 2. 判断提供的URL是否有变化：
        //     1. 如果发生了变化，或提供了`force: true`参数，则：
        //         1. 暂停对象执行
        //         2. 将URL更新至浏览器，由于对象是暂停的，所以此操作不会引起`processChange`再到`redirect`死循环
        //         3. 恢复对象执行
        //         4. 如果没有`silent: true`参数，触发`redirect`事件
        //     2. 未发生变化，且`force`参数未给，什么也不做
        //
        // 以上2种入口最终逻辑都集中在`redirect`方法，区别在于是否有`background: true`这个配置项

        /**
         * 构造函数
         *
         * @constructs Locator
         */
        exports.constructor = function () {
            /**
             * 标记当前对象状态
             *
             * 状态迁移如下：
             *
             * - 停止状态：仅可以启动
             * - 启动状态：可以暂停，可以停止
             * - 暂停状态：可以启动但相当于恢复，可以恢复，可以停止
             *
             * @member {string} Locator#.state
             *
             * @private
             */
            this.state = STATE.STOPPED;

            /**
             * 当前地址
             *
             * @member {?string} Locator#.currentLocation
             *
             * @private
             */
            this.currentLocation = null;
        };

        /**
         * 启动当前对象
         *
         * 未启动的对象依旧可以通过{@link Locator#.redirect|redirect方法}等的调用来控制地址跳转
         *
         * @method Locator#.start
         *
         * @fires start
         */
        exports.start = function () {
            if (this.state === STATE.DISPOSED) {
                throw new Error('This locator is disposed');
            }

            if (this.state === STATE.STARTED) {
                return;
            }

            if (this.state === STATE.PAUSED) {
                this.resume();
                return;
            }

            this.registerChangeListener();
            this.state = STATE.STARTED;

            // 处理第一次地址的通知
            var u = require('underscore');
            setTimeout(u.bind(this.processChange, this), 0);

            /**
             * 启动时触发
             *
             * @event Locator#.start
             */
            this.fire('start');
        };

        /**
         * 停止当前对象
         *
         * 仅停止对浏览器的监听，不影响{@link Locator#.redirect|redirect方法}等的调用
         *
         * @method Locator#.stop
         *
         * @fires stop
         */
        exports.stop = function () {
            if (this.state === STATE.DISPOSED) {
                throw new Error('This locator is disposed');
            }

            if (this.state === STATE.STOPPED) {
                return;
            }

            this.state = STATE.STOPPED;
            this.unregisterChangeListener();

            /**
             * 停止时触发
             *
             * @event Locator#.stop
             */
            this.fire('stop');
        };

        /**
         * 使当前对象继续工作
         *
         * @method Locator#.resume
         *
         * @fires resume
         */
        exports.resume = function () {
            if (this.state === STATE.DISPOSED) {
                throw new Error('This locator is disposed');
            }

            if (this.state === STATE.STARTED || this.state === STATE.STOPPED) {
                return;
            }

            this.state = STATE.STARTED;

            /**
             * 恢复时触发
             *
             * @event Locator#.resume
             */
            this.fire('resume');
        };

        /**
         * 暂停当前对象的工作
         *
         * 仅暂停对浏览器的监听，不影响{@link Locator#.redirect|redirect方法}等的调用
         *
         * @method Locator#.pause
         *
         * @fires pause
         */
        exports.pause = function () {
            if (this.state === STATE.DISPOSED) {
                throw new Error('This locator is disposed');
            }

            if (this.state === STATE.PAUSED || this.state === STATE.STOPPED) {
                return;
            }

            this.state = STATE.PAUSED;

            /**
             * 暂停时触发
             *
             * @event Locator#.pause
             */
            this.fire('pause');
        };

        /**
         * 获取浏览器中的当前地址，即`#`后面的部分
         *
         * 需要注意该方法必须返回浏览器中可见的地址（通常在地址栏中体现），而不是返回当前对象内部存储的地址
         *
         * 被重写时，该方法需要返回被一致化后的地址，如hash则需要去除起始的`#`字符
         *
         * @method Locator#.getVisibleLocation
         *
         * @return {string} 浏览器中可见的当前地址
         */
        exports.getVisibleLocation = function () {
            // Firefox下`location.hash`存在自动解码的情况，比如hash的值是**abc%3def**，在Firefox下获取会成为**abc=def**，
            // 为了避免这一情况，需要从`location.href`中分解
            var index = location.href.indexOf('#');
            var url = index === -1 ? '' : location.href.slice(index + 1);

            return url;
        };

        /**
         * 注册监听地址变化的处理器
         *
         * @method Locator#.registerChangeListener
         *
         * @protected
         */
        exports.registerChangeListener = function () {
            var u = require('underscore');
            /**
             * 用于临时保存`hashchange`事件的处理函数以便注销事件
             *
             * @member {?Function} Locator#.hashChangeListener
             *
             * @private
             */
            var listener = this.hashChangeListener = u.bind(this.processChange, this);
            // 如果有hashchange事件则使用事件，否则定时监听
            if (window.addEventListener) {
                window.addEventListener('hashchange', listener, false);
            }
            // IE8在IE7兼容模式下，会有`onhashchange`这个属性，但实际不支持`hashchange`事件（你坑我一脸）
            else if ('onhashchange' in window && document.documentMode > 7) {
                window.attachEvent('onhashchange', listener);
            }
            else {
                /**
                 * 用于非标准浏览器下通过定时器模拟`hashchange`事件的定时器id
                 *
                 * @member {?number} Locator#.rollTimer
                 *
                 * @private
                 */
                this.rollTimer = setInterval(listener, 100);
            }
        };

        /**
         * 取消监听地址变化的处理器
         *
         * @method Locator#.unregisterChangeListener
         *
         * @protected
         */
        exports.unregisterChangeListener = function () {
            // 没有启动过的话，就没有这个方法，也无所谓停止的概念
            if (!this.hashChangeListener) {
                return;
            }

            if (this.rollTimer) {
                clearInterval(this.rollTimer);
                this.rollTimer = null;
            }

            if (window.removeEventListener) {
                window.removeEventListener('hashchange', this.hashChangeListener, false);
            }
            else if ('onhashchange' in window && document.documentMode > 7) {
                window.detachEvent('onhashchange', this.hashChangeListener);
            }

            this.hashChangeListener = null;
        };

        /**
         * 处理地址变化
         *
         * @method Locator#.processChange
         *
         * @protected
         */
        exports.processChange = function () {
            if (this.state !== STATE.STARTED) {
                return;
            }

            var location = this.getVisibleLocation();
            // 这里要求`redirect`仅控制自身的URL跳转逻辑，但不要将这个URL更新到浏览器中，以免产生额外的历史记录项
            this.redirect(location, { background: true });
        };

        /**
         * 判断当前的跳转请求是否合法
         *
         * @method Locator#.isRedirectValid
         *
         * @param {string} url 跳转的目标URL
         * @param {RedirectOptions} options 相关配置
         * @return {boolean} 如果可以进行跳转返回`true`，否则返回`false`
         * @protected
         */
        exports.isRedirectValid = function (url, options) {
            var isChanged = url !== this.currentLocation;
            return isChanged || !!options.force;
        };

        /**
         * 更新地址到浏览器中
         *
         * @method Locator#.updateLocation
         *
         * @param {string} url 目标地址
         * @protected
         */
        exports.updateLocation = function (url) {
            location.hash = url;
        };

        /**
         * 重定向至指定的地址
         *
         * @method Locator#.redirect
         *
         * @param {string | URL} url 重定向的地址
         * @param {RedirectOptions} [options] 额外附加的参数对象
         * @return {boolean} 如果确实执行了重定向逻辑则返回`true`，否则返回`false`
         */
        exports.redirect = function (url, options) {
            if (this.state === STATE.DISPOSED) {
                throw new Error('This locator is disposed');
            }

            url = url.toString();
            options = options || {};

            var isRedirectValid = this.isRedirectValid(url, options);

            if (isRedirectValid) {
                var referrer = this.currentLocation;
                // 要先更新当前地址，否则`tryUpdateLocation`引起的浏览器地址变化可能由`processChange`接收
                // `mini-event`的事件执行是不会处理异常的，因此事件处理函数可能打断当前函数的正常执行，
                // 需要在事件触发前就把`currentLocation`处理完，否则一但出现异常下次再重定向`referrer`会是错误的
                this.currentLocation = url;

                if (!options.background) {
                    // 为了避免更新浏览器中的地址又一次导致`processChange`执行最终回到`redirect`形成死循环，先停掉对象
                    this.pause();
                    this.updateLocation(url);
                    this.resume();
                }

                if (!options.silent) {
                    /**
                     * URL跳转时触发
                     *
                     * @event Locator#.redirect
                     * @property {string} e.url 当前的URL
                     * @property {?string} e.referrer 来源URL
                     */
                    this.fire(
                        'redirect',
                        { url: url, referrer: referrer }
                    );
                }
            }

            return isRedirectValid;
        };

        /**
         * 刷新当前地址
         *
         * @method Locator#.reload
         */
        exports.reload = function () {
            if (this.state === STATE.DISPOSED) {
                throw new Error('This locator is disposed');
            }

            if (this.currentLocation === null) {
                throw new Error('There is currently no location for reload');
            }

            this.redirect(this.currentLocation, { force: true });
        };

        /**
         * 销毁当前对象
         *
         * @method Locator#.dispose
         */
        exports.dispose = function () {
            // 允许重复`dispose`而不出异常
            if (this.state === STATE.DISPOSED) {
                return;
            }

            if (this.state !== STATE.STOPPED) {
                this.stop();
            }

            this.destroyEvents();
            this.currentLocation = null;
            this.state = STATE.DISPOSED;
        };

        var Locator = require('eoo').create(require('mini-event/EventTarget'), exports);
        return Locator;
    }
);
