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
    var promise = new MyPromise_1.default(function (res, rej) {
        res(12);
        setTimeout(function () { }, 1000);
    });
    var d = promise.then(function () {
        var p = MyPromise_1.default.resolve(2222);
        return {
            then: function (f) {
                setTimeout(function () {
                    f(p);
                    throw 232;
                }, 200);
            }
        };
    });
    setTimeout(function () {
        console.log(promise);
        console.log(d);
        promise.then(console.log);
    }, 2000);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLmpzIiwic291cmNlUm9vdCI6Ii4vc3JjLyIsInNvdXJjZXMiOlsicnVuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0lBQ0EsMERBQXNEO0lBQ3RELElBQU0sT0FBTyxHQUFHLElBQUksbUJBQVMsQ0FBQyxVQUFDLEdBQUcsRUFBRSxHQUFHO1FBQ25DLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNSLFVBQVUsQ0FBQyxjQUFRLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNoQyxDQUFDLENBQUMsQ0FBQztJQUNILElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7UUFDakIsSUFBTSxDQUFDLEdBQUcsbUJBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDakMsT0FBTztZQUNILElBQUksWUFBQyxDQUFLO2dCQUNOLFVBQVUsQ0FBQztvQkFDUCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7b0JBQ0osTUFBTSxHQUFHLENBQUE7Z0JBQ2IsQ0FBQyxFQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQ1YsQ0FBQztTQUNKLENBQUE7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILFVBQVUsQ0FBQztRQUNQLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDckIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNmLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0lBQzdCLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGFzc2VydCB9IGZyb20gXCJjb25zb2xlXCI7XG5pbXBvcnQgTXlQcm9taXNlLCB7IFByb21pc2VVdGlscyB9IGZyb20gXCIuL015UHJvbWlzZVwiO1xuY29uc3QgcHJvbWlzZSA9IG5ldyBNeVByb21pc2UoKHJlcywgcmVqKSA9PiB7XG4gICAgcmVzKDEyKTtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHsgfSwgMTAwMCk7XG59KTtcbmxldCBkID0gcHJvbWlzZS50aGVuKCgpID0+IHtcbiAgICBjb25zdCBwID0gTXlQcm9taXNlLnJlc29sdmUoMjIyMilcbiAgICByZXR1cm4ge1xuICAgICAgICB0aGVuKGY6YW55KXtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCk9PntcbiAgICAgICAgICAgICAgICBmKHApXG4gICAgICAgICAgICAgICAgdGhyb3cgMjMyXG4gICAgICAgICAgICB9LDIwMClcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICBjb25zb2xlLmxvZyhwcm9taXNlKTtcbiAgICBjb25zb2xlLmxvZyhkKTtcbiAgICBwcm9taXNlLnRoZW4oY29uc29sZS5sb2cpXG59LCAyMDAwKTtcbiJdfQ==