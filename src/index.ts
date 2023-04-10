
// import promise_test from 'promise-aplus-tests'
// const promise_test = require('promises-aplus-tests')
import MyPromise,{DeferredResult} from "./MyPromise"

interface Adapters{
    resolved<T>(value:T):MyPromise<T>,
    rejected<T>(reason:T):MyPromise<T>,
    deferred<T>():DeferredResult<T>
}

const adapter:Adapters = {
    resolved:MyPromise.resolve,
    rejected:MyPromise.reject,
    deferred:MyPromise.deferred
}

// promise_test(adapter)
module.exports = adapter
