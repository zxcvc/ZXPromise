const { MyPromise } = require("../dist/index");
const adapter = {
	resolved: MyPromise.resolve,
	rejected: MyPromise.reject,
	deferred: MyPromise.deferred,
};
module.exports = adapter;
