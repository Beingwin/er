/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file Model类
 * @author otakustay
 */
define(
    function (require) {
        var Promise = require('promise');
        var u = require('underscore');

        /**
         * 在ER框架中，Model并不一定要继承该类，任何对象都可以作为Model使用
         *
         * ER对于Model的处理如下：
         *
         * 1. 通过{@Action#.createModel}方法创建一个对象，或通过其它手段通过{@link Action#.setModel}提供{@link Model}实例
         * 2. 如果该对象有`load`函数，则执行该函数，并分为以下情况，通过`Promise`处理异步
         * 3. 如果对象没有`load`函数，则默认对象本身就是Model
         * 4. 当离开Action时，如果Model有`dispose`方法，则会调用以销毁对象
         *
         * 该Model类为一个通用的可配置的基类，提供了数据加载的相关方法
         *
         * @class Model
         *
         * @extends emc.Model
         * @param {Object} [context] 初始化的数据
         */
        var exports = {};

        /**
         * @constructs Model
         */
        exports.constructor = function (context) {
            this.$super(arguments);

            this.initialize();
        };

        /**
         * 初始化函数，用于在无法修改构造函数的情况下使用
         *
         * @method Model#.initialize
         * @protected
         */
        exports.initialize = function () {};

        /**
         * 加载数据，在完成数据处理后返回
         *
         * @method Model#.load
         *
         * @return {Promise | undefined} 方法会在{@link Model#.prepare}之后再返回
         */
        exports.load = function () {
            var dataLoader = this.getDataLoader();
            return Promise.cast(dataLoader ? dataLoader.load() : undefined);
        };

        /**
         * 加载数据后进入数据准备阶段
         *
         * @method Model#.forwardToPrepare
         *
         * @param {meta.DataLoadResult[]} results 数据加载的结果集
         * @protected
         */
        exports.forwardToPrepare = function (results) {
            return new Promise(u.bind(this.prepare, this)).then(
                function () {
                    var success = {
                        success: true,
                        name: '$prepare',
                        options: {}
                    };
                    results.push(success);
                    return results;
                },
                function (ex) {
                    var error = {
                        success: false,
                        name: '$prepare',
                        options: {},
                        error: ex
                    };
                    results.push(error);
                    return results;
                }
            );
        };

        /**
         * 处理加载后的数据
         *
         * 这个方法用于在{@link Model#.load}完毕后，调整一些数据结构
         *
         * 在该方法执行时，当前的{@link Model}对象中已经有{@link Model#.load}方法填充的数据，
         * 可使用{@link Model#.get}、{@link Model#.set}和{@link Model#.remove}方法对数据进行调整
         *
         * 如果在`prepare`方法中有异步的操作，可以让方法返回一个{@link Promise}对象，{@link Model#.load}方法会相应处理状态
         *
         *
         * @method Model#.prepare
         * @return {Promise | undefined} 如果`prepare`的逻辑中有异步操作，则返回一个{@link Promise}对象，通知调用者等待
         * @protected
         */
        exports.prepare = function () {};

        /**
         * 销毁当前{@link Model}对象，会尝试停止所有正在加载的数据
         *
         * @method Model#.dispose
         */
        exports.dispose = function () {
            this.$super();
            var dataLoader = this.getDataLoader();
            if (dataLoader) {
                dataLoader.dispose();
                dataLoader = null;
            }
        };

        var oo = require('eoo');

        /**
         * 获取关联数据加载器
         *
         * @method Model#.getDataLoader
         *
         * @return {DataLoader}
         * @protected
         */
        exports.getDataLoader = function () {
            return this.dataLoader;
        };

        /**
         * 设置关联的数据加载器
         *
         * @method Model#.setDataLoader
         *
         * @param {DataLoader} dataLoader 需要关联的数据加载器实例
         * @protected
         */
        exports.setDataLoader = function (dataLoader) {
            dataLoader.setStore(this);
            this.dataLoader = dataLoader;
        };

        var Model = oo.create(require('emc/Model'), exports);
        return Model;
    }
);
