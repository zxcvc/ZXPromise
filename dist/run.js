var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "console", "./MyPromise"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var console_1 = require("console");
    var MyPromise_1 = __importStar(require("./MyPromise"));
    var promise = new MyPromise_1.default(function (res, rej) {
        // rej(12)
        setTimeout(function () {
            rej(12);
        }, 1000);
    });
    var d = promise.then(undefined, function () { return ({ then: function () {
            console.log(2222);
            return 1;
        } }); });
    var e = d.then(function (v) { return v; }, console.log);
    setTimeout(function () {
        console.log(promise);
        console.log(d);
        console.log(e);
        (0, console_1.assert)(promise.state === MyPromise_1.PromiseUtils.PromiseState.rejected, 1);
        (0, console_1.assert)(d.state === MyPromise_1.PromiseUtils.PromiseState.fulfilled, 2);
        (0, console_1.assert)(d.value === promise.reason, 3);
        (0, console_1.assert)(e.value === d.value, 4);
    }, 2000);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLmpzIiwic291cmNlUm9vdCI6Ii4vc3JjLyIsInNvdXJjZXMiOlsicnVuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFBQSxtQ0FBZ0M7SUFDaEMsdURBQXFEO0lBQ3JELElBQU0sT0FBTyxHQUFHLElBQUksbUJBQVMsQ0FBQyxVQUFDLEdBQUcsRUFBQyxHQUFHO1FBQ2xDLFVBQVU7UUFDVixVQUFVLENBQUM7WUFDUCxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDWCxDQUFDLEVBQUMsSUFBSSxDQUFDLENBQUM7SUFDWixDQUFDLENBQUMsQ0FBQTtJQUNGLElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFDLGNBQUksT0FBQSxDQUFDLEVBQUMsSUFBSTtZQUNyQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFBO1lBQ2pCLE9BQU8sQ0FBQyxDQUFBO1FBQUEsQ0FBQyxFQUFDLENBQUMsRUFGb0IsQ0FFcEIsQ0FBQyxDQUFBO0lBQ2hCLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQSxDQUFDLElBQUUsT0FBQSxDQUFDLEVBQUQsQ0FBQyxFQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUdoQyxVQUFVLENBQUM7UUFDUCxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQ3BCLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDZCxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBRWQsSUFBQSxnQkFBTSxFQUFDLE9BQU8sQ0FBQyxLQUFLLEtBQUssd0JBQVksQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFDLENBQUMsQ0FBQyxDQUFBO1FBQzlELElBQUEsZ0JBQU0sRUFBQyxDQUFDLENBQUMsS0FBSyxLQUFLLHdCQUFZLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBQyxDQUFDLENBQUMsQ0FBQTtRQUN6RCxJQUFBLGdCQUFNLEVBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxPQUFPLENBQUMsTUFBTSxFQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3BDLElBQUEsZ0JBQU0sRUFBQyxDQUFDLENBQUMsS0FBSyxLQUFLLENBQUMsQ0FBQyxLQUFLLEVBQUMsQ0FBQyxDQUFDLENBQUE7SUFDakMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYXNzZXJ0IH0gZnJvbSBcImNvbnNvbGVcIlxuaW1wb3J0IE15UHJvbWlzZSwgeyBQcm9taXNlVXRpbHMgfSBmcm9tIFwiLi9NeVByb21pc2VcIlxuY29uc3QgcHJvbWlzZSA9IG5ldyBNeVByb21pc2UoKHJlcyxyZWopPT57XG4gICAgLy8gcmVqKDEyKVxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICByZWooMTIpXG4gICAgfSwxMDAwKTtcbn0pXG5sZXQgZCA9IHByb21pc2UudGhlbih1bmRlZmluZWQsKCk9Pih7dGhlbigpe1xuICAgIGNvbnNvbGUubG9nKDIyMjIpXG4gICAgcmV0dXJuIDF9fSkpXG5sZXQgZSA9IGQudGhlbih2PT52LGNvbnNvbGUubG9nKVxuXG5cbnNldFRpbWVvdXQoKCkgPT4ge1xuICAgIGNvbnNvbGUubG9nKHByb21pc2UpXG4gICAgY29uc29sZS5sb2coZClcbiAgICBjb25zb2xlLmxvZyhlKVxuXG4gICAgYXNzZXJ0KHByb21pc2Uuc3RhdGUgPT09IFByb21pc2VVdGlscy5Qcm9taXNlU3RhdGUucmVqZWN0ZWQsMSlcbiAgICBhc3NlcnQoZC5zdGF0ZSA9PT0gUHJvbWlzZVV0aWxzLlByb21pc2VTdGF0ZS5mdWxmaWxsZWQsMilcbiAgICBhc3NlcnQoZC52YWx1ZSA9PT0gcHJvbWlzZS5yZWFzb24sMylcbiAgICBhc3NlcnQoZS52YWx1ZSA9PT0gZC52YWx1ZSw0KVxufSwgMjAwMCk7XG5cblxuXG4iXX0=