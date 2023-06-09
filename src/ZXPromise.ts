export interface DeferredResult<Value> {
	promise: ZXPromise<Value>;
	resolve<T>(value: T): void;
	reject<T>(value: T): void;
}

namespace PromiseUtils {
	export enum PromiseState {
		PENDING = "pending",
		FULFILLED = "fulfilled",
		REJECTED = "rejected",
	}
	export type ResolveCallback<T> = (value?: T) => void;
	export type RejectCallback = (reason?: any) => void;
	export type Callback<T> = (resolve: ResolveCallback<T>, reject: RejectCallback) => void;
	export type ThenOnFulfilled<T> = (value?: T) => any;
	export type ThenOnRejected<T> = (value?: T) => any;
	export type OnFulfilledResult<T> = {
		type: "success" | "faild";
		value: T;
	};
	export type OnRejectedResult<T> = OnFulfilledResult<T>;

	export function spawn(task: Function) {
		let timer: NodeJS.Timeout | null = setTimeout(() => {
			task();
			if (timer !== null) {
				clearTimeout(timer);
				timer = null;
			}
		}, 0);
	}
	export function is_promise(target: any): boolean {
		return target instanceof ZXPromise;
	}
	export function is_obj(target: any): boolean {
		return (typeof target === "object" || typeof target === "function") && target !== null;
	}
	export function is_thenable(target: any) {
		return (typeof target === "object" || typeof target === "function") && typeof target.then === "function";
	}
	export function get_then(target: any): any {
		return target.then;
	}
	export function get_finally_then(thenable: any, res: any, rej: any) {
		let then;
		while (is_obj(thenable)) {
			if (thenable.then === undefined) break;
			then = thenable.then;
			if (typeof then === "function") {
				thenable = then.call(thenable, res, rej);
			} else {
				break;
			}
		}
		return then;
	}
	export type CallbackWithCalled = {
		cb: Function;
		called: boolean;
	};
	export function make_callback(cb: Function): CallbackWithCalled {
		return {
			cb: cb,
			called: false,
		};
	}
}

class ZXPromise<T> {
	state: PromiseUtils.PromiseState = PromiseUtils.PromiseState.PENDING;
	value: T | undefined = undefined;
	reason: any = undefined;
	private onFulfilled: Array<PromiseUtils.CallbackWithCalled> = [];
	private onRejected: Array<PromiseUtils.CallbackWithCalled> = [];
	private onFulfilledResult: Array<PromiseUtils.OnFulfilledResult<any>> = [];
	private onRejectedResult: Array<PromiseUtils.OnRejectedResult<any>> = [];
	private visited: Set<any> = new Set();

	constructor(callback: PromiseUtils.Callback<T>) {
		const resolve = (value?: T) => {
			ZXPromise.resolve_promise(this as any, value);
		};
		const reject = (reason?: T) => {
			this.toRejected(reason);
		};

		try {
			callback(resolve, reject);
		} catch (error) {
			if (this.state === PromiseUtils.PromiseState.PENDING) {
				this.toRejected(error as T);
				this.flush_rejected();
			}
		}
	}

	private toResolved(value?: T) {
		if (this.state !== PromiseUtils.PromiseState.PENDING) {
			return;
		}
		this.value = value;
		this.change_state(PromiseUtils.PromiseState.FULFILLED);
		this.flush_fulfilled();
	}
	private toRejected(reason?: any) {
		if (this.state !== PromiseUtils.PromiseState.PENDING) {
			return;
		}
		this.reason = reason;
		this.change_state(PromiseUtils.PromiseState.REJECTED);
		this.flush_rejected();
	}
	private flush_fulfilled() {
		if (this.state !== PromiseUtils.PromiseState.FULFILLED) return;
		PromiseUtils.spawn(() => {
			for (let i = 0; i < this.onFulfilled.length; ++i) {
				const callback = this.onFulfilled[i];
				if (callback.called) return;
				const index = i;
				try {
					const fn = callback.cb;
					const v = fn(this.value);
					this.onFulfilledResult[index] = { value: v, type: "success" };
				} catch (error) {
					this.onFulfilledResult[index] = { value: error, type: "faild" };
				} finally {
					callback.called = true;
				}
			}
		});
	}
	private flush_rejected() {
		if (this.state !== PromiseUtils.PromiseState.REJECTED) return;
		PromiseUtils.spawn(() => {
			for (let i = 0; i < this.onRejected.length; ++i) {
				const callback = this.onRejected[i];
				if (callback.called) return;
				const fn = callback.cb;
				const index = i;
				try {
					const v = fn(this.reason);
					this.onRejectedResult[index] = { value: v, type: "success" };
				} catch (error) {
					this.onRejectedResult[index] = { value: error, type: "faild" };
				} finally {
					callback.called = true;
				}
			}
		});
	}
	private change_state(new_state: PromiseUtils.PromiseState) {
		if (this.state !== PromiseUtils.PromiseState.PENDING) throw new Error("Promise is not in pending");
		this.state = new_state;
	}

