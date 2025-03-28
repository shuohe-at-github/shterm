/**
 * 断言工具类。
 */
class Assert {

    static __instance__: Assert = new Assert()

    public __val__: any
    public __failstr__: string | undefined

    static __judge__(cond: boolean) {
        if (! cond)
            throw new Error(Assert.__instance__.__failstr__ || 'Assersion failed.')
    }

    constructor() {
        this.__val__ = null
        this.__failstr__ = ''
    }

    defined() {
        Assert.__judge__(this.__val__ !== undefined)
    }

    hasValue() {
        Assert.__judge__(this.__val__ !== undefined && this.__val__ !== null)
    }

    notEmpty() {
        Assert.__judge__(this.__val__ && this.__val__.length > 0)
    }

    either(v1: any, v2: any) {
        Assert.__judge__(this.__val__ === v1 || this.__val__ === v2)
    }

    oneOf(...args: any[]) {
        Assert.__judge__(args.indexOf(this.__val__) >= 0)
    }

    inList(list: any[]) {
        Assert.__judge__(list.indexOf(this.__val__) >= 0)
    }

    inRange(v1: any, v2: any) {
        Assert.__judge__(v1 <= this.__val__ && this.__val__ <= v2)
    }

    isNumber() {
        Assert.__judge__(typeof this.__val__ === 'number')
    }

    isBoolean() {
        Assert.__judge__(typeof this.__val__ === 'boolean')
    }

    isString() {
        Assert.__judge__(typeof this.__val__ === 'string')
    }

    isArray() {
        Assert.__judge__(Array.isArray(this.__val__))
    }

    isObject() {
        Assert.__judge__(Object.prototype.toString.call(this.__val__) === '[object Object]')
    }

    isFunction() {
        Assert.__judge__(typeof this.__val__ ==='function')
    }

    instanceOf<T extends Function>(cls: T) {
        Assert.__judge__(this.__val__ instanceof cls)
    }
}

/**
 * 返回包裹着指定值的断言对象，以便于调用断言对象的各种断言方法。如果指定值是布尔值，
 * 则将其视为断言结果，假如为 false 则抛出异常。
 * 
 * @param val 需要进行后续断言检查的指定值
 * @returns 断言对象
 */
export function assert(val: any, failstr?: string): Assert {
    Assert.__instance__.__failstr__ = failstr
    if (typeof val === 'boolean') {
        Assert.__judge__(val)
    } else {
        Assert.__instance__.__val__ = val
    }

    return Assert.__instance__
}
