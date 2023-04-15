import { assert } from "console";
import MyPromise, { PromiseUtils } from "./MyPromise";
const promise = new MyPromise((res, rej) => {
    res(12);
    setTimeout(() => { }, 1000);
});
let d = promise.then(() => {
    const p = MyPromise.resolve(2222)
    return {
        then(f:any){
            setTimeout(()=>{
                f(p)
                throw 232
            },200)
        }
    }
});

setTimeout(() => {
    console.log(promise);
    console.log(d);
    promise.then(console.log)
}, 2000);
