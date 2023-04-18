import MyPromise from "./MyPromise";
let c = 0;
const p = MyPromise.resolve(1)
const pp = p.then(v => {
    var thenableA = {
        then(r: any) {
            r(thenableB)
        }
    }
    var thenableB = {
        then(r: any) {
            r(thenableA)
        }
    }
    return thenableA
})

setTimeout(() => {
    console.log(pp)
}, 1000);