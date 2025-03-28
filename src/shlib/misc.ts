import { assert } from './assert'

export function isNumber(val: any) {
    return typeof val === 'number'
}

export function isBoolean(val: any) {
    return typeof val === 'boolean'
}

export function isString(val: any) {
    return typeof val ==='string'
}

export function isArray(val: any) {
    return Array.isArray(val)
}

export function isObject(val: any) {
    return Object.prototype.toString.call(val) === '[object Object]'
}

export function isFunction(val: any) {
    return typeof val === 'function'
}

/**
 * 将一个驼峰大小写字符串转换为横线分隔字符串。
 *
 * @param src 要转换的字符串，形如 '`updateDatabaseTable`'。
 * @return 转换后的字符串，形如 '`update-database-table`'
 */
export function camelToDash(src: string): string {
    if (src[0] === '-')
        return src

    const result: string[] = []
    let i = 0, j = 0

    for (const c of src) {
        if (c >= 'A' && c <= 'Z') {
            if (i < j)
                result.push(src.slice(i, j))
            result.push('-')
            result.push(c.toLocaleLowerCase())
            i = j + 1
        }
        j++
    }
    if (i < j)
        result.push(src.slice(i))

    return result.join('')
}

/**
 * 将一个横线份额字符串转换为驼峰大小写字符串。
 * 
 * @param src 要转换的字符串，形如 '`update-database-table`' 
 * @return 转换后的字符串，形如 '`updateDatabaseTable`'
 */
export function dashToCamel(src: string): string {
    if (src[0] === '-')
        return src

    const result: string[] = []
    const words = src.split('-')

    result.push(words[0])
    for (let i = 1; i < words.length; i++)
        result.push(words[i][0].toUpperCase(), words[i].substring(1))

    return result.join('')
}

/**
 * 将 CSS 字符串解析成 CSS 属性对象。
 * 
 * @param text CSS 属性字符串
 * @returns CSS 属性对象
 */
export function parseCssText(text: string): Record<string, string> {
    const result: Record<string, string> = {}
    const lines = text.split(';')

    for (let line of lines) {
        line = line.trim()
        if (! line.length)
            continue
        let [key, value] = line.split(':')
        result[dashToCamel(key.trim())] = value.trim()
    }
    
    return result
}

/**
 * 将 CSS 属性对象装配成 CSS 属性字符串。
 * 
 * @param {Record<string, string>} style 一个 CSS 属性对象
 * @return {string} CSS 字符串
 */
export function buildCssText(style: Record<string, string>): string {
    const result: string[] = []

    for (const [key, value] of Object.entries(style)) {
        result.push(camelToDash(key))
        result.push(':')
        result.push(value as string)
        result.push(';')
    }

    return result.join('')
}

/**
 * 快捷创建一个 DOM 元素，并设置其 HTML 属性（Attribute）和子元素。有多种灵活的
 * 使用方式。如：
 * 1. `createElement(tagName)` 简单创建元素；
 * 2. `createElement(tagName, className)` 创建元素并设置其 CSS 类；
 * 3. `createElement(tagName, className, attrs)` 创建元素并设置其 CSS 类和其他属性；
 * 4. `createElement(tagName, className, attrs, children)` 创建元素并设置其 CSS 类、其他属性和子元素；
 * 5. `createElement(tagName, className, children)` 创建元素并设置其 CSS 类和子元素；
 * 6. `createElement(tagName, children)` 创建元素并设置其子元素；
 * 
 * @param tagName 元素标签名
 * @param {Optional<string>} className 该元素的 CSS 类名
 * @param {Optional<Record<string, string>>} attrs 元素的 HTML 属性
 * @param {Optional<Node[]>} children 元素的子元素
 * @returns {Element} 创建的 DOM 元素
 */
