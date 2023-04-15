export interface DeferredResult<Value> {
    promise: MyPromise<Value>;
    resolve<T>(value: T): void;
    reject<T>(value: T): void;
}

export namespace PromiseUtils {
    export enum PromiseState {
        pending = "pending",
        fulfilled = "fulfilled",
        rejected = "rejected",
    }
    export enum ErrorState {
        NO_ERROR = "NO_ERROR",
        RESOLVED = "RESOLVED",
        NO_RESOLVED = "NO_RESOLVED",
    }
    export type Callback<T> = (
        resolve: ResolveCallback<T>,
        reject: RejectCallback
    ) => void;
    export type ResolveCallback<T> = (value?: T) => void;
    export type RejectCallback = (reason?: any) => void;
    export type ThenCallback<Arg, ReturnValue> = (value: Arg) => ReturnValue;
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
        return target instanceof MyPromise;
    }
    export function is_obj(target: any): boolean {
        return (
            (typeof target === "object" || typeof target === "function") &&
            target !== null
        );
    }
    export function is_thenable(target: any) {
        return (
            (typeof target === "object" || typeof target === "function") &&
            typeof target.then === "function"
        );
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

class MyPromise<T> {
    state: PromiseUtils.PromiseState = PromiseUtils.PromiseState.pending;
    value: T | undefined = undefined;
    reason: any = undefined;
    onFulfilled: Array<PromiseUtils.CallbackWithCalled> = [];
    onRejected: Array<PromiseUtils.CallbackWithCalled> = [];
    onFulfilledResult: Array<PromiseUtils.OnFulfilledResult<any>> = [];
    onRejectedResult: Array<PromiseUtils.OnRejectedResult<any>> = [];
    prev_promise: MyPromise<any> | null = null;

    constructor(callback: PromiseUtils.Callback<T>) {
        const resolve = (value?: T) => {
            // this.toResolved(value);
            MyPromise.resolve_promise(this as any, value);
        };
        const reject = (reason?: T) => {
            this.toRejected(reason);
        };

        try {
            callback(resolve, reject);
        } catch (error) {
            if (this.state === PromiseUtils.PromiseState.pending) {
                this.toRejected(error as T);
                this.flush_rejected();
            }
        }
    }
    static resolve_called = false;
    static reject_called = false;
    static resolve_promise(promise: MyPromise<unknown>, x: any) {
        if (promise === x) {
            promise.toRejected(new TypeError("Chaining cycle detected for promise"));
        } else if (PromiseUtils.is_promise(x)) {
            x.then(
                // (y:any)=>MyPromise.resolve_promise(promise,y),
                promise.toResolved.bind(promise),
                promise.toRejected.bind(promise)
            );
        } else if (PromiseUtils.is_obj(x)) {
            try {
                const resolve_promise = (value: any) => {
                    if (resolve_promise.called || reject_promise.called) return;
                    resolve_promise.called = true;
                    MyPromise.resolve_promise(promise, value);
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
                    try {
                        then.call(x, resolve_promise, reject_promise);
                    } catch (error) {
                        if (!resolve_promise.called && !reject_promise.called) {
                            reject_promise(error);
                        }
                    }
                    // if (PromiseUtils.is_thenable(ret)) {
                    //     if (!(resolve_promise.called)) {
                    //         MyPromise.resolve_promise(promise, ret)
                    //     }
                    // }
                } else {
                    promise.toResolved(x);
                }
            } catch (error) {
                promise.toRejected(error);
            }
        } else {
            promise.toResolved(x);
        }
    }

    private toResolved(value?: T) {
        if (this.state !== PromiseUtils.PromiseState.pending) {
            return;
        }
        this.value = value;
        this.change_state(PromiseUtils.PromiseState.fulfilled);
        this.flush_fulfilled();
    }
    private toRejected(reason?: any) {
        if (this.state !== PromiseUtils.PromiseState.pending) {
            return;
        }
        this.reason = reason;
        this.change_state(PromiseUtils.PromiseState.rejected);
        this.flush_rejected();
    }

    private flush_fulfilled() {
        if (this.state !== PromiseUtils.PromiseState.fulfilled) return;
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
        if (this.state !== PromiseUtils.PromiseState.rejected) return;
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
    private set_prev(promise: MyPromise<any>) {
        this.prev_promise = promise;
    }

    then(
        onFulfilled?: PromiseUtils.ThenOnFulfilled<T>,
        onRejected?: PromiseUtils.ThenOnRejected<any>
    ): MyPromise<unknown> {
        let res: any;
        let rej: any;
        const promise: MyPromise<unknown> = new MyPromise((_res, _rej) => {
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
            const index =
                this.onFulfilled.push(PromiseUtils.make_callback(onFulfilled)) - 1;
            this.onFulfilled.push(
                PromiseUtils.make_callback(() => {
                    const result = this.onFulfilledResult[index];
                    if (result.type === "faild") {
                        rej(result.value);
                        throw result.value;
                    }
                    MyPromise.resolve_promise(promise, result.value);
                })
            );
        }
        if (typeof onRejected === "function") {
            const index =
                this.onRejected.push(PromiseUtils.make_callback(onRejected)) - 1;
            this.onRejected.push(
                PromiseUtils.make_callback(() => {
                    const result = this.onRejectedResult[index];
                    if (result.type === "faild") {
                        rej(result.value);
                        throw result.value;
                    }
                    MyPromise.resolve_promise(promise, result.value);
                })
            );
        }
        this.flush_fulfilled();
        this.flush_rejected();
        return promise;
    }

    private change_state(new_state: PromiseUtils.PromiseState) {
        if (this.state !== PromiseUtils.PromiseState.pending)
            throw new Error("Promise状态不是pending");
        this.state = new_state;
    }

    static resolve<T>(value?: T): MyPromise<T> {
        return new MyPromise((res, rej) => res(value));
    }
    static reject<T>(reason: T): MyPromise<T> {
        return new MyPromise((res, rej) => rej(reason));
    }
    static deferred<T>(): DeferredResult<T> {
        let res: PromiseUtils.ResolveCallback<any>;
        let rej: PromiseUtils.RejectCallback;
        const promise: MyPromise<T> = new MyPromise((_res, _rej) => {
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

export default MyPromise;