	then(
		onFulfilled?: PromiseUtils.ThenOnFulfilled<T>,
		onRejected?: PromiseUtils.ThenOnRejected<any>
	): ZXPromise<unknown> {
		let res: any;
		let rej: any;
		const promise: ZXPromise<unknown> = new ZXPromise((_res, _rej) => {
			res = _res;
			rej = _rej;
		});

		if (typeof onFulfilled !== "function") {
			this.onFulfilled.push(
				PromiseUtils.make_callback(() => {
					res(this.value);
				})
			);
		}
		if (typeof onRejected !== "function") {
			this.onRejected.push(
				PromiseUtils.make_callback(() => {
					rej(this.reason);
				})
			);
		}

		if (typeof onFulfilled === "function") {
			const index = this.onFulfilled.push(PromiseUtils.make_callback(onFulfilled)) - 1;
			this.onFulfilled.push(
				PromiseUtils.make_callback(() => {
					const result = this.onFulfilledResult[index];
					if (result.type === "faild") {
						rej(result.value);
						throw result.value;
					}
					ZXPromise.resolve_promise(promise, result.value);
				})
			);
		}
		if (typeof onRejected === "function") {
			const index = this.onRejected.push(PromiseUtils.make_callback(onRejected)) - 1;
			this.onRejected.push(
				PromiseUtils.make_callback(() => {
					const result = this.onRejectedResult[index];
					if (result.type === "faild") {
						rej(result.value);
						throw result.value;
					}
					ZXPromise.resolve_promise(promise, result.value);
				})
			);
		}
		this.flush_fulfilled();
		this.flush_rejected();
		return promise;
	}

	static resolve_promise(promise: ZXPromise<unknown>, x: any) {
		if (promise.visited.has(x)) {
			promise.toRejected(new TypeError("A recursive loop occurs"));
			return;
		}
		if (promise === x) {
			promise.toRejected(new TypeError("Chaining cycle detected for promise"));
		} else if (PromiseUtils.is_promise(x)) {
			x.then(promise.toResolved.bind(promise), promise.toRejected.bind(promise));
		} else if (PromiseUtils.is_obj(x)) {
			try {
				const resolve_promise = (value: any) => {
					if (resolve_promise.called || reject_promise.called) return;
					resolve_promise.called = true;
					ZXPromise.resolve_promise(promise, value);
				};
				resolve_promise.called = false;
				const reject_promise = (reason: any) => {
					if (reject_promise.called || resolve_promise.called) return;
					reject_promise.called = true;
					promise.toRejected(reason);
				};
				reject_promise.called = false;
				const then = PromiseUtils.get_then(x);
				if (typeof then === "function") {
					promise.visited.add(x);
					try {
						then.call(x, resolve_promise, reject_promise);
					} catch (error) {
						if (!resolve_promise.called && !reject_promise.called) {
							reject_promise(error);
						}
					}
				} else {
					promise.toResolved(x);
				}
			} catch (error) {
				promise.toRejected(error);
			}
		} else {
			promise.toResolved(x);
		}
		promise.visited.clear();
	}
	static resolve<T>(value?: T): ZXPromise<T> {
		return new ZXPromise((res, rej) => res(value));
	}
	static reject<T>(reason: T): ZXPromise<T> {
		return new ZXPromise((res, rej) => rej(reason));
	}
	static deferred<T>(): DeferredResult<T> {
		let res: PromiseUtils.ResolveCallback<any>;
		let rej: PromiseUtils.RejectCallback;
		const promise: ZXPromise<T> = new ZXPromise((_res, _rej) => {
			res = _res;
			rej = _rej;
		});
		return {
			promise,
			resolve<T>(value?: T) {
				res(value);
			},
			reject<T>(reason?: T) {
				rej(reason);
			},
		};
	}
}

export { ZXPromise };
