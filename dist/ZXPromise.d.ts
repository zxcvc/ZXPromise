export interface DeferredResult<Value> {
    promise: ZXPromise<Value>;
    resolve<T>(value: T): void;
    reject<T>(value: T): void;
}
declare namespace PromiseUtils {
    enum PromiseState {
        PENDING = "pending",
        FULFILLED = "fulfilled",
        REJECTED = "rejected"
    }
    type ResolveCallback<T> = (value?: T) => void;
    type RejectCallback = (reason?: any) => void;
    type Callback<T> = (resolve: ResolveCallback<T>, reject: RejectCallback) => void;
    type ThenOnFulfilled<T> = (value?: T) => any;
    type ThenOnRejected<T> = (value?: T) => any;
    type OnFulfilledResult<T> = {
        type: "success" | "faild";
        value: T;
    };
    type OnRejectedResult<T> = OnFulfilledResult<T>;
    function spawn(task: Function): void;
    function is_promise(target: any): boolean;
    function is_obj(target: any): boolean;
    function is_thenable(target: any): boolean;
    function get_then(target: any): any;
    function get_finally_then(thenable: any, res: any, rej: any): any;
    type CallbackWithCalled = {
        cb: Function;
        called: boolean;
    };
    function make_callback(cb: Function): CallbackWithCalled;
}
declare class ZXPromise<T> {
    state: PromiseUtils.PromiseState;
    value: T | undefined;
    reason: any;
    private onFulfilled;
    private onRejected;
    private onFulfilledResult;
    private onRejectedResult;
    private visited;
    constructor(callback: PromiseUtils.Callback<T>);
    private toResolved;
    private toRejected;
    private flush_fulfilled;
    private flush_rejected;
    private change_state;
    then(onFulfilled?: PromiseUtils.ThenOnFulfilled<T>, onRejected?: PromiseUtils.ThenOnRejected<any>): ZXPromise<unknown>;
    static resolve_promise(promise: ZXPromise<unknown>, x: any): void;
    static resolve<T>(value?: T): ZXPromise<T>;
    static reject<T>(reason: T): ZXPromise<T>;
    static deferred<T>(): DeferredResult<T>;
}
export { ZXPromise };
