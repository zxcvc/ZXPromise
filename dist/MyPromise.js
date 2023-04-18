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
        MyPromise.prototype.change_state = function (new_state) {
            if (this.state !== PromiseUtils.PromiseState.PENDING)
                throw new Error("Promise状态不是pending");
            this.state = new_state;
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
        return MyPromise;
    }());
    exports.default = MyPromise;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTXlQcm9taXNlLmpzIiwic291cmNlUm9vdCI6Ii4vc3JjLyIsInNvdXJjZXMiOlsiTXlQcm9taXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztJQU1BLElBQWlCLFlBQVksQ0FzRTVCO0lBdEVELFdBQWlCLFlBQVk7UUFDekIsSUFBWSxZQUlYO1FBSkQsV0FBWSxZQUFZO1lBQ3BCLG1DQUFtQixDQUFBO1lBQ25CLHVDQUF1QixDQUFBO1lBQ3ZCLHFDQUFxQixDQUFBO1FBQ3pCLENBQUMsRUFKVyxZQUFZLEdBQVoseUJBQVksS0FBWix5QkFBWSxRQUl2QjtRQWVELFNBQWdCLEtBQUssQ0FBQyxJQUFjO1lBQ2hDLElBQUksS0FBSyxHQUEwQixVQUFVLENBQUM7Z0JBQzFDLElBQUksRUFBRSxDQUFDO2dCQUNQLElBQUksS0FBSyxLQUFLLElBQUksRUFBRTtvQkFDaEIsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNwQixLQUFLLEdBQUcsSUFBSSxDQUFDO2lCQUNoQjtZQUNMLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNWLENBQUM7UUFSZSxrQkFBSyxRQVFwQixDQUFBO1FBQ0QsU0FBZ0IsVUFBVSxDQUFDLE1BQVc7WUFDbEMsT0FBTyxNQUFNLFlBQVksU0FBUyxDQUFDO1FBQ3ZDLENBQUM7UUFGZSx1QkFBVSxhQUV6QixDQUFBO1FBQ0QsU0FBZ0IsTUFBTSxDQUFDLE1BQVc7WUFDOUIsT0FBTyxDQUNILENBQUMsT0FBTyxNQUFNLEtBQUssUUFBUSxJQUFJLE9BQU8sTUFBTSxLQUFLLFVBQVUsQ0FBQztnQkFDNUQsTUFBTSxLQUFLLElBQUksQ0FDbEIsQ0FBQztRQUNOLENBQUM7UUFMZSxtQkFBTSxTQUtyQixDQUFBO1FBQ0QsU0FBZ0IsV0FBVyxDQUFDLE1BQVc7WUFDbkMsT0FBTyxDQUNILENBQUMsT0FBTyxNQUFNLEtBQUssUUFBUSxJQUFJLE9BQU8sTUFBTSxLQUFLLFVBQVUsQ0FBQztnQkFDNUQsT0FBTyxNQUFNLENB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Q0FBQyxDQUFDLENBQUM7WUFDSCxPQUFPO2dCQUNILE9BQU8sU0FBQTtnQkFDUCxPQUFPLFlBQUksS0FBUztvQkFDaEIsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNmLENBQUM7Z0JBQ0QsTUFBTSxZQUFJLE1BQVU7b0JBQ2hCLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDaEIsQ0FBQzthQUNKLENBQUM7UUFDTixDQUFDO1FBQ0wsZ0JBQUM7SUFBRCxDQUFDLEFBek5ELElBeU5DO0lBRUQsa0JBQWUsU0FBUyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGludGVyZmFjZSBEZWZlcnJlZFJlc3VsdDxWYWx1ZT4ge1xuICAgIHByb21pc2U6IE15UHJvbWlzZTxWYWx1ZT47XG4gICAgcmVzb2x2ZTxUPih2YWx1ZTogVCk6IHZvaWQ7XG4gICAgcmVqZWN0PFQ+KHZhbHVlOiBUKTogdm9pZDtcbn1cblxuZXhwb3J0IG5hbWVzcGFjZSBQcm9taXNlVXRpbHMge1xuICAgIGV4cG9ydCBlbnVtIFByb21pc2VTdGF0ZSB7XG4gICAgICAgIFBFTkRJTkcgPSBcInBlbmRpbmdcIixcbiAgICAgICAgRlVMRklMTEVEID0gXCJmdWxmaWxsZWRcIixcbiAgICAgICAgUkVKRUNURUQgPSBcInJlamVjdGVkXCIsXG4gICAgfVxuICAgIGV4cG9ydCB0eXBlIFJlc29sdmVDYWxsYmFjazxUPiA9ICh2YWx1ZT86IFQpID0+IHZvaWQ7XG4gICAgZXhwb3J0IHR5cGUgUmVqZWN0Q2FsbGJhY2sgPSAocmVhc29uPzogYW55KSA9PiB2b2lkO1xuICAgIGV4cG9ydCB0eXBlIENhbGxiYWNrPFQ+ID0gKFxuICAgICAgICByZXNvbHZlOiBSZXNvbHZlQ2FsbGJhY2s8VD4sXG4gICAgICAgIHJlamVjdDogUmVqZWN0Q2FsbGJhY2tcbiAgICApID0+IHZvaWQ7XG4gICAgZXhwb3J0IHR5cGUgVGhlbk9uRnVsZmlsbGVkPFQ+ID0gKHZhbHVlPzogVCkgPT4gYW55O1xuICAgIGV4cG9ydCB0eXBlIFRoZW5PblJlamVjdGVkPFQ+ID0gKHZhbHVlPzogVCkgPT4gYW55O1xuICAgIGV4cG9ydCB0eXBlIE9uRnVsZmlsbGVkUmVzdWx0PFQ+ID0ge1xuICAgICAgICB0eXBlOiBcInN1Y2Nlc3NcIiB8IFwiZmFpbGRcIjtcbiAgICAgICAgdmFsdWU6IFQ7XG4gICAgfTtcbiAgICBleHBvcnQgdHlwZSBPblJlamVjdGVkUmVzdWx0PFQ+ID0gT25GdWxmaWxsZWRSZXN1bHQ8VD47XG5cbiAgICBleHBvcnQgZnVuY3Rpb24gc3Bhd24odGFzazogRnVuY3Rpb24pIHtcbiAgICAgICAgbGV0IHRpbWVyOiBOb2RlSlMuVGltZW91dCB8IG51bGwgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHRhc2soKTtcbiAgICAgICAgICAgIGlmICh0aW1lciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICAgICAgICAgICAgdGltZXIgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCAwKTtcbiAgICB9XG4gICAgZXhwb3J0IGZ1bmN0aW9uIGlzX3Byb21pc2UodGFyZ2V0OiBhbnkpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRhcmdldCBpbnN0YW5jZW9mIE15UHJvbWlzZTtcbiAgICB9XG4gICAgZXhwb3J0IGZ1bmN0aW9uIGlzX29iaih0YXJnZXQ6IGFueSk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgKHR5cGVvZiB0YXJnZXQgPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIHRhcmdldCA9PT0gXCJmdW5jdGlvblwiKSAmJlxuICAgICAgICAgICAgdGFyZ2V0ICE9PSBudWxsXG4gICAgICAgICk7XG4gICAgfVxuICAgIGV4cG9ydCBmdW5jdGlvbiBpc190aGVuYWJsZSh0YXJnZXQ6IGFueSkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgKHR5cGVvZiB0YXJnZXQgPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIHRhcmdldCA9PT0gXCJmdW5jdGlvblwiKSAmJlxuICAgICAgICAgICAgdHlwZW9mIHRhcmdldC50aGVuID09PSBcImZ1bmN0aW9uXCJcbiAgICAgICAgKTtcbiAgICB9XG4gICAgZXhwb3J0IGZ1bmN0aW9uIGdldF90aGVuKHRhcmdldDogYW55KTogYW55IHtcbiAgICAgICAgcmV0dXJuIHRhcmdldC50aGVuO1xuICAgIH1cbiAgICBleHBvcnQgZnVuY3Rpb24gZ2V0X2ZpbmFsbHlfdGhlbih0aGVuYWJsZTogYW55LCByZXM6IGFueSwgcmVqOiBhbnkpIHtcbiAgICAgICAgbGV0IHRoZW47XG4gICAgICAgIHdoaWxlIChpc19vYmoodGhlbmFibGUpKSB7XG4gICAgICAgICAgICBpZiAodGhlbmFibGUudGhlbiA9PT0gdW5kZWZpbmVkKSBicmVhaztcbiAgICAgICAgICAgIHRoZW4gPSB0aGVuYWJsZS50aGVuO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGVuID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICB0aGVuYWJsZSA9IHRoZW4uY2FsbCh0aGVuYWJsZSwgcmVzLCByZWopO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhlbjtcbiAgICB9XG4gICAgZXhwb3J0IHR5cGUgQ2FsbGJhY2tXaXRoQ2FsbGVkID0ge1xuICAgICAgICBjYjogRnVuY3Rpb247XG4gICAgICAgIGNhbGxlZDogYm9vbGVhbjtcbiAgICB9O1xuICAgIGV4cG9ydCBmdW5jdGlvbiBtYWtlX2NhbGxiYWNrKGNiOiBGdW5jdGlvbik6IENhbGxiYWNrV2l0aENhbGxlZCB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjYjogY2IsXG4gICAgICAgICAgICBjYWxsZWQ6IGZhbHNlLFxuICAgICAgICB9O1xuICAgIH1cbn1cblxuY2xhc3MgTXlQcm9taXNlPFQ+IHtcbiAgICBzdGF0ZTogUHJvbWlzZVV0aWxzLlByb21pc2VTdGF0ZSA9IFByb21pc2VVdGlscy5Qcm9taXNlU3RhdGUuUEVORElORztcbiAgICB2YWx1ZTogVCB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICByZWFzb246IGFueSA9IHVuZGVmaW5lZDtcbiAgICBwcml2YXRlIG9uRnVsZmlsbGVkOiBBcnJheTxQcm9taXNlVXRpbHMuQ2FsbGJhY2tXaXRoQ2FsbGVkPiA9IFtdO1xuICAgIHByaXZhdGUgb25SZWplY3RlZDogQXJyYXk8UHJvbWlzZVV0aWxzLkNhbGxiYWNrV2l0aENhbGxlZD4gPSBbXTtcbiAgICBwcml2YXRlIG9uRnVsZmlsbGVkUmVzdWx0OiBBcnJheTxQcm9taXNlVXRpbHMuT25GdWxmaWxsZWRSZXN1bHQ8YW55Pj4gPSBbXTtcbiAgICBwcml2YXRlIG9uUmVqZWN0ZWRSZXN1bHQ6IEFycmF5PFByb21pc2VVdGlscy5PblJlamVjdGVkUmVzdWx0PGFueT4+ID0gW107XG4gICAgcHJpdmF0ZSB2aXNpdGVkOiBTZXQ8YW55PiA9IG5ldyBTZXQoKTtcblxuICAgIGNvbnN0cnVjdG9yKGNhbGxiYWNrOiBQcm9taXNlVXRpbHMuQ2FsbGJhY2s8VD4pIHtcbiAgICAgICAgY29uc3QgcmVzb2x2ZSA9ICh2YWx1ZT86IFQpID0+IHtcbiAgICAgICAgICAgIE15UHJvbWlzZS5yZXNvbHZlX3Byb21pc2UodGhpcyBhcyBhbnksIHZhbHVlKTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgcmVqZWN0ID0gKHJlYXNvbj86IFQpID0+IHtcbiAgICAgICAgICAgIHRoaXMudG9SZWplY3RlZChyZWFzb24pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjYWxsYmFjayhyZXNvbHZlLCByZWplY3QpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUgPT09IFByb21pc2VVdGlscy5Qcm9taXNlU3RhdGUuUEVORElORykge1xuICAgICAgICAgICAgICAgIHRoaXMudG9SZWplY3RlZChlcnJvciBhcyBUKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZsdXNoX3JlamVjdGVkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHRvUmVzb2x2ZWQodmFsdWU/OiBUKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlICE9PSBQcm9taXNlVXRpbHMuUHJvbWlzZVN0YXRlLlBFTkRJTkcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuY2hhbmdlX3N0YXRlKFByb21pc2VVdGlscy5Qcm9taXNlU3RhdGUuRlVMRklMTEVEKTtcbiAgICAgICAgdGhpcy5mbHVzaF9mdWxmaWxsZWQoKTtcbiAgICB9XG4gICAgcHJpdmF0ZSB0b1JlamVjdGVkKHJlYXNvbj86IGFueSkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZSAhPT0gUHJvbWlzZVV0aWxzLlByb21pc2VTdGF0ZS5QRU5ESU5HKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZWFzb24gPSByZWFzb247XG4gICAgICAgIHRoaXMuY2hhbmdlX3N0YXRlKFByb21pc2VVdGlscy5Qcm9taXNlU3RhdGUuUkVKRUNURUQpO1xuICAgICAgICB0aGlzLmZsdXNoX3JlamVjdGVkKCk7XG4gICAgfVxuICAgIHByaXZhdGUgZmx1c2hfZnVsZmlsbGVkKCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZSAhPT0gUHJvbWlzZVV0aWxzLlByb21pc2VTdGF0ZS5GVUxGSUxMRUQpIHJldHVybjtcbiAgICAgICAgUHJvbWlzZVV0aWxzLnNwYXduKCgpID0+IHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5vbkZ1bGZpbGxlZC5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrID0gdGhpcy5vbkZ1bGZpbGxlZFtpXTtcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2suY2FsbGVkKSByZXR1cm47XG4gICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBpO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZuID0gY2FsbGJhY2suY2I7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHYgPSBmbih0aGlzLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkZ1bGZpbGxlZFJlc3VsdFtpbmRleF0gPSB7IHZhbHVlOiB2LCB0eXBlOiBcInN1Y2Nlc3NcIiB9O1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25GdWxmaWxsZWRSZXN1bHRbaW5kZXhdID0geyB2YWx1ZTogZXJyb3IsIHR5cGU6IFwiZmFpbGRcIiB9O1xuICAgICAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmNhbGxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgcHJpdmF0ZSBmbHVzaF9yZWplY3RlZCgpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgIT09IFByb21pc2VVdGlscy5Qcm9taXNlU3RhdGUuUkVKRUNURUQpIHJldHVybjtcbiAgICAgICAgUHJvbWlzZVV0aWxzLnNwYXduKCgpID0+IHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5vblJlamVjdGVkLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2FsbGJhY2sgPSB0aGlzLm9uUmVqZWN0ZWRbaV07XG4gICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrLmNhbGxlZCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZuID0gY2FsbGJhY2suY2I7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBpO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHYgPSBmbih0aGlzLnJlYXNvbik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25SZWplY3RlZFJlc3VsdFtpbmRleF0gPSB7IHZhbHVlOiB2LCB0eXBlOiBcInN1Y2Nlc3NcIiB9O1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25SZWplY3RlZFJlc3VsdFtpbmRleF0gPSB7IHZhbHVlOiBlcnJvciwgdHlwZTogXCJmYWlsZFwiIH07XG4gICAgICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBwcml2YXRlIGNoYW5nZV9zdGF0ZShuZXdfc3RhdGU6IFByb21pc2VVdGlscy5Qcm9taXNlU3RhdGUpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgIT09IFByb21pc2VVdGlscy5Qcm9taXNlU3RhdGUuUEVORElORylcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlByb21pc2XnirbmgIHkuI3mmK9wZW5kaW5nXCIpO1xuICAgICAgICB0aGlzLnN0YXRlID0gbmV3X3N0YXRlO1xuICAgIH1cblxuICAgIHRoZW4oXG4gICAgICAgIG9uRnVsZmlsbGVkPzogUHJvbWlzZVV0aWxzLlRoZW5PbkZ1bGZpbGxlZDxUPixcbiAgICAgICAgb25SZWplY3RlZD86IFByb21pc2VVdGlscy5UaGVuT25SZWplY3RlZDxhbnk+XG4gICAgKTogTXlQcm9taXNlPHVua25vd24+IHtcbiAgICAgICAgbGV0IHJlczogYW55O1xuICAgICAgICBsZXQgcmVqOiBhbnk7XG4gICAgICAgIGNvbnN0IHByb21pc2U6IE15UHJvbWlzZTx1bmtub3duPiA9IG5ldyBNeVByb21pc2UoKF9yZXMsIF9yZWopID0+IHtcbiAgICAgICAgICAgIHJlcyA9IF9yZXM7XG4gICAgICAgICAgICByZWogPSBfcmVqO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAodHlwZW9mIG9uRnVsZmlsbGVkICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRoaXMub25GdWxmaWxsZWQucHVzaChcbiAgICAgICAgICAgICAgICBQcm9taXNlVXRpbHMubWFrZV9jYWxsYmFjaygoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlcyh0aGlzLnZhbHVlKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIG9uUmVqZWN0ZWQgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhpcy5vblJlamVjdGVkLnB1c2goXG4gICAgICAgICAgICAgICAgUHJvbWlzZVV0aWxzLm1ha2VfY2FsbGJhY2soKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZWoodGhpcy5yZWFzb24pO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvbkZ1bGZpbGxlZCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9XG4gICAgICAgICAgICAgICAgdGhpcy5vbkZ1bGZpbGxlZC5wdXNoKFByb21pc2VVdGlscy5tYWtlX2NhbGxiYWNrKG9uRnVsZmlsbGVkKSkgLSAxO1xuICAgICAgICAgICAgdGhpcy5vbkZ1bGZpbGxlZC5wdXNoKFxuICAgICAgICAgICAgICAgIFByb21pc2VVdGlscy5tYWtlX2NhbGxiYWNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5vbkZ1bGZpbGxlZFJlc3VsdFtpbmRleF07XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQudHlwZSA9PT0gXCJmYWlsZFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWoocmVzdWx0LnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IHJlc3VsdC52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBNeVByb21pc2UucmVzb2x2ZV9wcm9taXNlKHByb21pc2UsIHJlc3VsdC52YWx1ZSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvblJlamVjdGVkID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID1cbiAgICAgICAgICAgICAgICB0aGlzLm9uUmVqZWN0ZWQucHVzaChQcm9taXNlVXRpbHMubWFrZV9jYWxsYmFjayhvblJlamVjdGVkKSkgLSAxO1xuICAgICAgICAgICAgdGhpcy5vblJlamVjdGVkLnB1c2goXG4gICAgICAgICAgICAgICAgUHJvbWlzZVV0aWxzLm1ha2VfY2FsbGJhY2soKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLm9uUmVqZWN0ZWRSZXN1bHRbaW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnR5cGUgPT09IFwiZmFpbGRcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqKHJlc3VsdC52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyByZXN1bHQudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgTXlQcm9taXNlLnJlc29sdmVfcHJvbWlzZShwcm9taXNlLCByZXN1bHQudmFsdWUpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZmx1c2hfZnVsZmlsbGVkKCk7XG4gICAgICAgIHRoaXMuZmx1c2hfcmVqZWN0ZWQoKTtcbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuXG4gICAgc3RhdGljIHJlc29sdmVfcHJvbWlzZShwcm9taXNlOiBNeVByb21pc2U8dW5rbm93bj4sIHg6IGFueSkge1xuICAgICAgICBpZiAocHJvbWlzZS52aXNpdGVkLmhhcyh4KSkge1xuICAgICAgICAgICAgcHJvbWlzZS50b1JlamVjdGVkKG5ldyBUeXBlRXJyb3IoXCJBIHJlY3Vyc2l2ZSBsb29wIG9jY3Vyc1wiKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByb21pc2UgPT09IHgpIHtcbiAgICAgICAgICAgIHByb21pc2UudG9SZWplY3RlZChuZXcgVHlwZUVycm9yKFwiQ2hhaW5pbmcgY3ljbGUgZGV0ZWN0ZWQgZm9yIHByb21pc2VcIikpO1xuICAgICAgICB9IGVsc2UgaWYgKFByb21pc2VVdGlscy5pc19wcm9taXNlKHgpKSB7XG4gICAgICAgICAgICB4LnRoZW4oXG4gICAgICAgICAgICAgICAgcHJvbWlzZS50b1Jlc29sdmVkLmJpbmQocHJvbWlzZSksXG4gICAgICAgICAgICAgICAgcHJvbWlzZS50b1JlamVjdGVkLmJpbmQocHJvbWlzZSlcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSBpZiAoUHJvbWlzZVV0aWxzLmlzX29iaih4KSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXNvbHZlX3Byb21pc2UgPSAodmFsdWU6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzb2x2ZV9wcm9taXNlLmNhbGxlZCB8fCByZWplY3RfcHJvbWlzZS5jYWxsZWQpIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZV9wcm9taXNlLmNhbGxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIE15UHJvbWlzZS5yZXNvbHZlX3Byb21pc2UocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmVzb2x2ZV9wcm9taXNlLmNhbGxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlamVjdF9wcm9taXNlID0gKHJlYXNvbjogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZWplY3RfcHJvbWlzZS5jYWxsZWQgfHwgcmVzb2x2ZV9wcm9taXNlLmNhbGxlZCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICByZWplY3RfcHJvbWlzZS5jYWxsZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBwcm9taXNlLnRvUmVqZWN0ZWQocmVhc29uKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJlamVjdF9wcm9taXNlLmNhbGxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRoZW4gPSBQcm9taXNlVXRpbHMuZ2V0X3RoZW4oeCk7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGVuID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZS52aXNpdGVkLmFkZCh4KTtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4uY2FsbCh4LCByZXNvbHZlX3Byb21pc2UsIHJlamVjdF9wcm9taXNlKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVzb2x2ZV9wcm9taXNlLmNhbGxlZCAmJiAhcmVqZWN0X3Byb21pc2UuY2FsbGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0X3Byb21pc2UoZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZS50b1Jlc29sdmVkKHgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgcHJvbWlzZS50b1JlamVjdGVkKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHByb21pc2UudG9SZXNvbHZlZCh4KTtcbiAgICAgICAgfVxuICAgICAgICBwcm9taXNlLnZpc2l0ZWQuY2xlYXIoKTtcbiAgICB9XG4gICAgc3RhdGljIHJlc29sdmU8VD4odmFsdWU/OiBUKTogTXlQcm9taXNlPFQ+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBNeVByb21pc2UoKHJlcywgcmVqKSA9PiByZXModmFsdWUpKTtcbiAgICB9XG4gICAgc3RhdGljIHJlamVjdDxUPihyZWFzb246IFQpOiBNeVByb21pc2U8VD4ge1xuICAgICAgICByZXR1cm4gbmV3IE15UHJvbWlzZSgocmVzLCByZWopID0+IHJlaihyZWFzb24pKTtcbiAgICB9XG4gICAgc3RhdGljIGRlZmVycmVkPFQ+KCk6IERlZmVycmVkUmVzdWx0PFQ+IHtcbiAgICAgICAgbGV0IHJlczogUHJvbWlzZVV0aWxzLlJlc29sdmVDYWxsYmFjazxhbnk+O1xuICAgICAgICBsZXQgcmVqOiBQcm9taXNlVXRpbHMuUmVqZWN0Q2FsbGJhY2s7XG4gICAgICAgIGNvbnN0IHByb21pc2U6IE15UHJvbWlzZTxUPiA9IG5ldyBNeVByb21pc2UoKF9yZXMsIF9yZWopID0+IHtcbiAgICAgICAgICAgIHJlcyA9IF9yZXM7XG4gICAgICAgICAgICByZWogPSBfcmVqO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHByb21pc2UsXG4gICAgICAgICAgICByZXNvbHZlPFQ+KHZhbHVlPzogVCkge1xuICAgICAgICAgICAgICAgIHJlcyh2YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVqZWN0PFQ+KHJlYXNvbj86IFQpIHtcbiAgICAgICAgICAgICAgICByZWoocmVhc29uKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBNeVByb21pc2U7XG4iXX0=