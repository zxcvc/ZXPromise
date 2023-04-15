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
    var MyPromise_1 = __importDefault(require("./MyPromise"));
    var adapter = {
        resolved: MyPromise_1.default.resolve,
        rejected: MyPromise_1.default.reject,
        deferred: MyPromise_1.default.deferred
    };
    module.exports = adapter;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLi9zcmMvIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztJQUNBLDBEQUFvRDtJQVFwRCxJQUFNLE9BQU8sR0FBWTtRQUNyQixRQUFRLEVBQUMsbUJBQVMsQ0FBQyxPQUFPO1FBQzFCLFFBQVEsRUFBQyxtQkFBUyxDQUFDLE1BQU07UUFDekIsUUFBUSxFQUFDLG1CQUFTLENBQUMsUUFBUTtLQUM5QixDQUFBO0lBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJcbmltcG9ydCBNeVByb21pc2Use0RlZmVycmVkUmVzdWx0fSBmcm9tIFwiLi9NeVByb21pc2VcIlxuXG5pbnRlcmZhY2UgQWRhcHRlcnN7XG4gICAgcmVzb2x2ZWQ8VD4odmFsdWU6VCk6TXlQcm9taXNlPFQ+LFxuICAgIHJlamVjdGVkPFQ+KHJlYXNvbjpUKTpNeVByb21pc2U8VD4sXG4gICAgZGVmZXJyZWQ8VD4oKTpEZWZlcnJlZFJlc3VsdDxUPlxufVxuXG5jb25zdCBhZGFwdGVyOkFkYXB0ZXJzID0ge1xuICAgIHJlc29sdmVkOk15UHJvbWlzZS5yZXNvbHZlLFxuICAgIHJlamVjdGVkOk15UHJvbWlzZS5yZWplY3QsXG4gICAgZGVmZXJyZWQ6TXlQcm9taXNlLmRlZmVycmVkXG59XG5cbm1vZHVsZS5leHBvcnRzID0gYWRhcHRlclxuIl19