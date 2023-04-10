var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./MyPromise"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // import promise_test from 'promise-aplus-tests'
    // const promise_test = require('promises-aplus-tests')
    var MyPromise_1 = __importDefault(require("./MyPromise"));
    var adapter = {
        resolved: MyPromise_1.default.resolve,
        rejected: MyPromise_1.default.reject,
        deferred: MyPromise_1.default.deferred
    };
    // promise_test(adapter)
    module.exports = adapter;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLi9zcmMvIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztJQUNBLGlEQUFpRDtJQUNqRCx1REFBdUQ7SUFDdkQsMERBQW9EO0lBUXBELElBQU0sT0FBTyxHQUFZO1FBQ3JCLFFBQVEsRUFBQyxtQkFBUyxDQUFDLE9BQU87UUFDMUIsUUFBUSxFQUFDLG1CQUFTLENBQUMsTUFBTTtRQUN6QixRQUFRLEVBQUMsbUJBQVMsQ0FBQyxRQUFRO0tBQzlCLENBQUE7SUFFRCx3QkFBd0I7SUFDeEIsTUFBTSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJcbi8vIGltcG9ydCBwcm9taXNlX3Rlc3QgZnJvbSAncHJvbWlzZS1hcGx1cy10ZXN0cydcbi8vIGNvbnN0IHByb21pc2VfdGVzdCA9IHJlcXVpcmUoJ3Byb21pc2VzLWFwbHVzLXRlc3RzJylcbmltcG9ydCBNeVByb21pc2Use0RlZmVycmVkUmVzdWx0fSBmcm9tIFwiLi9NeVByb21pc2VcIlxuXG5pbnRlcmZhY2UgQWRhcHRlcnN7XG4gICAgcmVzb2x2ZWQ8VD4odmFsdWU6VCk6TXlQcm9taXNlPFQ+LFxuICAgIHJlamVjdGVkPFQ+KHJlYXNvbjpUKTpNeVByb21pc2U8VD4sXG4gICAgZGVmZXJyZWQ8VD4oKTpEZWZlcnJlZFJlc3VsdDxUPlxufVxuXG5jb25zdCBhZGFwdGVyOkFkYXB0ZXJzID0ge1xuICAgIHJlc29sdmVkOk15UHJvbWlzZS5yZXNvbHZlLFxuICAgIHJlamVjdGVkOk15UHJvbWlzZS5yZWplY3QsXG4gICAgZGVmZXJyZWQ6TXlQcm9taXNlLmRlZmVycmVkXG59XG5cbi8vIHByb21pc2VfdGVzdChhZGFwdGVyKVxubW9kdWxlLmV4cG9ydHMgPSBhZGFwdGVyXG4iXX0=