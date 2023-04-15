(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PromiseUtils = void 0;
    var PromiseUtils;
    (function (PromiseUtils) {
        var PromiseState;
        (function (PromiseState) {
            PromiseState["PENDING"] = "pending";
            PromiseState["FULFILLED"] = "fulfilled";
            PromiseState["REJECTED"] = "rejected";
        })(PromiseState = PromiseUtils.PromiseState || (PromiseUtils.PromiseState = {}));
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
            return target instanceof MyPromise;
        }
        PromiseUtils.is_promise = is_promise;
        function is_obj(target) {
            return ((typeof target === "object" || typeof target === "function") &&
                target !== null);
        }
        PromiseUtils.is_obj = is_obj;
        function is_thenable(target) {
            return ((typeof target === "object" || typeof target === "function") &&
                typeof target.then === "function");
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
    })(PromiseUtils = exports.PromiseUtils || (exports.PromiseUtils = {}));
    var MyPromise = /** @class */ (function () {
        function MyPromise(callback) {
            var _this = this;
            this.state = PromiseUtils.PromiseState.PENDING;
            this.value = undefined;
            this.reason = undefined;
            this.onFulfilled = [];
            this.onRejected = [];
            this.onFulfilledResult = [];
            this.onRejectedResult = [];
            var resolve = function (value) {
                MyPromise.resolve_promise(_this, value);
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
        MyPromise.resolve_promise = function (promise, x) {
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
                        MyPromise.resolve_promise(promise, value);
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
        };
        MyPromise.prototype.toResolved = function (value) {
            if (this.state !== PromiseUtils.PromiseState.PENDING) {
                return;
            }
            this.value = value;
            this.change_state(PromiseUtils.PromiseState.FULFILLED);
            this.flush_fulfilled();
        };
        MyPromise.prototype.toRejected = function (reason) {
            if (this.state !== PromiseUtils.PromiseState.PENDING) {
                return;
            }
            this.reason = reason;
            this.change_state(PromiseUtils.PromiseState.REJECTED);
            this.flush_rejected();
        };
        MyPromise.prototype.flush_fulfilled = function () {
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
        MyPromise.prototype.flush_rejected = function () {
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
        MyPromise.prototype.then = function (onFulfilled, onRejected) {
            var _this = this;
            var res;
            var rej;
            var promise = new MyPromise(function (_res, _rej) {
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
                    MyPromise.resolve_promise(promise, result.value);
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
                    MyPromise.resolve_promise(promise, result.value);
                }));
            }
            this.flush_fulfilled();
            this.flush_rejected();
            return promise;
        };
        MyPromise.prototype.change_state = function (new_state) {
            if (this.state !== PromiseUtils.PromiseState.PENDING)
                throw new Error("Promise状态不是pending");
            this.state = new_state;
        };
        MyPromise.resolve = function (value) {
            return new MyPromise(function (res, rej) { return res(value); });
        };
        MyPromise.reject = function (reason) {
            return new MyPromise(function (res, rej) { return rej(reason); });
        };
        MyPromise.deferred = function () {
            var res;
            var rej;
            var promise = new MyPromise(function (_res, _rej) {
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
        MyPromise.resolve_called = false;
        MyPromise.reject_called = false;
        return MyPromise;
    }());
    exports.default = MyPromise;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTXlQcm9taXNlLmpzIiwic291cmNlUm9vdCI6Ii4vc3JjLyIsInNvdXJjZXMiOlsiTXlQcm9taXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztJQU1BLElBQWlCLFlBQVksQ0F5RTVCO0lBekVELFdBQWlCLFlBQVk7UUFDekIsSUFBWSxZQUlYO1FBSkQsV0FBWSxZQUFZO1lBQ3BCLG1DQUFtQixDQUFBO1lBQ25CLHVDQUF1QixDQUFBO1lBQ3ZCLHFDQUFxQixDQUFBO1FBQ3pCLENBQUMsRUFKVyxZQUFZLEdBQVoseUJBQVksS0FBWix5QkFBWSxRQUl2QjtRQWdCRCxTQUFnQixLQUFLLENBQUMsSUFBYztZQUNoQyxJQUFJLEtBQUssR0FBMEIsVUFBVSxDQUFDO2dCQUMxQyxJQUFJLEVBQUUsQ0FBQztnQkFDUCxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7b0JBQ2hCLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDcEIsS0FBSyxHQUFHLElBQUksQ0FBQztpQkFDaEI7WUFDTCxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDVixDQUFDO1FBUmUsa0JBQUssUUFRcEIsQ0FBQTtRQUVELFNBQWdCLFVBQVUsQ0FBQyxNQUFXO1lBQ2xDLE9BQU8sTUFBTSxZQUFZLFNBQVMsQ0FBQztRQUN2QyxDQUFDO1FBRmUsdUJBQVUsYUFFekIsQ0FBQTtRQUNELFNBQWdCLE1BQU0sQ0FBQyxNQUFXO1lBQzlCLE9BQU8sQ0FDSCxDQUFDLE9BQU8sTUFBTSxLQUFLLFFBQVEsSUFBSSxPQUFPLE1BQU0sS0FBSyxVQUFVLENBQUM7Z0JBQzVELE1BQU0sS0FBSyxJQUFJLENBQ2xCLENBQUM7UUFDTixDQUFDO1FBTGUsbUJBQU0sU0FLckIsQ0FBQTtRQUNELFNBQWdCLFdBQVcsQ0FBQyxNQUFXO1lBQ25DLE9BQU8sQ0FDSCxDQUFDLE9BQU8sTUFBTSxLQUFLLFFBQVEsSUFBSSxPQUFPLE1BQU0sS0FBSyxVQUFVLENBQUM7Z0JBQzVELE9BQU8sTUFBTSxD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QUM7S0FBQSxBQXRORCxJQXNOQztJQUVELGtCQUFlLFNBQVMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBpbnRlcmZhY2UgRGVmZXJyZWRSZXN1bHQ8VmFsdWU+IHtcbiAgICBwcm9taXNlOiBNeVByb21pc2U8VmFsdWU+O1xuICAgIHJlc29sdmU8VD4odmFsdWU6IFQpOiB2b2lkO1xuICAgIHJlamVjdDxUPih2YWx1ZTogVCk6IHZvaWQ7XG59XG5cbmV4cG9ydCBuYW1lc3BhY2UgUHJvbWlzZVV0aWxzIHtcbiAgICBleHBvcnQgZW51bSBQcm9taXNlU3RhdGUge1xuICAgICAgICBQRU5ESU5HID0gXCJwZW5kaW5nXCIsXG4gICAgICAgIEZVTEZJTExFRCA9IFwiZnVsZmlsbGVkXCIsXG4gICAgICAgIFJFSkVDVEVEID0gXCJyZWplY3RlZFwiLFxuICAgIH1cbiAgICBleHBvcnQgdHlwZSBSZXNvbHZlQ2FsbGJhY2s8VD4gPSAodmFsdWU/OiBUKSA9PiB2b2lkO1xuICAgIGV4cG9ydCB0eXBlIFJlamVjdENhbGxiYWNrID0gKHJlYXNvbj86IGFueSkgPT4gdm9pZDtcbiAgICBleHBvcnQgdHlwZSBDYWxsYmFjazxUPiA9IChcbiAgICAgICAgcmVzb2x2ZTogUmVzb2x2ZUNhbGxiYWNrPFQ+LFxuICAgICAgICByZWplY3Q6IFJlamVjdENhbGxiYWNrXG4gICAgKSA9PiB2b2lkO1xuICAgIGV4cG9ydCB0eXBlIFRoZW5PbkZ1bGZpbGxlZDxUPiA9ICh2YWx1ZT86IFQpID0+IGFueTtcbiAgICBleHBvcnQgdHlwZSBUaGVuT25SZWplY3RlZDxUPiA9ICh2YWx1ZT86IFQpID0+IGFueTtcblxuICAgIGV4cG9ydCB0eXBlIE9uRnVsZmlsbGVkUmVzdWx0PFQ+ID0ge1xuICAgICAgICB0eXBlOiBcInN1Y2Nlc3NcIiB8IFwiZmFpbGRcIjtcbiAgICAgICAgdmFsdWU6IFQ7XG4gICAgfTtcbiAgICBleHBvcnQgdHlwZSBPblJlamVjdGVkUmVzdWx0PFQ+ID0gT25GdWxmaWxsZWRSZXN1bHQ8VD47XG5cbiAgICBleHBvcnQgZnVuY3Rpb24gc3Bhd24odGFzazogRnVuY3Rpb24pIHtcbiAgICAgICAgbGV0IHRpbWVyOiBOb2RlSlMuVGltZW91dCB8IG51bGwgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHRhc2soKTtcbiAgICAgICAgICAgIGlmICh0aW1lciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICAgICAgICAgICAgdGltZXIgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCAwKTtcbiAgICB9XG5cbiAgICBleHBvcnQgZnVuY3Rpb24gaXNfcHJvbWlzZSh0YXJnZXQ6IGFueSk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGFyZ2V0IGluc3RhbmNlb2YgTXlQcm9taXNlO1xuICAgIH1cbiAgICBleHBvcnQgZnVuY3Rpb24gaXNfb2JqKHRhcmdldDogYW55KTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAodHlwZW9mIHRhcmdldCA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgdGFyZ2V0ID09PSBcImZ1bmN0aW9uXCIpICYmXG4gICAgICAgICAgICB0YXJnZXQgIT09IG51bGxcbiAgICAgICAgKTtcbiAgICB9XG4gICAgZXhwb3J0IGZ1bmN0aW9uIGlzX3RoZW5hYmxlKHRhcmdldDogYW55KSB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAodHlwZW9mIHRhcmdldCA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgdGFyZ2V0ID09PSBcImZ1bmN0aW9uXCIpICYmXG4gICAgICAgICAgICB0eXBlb2YgdGFyZ2V0LnRoZW4gPT09IFwiZnVuY3Rpb25cIlxuICAgICAgICApO1xuICAgIH1cbiAgICBleHBvcnQgZnVuY3Rpb24gZ2V0X3RoZW4odGFyZ2V0OiBhbnkpOiBhbnkge1xuICAgICAgICByZXR1cm4gdGFyZ2V0LnRoZW47XG4gICAgfVxuXG4gICAgZXhwb3J0IGZ1bmN0aW9uIGdldF9maW5hbGx5X3RoZW4odGhlbmFibGU6IGFueSwgcmVzOiBhbnksIHJlajogYW55KSB7XG4gICAgICAgIGxldCB0aGVuO1xuICAgICAgICB3aGlsZSAoaXNfb2JqKHRoZW5hYmxlKSkge1xuICAgICAgICAgICAgaWYgKHRoZW5hYmxlLnRoZW4gPT09IHVuZGVmaW5lZCkgYnJlYWs7XG4gICAgICAgICAgICB0aGVuID0gdGhlbmFibGUudGhlbjtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhlbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgdGhlbmFibGUgPSB0aGVuLmNhbGwodGhlbmFibGUsIHJlcywgcmVqKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoZW47XG4gICAgfVxuICAgIGV4cG9ydCB0eXBlIENhbGxiYWNrV2l0aENhbGxlZCA9IHtcbiAgICAgICAgY2I6IEZ1bmN0aW9uO1xuICAgICAgICBjYWxsZWQ6IGJvb2xlYW47XG4gICAgfTtcbiAgICBleHBvcnQgZnVuY3Rpb24gbWFrZV9jYWxsYmFjayhjYjogRnVuY3Rpb24pOiBDYWxsYmFja1dpdGhDYWxsZWQge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY2I6IGNiLFxuICAgICAgICAgICAgY2FsbGVkOiBmYWxzZSxcbiAgICAgICAgfTtcbiAgICB9XG59XG5cbmNsYXNzIE15UHJvbWlzZTxUPiB7XG4gICAgc3RhdGU6IFByb21pc2VVdGlscy5Qcm9taXNlU3RhdGUgPSBQcm9taXNlVXRpbHMuUHJvbWlzZVN0YXRlLlBFTkRJTkc7XG4gICAgdmFsdWU6IFQgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgcmVhc29uOiBhbnkgPSB1bmRlZmluZWQ7XG4gICAgb25GdWxmaWxsZWQ6IEFycmF5PFByb21pc2VVdGlscy5DYWxsYmFja1dpdGhDYWxsZWQ+ID0gW107XG4gICAgb25SZWplY3RlZDogQXJyYXk8UHJvbWlzZVV0aWxzLkNhbGxiYWNrV2l0aENhbGxlZD4gPSBbXTtcbiAgICBvbkZ1bGZpbGxlZFJlc3VsdDogQXJyYXk8UHJvbWlzZVV0aWxzLk9uRnVsZmlsbGVkUmVzdWx0PGFueT4+ID0gW107XG4gICAgb25SZWplY3RlZFJlc3VsdDogQXJyYXk8UHJvbWlzZVV0aWxzLk9uUmVqZWN0ZWRSZXN1bHQ8YW55Pj4gPSBbXTtcblxuICAgIGNvbnN0cnVjdG9yKGNhbGxiYWNrOiBQcm9taXNlVXRpbHMuQ2FsbGJhY2s8VD4pIHtcbiAgICAgICAgY29uc3QgcmVzb2x2ZSA9ICh2YWx1ZT86IFQpID0+IHtcbiAgICAgICAgICAgIE15UHJvbWlzZS5yZXNvbHZlX3Byb21pc2UodGhpcyBhcyBhbnksIHZhbHVlKTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgcmVqZWN0ID0gKHJlYXNvbj86IFQpID0+IHtcbiAgICAgICAgICAgIHRoaXMudG9SZWplY3RlZChyZWFzb24pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjYWxsYmFjayhyZXNvbHZlLCByZWplY3QpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUgPT09IFByb21pc2VVdGlscy5Qcm9taXNlU3RhdGUuUEVORElORykge1xuICAgICAgICAgICAgICAgIHRoaXMudG9SZWplY3RlZChlcnJvciBhcyBUKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZsdXNoX3JlamVjdGVkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgc3RhdGljIHJlc29sdmVfY2FsbGVkID0gZmFsc2U7XG4gICAgc3RhdGljIHJlamVjdF9jYWxsZWQgPSBmYWxzZTtcbiAgICBzdGF0aWMgcmVzb2x2ZV9wcm9taXNlKHByb21pc2U6IE15UHJvbWlzZTx1bmtub3duPiwgeDogYW55KSB7XG4gICAgICAgIGlmIChwcm9taXNlID09PSB4KSB7XG4gICAgICAgICAgICBwcm9taXNlLnRvUmVqZWN0ZWQobmV3IFR5cGVFcnJvcihcIkNoYWluaW5nIGN5Y2xlIGRldGVjdGVkIGZvciBwcm9taXNlXCIpKTtcbiAgICAgICAgfSBlbHNlIGlmIChQcm9taXNlVXRpbHMuaXNfcHJvbWlzZSh4KSkge1xuICAgICAgICAgICAgeC50aGVuKFxuICAgICAgICAgICAgICAgIHByb21pc2UudG9SZXNvbHZlZC5iaW5kKHByb21pc2UpLFxuICAgICAgICAgICAgICAgIHByb21pc2UudG9SZWplY3RlZC5iaW5kKHByb21pc2UpXG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2UgaWYgKFByb21pc2VVdGlscy5pc19vYmooeCkpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzb2x2ZV9wcm9taXNlID0gKHZhbHVlOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc29sdmVfcHJvbWlzZS5jYWxsZWQgfHwgcmVqZWN0X3Byb21pc2UuY2FsbGVkKSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmVfcHJvbWlzZS5jYWxsZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBNeVByb21pc2UucmVzb2x2ZV9wcm9taXNlKHByb21pc2UsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJlc29sdmVfcHJvbWlzZS5jYWxsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBjb25zdCByZWplY3RfcHJvbWlzZSA9IChyZWFzb246IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVqZWN0X3Byb21pc2UuY2FsbGVkIHx8IHJlc29sdmVfcHJvbWlzZS5jYWxsZWQpIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0X3Byb21pc2UuY2FsbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZS50b1JlamVjdGVkKHJlYXNvbik7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZWplY3RfcHJvbWlzZS5jYWxsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBjb25zdCB0aGVuID0gUHJvbWlzZVV0aWxzLmdldF90aGVuKHgpO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGhlbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGVuLmNhbGwoeCwgcmVzb2x2ZV9wcm9taXNlLCByZWplY3RfcHJvbWlzZSk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc29sdmVfcHJvbWlzZS5jYWxsZWQgJiYgIXJlamVjdF9wcm9taXNlLmNhbGxlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdF9wcm9taXNlKGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHByb21pc2UudG9SZXNvbHZlZCh4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIHByb21pc2UudG9SZWplY3RlZChlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwcm9taXNlLnRvUmVzb2x2ZWQoeCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHRvUmVzb2x2ZWQodmFsdWU/OiBUKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlICE9PSBQcm9taXNlVXRpbHMuUHJvbWlzZVN0YXRlLlBFTkRJTkcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuY2hhbmdlX3N0YXRlKFByb21pc2VVdGlscy5Qcm9taXNlU3RhdGUuRlVMRklMTEVEKTtcbiAgICAgICAgdGhpcy5mbHVzaF9mdWxmaWxsZWQoKTtcbiAgICB9XG4gICAgcHJpdmF0ZSB0b1JlamVjdGVkKHJlYXNvbj86IGFueSkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZSAhPT0gUHJvbWlzZVV0aWxzLlByb21pc2VTdGF0ZS5QRU5ESU5HKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZWFzb24gPSByZWFzb247XG4gICAgICAgIHRoaXMuY2hhbmdlX3N0YXRlKFByb21pc2VVdGlscy5Qcm9taXNlU3RhdGUuUkVKRUNURUQpO1xuICAgICAgICB0aGlzLmZsdXNoX3JlamVjdGVkKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBmbHVzaF9mdWxmaWxsZWQoKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlICE9PSBQcm9taXNlVXRpbHMuUHJvbWlzZVN0YXRlLkZVTEZJTExFRCkgcmV0dXJuO1xuICAgICAgICBQcm9taXNlVXRpbHMuc3Bhd24oKCkgPT4ge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm9uRnVsZmlsbGVkLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2FsbGJhY2sgPSB0aGlzLm9uRnVsZmlsbGVkW2ldO1xuICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjay5jYWxsZWQpIHJldHVybjtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZm4gPSBjYWxsYmFjay5jYjtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdiA9IGZuKHRoaXMudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uRnVsZmlsbGVkUmVzdWx0W2luZGV4XSA9IHsgdmFsdWU6IHYsIHR5cGU6IFwic3VjY2Vzc1wiIH07XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkZ1bGZpbGxlZFJlc3VsdFtpbmRleF0gPSB7IHZhbHVlOiBlcnJvciwgdHlwZTogXCJmYWlsZFwiIH07XG4gICAgICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBwcml2YXRlIGZsdXNoX3JlamVjdGVkKCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZSAhPT0gUHJvbWlzZVV0aWxzLlByb21pc2VTdGF0ZS5SRUpFQ1RFRCkgcmV0dXJuO1xuICAgICAgICBQcm9taXNlVXRpbHMuc3Bhd24oKCkgPT4ge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm9uUmVqZWN0ZWQubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjYWxsYmFjayA9IHRoaXMub25SZWplY3RlZFtpXTtcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2suY2FsbGVkKSByZXR1cm47XG4gICAgICAgICAgICAgICAgY29uc3QgZm4gPSBjYWxsYmFjay5jYjtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdiA9IGZuKHRoaXMucmVhc29uKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vblJlamVjdGVkUmVzdWx0W2luZGV4XSA9IHsgdmFsdWU6IHYsIHR5cGU6IFwic3VjY2Vzc1wiIH07XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vblJlamVjdGVkUmVzdWx0W2luZGV4XSA9IHsgdmFsdWU6IGVycm9yLCB0eXBlOiBcImZhaWxkXCIgfTtcbiAgICAgICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5jYWxsZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdGhlbihcbiAgICAgICAgb25GdWxmaWxsZWQ/OiBQcm9taXNlVXRpbHMuVGhlbk9uRnVsZmlsbGVkPFQ+LFxuICAgICAgICBvblJlamVjdGVkPzogUHJvbWlzZVV0aWxzLlRoZW5PblJlamVjdGVkPGFueT5cbiAgICApOiBNeVByb21pc2U8dW5rbm93bj4ge1xuICAgICAgICBsZXQgcmVzOiBhbnk7XG4gICAgICAgIGxldCByZWo6IGFueTtcbiAgICAgICAgY29uc3QgcHJvbWlzZTogTXlQcm9taXNlPHVua25vd24+ID0gbmV3IE15UHJvbWlzZSgoX3JlcywgX3JlaikgPT4ge1xuICAgICAgICAgICAgcmVzID0gX3JlcztcbiAgICAgICAgICAgIHJlaiA9IF9yZWo7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICh0eXBlb2Ygb25GdWxmaWxsZWQgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhpcy5vbkZ1bGZpbGxlZC5wdXNoKFxuICAgICAgICAgICAgICAgIFByb21pc2VVdGlscy5tYWtlX2NhbGxiYWNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzKHRoaXMudmFsdWUpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygb25SZWplY3RlZCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aGlzLm9uUmVqZWN0ZWQucHVzaChcbiAgICAgICAgICAgICAgICBQcm9taXNlVXRpbHMubWFrZV9jYWxsYmFjaygoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlaih0aGlzLnJlYXNvbik7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIG9uRnVsZmlsbGVkID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID1cbiAgICAgICAgICAgICAgICB0aGlzLm9uRnVsZmlsbGVkLnB1c2goUHJvbWlzZVV0aWxzLm1ha2VfY2FsbGJhY2sob25GdWxmaWxsZWQpKSAtIDE7XG4gICAgICAgICAgICB0aGlzLm9uRnVsZmlsbGVkLnB1c2goXG4gICAgICAgICAgICAgICAgUHJvbWlzZVV0aWxzLm1ha2VfY2FsbGJhY2soKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLm9uRnVsZmlsbGVkUmVzdWx0W2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdC50eXBlID09PSBcImZhaWxkXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlaihyZXN1bHQudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgcmVzdWx0LnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIE15UHJvbWlzZS5yZXNvbHZlX3Byb21pc2UocHJvbWlzZSwgcmVzdWx0LnZhbHVlKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIG9uUmVqZWN0ZWQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPVxuICAgICAgICAgICAgICAgIHRoaXMub25SZWplY3RlZC5wdXNoKFByb21pc2VVdGlscy5tYWtlX2NhbGxiYWNrKG9uUmVqZWN0ZWQpKSAtIDE7XG4gICAgICAgICAgICB0aGlzLm9uUmVqZWN0ZWQucHVzaChcbiAgICAgICAgICAgICAgICBQcm9taXNlVXRpbHMubWFrZV9jYWxsYmFjaygoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMub25SZWplY3RlZFJlc3VsdFtpbmRleF07XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQudHlwZSA9PT0gXCJmYWlsZFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWoocmVzdWx0LnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IHJlc3VsdC52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBNeVByb21pc2UucmVzb2x2ZV9wcm9taXNlKHByb21pc2UsIHJlc3VsdC52YWx1ZSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5mbHVzaF9mdWxmaWxsZWQoKTtcbiAgICAgICAgdGhpcy5mbHVzaF9yZWplY3RlZCgpO1xuICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGNoYW5nZV9zdGF0ZShuZXdfc3RhdGU6IFByb21pc2VVdGlscy5Qcm9taXNlU3RhdGUpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgIT09IFByb21pc2VVdGlscy5Qcm9taXNlU3RhdGUuUEVORElORylcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlByb21pc2XnirbmgIHkuI3mmK9wZW5kaW5nXCIpO1xuICAgICAgICB0aGlzLnN0YXRlID0gbmV3X3N0YXRlO1xuICAgIH1cblxuICAgIHN0YXRpYyByZXNvbHZlPFQ+KHZhbHVlPzogVCk6IE15UHJvbWlzZTxUPiB7XG4gICAgICAgIHJldHVybiBuZXcgTXlQcm9taXNlKChyZXMsIHJlaikgPT4gcmVzKHZhbHVlKSk7XG4gICAgfVxuICAgIHN0YXRpYyByZWplY3Q8VD4ocmVhc29uOiBUKTogTXlQcm9taXNlPFQ+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBNeVByb21pc2UoKHJlcywgcmVqKSA9PiByZWoocmVhc29uKSk7XG4gICAgfVxuICAgIHN0YXRpYyBkZWZlcnJlZDxUPigpOiBEZWZlcnJlZFJlc3VsdDxUPiB7XG4gICAgICAgIGxldCByZXM6IFByb21pc2VVdGlscy5SZXNvbHZlQ2FsbGJhY2s8YW55PjtcbiAgICAgICAgbGV0IHJlajogUHJvbWlzZVV0aWxzLlJlamVjdENhbGxiYWNrO1xuICAgICAgICBjb25zdCBwcm9taXNlOiBNeVByb21pc2U8VD4gPSBuZXcgTXlQcm9taXNlKChfcmVzLCBfcmVqKSA9PiB7XG4gICAgICAgICAgICByZXMgPSBfcmVzO1xuICAgICAgICAgICAgcmVqID0gX3JlajtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwcm9taXNlLFxuICAgICAgICAgICAgcmVzb2x2ZTxUPih2YWx1ZT86IFQpIHtcbiAgICAgICAgICAgICAgICByZXModmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlamVjdDxUPihyZWFzb24/OiBUKSB7XG4gICAgICAgICAgICAgICAgcmVqKHJlYXNvbik7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTXlQcm9taXNlO1xuIl19