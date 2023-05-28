(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Promise = {}));
})(this, (function (exports) { 'use strict';

	var PromiseUtils;
	(function (PromiseUtils) {
	    (function (PromiseState) {
	        PromiseState["PENDING"] = "pending";
	        PromiseState["FULFILLED"] = "fulfilled";
	        PromiseState["REJECTED"] = "rejected";
	    })(PromiseUtils.PromiseState || (PromiseUtils.PromiseState = {}));
	    function spawn(task) {
	        var timer = setTimeout(function () {
	            task();
	            if (timer !== null) {
	                clearTimeout(timer);
	                timer = null;
	            }
	        }, 0);
	    }
	    PromiseUtils.spawn = spawn;
	    function is_promise(target) {
	        return target instanceof ZPromise;
	    }
	    PromiseUtils.is_promise = is_promise;
	    function is_obj(target) {
	        return (typeof target === "object" || typeof target === "function") && target !== null;
	    }
	    PromiseUtils.is_obj = is_obj;
	    function is_thenable(target) {
	        return (typeof target === "object" || typeof target === "function") && typeof target.then === "function";
	    }
	    PromiseUtils.is_thenable = is_thenable;
	    function get_then(target) {
	        return target.then;
	    }
	    PromiseUtils.get_then = get_then;
	    function get_finally_then(thenable, res, rej) {
	        var then;
	        while (is_obj(thenable)) {
	            if (thenable.then === undefined)
	                break;
	            then = thenable.then;
	            if (typeof then === "function") {
	                thenable = then.call(thenable, res, rej);
	            }
	            else {
	                break;
	            }
	        }
	        return then;
	    }
	    PromiseUtils.get_finally_then = get_finally_then;
	    function make_callback(cb) {
	        return {
	            cb: cb,
	            called: false,
	        };
	    }
	    PromiseUtils.make_callback = make_callback;
	})(PromiseUtils || (PromiseUtils = {}));
	var ZPromise = /** @class */ (function () {
	    function ZPromise(callback) {
	        var _this = this;
	        this.state = PromiseUtils.PromiseState.PENDING;
	        this.value = undefined;
	        this.reason = undefined;
	        this.onFulfilled = [];
	        this.onRejected = [];
	        this.onFulfilledResult = [];
	        this.onRejectedResult = [];
	        this.visited = new Set();
	        var resolve = function (value) {
	            ZPromise.resolve_promise(_this, value);
	        };
	        var reject = function (reason) {
	            _this.toRejected(reason);
	        };
	        try {
	            callback(resolve, reject);
	        }
	        catch (error) {
	            if (this.state === PromiseUtils.PromiseState.PENDING) {
	                this.toRejected(error);
	                this.flush_rejected();
	            }
	        }
	    }
	    ZPromise.prototype.toResolved = function (value) {
	        if (this.state !== PromiseUtils.PromiseState.PENDING) {
	            return;
	        }
	        this.value = value;
	        this.change_state(PromiseUtils.PromiseState.FULFILLED);
	        this.flush_fulfilled();
	    };
	    ZPromise.prototype.toRejected = function (reason) {
	        if (this.state !== PromiseUtils.PromiseState.PENDING) {
	            return;
	        }
	        this.reason = reason;
	        this.change_state(PromiseUtils.PromiseState.REJECTED);
	        this.flush_rejected();
	    };
	    ZPromise.prototype.flush_fulfilled = function () {
	        var _this = this;
	        if (this.state !== PromiseUtils.PromiseState.FULFILLED)
	            return;
	        PromiseUtils.spawn(function () {
	            for (var i = 0; i < _this.onFulfilled.length; ++i) {
	                var callback = _this.onFulfilled[i];
	                if (callback.called)
	                    return;
	                var index = i;
	                try {
	                    var fn = callback.cb;
	                    var v = fn(_this.value);
	                    _this.onFulfilledResult[index] = { value: v, type: "success" };
	                }
	                catch (error) {
	                    _this.onFulfilledResult[index] = { value: error, type: "faild" };
	                }
	                finally {
	                    callback.called = true;
	                }
	            }
	        });
	    };
	    ZPromise.prototype.flush_rejected = function () {
	        var _this = this;
	        if (this.state !== PromiseUtils.PromiseState.REJECTED)
	            return;
	        PromiseUtils.spawn(function () {
	            for (var i = 0; i < _this.onRejected.length; ++i) {
	                var callback = _this.onRejected[i];
	                if (callback.called)
	                    return;
	                var fn = callback.cb;
	                var index = i;
	                try {
	                    var v = fn(_this.reason);
	                    _this.onRejectedResult[index] = { value: v, type: "success" };
	                }
	                catch (error) {
	                    _this.onRejectedResult[index] = { value: error, type: "faild" };
	                }
	                finally {
	                    callback.called = true;
	                }
	            }
	        });
	    };
	    ZPromise.prototype.change_state = function (new_state) {
	        if (this.state !== PromiseUtils.PromiseState.PENDING)
	            throw new Error("Promise is not in pending");
	        this.state = new_state;
	    };
	    ZPromise.prototype.then = function (onFulfilled, onRejected) {
	        var _this = this;
	        var res;
	        var rej;
	        var promise = new ZPromise(function (_res, _rej) {
	            res = _res;
	            rej = _rej;
	        });
	        if (typeof onFulfilled !== "function") {
	            this.onFulfilled.push(PromiseUtils.make_callback(function () {
	                res(_this.value);
	            }));
	        }
	        if (typeof onRejected !== "function") {
	            this.onRejected.push(PromiseUtils.make_callback(function () {
	                rej(_this.reason);
	            }));
	        }
	        if (typeof onFulfilled === "function") {
	            var index_1 = this.onFulfilled.push(PromiseUtils.make_callback(onFulfilled)) - 1;
	            this.onFulfilled.push(PromiseUtils.make_callback(function () {
	                var result = _this.onFulfilledResult[index_1];
	                if (result.type === "faild") {
	                    rej(result.value);
	                    throw result.value;
	                }
	                ZPromise.resolve_promise(promise, result.value);
	            }));
	        }
	        if (typeof onRejected === "function") {
	            var index_2 = this.onRejected.push(PromiseUtils.make_callback(onRejected)) - 1;
	            this.onRejected.push(PromiseUtils.make_callback(function () {
	                var result = _this.onRejectedResult[index_2];
	                if (result.type === "faild") {
	                    rej(result.value);
	                    throw result.value;
	                }
	                ZPromise.resolve_promise(promise, result.value);
	            }));
	        }
	        this.flush_fulfilled();
	        this.flush_rejected();
	        return promise;
	    };
	    ZPromise.resolve_promise = function (promise, x) {
	        if (promise.visited.has(x)) {
	            promise.toRejected(new TypeError("A recursive loop occurs"));
	            return;
	        }
	        if (promise === x) {
	            promise.toRejected(new TypeError("Chaining cycle detected for promise"));
	        }
	        else if (PromiseUtils.is_promise(x)) {
	            x.then(promise.toResolved.bind(promise), promise.toRejected.bind(promise));
	        }
	        else if (PromiseUtils.is_obj(x)) {
	            try {
	                var resolve_promise_1 = function (value) {
	                    if (resolve_promise_1.called || reject_promise_1.called)
	                        return;
	                    resolve_promise_1.called = true;
	                    ZPromise.resolve_promise(promise, value);
	                };
	                resolve_promise_1.called = false;
	                var reject_promise_1 = function (reason) {
	                    if (reject_promise_1.called || resolve_promise_1.called)
	                        return;
	                    reject_promise_1.called = true;
	                    promise.toRejected(reason);
	                };
	                reject_promise_1.called = false;
	                var then = PromiseUtils.get_then(x);
	                if (typeof then === "function") {
	                    promise.visited.add(x);
	                    try {
	                        then.call(x, resolve_promise_1, reject_promise_1);
	                    }
	                    catch (error) {
	                        if (!resolve_promise_1.called && !reject_promise_1.called) {
	                            reject_promise_1(error);
	                        }
	                    }
	                }
	                else {
	                    promise.toResolved(x);
	                }
	            }
	            catch (error) {
	                promise.toRejected(error);
	            }
	        }
	        else {
	            promise.toResolved(x);
	        }
	        promise.visited.clear();
	    };
	    ZPromise.resolve = function (value) {
	        return new ZPromise(function (res, rej) { return res(value); });
	    };
	    ZPromise.reject = function (reason) {
	        return new ZPromise(function (res, rej) { return rej(reason); });
	    };
	    ZPromise.deferred = function () {
	        var res;
	        var rej;
	        var promise = new ZPromise(function (_res, _rej) {
	            res = _res;
	            rej = _rej;
	        });
	        return {
	            promise: promise,
	            resolve: function (value) {
	                res(value);
	            },
	            reject: function (reason) {
	                rej(reason);
	            },
	        };
	    };
	    return ZPromise;
	}());

	exports.ZPromise = ZPromise;

}));