export function createElement(tagName: string, className?: any , attrs?: any, children?: any): Element {
    if (isArray(attrs)) {
        children = attrs
        attrs = undefined
    }

    if (isObject(className)) {
        attrs = className
        className = undefined
    }
    else if (isArray(className)) {
        children = className
        attrs = undefined
        className = undefined
    }

    const el = document.createElement(tagName)
    if (className) {
        assert(className).isString()
        el.className = className
    }

    if (attrs) {
        assert(attrs).isObject()
        for (let key in attrs) {
            if (key === 'className')
                el.className = attrs[key]
            else if (key === 'style')
                el.style.cssText = attrs[key]
            else
                el.setAttribute(key, attrs[key])
        }
    }
    if (children) {
        assert(children).isArray()
        for (let child of children) {
            assert(isString(child) || child instanceof Node)
            el.append(child)
        }
    }

    return el
}

/**
 * 为 String 类增加快捷方法。
 */
declare global {
    interface String {
        camelToDash(): string
        dashToCamel(): string
    }
}
Object.assign(String.prototype, {
    /**
     * 将一个驼峰大小写字符串转换为横线分隔字符串。
     *
     * @return {string} 转换后的字符串，形如 '`update-database-table`'
     */
    camelToDash: function(): string {
        return camelToDash(this as unknown as string)
    },
    /**
     * 将一个横线份额字符串转换为驼峰大小写字符串。
     *
     * @return {string} 转换后的字符串，形如 '`updateDatabaseTable`'
     */
    dashToCamel: function(): string {
        return dashToCamel(this as unknown as string)
    },
})

/**
 * 保存被注册过、需要响应 clickout 事件的页面元素。
 */
let _clickoutWatchers: HTMLElement[] = []
/**
 * 设置 window 对象侦听器，在需要的时候向被注册过的元素发送 clickout 事件。
 */
export function setupClickout() {
    window.addEventListener('pointerdown', (e) => {
        const path = e.composedPath()
        let rest = _clickoutWatchers
        for (let et of path)
            rest = rest.filter(v => (v !== et))

        const clickout = new CustomEvent('clickout', { detail: e })
        rest.forEach(el => el.dispatchEvent(clickout))
    }, true)
}


/**
 * 为 HTMLElement 类增加快捷方法。
 */
