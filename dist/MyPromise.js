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
            PromiseState["pending"] = "pending";
            PromiseState["fulfilled"] = "fulfilled";
            PromiseState["rejected"] = "rejected";
        })(PromiseState = PromiseUtils.PromiseState || (PromiseUtils.PromiseState = {}));
        var ErrorState;
        (function (ErrorState) {
            ErrorState["NO_ERROR"] = "NO_ERROR";
            ErrorState["RESOLVED"] = "RESOLVED";
            ErrorState["NO_RESOLVED"] = "NO_RESOLVED";
        })(ErrorState = PromiseUtils.ErrorState || (PromiseUtils.ErrorState = {}));
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
                called: false
            };
        }
        PromiseUtils.make_callback = make_callback;
    })(PromiseUtils = exports.PromiseUtils || (exports.PromiseUtils = {}));
    var MyPromise = /** @class */ (function () {
        function MyPromise(callback) {
            var _this = this;
            this.state = PromiseUtils.PromiseState.pending;
            this.value = undefined;
            this.reason = undefined;
            this.onFulfilled = [];
            this.onRejected = [];
            this.onFulfilledResult = [];
            this.onRejectedResult = [];
            this.prev_promise = null;
            var resolve = function (value) {
                // this.toResolved(value);
                MyPromise.resolve_promise(_this, value);
            };
            var reject = function (reason) {
                _this.toRejected(reason);
            };
            try {
                callback(resolve, reject);
            }
            catch (error) {
                if (this.state === PromiseUtils.PromiseState.pending) {
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
                x.then(
                // (y:any)=>MyPromise.resolve_promise(promise,y),
                promise.toResolved.bind(promise), promise.toRejected.bind(promise));
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
                            if ((!resolve_promise_1.called) && (!reject_promise_1.called)) {
                                reject_promise_1(error);
                            }
                        }
                        // if (PromiseUtils.is_thenable(ret)) {
                        //     if (!(resolve_promise.called)) {
                        //         MyPromise.resolve_promise(promise, ret)
                        //     }
                        // }
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
            if (this.state !== PromiseUtils.PromiseState.pending) {
                return;
            }
            this.value = value;
            this.change_state(PromiseUtils.PromiseState.fulfilled);
            this.flush_fulfilled();
        };
        MyPromise.prototype.toRejected = function (reason) {
            if (this.state !== PromiseUtils.PromiseState.pending) {
                return;
            }
            this.reason = reason;
            this.change_state(PromiseUtils.PromiseState.rejected);
            this.flush_rejected();
        };
        MyPromise.prototype.flush_fulfilled = function () {
            var _this = this;
            if (this.state !== PromiseUtils.PromiseState.fulfilled)
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
            if (this.state !== PromiseUtils.PromiseState.rejected)
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
        MyPromise.prototype.set_prev = function (promise) {
            this.prev_promise = promise;
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
            if (this.state !== PromiseUtils.PromiseState.pending)
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTXlQcm9taXNlLmpzIiwic291cmNlUm9vdCI6Ii4vc3JjLyIsInNvdXJjZXMiOlsiTXlQcm9taXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztJQU1BLElBQWlCLFlBQVksQ0ErRTVCO0lBL0VELFdBQWlCLFlBQVk7UUFDekIsSUFBWSxZQUlYO1FBSkQsV0FBWSxZQUFZO1lBQ3BCLG1DQUFtQixDQUFBO1lBQ25CLHVDQUF1QixDQUFBO1lBQ3ZCLHFDQUFxQixDQUFBO1FBQ3pCLENBQUMsRUFKVyxZQUFZLEdBQVoseUJBQVksS0FBWix5QkFBWSxRQUl2QjtRQUNELElBQVksVUFJWDtRQUpELFdBQVksVUFBVTtZQUNsQixtQ0FBcUIsQ0FBQTtZQUNyQixtQ0FBcUIsQ0FBQTtZQUNyQix5Q0FBMkIsQ0FBQTtRQUMvQixDQUFDLEVBSlcsVUFBVSxHQUFWLHVCQUFVLEtBQVYsdUJBQVUsUUFJckI7UUFpQkQsU0FBZ0IsS0FBSyxDQUFDLElBQWM7WUFDaEMsSUFBSSxLQUFLLEdBQTBCLFVBQVUsQ0FBQztnQkFDMUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1AsSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFO29CQUNoQixZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ3BCLEtBQUssR0FBRyxJQUFJLENBQUM7aUJBQ2hCO1lBQ0wsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ1YsQ0FBQztRQVJlLGtCQUFLLFFBUXBCLENBQUE7UUFFRCxTQUFnQixVQUFVLENBQUMsTUFBVztZQUNsQyxPQUFPLE1BQU0sWUFBWSxTQUFTLENBQUM7UUFDdkMsQ0FBQztRQUZlLHVCQUFVLGFBRXpCLENBQUE7UUFDRCxTQUFnQixNQUFNLENBQUMsTUFBVztZQUM5QixPQUFPLENBQ0gsQ0FBQyxPQUFPLE1BQU0sS0FBSyxRQUFRLElBQUksT0FBTyxNQUFNLEtBQUssVUFBVSxDQUFDO2dCQUM1RCxNQUFNLEtBQUssSUFBSSxDQUNsQixDQUFDO1FBQ04sQ0FBQztRQUxl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QUFDLFVBQUMsSUFBSSxFQUFFLElBQUk7Z0JBQ25ELEdBQUcsR0FBRyxJQUFJLENBQUM7Z0JBQ1gsR0FBRyxHQUFHLElBQUksQ0FBQztZQUNmLENBQUMsQ0FBQyxDQUFDO1lBQ0gsT0FBTztnQkFDSCxPQUFPLFNBQUE7Z0JBQ1AsT0FBTyxZQUFJLEtBQVM7b0JBQ2hCLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDZixDQUFDO2dCQUNELE1BQU0sWUFBSSxNQUFVO29CQUNoQixHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ2hCLENBQUM7YUFDSixDQUFDO1FBQ04sQ0FBQztRQTFMTSx3QkFBYyxHQUFHLEtBQUssQUFBUixDQUFRO1FBQ3RCLHVCQUFhLEdBQUcsS0FBSyxBQUFSLENBQVE7UUEwTGhDLGdCQUFDO0tBQUEsQUF2TkQsSUF1TkM7SUFFRCxrQkFBZSxTQUFTLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgaW50ZXJmYWNlIERlZmVycmVkUmVzdWx0PFZhbHVlPiB7XG4gICAgcHJvbWlzZTogTXlQcm9taXNlPFZhbHVlPjtcbiAgICByZXNvbHZlPFQ+KHZhbHVlOiBUKTogdm9pZDtcbiAgICByZWplY3Q8VD4odmFsdWU6IFQpOiB2b2lkO1xufVxuXG5leHBvcnQgbmFtZXNwYWNlIFByb21pc2VVdGlscyB7XG4gICAgZXhwb3J0IGVudW0gUHJvbWlzZVN0YXRlIHtcbiAgICAgICAgcGVuZGluZyA9IFwicGVuZGluZ1wiLFxuICAgICAgICBmdWxmaWxsZWQgPSBcImZ1bGZpbGxlZFwiLFxuICAgICAgICByZWplY3RlZCA9IFwicmVqZWN0ZWRcIixcbiAgICB9XG4gICAgZXhwb3J0IGVudW0gRXJyb3JTdGF0ZSB7XG4gICAgICAgIE5PX0VSUk9SID0gXCJOT19FUlJPUlwiLFxuICAgICAgICBSRVNPTFZFRCA9IFwiUkVTT0xWRURcIixcbiAgICAgICAgTk9fUkVTT0xWRUQgPSBcIk5PX1JFU09MVkVEXCIsXG4gICAgfVxuICAgIGV4cG9ydCB0eXBlIENhbGxiYWNrPFQ+ID0gKFxuICAgICAgICByZXNvbHZlOiBSZXNvbHZlQ2FsbGJhY2s8VD4sXG4gICAgICAgIHJlamVjdDogUmVqZWN0Q2FsbGJhY2tcbiAgICApID0+IHZvaWQ7XG4gICAgZXhwb3J0IHR5cGUgUmVzb2x2ZUNhbGxiYWNrPFQ+ID0gKHZhbHVlPzogVCkgPT4gdm9pZDtcbiAgICBleHBvcnQgdHlwZSBSZWplY3RDYWxsYmFjayA9IChyZWFzb24/OiBhbnkpID0+IHZvaWQ7XG4gICAgZXhwb3J0IHR5cGUgVGhlbkNhbGxiYWNrPEFyZywgUmV0dXJuVmFsdWU+ID0gKHZhbHVlOiBBcmcpID0+IFJldHVyblZhbHVlO1xuICAgIGV4cG9ydCB0eXBlIFRoZW5PbkZ1bGZpbGxlZDxUPiA9ICh2YWx1ZT86IFQpID0+IGFueTtcbiAgICBleHBvcnQgdHlwZSBUaGVuT25SZWplY3RlZDxUPiA9ICh2YWx1ZT86IFQpID0+IGFueTtcblxuICAgIGV4cG9ydCB0eXBlIE9uRnVsZmlsbGVkUmVzdWx0PFQ+ID0ge1xuICAgICAgICB0eXBlOiBcInN1Y2Nlc3NcIiB8IFwiZmFpbGRcIjtcbiAgICAgICAgdmFsdWU6IFQ7XG4gICAgfTtcbiAgICBleHBvcnQgdHlwZSBPblJlamVjdGVkUmVzdWx0PFQ+ID0gT25GdWxmaWxsZWRSZXN1bHQ8VD47XG5cbiAgICBleHBvcnQgZnVuY3Rpb24gc3Bhd24odGFzazogRnVuY3Rpb24pIHtcbiAgICAgICAgbGV0IHRpbWVyOiBOb2RlSlMuVGltZW91dCB8IG51bGwgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHRhc2soKTtcbiAgICAgICAgICAgIGlmICh0aW1lciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICAgICAgICAgICAgdGltZXIgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCAwKTtcbiAgICB9XG5cbiAgICBleHBvcnQgZnVuY3Rpb24gaXNfcHJvbWlzZSh0YXJnZXQ6IGFueSk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGFyZ2V0IGluc3RhbmNlb2YgTXlQcm9taXNlO1xuICAgIH1cbiAgICBleHBvcnQgZnVuY3Rpb24gaXNfb2JqKHRhcmdldDogYW55KTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAodHlwZW9mIHRhcmdldCA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgdGFyZ2V0ID09PSBcImZ1bmN0aW9uXCIpICYmXG4gICAgICAgICAgICB0YXJnZXQgIT09IG51bGxcbiAgICAgICAgKTtcbiAgICB9XG4gICAgZXhwb3J0IGZ1bmN0aW9uIGlzX3RoZW5hYmxlKHRhcmdldDogYW55KSB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAodHlwZW9mIHRhcmdldCA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgdGFyZ2V0ID09PSBcImZ1bmN0aW9uXCIpICYmXG4gICAgICAgICAgICB0eXBlb2YgdGFyZ2V0LnRoZW4gPT09IFwiZnVuY3Rpb25cIlxuICAgICAgICApO1xuICAgIH1cbiAgICBleHBvcnQgZnVuY3Rpb24gZ2V0X3RoZW4odGFyZ2V0OiBhbnkpOiBhbnkge1xuICAgICAgICByZXR1cm4gdGFyZ2V0LnRoZW47XG4gICAgfVxuXG4gICAgZXhwb3J0IGZ1bmN0aW9uIGdldF9maW5hbGx5X3RoZW4odGhlbmFibGU6IGFueSwgcmVzOiBhbnksIHJlajogYW55KSB7XG4gICAgICAgIGxldCB0aGVuO1xuICAgICAgICB3aGlsZSAoaXNfb2JqKHRoZW5hYmxlKSkge1xuICAgICAgICAgICAgaWYgKHRoZW5hYmxlLnRoZW4gPT09IHVuZGVmaW5lZCkgYnJlYWs7XG4gICAgICAgICAgICB0aGVuID0gdGhlbmFibGUudGhlbjtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhlbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgdGhlbmFibGUgPSB0aGVuLmNhbGwodGhlbmFibGUsIHJlcywgcmVqKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoZW47XG4gICAgfVxuICAgIGV4cG9ydCB0eXBlIENhbGxiYWNrV2l0aENhbGxlZCA9IHtcbiAgICAgICAgY2I6IEZ1bmN0aW9uLFxuICAgICAgICBjYWxsZWQ6IGJvb2xlYW5cbiAgICB9XG4gICAgZXhwb3J0IGZ1bmN0aW9uIG1ha2VfY2FsbGJhY2soY2I6IEZ1bmN0aW9uKTogQ2FsbGJhY2tXaXRoQ2FsbGVkIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNiOiBjYixcbiAgICAgICAgICAgIGNhbGxlZDogZmFsc2VcbiAgICAgICAgfVxuICAgIH1cbn1cblxuY2xhc3MgTXlQcm9taXNlPFQ+IHtcbiAgICBzdGF0ZTogUHJvbWlzZVV0aWxzLlByb21pc2VTdGF0ZSA9IFByb21pc2VVdGlscy5Qcm9taXNlU3RhdGUucGVuZGluZztcbiAgICB2YWx1ZTogVCB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICByZWFzb246IGFueSA9IHVuZGVmaW5lZDtcbiAgICBvbkZ1bGZpbGxlZDogQXJyYXk8UHJvbWlzZVV0aWxzLkNhbGxiYWNrV2l0aENhbGxlZD4gPSBbXTtcbiAgICBvblJlamVjdGVkOiBBcnJheTxQcm9taXNlVXRpbHMuQ2FsbGJhY2tXaXRoQ2FsbGVkPiA9IFtdO1xuICAgIG9uRnVsZmlsbGVkUmVzdWx0OiBBcnJheTxQcm9taXNlVXRpbHMuT25GdWxmaWxsZWRSZXN1bHQ8YW55Pj4gPSBbXTtcbiAgICBvblJlamVjdGVkUmVzdWx0OiBBcnJheTxQcm9taXNlVXRpbHMuT25SZWplY3RlZFJlc3VsdDxhbnk+PiA9IFtdO1xuICAgIHByZXZfcHJvbWlzZTogTXlQcm9taXNlPGFueT4gfCBudWxsID0gbnVsbDtcblxuICAgIGNvbnN0cnVjdG9yKGNhbGxiYWNrOiBQcm9taXNlVXRpbHMuQ2FsbGJhY2s8VD4pIHtcbiAgICAgICAgY29uc3QgcmVzb2x2ZSA9ICh2YWx1ZT86IFQpID0+IHtcbiAgICAgICAgICAgIC8vIHRoaXMudG9SZXNvbHZlZCh2YWx1ZSk7XG4gICAgICAgICAgICBNeVByb21pc2UucmVzb2x2ZV9wcm9taXNlKHRoaXMgYXMgYW55LCB2YWx1ZSlcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgcmVqZWN0ID0gKHJlYXNvbj86IFQpID0+IHtcbiAgICAgICAgICAgIHRoaXMudG9SZWplY3RlZChyZWFzb24pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjYWxsYmFjayhyZXNvbHZlLCByZWplY3QpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUgPT09IFByb21pc2VVdGlscy5Qcm9taXNlU3RhdGUucGVuZGluZykge1xuICAgICAgICAgICAgICAgIHRoaXMudG9SZWplY3RlZChlcnJvciBhcyBUKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZsdXNoX3JlamVjdGVkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgc3RhdGljIHJlc29sdmVfY2FsbGVkID0gZmFsc2VcbiAgICBzdGF0aWMgcmVqZWN0X2NhbGxlZCA9IGZhbHNlXG4gICAgc3RhdGljIHJlc29sdmVfcHJvbWlzZShwcm9taXNlOiBNeVByb21pc2U8dW5rbm93bj4sIHg6IGFueSkge1xuICAgICAgICBpZiAocHJvbWlzZSA9PT0geCkge1xuICAgICAgICAgICAgcHJvbWlzZS50b1JlamVjdGVkKG5ldyBUeXBlRXJyb3IoXCJDaGFpbmluZyBjeWNsZSBkZXRlY3RlZCBmb3IgcHJvbWlzZVwiKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoUHJvbWlzZVV0aWxzLmlzX3Byb21pc2UoeCkpIHtcbiAgICAgICAgICAgIHgudGhlbihcbiAgICAgICAgICAgICAgICAvLyAoeTphbnkpPT5NeVByb21pc2UucmVzb2x2ZV9wcm9taXNlKHByb21pc2UseSksXG4gICAgICAgICAgICAgICAgcHJvbWlzZS50b1Jlc29sdmVkLmJpbmQocHJvbWlzZSksXG4gICAgICAgICAgICAgICAgcHJvbWlzZS50b1JlamVjdGVkLmJpbmQocHJvbWlzZSlcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSBpZiAoUHJvbWlzZVV0aWxzLmlzX29iaih4KSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXNvbHZlX3Byb21pc2UgPSAodmFsdWU6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZihyZXNvbHZlX3Byb21pc2UuY2FsbGVkIHx8IHJlamVjdF9wcm9taXNlLmNhbGxlZCkgcmV0dXJuXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmVfcHJvbWlzZS5jYWxsZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIE15UHJvbWlzZS5yZXNvbHZlX3Byb21pc2UocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmVzb2x2ZV9wcm9taXNlLmNhbGxlZCA9IGZhbHNlXG4gICAgICAgICAgICAgICAgY29uc3QgcmVqZWN0X3Byb21pc2UgPSAocmVhc29uOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYocmVqZWN0X3Byb21pc2UuY2FsbGVkIHx8IHJlc29sdmVfcHJvbWlzZS5jYWxsZWQpIHJldHVyblxuICAgICAgICAgICAgICAgICAgICByZWplY3RfcHJvbWlzZS5jYWxsZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIHByb21pc2UudG9SZWplY3RlZChyZWFzb24pO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmVqZWN0X3Byb21pc2UuY2FsbGVkID0gZmFsc2VcbiAgICAgICAgICAgICAgICBjb25zdCB0aGVuID0gUHJvbWlzZVV0aWxzLmdldF90aGVuKHgpO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGhlbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGVuLmNhbGwoeCwgcmVzb2x2ZV9wcm9taXNlLCByZWplY3RfcHJvbWlzZSk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZigoIXJlc29sdmVfcHJvbWlzZS5jYWxsZWQgKSYmICghcmVqZWN0X3Byb21pc2UuY2FsbGVkKSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0X3Byb21pc2UoZXJyb3IpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgKFByb21pc2VVdGlscy5pc190aGVuYWJsZShyZXQpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICBpZiAoIShyZXNvbHZlX3Byb21pc2UuY2FsbGVkKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIE15UHJvbWlzZS5yZXNvbHZlX3Byb21pc2UocHJvbWlzZSwgcmV0KVxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZS50b1Jlc29sdmVkKHgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgcHJvbWlzZS50b1JlamVjdGVkKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHByb21pc2UudG9SZXNvbHZlZCh4KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgdG9SZXNvbHZlZCh2YWx1ZT86IFQpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgIT09IFByb21pc2VVdGlscy5Qcm9taXNlU3RhdGUucGVuZGluZykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5jaGFuZ2Vfc3RhdGUoUHJvbWlzZVV0aWxzLlByb21pc2VTdGF0ZS5mdWxmaWxsZWQpO1xuICAgICAgICB0aGlzLmZsdXNoX2Z1bGZpbGxlZCgpO1xuICAgIH1cbiAgICBwcml2YXRlIHRvUmVqZWN0ZWQocmVhc29uPzogYW55KSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlICE9PSBQcm9taXNlVXRpbHMuUHJvbWlzZVN0YXRlLnBlbmRpbmcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJlYXNvbiA9IHJlYXNvbjtcbiAgICAgICAgdGhpcy5jaGFuZ2Vfc3RhdGUoUHJvbWlzZVV0aWxzLlByb21pc2VTdGF0ZS5yZWplY3RlZCk7XG4gICAgICAgIHRoaXMuZmx1c2hfcmVqZWN0ZWQoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGZsdXNoX2Z1bGZpbGxlZCgpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgIT09IFByb21pc2VVdGlscy5Qcm9taXNlU3RhdGUuZnVsZmlsbGVkKSByZXR1cm47XG4gICAgICAgIFByb21pc2VVdGlscy5zcGF3bigoKSA9PiB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMub25GdWxmaWxsZWQubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjYWxsYmFjayA9IHRoaXMub25GdWxmaWxsZWRbaV07XG4gICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrLmNhbGxlZCkgcmV0dXJuXG4gICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBpO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZuID0gY2FsbGJhY2suY2JcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdiA9IGZuKHRoaXMudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uRnVsZmlsbGVkUmVzdWx0W2luZGV4XSA9IHsgdmFsdWU6IHYsIHR5cGU6IFwic3VjY2Vzc1wiIH07XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkZ1bGZpbGxlZFJlc3VsdFtpbmRleF0gPSB7IHZhbHVlOiBlcnJvciwgdHlwZTogXCJmYWlsZFwiIH07XG4gICAgICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbGVkID0gdHJ1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHByaXZhdGUgZmx1c2hfcmVqZWN0ZWQoKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlICE9PSBQcm9taXNlVXRpbHMuUHJvbWlzZVN0YXRlLnJlamVjdGVkKSByZXR1cm47XG4gICAgICAgIFByb21pc2VVdGlscy5zcGF3bigoKSA9PiB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMub25SZWplY3RlZC5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrID0gdGhpcy5vblJlamVjdGVkW2ldO1xuICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjay5jYWxsZWQpIHJldHVyblxuICAgICAgICAgICAgICAgIGNvbnN0IGZuID0gY2FsbGJhY2suY2JcbiAgICAgICAgICAgICAgICBjb25zdCBpbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdiA9IGZuKHRoaXMucmVhc29uKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vblJlamVjdGVkUmVzdWx0W2luZGV4XSA9IHsgdmFsdWU6IHYsIHR5cGU6IFwic3VjY2Vzc1wiIH07XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vblJlamVjdGVkUmVzdWx0W2luZGV4XSA9IHsgdmFsdWU6IGVycm9yLCB0eXBlOiBcImZhaWxkXCIgfTtcbiAgICAgICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5jYWxsZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgcHJpdmF0ZSBzZXRfcHJldihwcm9taXNlOiBNeVByb21pc2U8YW55Pikge1xuICAgICAgICB0aGlzLnByZXZfcHJvbWlzZSA9IHByb21pc2U7XG4gICAgfVxuXG4gICAgdGhlbihcbiAgICAgICAgb25GdWxmaWxsZWQ/OiBQcm9taXNlVXRpbHMuVGhlbk9uRnVsZmlsbGVkPFQ+LFxuICAgICAgICBvblJlamVjdGVkPzogUHJvbWlzZVV0aWxzLlRoZW5PblJlamVjdGVkPGFueT5cbiAgICApOiBNeVByb21pc2U8dW5rbm93bj4ge1xuICAgICAgICBsZXQgcmVzOiBhbnk7XG4gICAgICAgIGxldCByZWo6IGFueTtcbiAgICAgICAgY29uc3QgcHJvbWlzZTogTXlQcm9taXNlPHVua25vd24+ID0gbmV3IE15UHJvbWlzZSgoX3JlcywgX3JlaikgPT4ge1xuICAgICAgICAgICAgcmVzID0gX3JlcztcbiAgICAgICAgICAgIHJlaiA9IF9yZWo7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICh0eXBlb2Ygb25GdWxmaWxsZWQgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhpcy5vbkZ1bGZpbGxlZC5wdXNoKFByb21pc2VVdGlscy5tYWtlX2NhbGxiYWNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICByZXModGhpcy52YWx1ZSk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvblJlamVjdGVkICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRoaXMub25SZWplY3RlZC5wdXNoKFByb21pc2VVdGlscy5tYWtlX2NhbGxiYWNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICByZWoodGhpcy5yZWFzb24pO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvbkZ1bGZpbGxlZCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMub25GdWxmaWxsZWQucHVzaChQcm9taXNlVXRpbHMubWFrZV9jYWxsYmFjayhvbkZ1bGZpbGxlZCkpIC0gMTtcbiAgICAgICAgICAgIHRoaXMub25GdWxmaWxsZWQucHVzaChQcm9taXNlVXRpbHMubWFrZV9jYWxsYmFjaygoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5vbkZ1bGZpbGxlZFJlc3VsdFtpbmRleF07XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC50eXBlID09PSBcImZhaWxkXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqKHJlc3VsdC52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IHJlc3VsdC52YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgTXlQcm9taXNlLnJlc29sdmVfcHJvbWlzZShwcm9taXNlLCByZXN1bHQudmFsdWUpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygb25SZWplY3RlZCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMub25SZWplY3RlZC5wdXNoKFByb21pc2VVdGlscy5tYWtlX2NhbGxiYWNrKG9uUmVqZWN0ZWQpKSAtIDE7XG4gICAgICAgICAgICB0aGlzLm9uUmVqZWN0ZWQucHVzaChQcm9taXNlVXRpbHMubWFrZV9jYWxsYmFjaygoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5vblJlamVjdGVkUmVzdWx0W2luZGV4XTtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnR5cGUgPT09IFwiZmFpbGRcIikge1xuICAgICAgICAgICAgICAgICAgICByZWoocmVzdWx0LnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgcmVzdWx0LnZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBNeVByb21pc2UucmVzb2x2ZV9wcm9taXNlKHByb21pc2UsIHJlc3VsdC52YWx1ZSk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5mbHVzaF9mdWxmaWxsZWQoKVxuICAgICAgICB0aGlzLmZsdXNoX3JlamVjdGVkKClcbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjaGFuZ2Vfc3RhdGUobmV3X3N0YXRlOiBQcm9taXNlVXRpbHMuUHJvbWlzZVN0YXRlKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlICE9PSBQcm9taXNlVXRpbHMuUHJvbWlzZVN0YXRlLnBlbmRpbmcpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQcm9taXNl54q25oCB5LiN5pivcGVuZGluZ1wiKTtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IG5ld19zdGF0ZTtcbiAgICB9XG5cbiAgICBzdGF0aWMgcmVzb2x2ZTxUPih2YWx1ZT86IFQpOiBNeVByb21pc2U8VD4ge1xuICAgICAgICByZXR1cm4gbmV3IE15UHJvbWlzZSgocmVzLCByZWopID0+IHJlcyh2YWx1ZSkpO1xuICAgIH1cbiAgICBzdGF0aWMgcmVqZWN0PFQ+KHJlYXNvbjogVCk6IE15UHJvbWlzZTxUPiB7XG4gICAgICAgIHJldHVybiBuZXcgTXlQcm9taXNlKChyZXMsIHJlaikgPT4gcmVqKHJlYXNvbikpO1xuICAgIH1cbiAgICBzdGF0aWMgZGVmZXJyZWQ8VD4oKTogRGVmZXJyZWRSZXN1bHQ8VD4ge1xuICAgICAgICBsZXQgcmVzOiBQcm9taXNlVXRpbHMuUmVzb2x2ZUNhbGxiYWNrPGFueT47XG4gICAgICAgIGxldCByZWo6IFByb21pc2VVdGlscy5SZWplY3RDYWxsYmFjaztcbiAgICAgICAgY29uc3QgcHJvbWlzZTogTXlQcm9taXNlPFQ+ID0gbmV3IE15UHJvbWlzZSgoX3JlcywgX3JlaikgPT4ge1xuICAgICAgICAgICAgcmVzID0gX3JlcztcbiAgICAgICAgICAgIHJlaiA9IF9yZWo7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcHJvbWlzZSxcbiAgICAgICAgICAgIHJlc29sdmU8VD4odmFsdWU/OiBUKSB7XG4gICAgICAgICAgICAgICAgcmVzKHZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWplY3Q8VD4ocmVhc29uPzogVCkge1xuICAgICAgICAgICAgICAgIHJlaihyZWFzb24pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IE15UHJvbWlzZTtcbiJdfQ==