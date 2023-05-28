const { ZXPromise } = require("../dist/index");
const adapter = {
	resolved: ZXPromise.resolve,
	rejected: ZXPromise.reject,
	deferred: ZXPromise.deferred,
};
module.exports = adapter;