declare global {
    interface HTMLElement {
        isAncestorOf(el: HTMLElement): boolean
        locationInViewport(): { left: number, top: number }
        locationInPage(): { left: number, top: number }
        isPointInside(x: number, y: number): boolean
        addClass(className: string): void
        removeClass(className: string): void
        setClass(className: string): void
        hasClass(className: string): boolean
        toggleClass(className: string, condition?: boolean): void
        updateStyle(style: string | Record<string, string>): void
        clearStyle(): void
        on(event: string, handler: EventListener, options?: EventListenerOptions): EventListener
        off(event: string, handler: EventListener, options?: EventListenerOptions): void
        enableClickout(): void
        disableClickout(): void
    }
}
Object.assign(HTMLElement.prototype, {
    /**
     * 判断是否自己是指定元素的祖先。
     * 
     * @param el 要判断的元素
     * @returns 是自己的祖先则返回 true，否则返回 false
     */
    isAncestorOf: function(el: HTMLElement): boolean {
        let pe = el.parentElement
        while (pe !== null && pe !== this as unknown as HTMLElement)
            pe = pe.parentElement

        return pe === this as unknown as HTMLElement
    },
    /**
     * 返回元素相对于浏览器视口的绝对位置。
     * 
     * @returns 元素的相对于当前文档的 left 和 top
     */
    locationInViewport: function(): {left: number, top: number} {
        const r = (this as unknown as HTMLElement).getBoundingClientRect()
        return { left: r.left, top: r.top }
    },
    /**
     * 返回元素相对于当前文档的绝对位置。
     *
     * @returns 元素的相对于当前文档的 left 和 top
     */
    locationInPage: function(): {left: number, top: number} {
        const r = (this as unknown as HTMLElement).getBoundingClientRect()
        return { left: r.left + window.scrollX, top: r.top + window.scrollY }
    },
    /**
     * 判断一个视口坐标点是否在元素内部。
     * 
     * @param x 横坐标
     * @param y 纵坐标
     * @returns 坐标点在元素内部则返回 true，否则返回 false
     */
    isPointInside: function(x: number, y: number): boolean {
        const r = (this as unknown as HTMLElement).getBoundingClientRect()
        return (r.left <= x && x < r.right && r.top <= y && y < r.bottom)
    },
    /**
     * 向元素的 classList 中增加一个 CSS 类。
     * 
     * @param className 要增加的 CSS 类名
     */
    addClass: function(className: string) {
        (this as unknown as HTMLElement).classList.add(className)
    },
    /**
     * 从元素的 classList 中删除一个 CSS 类。
     * 
     * @param className 要删除的 CSS 类名
     */
    removeClass: function(className: string) {
        (this as unknown as HTMLElement).classList.remove(className)
    },
    /**
     * 设置元素的 CSS 类名。
     * 
     * @param className 要设置的 CSS 类名；如果有多个类名，用空格分隔
     */
    setClass: function(className: string) {
        (this as unknown as HTMLElement).className = className
    },
    /**
     * 判断一个元素是否有指定的 CSS 类。
     *
     * @param {string} className 要判断的 CSS 类名
     * @returns {boolean} 元素有指定的 CSS 类则返回 true，否则返回 false
     */
    hasClass: function (className: string): boolean {
        return (this as unknown as HTMLElement).classList.contains(className)
    },
    /**
     * 根据条件切换指定 CSS 类是否存在。
     * 
     * @param className 要增加或删除的 CSS 类名
     * @param condition 条件
     */
    toggleClass: function(className: string, condition?: boolean) {
        if (condition === undefined)
            condition = (this as unknown as HTMLElement).classList.contains(className)

        if (condition)
            (this as unknown as HTMLElement).classList.add(className)
        else
            (this as unknown as HTMLElement).classList.remove(className)
    },
    /**
     * 更新元素的 CSS 属性。要更新的属性如果在元素的 style 中存在，则将会被替换，否则就新增.
     * 元素的 style 中其他的属性将得以保留。
     * 
     * @param newStyle 要设置的 CSS 属性，用文本串或属性对象形式均可
     */
    updateStyle: function(newStyle: string | Record<string, string>) {
        if (newStyle === '' || Object.keys(newStyle).length === 0)
            return

        if (isString(newStyle))
            newStyle = parseCssText(newStyle as string)

        const currStyle = parseCssText((this as unknown as HTMLElement).style.cssText)
        Object.assign(currStyle, newStyle);
        (this as unknown as HTMLElement).style.cssText = buildCssText(currStyle)
    },
    /**
     * 清空元素的 CSS 属性。
     */
    clearStyle: function() {
        (this as unknown as HTMLElement).style.cssText = ''
    },
    /**
     * 为元素设置指定事件的侦听器。
     * 
     * @param event 要设置侦听器的事件 
     * @param handler 侦听器
     * @param options 与 EventTarget.addEventListener 的 options 参数相同
     * @return 被设置的侦听器，即参数 handler 本身
     */
    on: function(event: string, handler: EventListener, options?: EventListenerOptions): EventListener {
        (this as unknown as HTMLElement).addEventListener(event, handler, options)
        return handler
    },
    /**
     * 为元素删除指定事件的侦听器。
     * 
     * @param event 要删除侦听器的事件
     * @param handler 要删除的侦听器
     * @param options 与 EventTarget.removeEventListener 的 options 参数相同。
     */
    off: function(event: string, handler: EventListener, options?: EventListenerOptions) {
        (this as unknown as HTMLElement).removeEventListener(event, handler, options)
    },
    /**
     * 将本元素注册，使得 clickout 事件可以发送到本元素。
     */
    enableClickout: function() {
        _clickoutWatchers.push(this as unknown as HTMLElement)
    },
    /**
     * 将本元素解注册，使得 clickout 事件不再发送到本元素。
     */
    disableClickout: function () {
        _clickoutWatchers = _clickoutWatchers.filter(v => (v !== (this as unknown as HTMLElement)))
    },
})

