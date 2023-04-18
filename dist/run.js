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
    var c = 0;
    var p = MyPromise_1.default.resolve(1);
    var pp = p.then(function (v) {
        var thenableA = {
            then: function (r) {
                r(thenableB);
            }
        };
        var thenableB = {
            then: function (r) {
                r(thenableA);
            }
        };
        return thenableA;
    });
    setTimeout(function () {
        console.log(pp);
    }, 1000);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLmpzIiwic291cmNlUm9vdCI6Ii4vc3JjLyIsInNvdXJjZXMiOlsicnVuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0lBQUEsMERBQW9DO0lBQ3BDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNWLElBQU0sQ0FBQyxHQUFHLG1CQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQzlCLElBQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQSxDQUFDO1FBQ2YsSUFBSSxTQUFTLEdBQUc7WUFDWixJQUFJLFlBQUMsQ0FBTTtnQkFDUCxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUE7WUFDaEIsQ0FBQztTQUNKLENBQUE7UUFDRCxJQUFJLFNBQVMsR0FBRztZQUNaLElBQUksWUFBQyxDQUFNO2dCQUNQLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQTtZQUNoQixDQUFDO1NBQ0osQ0FBQTtRQUNELE9BQU8sU0FBUyxDQUFBO0lBQ3BCLENBQUMsQ0FBQyxDQUFBO0lBRUYsVUFBVSxDQUFDO1FBQ1AsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUNuQixDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgTXlQcm9taXNlIGZyb20gXCIuL015UHJvbWlzZVwiO1xubGV0IGMgPSAwO1xuY29uc3QgcCA9IE15UHJvbWlzZS5yZXNvbHZlKDEpXG5jb25zdCBwcCA9IHAudGhlbih2ID0+IHtcbiAgICB2YXIgdGhlbmFibGVBID0ge1xuICAgICAgICB0aGVuKHI6IGFueSkge1xuICAgICAgICAgICAgcih0aGVuYWJsZUIpXG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIHRoZW5hYmxlQiA9IHtcbiAgICAgICAgdGhlbihyOiBhbnkpIHtcbiAgICAgICAgICAgIHIodGhlbmFibGVBKVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGVuYWJsZUFcbn0pXG5cbnNldFRpbWVvdXQoKCkgPT4ge1xuICAgIGNvbnNvbGUubG9nKHBwKVxufSwgMTAwMCk7Il19