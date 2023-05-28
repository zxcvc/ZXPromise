const { ZPromise } = require("../dist/index");
const adapter = {
	resolved: ZPromise.resolve,
	rejected: ZPromise.reject,
	deferred: ZPromise.deferred,
};
module.exports = adapter;
