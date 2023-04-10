import { assert } from "console"
import MyPromise, { PromiseUtils } from "./MyPromise"
const promise = new MyPromise((res,rej)=>{
    // rej(12)
    setTimeout(() => {
        rej(12)
    },1000);
})
let d = promise.then(undefined,()=>({then(){
    console.log(2222)
    return 1}}))
let e = d.then(v=>v,console.log)


setTimeout(() => {
    console.log(promise)
    console.log(d)
    console.log(e)

    assert(promise.state === PromiseUtils.PromiseState.rejected,1)
    assert(d.state === PromiseUtils.PromiseState.fulfilled,2)
    assert(d.value === promise.reason,3)
    assert(e.value === d.value,4)
}, 2000);



