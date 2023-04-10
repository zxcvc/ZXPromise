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
        function is_thenable(target) {
            return ((typeof target === 'object' || typeof target === 'function') && typeof target.then === 'function');
        }
        PromiseUtils.is_thenable = is_thenable;
        function get_then(target) {
            return target.then;
        }
        PromiseUtils.get_then = get_then;
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
                _this.toResolved(value);
                _this.flush_fulfilled();
            };
            var reject = function (reason) {
                _this.toRejected(reason);
                _this.flush_rejected();
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
        MyPromise.prototype.toResolved = function (value) {
            if (this.state !== PromiseUtils.PromiseState.pending) {
                return;
            }
            this.value = value;
            this.change_state(PromiseUtils.PromiseState.fulfilled);
        };
        MyPromise.prototype.toRejected = function (reason) {
            if (this.state !== PromiseUtils.PromiseState.pending) {
                return;
            }
            this.reason = reason;
            this.change_state(PromiseUtils.PromiseState.rejected);
        };
        MyPromise.prototype.flush = function () {
            this.flush_fulfilled();
            this.flush_rejected();
        };
        MyPromise.prototype.flush_fulfilled = function () {
            var _this = this;
            PromiseUtils.spawn(function () {
                for (var i = 0; i < _this.onFulfilled.length; ++i) {
                    var fn = _this.onFulfilled[i];
                    var index = i;
                    try {
                        var v = fn(_this.value);
                        _this.onFulfilledResult[index] = { value: v, type: "success" };
                    }
                    catch (error) {
                        _this.onFulfilledResult[index] = { value: error, type: "faild" };
                    }
                }
            });
        };
        MyPromise.prototype.flush_rejected = function () {
            var _this = this;
            PromiseUtils.spawn(function () {
                for (var i = 0; i < _this.onRejected.length; ++i) {
                    var fn = _this.onRejected[i];
                    var index = i;
                    try {
                        var v = fn(_this.reason);
                        _this.onRejectedResult[index] = { value: v, type: "success" };
                    }
                    catch (error) {
                        _this.onRejectedResult[index] = { value: error, type: "faild" };
                    }
                }
            });
        };
        MyPromise.prototype.set_prev = function (promise) {
            this.prev_promise = promise;
        };
        MyPromise.prototype.then = function (onFulfilled, onRejected) {
            var _this = this;
            var promise = new MyPromise(function (res, rej) {
                if (typeof onFulfilled !== "function") {
                    _this.onFulfilled.push(function () {
                        res(_this.value);
                    });
                }
                if (typeof onRejected !== "function") {
                    _this.onRejected.push(function () {
                        rej(_this.reason);
                    });
                }
                if (typeof onFulfilled === "function") {
                    var index_1 = _this.onFulfilled.push(onFulfilled) - 1;
                    _this.onFulfilled.push(function () {
                        var result = _this.onFulfilledResult[index_1];
                        if (result.value === promise) {
                            rej(new TypeError('Chaining cycle detected for promise'));
                        }
                        else {
                            if (result.type === "faild") {
                                rej(result.value);
                                throw result.value;
                            }
                            else if (PromiseUtils.is_promise(result.value)) {
                                result.value.then(res, rej);
                            }
                            else {
                                try {
                                    var then = PromiseUtils.get_then(result.value);
                                    if (typeof then === 'function') {
                                        then.call(result.value, res, rej);
                                    }
                                    else {
                                        res(result.value);
                                    }
                                }
                                catch (error) {
                                    rej(error);
                                }
                            }
                        }
                    });
                }
                if (typeof onRejected === "function") {
                    var index_2 = _this.onRejected.push(onRejected) - 1;
                    _this.onRejected.push(function () {
                        var result = _this.onRejectedResult[index_2];
                        if (result.value === promise) {
                            rej(new TypeError('Chaining cycle detected for promise'));
                        }
                        else {
                            if (result.type === "faild") {
                                rej(result.value);
                                throw result.value;
                            }
                            else if (PromiseUtils.is_promise(result.value)) {
                                result.value.then(res, rej);
                            }
                            else {
                                try {
                                    var then = PromiseUtils.get_then(result.value);
                                    if (typeof then === 'function') {
                                        then.call(result.value, res, rej);
                                    }
                                    else {
                                        res(result.value);
                                    }
                                }
                                catch (error) {
                                    rej(error);
                                }
                            }
                        }
                    });
                }
            });
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
        return MyPromise;
    }());
    exports.default = MyPromise;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTXlQcm9taXNlLmpzIiwic291cmNlUm9vdCI6Ii4vc3JjLyIsInNvdXJjZXMiOlsiTXlQcm9taXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztJQU1BLElBQWlCLFlBQVksQ0FpRDVCO0lBakRELFdBQWlCLFlBQVk7UUFDekIsSUFBWSxZQUlYO1FBSkQsV0FBWSxZQUFZO1lBQ3BCLG1DQUFtQixDQUFBO1lBQ25CLHVDQUF1QixDQUFBO1lBQ3ZCLHFDQUFxQixDQUFBO1FBQ3pCLENBQUMsRUFKVyxZQUFZLEdBQVoseUJBQVksS0FBWix5QkFBWSxRQUl2QjtRQUNELElBQVksVUFJWDtRQUpELFdBQVksVUFBVTtZQUNsQixtQ0FBcUIsQ0FBQTtZQUNyQixtQ0FBcUIsQ0FBQTtZQUNyQix5Q0FBMkIsQ0FBQTtRQUMvQixDQUFDLEVBSlcsVUFBVSxHQUFWLHVCQUFVLEtBQVYsdUJBQVUsUUFJckI7UUFpQkQsU0FBZ0IsS0FBSyxDQUFDLElBQWM7WUFDaEMsSUFBSSxLQUFLLEdBQTBCLFVBQVUsQ0FBQztnQkFDMUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1AsSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFO29CQUNoQixZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ3BCLEtBQUssR0FBRyxJQUFJLENBQUM7aUJBQ2hCO1lBQ0wsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ1YsQ0FBQztRQVJlLGtCQUFLLFFBUXBCLENBQUE7UUFFRCxTQUFnQixVQUFVLENBQUMsTUFBVztZQUNsQyxPQUFPLE1BQU0sWUFBWSxTQUFTLENBQUE7UUFDdEMsQ0FBQztRQUZlLHVCQUFVLGFBRXpCLENBQUE7UUFFRCxTQUFnQixXQUFXLENBQUMsTUFBVztZQUNuQyxPQUFPLENBQUMsQ0FBQyxPQUFPLE1BQU0sS0FBSyxRQUFRLElBQUksT0FBTyxNQUFNLEtBQUssVUFBVSxDQUFDLElBQUksT0FBTyxNQUFNLENBQUMsSUFBSSxLQUFLLFVBQVUsQ0FBQyxDQUFBO1FB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O1lBQzNDLElBQUksR0FBZ0MsQ0FBQztZQUNyQyxJQUFNLE9BQU8sR0FBaUIsSUFBSSxTQUFTLENBQUMsVUFBQyxJQUFJLEVBQUUsSUFBSTtnQkFDbkQsR0FBRyxHQUFHLElBQUksQ0FBQztnQkFDWCxHQUFHLEdBQUcsSUFBSSxDQUFDO1lBQ2YsQ0FBQyxDQUFDLENBQUM7WUFDSCxPQUFPO2dCQUNILE9BQU8sU0FBQTtnQkFDUCxPQUFPLFlBQUksS0FBUztvQkFDaEIsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNmLENBQUM7Z0JBQ0QsTUFBTSxZQUFJLE1BQVU7b0JBQ2hCLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDaEIsQ0FBQzthQUNKLENBQUM7UUFDTixDQUFDO1FBQ0wsZ0JBQUM7SUFBRCxDQUFDLEFBL0xELElBK0xDO0lBRUQsa0JBQWUsU0FBUyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGludGVyZmFjZSBEZWZlcnJlZFJlc3VsdDxWYWx1ZT4ge1xuICAgIHByb21pc2U6IE15UHJvbWlzZTxWYWx1ZT47XG4gICAgcmVzb2x2ZTxUPih2YWx1ZTogVCk6IHZvaWQ7XG4gICAgcmVqZWN0PFQ+KHZhbHVlOiBUKTogdm9pZDtcbn1cblxuZXhwb3J0IG5hbWVzcGFjZSBQcm9taXNlVXRpbHMge1xuICAgIGV4cG9ydCBlbnVtIFByb21pc2VTdGF0ZSB7XG4gICAgICAgIHBlbmRpbmcgPSBcInBlbmRpbmdcIixcbiAgICAgICAgZnVsZmlsbGVkID0gXCJmdWxmaWxsZWRcIixcbiAgICAgICAgcmVqZWN0ZWQgPSBcInJlamVjdGVkXCIsXG4gICAgfVxuICAgIGV4cG9ydCBlbnVtIEVycm9yU3RhdGUge1xuICAgICAgICBOT19FUlJPUiA9IFwiTk9fRVJST1JcIixcbiAgICAgICAgUkVTT0xWRUQgPSBcIlJFU09MVkVEXCIsXG4gICAgICAgIE5PX1JFU09MVkVEID0gXCJOT19SRVNPTFZFRFwiLFxuICAgIH1cbiAgICBleHBvcnQgdHlwZSBDYWxsYmFjazxUPiA9IChcbiAgICAgICAgcmVzb2x2ZTogUmVzb2x2ZUNhbGxiYWNrPFQ+LFxuICAgICAgICByZWplY3Q6IFJlamVjdENhbGxiYWNrXG4gICAgKSA9PiB2b2lkO1xuICAgIGV4cG9ydCB0eXBlIFJlc29sdmVDYWxsYmFjazxUPiA9ICh2YWx1ZT86IFQpID0+IHZvaWQ7XG4gICAgZXhwb3J0IHR5cGUgUmVqZWN0Q2FsbGJhY2sgPSAocmVhc29uPzogYW55KSA9PiB2b2lkO1xuICAgIGV4cG9ydCB0eXBlIFRoZW5DYWxsYmFjazxBcmcsIFJldHVyblZhbHVlPiA9ICh2YWx1ZTogQXJnKSA9PiBSZXR1cm5WYWx1ZTtcbiAgICBleHBvcnQgdHlwZSBUaGVuT25GdWxmaWxsZWQ8VD4gPSAodmFsdWU/OiBUKSA9PiBhbnk7XG4gICAgZXhwb3J0IHR5cGUgVGhlbk9uUmVqZWN0ZWQ8VD4gPSAodmFsdWU/OiBUKSA9PiBhbnk7XG5cbiAgICBleHBvcnQgdHlwZSBPbkZ1bGZpbGxlZFJlc3VsdDxUPiA9IHtcbiAgICAgICAgdHlwZTogXCJzdWNjZXNzXCIgfCBcImZhaWxkXCI7XG4gICAgICAgIHZhbHVlOiBUO1xuICAgIH07XG4gICAgZXhwb3J0IHR5cGUgT25SZWplY3RlZFJlc3VsdDxUPiA9IE9uRnVsZmlsbGVkUmVzdWx0PFQ+O1xuXG4gICAgZXhwb3J0IGZ1bmN0aW9uIHNwYXduKHRhc2s6IEZ1bmN0aW9uKSB7XG4gICAgICAgIGxldCB0aW1lcjogTm9kZUpTLlRpbWVvdXQgfCBudWxsID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICB0YXNrKCk7XG4gICAgICAgICAgICBpZiAodGltZXIgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICAgICAgICAgIHRpbWVyID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMCk7XG4gICAgfVxuXG4gICAgZXhwb3J0IGZ1bmN0aW9uIGlzX3Byb21pc2UodGFyZ2V0OiBhbnkpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRhcmdldCBpbnN0YW5jZW9mIE15UHJvbWlzZVxuICAgIH1cblxuICAgIGV4cG9ydCBmdW5jdGlvbiBpc190aGVuYWJsZSh0YXJnZXQ6IGFueSkge1xuICAgICAgICByZXR1cm4gKCh0eXBlb2YgdGFyZ2V0ID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgdGFyZ2V0ID09PSAnZnVuY3Rpb24nKSAmJiB0eXBlb2YgdGFyZ2V0LnRoZW4gPT09ICdmdW5jdGlvbicpXG4gICAgfVxuICAgIGV4cG9ydCBmdW5jdGlvbiBnZXRfdGhlbih0YXJnZXQ6IGFueSk6IGFueSB7XG4gICAgICAgIHJldHVybiB0YXJnZXQudGhlblxuICAgIH1cblxuXG59XG5cbmNsYXNzIE15UHJvbWlzZTxUPiB7XG4gICAgc3RhdGU6IFByb21pc2VVdGlscy5Qcm9taXNlU3RhdGUgPSBQcm9taXNlVXRpbHMuUHJvbWlzZVN0YXRlLnBlbmRpbmc7XG4gICAgdmFsdWU6IFQgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgcmVhc29uOiBhbnkgPSB1bmRlZmluZWQ7XG4gICAgb25GdWxmaWxsZWQ6IEFycmF5PFByb21pc2VVdGlscy5UaGVuT25GdWxmaWxsZWQ8VD4+ID0gW107XG4gICAgb25SZWplY3RlZDogQXJyYXk8UHJvbWlzZVV0aWxzLlRoZW5PblJlamVjdGVkPGFueT4+ID0gW107XG4gICAgb25GdWxmaWxsZWRSZXN1bHQ6IEFycmF5PFByb21pc2VVdGlscy5PbkZ1bGZpbGxlZFJlc3VsdDxhbnk+PiA9IFtdO1xuICAgIG9uUmVqZWN0ZWRSZXN1bHQ6IEFycmF5PFByb21pc2VVdGlscy5PblJlamVjdGVkUmVzdWx0PGFueT4+ID0gW107XG4gICAgcHJldl9wcm9taXNlOiBNeVByb21pc2U8YW55PiB8IG51bGwgPSBudWxsO1xuXG4gICAgY29uc3RydWN0b3IoY2FsbGJhY2s6IFByb21pc2VVdGlscy5DYWxsYmFjazxUPikge1xuICAgICAgICBjb25zdCByZXNvbHZlID0gKHZhbHVlPzogVCkgPT4ge1xuICAgICAgICAgICAgdGhpcy50b1Jlc29sdmVkKHZhbHVlKTtcbiAgICAgICAgICAgIHRoaXMuZmx1c2hfZnVsZmlsbGVkKCk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHJlamVjdCA9IChyZWFzb24/OiBUKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnRvUmVqZWN0ZWQocmVhc29uKTtcbiAgICAgICAgICAgIHRoaXMuZmx1c2hfcmVqZWN0ZWQoKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY2FsbGJhY2socmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlID09PSBQcm9taXNlVXRpbHMuUHJvbWlzZVN0YXRlLnBlbmRpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRvUmVqZWN0ZWQoZXJyb3IgYXMgVCk7XG4gICAgICAgICAgICAgICAgdGhpcy5mbHVzaF9yZWplY3RlZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB0b1Jlc29sdmVkKHZhbHVlPzogVCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZSAhPT0gUHJvbWlzZVV0aWxzLlByb21pc2VTdGF0ZS5wZW5kaW5nKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLmNoYW5nZV9zdGF0ZShQcm9taXNlVXRpbHMuUHJvbWlzZVN0YXRlLmZ1bGZpbGxlZCk7XG4gICAgfVxuICAgIHByaXZhdGUgdG9SZWplY3RlZChyZWFzb24/OiBhbnkpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgIT09IFByb21pc2VVdGlscy5Qcm9taXNlU3RhdGUucGVuZGluZykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVhc29uID0gcmVhc29uO1xuICAgICAgICB0aGlzLmNoYW5nZV9zdGF0ZShQcm9taXNlVXRpbHMuUHJvbWlzZVN0YXRlLnJlamVjdGVkKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGZsdXNoKCkge1xuICAgICAgICB0aGlzLmZsdXNoX2Z1bGZpbGxlZCgpO1xuICAgICAgICB0aGlzLmZsdXNoX3JlamVjdGVkKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBmbHVzaF9mdWxmaWxsZWQoKSB7XG4gICAgICAgIFByb21pc2VVdGlscy5zcGF3bigoKSA9PiB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMub25GdWxmaWxsZWQubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmbiA9IHRoaXMub25GdWxmaWxsZWRbaV1cbiAgICAgICAgICAgICAgICBjb25zdCBpbmRleCA9IGlcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2ID0gZm4odGhpcy52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25GdWxmaWxsZWRSZXN1bHRbaW5kZXhdID0geyB2YWx1ZTogdiwgdHlwZTogXCJzdWNjZXNzXCIgfTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uRnVsZmlsbGVkUmVzdWx0W2luZGV4XSA9IHsgdmFsdWU6IGVycm9yLCB0eXBlOiBcImZhaWxkXCIgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBwcml2YXRlIGZsdXNoX3JlamVjdGVkKCkge1xuICAgICAgICBQcm9taXNlVXRpbHMuc3Bhd24oKCkgPT4ge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm9uUmVqZWN0ZWQubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmbiA9IHRoaXMub25SZWplY3RlZFtpXVxuICAgICAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gaVxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHYgPSBmbih0aGlzLnJlYXNvbik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25SZWplY3RlZFJlc3VsdFtpbmRleF0gPSB7IHZhbHVlOiB2LCB0eXBlOiBcInN1Y2Nlc3NcIiB9O1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25SZWplY3RlZFJlc3VsdFtpbmRleF0gPSB7IHZhbHVlOiBlcnJvciwgdHlwZTogXCJmYWlsZFwiIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgcHJpdmF0ZSBzZXRfcHJldihwcm9taXNlOiBNeVByb21pc2U8YW55Pikge1xuICAgICAgICB0aGlzLnByZXZfcHJvbWlzZSA9IHByb21pc2U7XG4gICAgfVxuXG4gICAgdGhlbihcbiAgICAgICAgb25GdWxmaWxsZWQ/OiBQcm9taXNlVXRpbHMuVGhlbk9uRnVsZmlsbGVkPFQ+LFxuICAgICAgICBvblJlamVjdGVkPzogUHJvbWlzZVV0aWxzLlRoZW5PblJlamVjdGVkPGFueT5cbiAgICApOiBNeVByb21pc2U8dW5rbm93bj4ge1xuICAgICAgICBjb25zdCBwcm9taXNlOiBNeVByb21pc2U8dW5rbm93bj4gPSBuZXcgTXlQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvbkZ1bGZpbGxlZCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vbkZ1bGZpbGxlZC5wdXNoKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzKHRoaXMudmFsdWUpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb25SZWplY3RlZCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vblJlamVjdGVkLnB1c2goKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZWoodGhpcy5yZWFzb24pXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvbkZ1bGZpbGxlZCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLm9uRnVsZmlsbGVkLnB1c2gob25GdWxmaWxsZWQpIC0gMTtcbiAgICAgICAgICAgICAgICB0aGlzLm9uRnVsZmlsbGVkLnB1c2goKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLm9uRnVsZmlsbGVkUmVzdWx0W2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdC52YWx1ZSA9PT0gcHJvbWlzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqKG5ldyBUeXBlRXJyb3IoJ0NoYWluaW5nIGN5Y2xlIGRldGVjdGVkIGZvciBwcm9taXNlJykpXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnR5cGUgPT09IFwiZmFpbGRcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlaihyZXN1bHQudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IHJlc3VsdC52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoUHJvbWlzZVV0aWxzLmlzX3Byb21pc2UocmVzdWx0LnZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChyZXN1bHQudmFsdWUgYXMgTXlQcm9taXNlPGFueT4pLnRoZW4ocmVzLCByZWopXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRoZW4gPSBQcm9taXNlVXRpbHMuZ2V0X3RoZW4ocmVzdWx0LnZhbHVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRoZW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4uY2FsbChyZXN1bHQudmFsdWUscmVzLCByZWopXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMocmVzdWx0LnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlaihlcnJvcilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvblJlamVjdGVkID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMub25SZWplY3RlZC5wdXNoKG9uUmVqZWN0ZWQpIC0gMTtcbiAgICAgICAgICAgICAgICB0aGlzLm9uUmVqZWN0ZWQucHVzaCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMub25SZWplY3RlZFJlc3VsdFtpbmRleF07XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQudmFsdWUgPT09IHByb21pc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlaihuZXcgVHlwZUVycm9yKCdDaGFpbmluZyBjeWNsZSBkZXRlY3RlZCBmb3IgcHJvbWlzZScpKVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdC50eXBlID09PSBcImZhaWxkXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWoocmVzdWx0LnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyByZXN1bHQudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKFByb21pc2VVdGlscy5pc19wcm9taXNlKHJlc3VsdC52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAocmVzdWx0LnZhbHVlIGFzIE15UHJvbWlzZTxhbnk+KS50aGVuKHJlcywgcmVqKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0aGVuID0gUHJvbWlzZVV0aWxzLmdldF90aGVuKHJlc3VsdC52YWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuLmNhbGwocmVzdWx0LnZhbHVlLHJlcywgcmVqKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzKHJlc3VsdC52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWooZXJyb3IpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cblxuXG5cbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjaGFuZ2Vfc3RhdGUobmV3X3N0YXRlOiBQcm9taXNlVXRpbHMuUHJvbWlzZVN0YXRlKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlICE9PSBQcm9taXNlVXRpbHMuUHJvbWlzZVN0YXRlLnBlbmRpbmcpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQcm9taXNl54q25oCB5LiN5pivcGVuZGluZ1wiKTtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IG5ld19zdGF0ZTtcbiAgICB9XG5cbiAgICBzdGF0aWMgcmVzb2x2ZTxUPih2YWx1ZT86IFQpOiBNeVByb21pc2U8VD4ge1xuICAgICAgICByZXR1cm4gbmV3IE15UHJvbWlzZSgocmVzLCByZWopID0+IHJlcyh2YWx1ZSkpO1xuICAgIH1cbiAgICBzdGF0aWMgcmVqZWN0PFQ+KHJlYXNvbjogVCk6IE15UHJvbWlzZTxUPiB7XG4gICAgICAgIHJldHVybiBuZXcgTXlQcm9taXNlKChyZXMsIHJlaikgPT4gcmVqKHJlYXNvbikpO1xuICAgIH1cbiAgICBzdGF0aWMgZGVmZXJyZWQ8VD4oKTogRGVmZXJyZWRSZXN1bHQ8VD4ge1xuICAgICAgICBsZXQgcmVzOiBQcm9taXNlVXRpbHMuUmVzb2x2ZUNhbGxiYWNrPGFueT47XG4gICAgICAgIGxldCByZWo6IFByb21pc2VVdGlscy5SZWplY3RDYWxsYmFjaztcbiAgICAgICAgY29uc3QgcHJvbWlzZTogTXlQcm9taXNlPFQ+ID0gbmV3IE15UHJvbWlzZSgoX3JlcywgX3JlaikgPT4ge1xuICAgICAgICAgICAgcmVzID0gX3JlcztcbiAgICAgICAgICAgIHJlaiA9IF9yZWo7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcHJvbWlzZSxcbiAgICAgICAgICAgIHJlc29sdmU8VD4odmFsdWU/OiBUKSB7XG4gICAgICAgICAgICAgICAgcmVzKHZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWplY3Q8VD4ocmVhc29uPzogVCkge1xuICAgICAgICAgICAgICAgIHJlaihyZWFzb24pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IE15UHJvbWlzZTtcbiJdfQ==