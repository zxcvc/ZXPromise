
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

module.exports = adapter
