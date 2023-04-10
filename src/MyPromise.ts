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
        return target instanceof MyPromise
    }

    export function is_thenable(target: any) {
        return ((typeof target === 'object' || typeof target === 'function') && typeof target.then === 'function')
    }
    export function get_then(target: any): any {
        return target.then
    }


}

class MyPromise<T> {
    state: PromiseUtils.PromiseState = PromiseUtils.PromiseState.pending;
    value: T | undefined = undefined;
    reason: any = undefined;
    onFulfilled: Array<PromiseUtils.ThenOnFulfilled<T>> = [];
    onRejected: Array<PromiseUtils.ThenOnRejected<any>> = [];
    onFulfilledResult: Array<PromiseUtils.OnFulfilledResult<any>> = [];
    onRejectedResult: Array<PromiseUtils.OnRejectedResult<any>> = [];
    prev_promise: MyPromise<any> | null = null;

    constructor(callback: PromiseUtils.Callback<T>) {
        const resolve = (value?: T) => {
            this.toResolved(value);
            this.flush_fulfilled();
        };
        const reject = (reason?: T) => {
            this.toRejected(reason);
            this.flush_rejected();
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

    private toResolved(value?: T) {
        if (this.state !== PromiseUtils.PromiseState.pending) {
            return;
        }
        this.value = value;
        this.change_state(PromiseUtils.PromiseState.fulfilled);
    }
    private toRejected(reason?: any) {
        if (this.state !== PromiseUtils.PromiseState.pending) {
            return;
        }
        this.reason = reason;
        this.change_state(PromiseUtils.PromiseState.rejected);
    }

    private flush() {
        this.flush_fulfilled();
        this.flush_rejected();
    }

    private flush_fulfilled() {
        PromiseUtils.spawn(() => {
            for (let i = 0; i < this.onFulfilled.length; ++i) {
                const fn = this.onFulfilled[i]
                const index = i
                try {
                    const v = fn(this.value);
                    this.onFulfilledResult[index] = { value: v, type: "success" };
                } catch (error) {
                    this.onFulfilledResult[index] = { value: error, type: "faild" };
                }
            }
        });
    }
    private flush_rejected() {
        PromiseUtils.spawn(() => {
            for (let i = 0; i < this.onRejected.length; ++i) {
                const fn = this.onRejected[i]
                const index = i
                try {
                    const v = fn(this.reason);
                    this.onRejectedResult[index] = { value: v, type: "success" };
                } catch (error) {
                    this.onRejectedResult[index] = { value: error, type: "faild" };
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
        const promise: MyPromise<unknown> = new MyPromise((res, rej) => {
            if (typeof onFulfilled !== "function") {
                this.onFulfilled.push(() => {
                    res(this.value)
                })
            }
            if (typeof onRejected !== "function") {
                this.onRejected.push(() => {
                    rej(this.reason)
                })
            }

            if (typeof onFulfilled === "function") {
                const index = this.onFulfilled.push(onFulfilled) - 1;
                this.onFulfilled.push(() => {
                    const result = this.onFulfilledResult[index];
                    if (result.value === promise) {
                        rej(new TypeError('Chaining cycle detected for promise'))
                    } else {
                        if (result.type === "faild") {
                            rej(result.value);
                            throw result.value;
                        } else if (PromiseUtils.is_promise(result.value)) {
                            (result.value as MyPromise<any>).then(res, rej)
                        } else {
                            try {
                                const then = PromiseUtils.get_then(result.value)
                                if (typeof then === 'function') {
                                    then.call(result.value,res, rej)
                                } else {
                                    res(result.value);
                                }
                            } catch (error) {
                                rej(error)
                            }

                        }
                    }
                });
            }
            if (typeof onRejected === "function") {
                const index = this.onRejected.push(onRejected) - 1;
                this.onRejected.push(() => {
                    const result = this.onRejectedResult[index];
                    if (result.value === promise) {
                        rej(new TypeError('Chaining cycle detected for promise'))
                    } else {
                        if (result.type === "faild") {
                            rej(result.value);
                            throw result.value;
                        } else if (PromiseUtils.is_promise(result.value)) {
                            (result.value as MyPromise<any>).then(res, rej)
                        } else {
                            try {
                                const then = PromiseUtils.get_then(result.value)
                                if (typeof then === 'function') {
                                    then.call(result.value,res, rej)
                                } else {
                                    res(result.value);
                                }
                            } catch (error) {
                                rej(error)
                            }

                        }
                    }
                });
            }
        });




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
