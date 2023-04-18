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
            this.visited = new Set();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTXlQcm9taXNlLmpzIiwic291cmNlUm9vdCI6Ii4vc3JjLyIsInNvdXJjZXMiOlsiTXlQcm9taXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztJQU1BLElBQWlCLFlBQVksQ0F5RTVCO0lBekVELFdBQWlCLFlBQVk7UUFDekIsSUFBWSxZQUlYO1FBSkQsV0FBWSxZQUFZO1lBQ3BCLG1DQUFtQixDQUFBO1lBQ25CLHVDQUF1QixDQUFBO1lBQ3ZCLHFDQUFxQixDQUFBO1FBQ3pCLENBQUMsRUFKVyxZQUFZLEdBQVoseUJBQVksS0FBWix5QkFBWSxRQUl2QjtRQWdCRCxTQUFnQixLQUFLLENBQUMsSUFBYztZQUNoQyxJQUFJLEtBQUssR0FBMEIsVUFBVSxDQUFDO2dCQUMxQyxJQUFJLEVBQUUsQ0FBQztnQkFDUCxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7b0JBQ2hCLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDcEIsS0FBSyxHQUFHLElBQUksQ0FBQztpQkFDaEI7WUFDTCxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDVixDQUFDO1FBUmUsa0JBQUssUUFRcEIsQ0FBQTtRQUVELFNBQWdCLFVBQVUsQ0FBQyxNQUFXO1lBQ2xDLE9BQU8sTUFBTSxZQUFZLFNBQVMsQ0FBQztRQUN2QyxDQUFDO1FBRmUsdUJBQVUsYUFFekIsQ0FBQTtRQUNELFNBQWdCLE1BQU0sQ0FBQyxNQUFXO1lBQzlCLE9BQU8sQ0FDSCxDQUFDLE9BQU8sTUFBTSxLQUFLLFFBQVEsSUFBSSxPQUFPLE1BQU0sS0FBSyxVQUFVLENBQUM7Z0JBQzVELE1BQU0sS0FBSyxJQUFJLENBQ2xCLENBQUM7UUFDTixDQUFDO1FBTGUsbUJBQU0sU0FLckIsQ0FBQTtRQUNELFNBQWdCLFdBQVcsQ0FBQyxNQUFXO1lBQ25DLE9BQU8sQ0FDSCxDQUFDLE9BQU8sTUFBTSxLQUFLLFFBQVEsSUFBSSxPQUFPLE1BQU0sS0FBSyxVQUFVLENBQUM7Z0JBQzVELE9BQU8sTUFBTSxD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LENBQUMsQ0FBQyxDQUFDO1lBQ0gsT0FBTztnQkFDSCxPQUFPLFNBQUE7Z0JBQ1AsT0FBTyxZQUFJLEtBQVM7b0JBQ2hCLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDZixDQUFDO2dCQUNELE1BQU0sWUFBSSxNQUFVO29CQUNoQixHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ2hCLENBQUM7YUFDSixDQUFDO1FBQ04sQ0FBQztRQWpNTSx3QkFBYyxHQUFHLEtBQUssQUFBUixDQUFTO1FBQ3ZCLHVCQUFhLEdBQUcsS0FBSyxBQUFSLENBQVM7UUFpTWpDLGdCQUFDO0tBQUEsQUE3TkQsSUE2TkM7SUFFRCxrQkFBZSxTQUFTLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgaW50ZXJmYWNlIERlZmVycmVkUmVzdWx0PFZhbHVlPiB7XG4gICAgcHJvbWlzZTogTXlQcm9taXNlPFZhbHVlPjtcbiAgICByZXNvbHZlPFQ+KHZhbHVlOiBUKTogdm9pZDtcbiAgICByZWplY3Q8VD4odmFsdWU6IFQpOiB2b2lkO1xufVxuXG5leHBvcnQgbmFtZXNwYWNlIFByb21pc2VVdGlscyB7XG4gICAgZXhwb3J0IGVudW0gUHJvbWlzZVN0YXRlIHtcbiAgICAgICAgUEVORElORyA9IFwicGVuZGluZ1wiLFxuICAgICAgICBGVUxGSUxMRUQgPSBcImZ1bGZpbGxlZFwiLFxuICAgICAgICBSRUpFQ1RFRCA9IFwicmVqZWN0ZWRcIixcbiAgICB9XG4gICAgZXhwb3J0IHR5cGUgUmVzb2x2ZUNhbGxiYWNrPFQ+ID0gKHZhbHVlPzogVCkgPT4gdm9pZDtcbiAgICBleHBvcnQgdHlwZSBSZWplY3RDYWxsYmFjayA9IChyZWFzb24/OiBhbnkpID0+IHZvaWQ7XG4gICAgZXhwb3J0IHR5cGUgQ2FsbGJhY2s8VD4gPSAoXG4gICAgICAgIHJlc29sdmU6IFJlc29sdmVDYWxsYmFjazxUPixcbiAgICAgICAgcmVqZWN0OiBSZWplY3RDYWxsYmFja1xuICAgICkgPT4gdm9pZDtcbiAgICBleHBvcnQgdHlwZSBUaGVuT25GdWxmaWxsZWQ8VD4gPSAodmFsdWU/OiBUKSA9PiBhbnk7XG4gICAgZXhwb3J0IHR5cGUgVGhlbk9uUmVqZWN0ZWQ8VD4gPSAodmFsdWU/OiBUKSA9PiBhbnk7XG5cbiAgICBleHBvcnQgdHlwZSBPbkZ1bGZpbGxlZFJlc3VsdDxUPiA9IHtcbiAgICAgICAgdHlwZTogXCJzdWNjZXNzXCIgfCBcImZhaWxkXCI7XG4gICAgICAgIHZhbHVlOiBUO1xuICAgIH07XG4gICAgZXhwb3J0IHR5cGUgT25SZWplY3RlZFJlc3VsdDxUPiA9IE9uRnVsZmlsbGVkUmVzdWx0PFQ+O1xuXG4gICAgZXhwb3J0IGZ1bmN0aW9uIHNwYXduKHRhc2s6IEZ1bmN0aW9uKSB7XG4gICAgICAgIGxldCB0aW1lcjogTm9kZUpTLlRpbWVvdXQgfCBudWxsID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICB0YXNrKCk7XG4gICAgICAgICAgICBpZiAodGltZXIgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICAgICAgICAgIHRpbWVyID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMCk7XG4gICAgfVxuXG4gICAgZXhwb3J0IGZ1bmN0aW9uIGlzX3Byb21pc2UodGFyZ2V0OiBhbnkpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRhcmdldCBpbnN0YW5jZW9mIE15UHJvbWlzZTtcbiAgICB9XG4gICAgZXhwb3J0IGZ1bmN0aW9uIGlzX29iaih0YXJnZXQ6IGFueSk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgKHR5cGVvZiB0YXJnZXQgPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIHRhcmdldCA9PT0gXCJmdW5jdGlvblwiKSAmJlxuICAgICAgICAgICAgdGFyZ2V0ICE9PSBudWxsXG4gICAgICAgICk7XG4gICAgfVxuICAgIGV4cG9ydCBmdW5jdGlvbiBpc190aGVuYWJsZSh0YXJnZXQ6IGFueSkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgKHR5cGVvZiB0YXJnZXQgPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIHRhcmdldCA9PT0gXCJmdW5jdGlvblwiKSAmJlxuICAgICAgICAgICAgdHlwZW9mIHRhcmdldC50aGVuID09PSBcImZ1bmN0aW9uXCJcbiAgICAgICAgKTtcbiAgICB9XG4gICAgZXhwb3J0IGZ1bmN0aW9uIGdldF90aGVuKHRhcmdldDogYW55KTogYW55IHtcbiAgICAgICAgcmV0dXJuIHRhcmdldC50aGVuO1xuICAgIH1cblxuICAgIGV4cG9ydCBmdW5jdGlvbiBnZXRfZmluYWxseV90aGVuKHRoZW5hYmxlOiBhbnksIHJlczogYW55LCByZWo6IGFueSkge1xuICAgICAgICBsZXQgdGhlbjtcbiAgICAgICAgd2hpbGUgKGlzX29iaih0aGVuYWJsZSkpIHtcbiAgICAgICAgICAgIGlmICh0aGVuYWJsZS50aGVuID09PSB1bmRlZmluZWQpIGJyZWFrO1xuICAgICAgICAgICAgdGhlbiA9IHRoZW5hYmxlLnRoZW47XG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoZW4gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIHRoZW5hYmxlID0gdGhlbi5jYWxsKHRoZW5hYmxlLCByZXMsIHJlaik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGVuO1xuICAgIH1cbiAgICBleHBvcnQgdHlwZSBDYWxsYmFja1dpdGhDYWxsZWQgPSB7XG4gICAgICAgIGNiOiBGdW5jdGlvbjtcbiAgICAgICAgY2FsbGVkOiBib29sZWFuO1xuICAgIH07XG4gICAgZXhwb3J0IGZ1bmN0aW9uIG1ha2VfY2FsbGJhY2soY2I6IEZ1bmN0aW9uKTogQ2FsbGJhY2tXaXRoQ2FsbGVkIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNiOiBjYixcbiAgICAgICAgICAgIGNhbGxlZDogZmFsc2UsXG4gICAgICAgIH07XG4gICAgfVxufVxuXG5jbGFzcyBNeVByb21pc2U8VD4ge1xuICAgIHN0YXRlOiBQcm9taXNlVXRpbHMuUHJvbWlzZVN0YXRlID0gUHJvbWlzZVV0aWxzLlByb21pc2VTdGF0ZS5QRU5ESU5HO1xuICAgIHZhbHVlOiBUIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgIHJlYXNvbjogYW55ID0gdW5kZWZpbmVkO1xuICAgIG9uRnVsZmlsbGVkOiBBcnJheTxQcm9taXNlVXRpbHMuQ2FsbGJhY2tXaXRoQ2FsbGVkPiA9IFtdO1xuICAgIG9uUmVqZWN0ZWQ6IEFycmF5PFByb21pc2VVdGlscy5DYWxsYmFja1dpdGhDYWxsZWQ+ID0gW107XG4gICAgb25GdWxmaWxsZWRSZXN1bHQ6IEFycmF5PFByb21pc2VVdGlscy5PbkZ1bGZpbGxlZFJlc3VsdDxhbnk+PiA9IFtdO1xuICAgIG9uUmVqZWN0ZWRSZXN1bHQ6IEFycmF5PFByb21pc2VVdGlscy5PblJlamVjdGVkUmVzdWx0PGFueT4+ID0gW107XG4gICAgdmlzaXRlZDpTZXQ8YW55PiA9IG5ldyBTZXQoKVxuXG4gICAgY29uc3RydWN0b3IoY2FsbGJhY2s6IFByb21pc2VVdGlscy5DYWxsYmFjazxUPikge1xuICAgICAgICBjb25zdCByZXNvbHZlID0gKHZhbHVlPzogVCkgPT4ge1xuICAgICAgICAgICAgTXlQcm9taXNlLnJlc29sdmVfcHJvbWlzZSh0aGlzIGFzIGFueSwgdmFsdWUpO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCByZWplY3QgPSAocmVhc29uPzogVCkgPT4ge1xuICAgICAgICAgICAgdGhpcy50b1JlamVjdGVkKHJlYXNvbik7XG4gICAgICAgIH07XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0ZSA9PT0gUHJvbWlzZVV0aWxzLlByb21pc2VTdGF0ZS5QRU5ESU5HKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50b1JlamVjdGVkKGVycm9yIGFzIFQpO1xuICAgICAgICAgICAgICAgIHRoaXMuZmx1c2hfcmVqZWN0ZWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBzdGF0aWMgcmVzb2x2ZV9jYWxsZWQgPSBmYWxzZTtcbiAgICBzdGF0aWMgcmVqZWN0X2NhbGxlZCA9IGZhbHNlO1xuICAgIHN0YXRpYyByZXNvbHZlX3Byb21pc2UocHJvbWlzZTogTXlQcm9taXNlPHVua25vd24+LCB4OiBhbnkpIHtcbiAgICAgICAgaWYocHJvbWlzZS52aXNpdGVkLmhhcyh4KSl7XG4gICAgICAgICAgICBwcm9taXNlLnRvUmVqZWN0ZWQobmV3IFR5cGVFcnJvcihcIkEgcmVjdXJzaXZlIGxvb3Agb2NjdXJzXCIpKTtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIGlmIChwcm9taXNlID09PSB4KSB7XG4gICAgICAgICAgICBwcm9taXNlLnRvUmVqZWN0ZWQobmV3IFR5cGVFcnJvcihcIkNoYWluaW5nIGN5Y2xlIGRldGVjdGVkIGZvciBwcm9taXNlXCIpKTtcbiAgICAgICAgfSBlbHNlIGlmIChQcm9taXNlVXRpbHMuaXNfcHJvbWlzZSh4KSkge1xuICAgICAgICAgICAgeC50aGVuKFxuICAgICAgICAgICAgICAgIHByb21pc2UudG9SZXNvbHZlZC5iaW5kKHByb21pc2UpLFxuICAgICAgICAgICAgICAgIHByb21pc2UudG9SZWplY3RlZC5iaW5kKHByb21pc2UpXG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2UgaWYgKFByb21pc2VVdGlscy5pc19vYmooeCkpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzb2x2ZV9wcm9taXNlID0gKHZhbHVlOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc29sdmVfcHJvbWlzZS5jYWxsZWQgfHwgcmVqZWN0X3Byb21pc2UuY2FsbGVkKSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmVfcHJvbWlzZS5jYWxsZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBNeVByb21pc2UucmVzb2x2ZV9wcm9taXNlKHByb21pc2UsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJlc29sdmVfcHJvbWlzZS5jYWxsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBjb25zdCByZWplY3RfcHJvbWlzZSA9IChyZWFzb246IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVqZWN0X3Byb21pc2UuY2FsbGVkIHx8IHJlc29sdmVfcHJvbWlzZS5jYWxsZWQpIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0X3Byb21pc2UuY2FsbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZS50b1JlamVjdGVkKHJlYXNvbik7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZWplY3RfcHJvbWlzZS5jYWxsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBjb25zdCB0aGVuID0gUHJvbWlzZVV0aWxzLmdldF90aGVuKHgpO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGhlbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb21pc2UudmlzaXRlZC5hZGQoeClcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4uY2FsbCh4LCByZXNvbHZlX3Byb21pc2UsIHJlamVjdF9wcm9taXNlKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVzb2x2ZV9wcm9taXNlLmNhbGxlZCAmJiAhcmVqZWN0X3Byb21pc2UuY2FsbGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0X3Byb21pc2UoZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZS50b1Jlc29sdmVkKHgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgcHJvbWlzZS50b1JlamVjdGVkKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHByb21pc2UudG9SZXNvbHZlZCh4KTtcbiAgICAgICAgfVxuICAgICAgICBwcm9taXNlLnZpc2l0ZWQuY2xlYXIoKVxuICAgIH1cblxuICAgIHByaXZhdGUgdG9SZXNvbHZlZCh2YWx1ZT86IFQpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgIT09IFByb21pc2VVdGlscy5Qcm9taXNlU3RhdGUuUEVORElORykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5jaGFuZ2Vfc3RhdGUoUHJvbWlzZVV0aWxzLlByb21pc2VTdGF0ZS5GVUxGSUxMRUQpO1xuICAgICAgICB0aGlzLmZsdXNoX2Z1bGZpbGxlZCgpO1xuICAgIH1cbiAgICBwcml2YXRlIHRvUmVqZWN0ZWQocmVhc29uPzogYW55KSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlICE9PSBQcm9taXNlVXRpbHMuUHJvbWlzZVN0YXRlLlBFTkRJTkcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJlYXNvbiA9IHJlYXNvbjtcbiAgICAgICAgdGhpcy5jaGFuZ2Vfc3RhdGUoUHJvbWlzZVV0aWxzLlByb21pc2VTdGF0ZS5SRUpFQ1RFRCk7XG4gICAgICAgIHRoaXMuZmx1c2hfcmVqZWN0ZWQoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGZsdXNoX2Z1bGZpbGxlZCgpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgIT09IFByb21pc2VVdGlscy5Qcm9taXNlU3RhdGUuRlVMRklMTEVEKSByZXR1cm47XG4gICAgICAgIFByb21pc2VVdGlscy5zcGF3bigoKSA9PiB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMub25GdWxmaWxsZWQubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjYWxsYmFjayA9IHRoaXMub25GdWxmaWxsZWRbaV07XG4gICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrLmNhbGxlZCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gaTtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmbiA9IGNhbGxiYWNrLmNiO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2ID0gZm4odGhpcy52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25GdWxmaWxsZWRSZXN1bHRbaW5kZXhdID0geyB2YWx1ZTogdiwgdHlwZTogXCJzdWNjZXNzXCIgfTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uRnVsZmlsbGVkUmVzdWx0W2luZGV4XSA9IHsgdmFsdWU6IGVycm9yLCB0eXBlOiBcImZhaWxkXCIgfTtcbiAgICAgICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5jYWxsZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHByaXZhdGUgZmx1c2hfcmVqZWN0ZWQoKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlICE9PSBQcm9taXNlVXRpbHMuUHJvbWlzZVN0YXRlLlJFSkVDVEVEKSByZXR1cm47XG4gICAgICAgIFByb21pc2VVdGlscy5zcGF3bigoKSA9PiB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMub25SZWplY3RlZC5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrID0gdGhpcy5vblJlamVjdGVkW2ldO1xuICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjay5jYWxsZWQpIHJldHVybjtcbiAgICAgICAgICAgICAgICBjb25zdCBmbiA9IGNhbGxiYWNrLmNiO1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gaTtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2ID0gZm4odGhpcy5yZWFzb24pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uUmVqZWN0ZWRSZXN1bHRbaW5kZXhdID0geyB2YWx1ZTogdiwgdHlwZTogXCJzdWNjZXNzXCIgfTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uUmVqZWN0ZWRSZXN1bHRbaW5kZXhdID0geyB2YWx1ZTogZXJyb3IsIHR5cGU6IFwiZmFpbGRcIiB9O1xuICAgICAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmNhbGxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGVuKFxuICAgICAgICBvbkZ1bGZpbGxlZD86IFByb21pc2VVdGlscy5UaGVuT25GdWxmaWxsZWQ8VD4sXG4gICAgICAgIG9uUmVqZWN0ZWQ/OiBQcm9taXNlVXRpbHMuVGhlbk9uUmVqZWN0ZWQ8YW55PlxuICAgICk6IE15UHJvbWlzZTx1bmtub3duPiB7XG4gICAgICAgIGxldCByZXM6IGFueTtcbiAgICAgICAgbGV0IHJlajogYW55O1xuICAgICAgICBjb25zdCBwcm9taXNlOiBNeVByb21pc2U8dW5rbm93bj4gPSBuZXcgTXlQcm9taXNlKChfcmVzLCBfcmVqKSA9PiB7XG4gICAgICAgICAgICByZXMgPSBfcmVzO1xuICAgICAgICAgICAgcmVqID0gX3JlajtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvbkZ1bGZpbGxlZCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aGlzLm9uRnVsZmlsbGVkLnB1c2goXG4gICAgICAgICAgICAgICAgUHJvbWlzZVV0aWxzLm1ha2VfY2FsbGJhY2soKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXModGhpcy52YWx1ZSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvblJlamVjdGVkICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRoaXMub25SZWplY3RlZC5wdXNoKFxuICAgICAgICAgICAgICAgIFByb21pc2VVdGlscy5tYWtlX2NhbGxiYWNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVqKHRoaXMucmVhc29uKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2Ygb25GdWxmaWxsZWQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPVxuICAgICAgICAgICAgICAgIHRoaXMub25GdWxmaWxsZWQucHVzaChQcm9taXNlVXRpbHMubWFrZV9jYWxsYmFjayhvbkZ1bGZpbGxlZCkpIC0gMTtcbiAgICAgICAgICAgIHRoaXMub25GdWxmaWxsZWQucHVzaChcbiAgICAgICAgICAgICAgICBQcm9taXNlVXRpbHMubWFrZV9jYWxsYmFjaygoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMub25GdWxmaWxsZWRSZXN1bHRbaW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnR5cGUgPT09IFwiZmFpbGRcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqKHJlc3VsdC52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyByZXN1bHQudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgTXlQcm9taXNlLnJlc29sdmVfcHJvbWlzZShwcm9taXNlLCByZXN1bHQudmFsdWUpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygb25SZWplY3RlZCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9XG4gICAgICAgICAgICAgICAgdGhpcy5vblJlamVjdGVkLnB1c2goUHJvbWlzZVV0aWxzLm1ha2VfY2FsbGJhY2sob25SZWplY3RlZCkpIC0gMTtcbiAgICAgICAgICAgIHRoaXMub25SZWplY3RlZC5wdXNoKFxuICAgICAgICAgICAgICAgIFByb21pc2VVdGlscy5tYWtlX2NhbGxiYWNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5vblJlamVjdGVkUmVzdWx0W2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdC50eXBlID09PSBcImZhaWxkXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlaihyZXN1bHQudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgcmVzdWx0LnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIE15UHJvbWlzZS5yZXNvbHZlX3Byb21pc2UocHJvbWlzZSwgcmVzdWx0LnZhbHVlKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmZsdXNoX2Z1bGZpbGxlZCgpO1xuICAgICAgICB0aGlzLmZsdXNoX3JlamVjdGVkKCk7XG4gICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH1cblxuICAgIHByaXZhdGUgY2hhbmdlX3N0YXRlKG5ld19zdGF0ZTogUHJvbWlzZVV0aWxzLlByb21pc2VTdGF0ZSkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZSAhPT0gUHJvbWlzZVV0aWxzLlByb21pc2VTdGF0ZS5QRU5ESU5HKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUHJvbWlzZeeKtuaAgeS4jeaYr3BlbmRpbmdcIik7XG4gICAgICAgIHRoaXMuc3RhdGUgPSBuZXdfc3RhdGU7XG4gICAgfVxuXG4gICAgc3RhdGljIHJlc29sdmU8VD4odmFsdWU/OiBUKTogTXlQcm9taXNlPFQ+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBNeVByb21pc2UoKHJlcywgcmVqKSA9PiByZXModmFsdWUpKTtcbiAgICB9XG4gICAgc3RhdGljIHJlamVjdDxUPihyZWFzb246IFQpOiBNeVByb21pc2U8VD4ge1xuICAgICAgICByZXR1cm4gbmV3IE15UHJvbWlzZSgocmVzLCByZWopID0+IHJlaihyZWFzb24pKTtcbiAgICB9XG4gICAgc3RhdGljIGRlZmVycmVkPFQ+KCk6IERlZmVycmVkUmVzdWx0PFQ+IHtcbiAgICAgICAgbGV0IHJlczogUHJvbWlzZVV0aWxzLlJlc29sdmVDYWxsYmFjazxhbnk+O1xuICAgICAgICBsZXQgcmVqOiBQcm9taXNlVXRpbHMuUmVqZWN0Q2FsbGJhY2s7XG4gICAgICAgIGNvbnN0IHByb21pc2U6IE15UHJvbWlzZTxUPiA9IG5ldyBNeVByb21pc2UoKF9yZXMsIF9yZWopID0+IHtcbiAgICAgICAgICAgIHJlcyA9IF9yZXM7XG4gICAgICAgICAgICByZWogPSBfcmVqO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHByb21pc2UsXG4gICAgICAgICAgICByZXNvbHZlPFQ+KHZhbHVlPzogVCkge1xuICAgICAgICAgICAgICAgIHJlcyh2YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVqZWN0PFQ+KHJlYXNvbj86IFQpIHtcbiAgICAgICAgICAgICAgICByZWoocmVhc29uKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBNeVByb21pc2U7XG4iXX0=