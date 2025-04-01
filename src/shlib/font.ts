import { assert } from "./assert"

const ChineseFonts = [
    '微软雅黑', '宋体', '黑体', '仿宋', '楷体', '仿宋_GB3212', '楷体_GB2312', '新宋体',
    '"Microsoft YaHei"', 'SimSun', 'SimHei', 'FangSong', 'KaiTi', 'NSimSun', 'FangSong_GB2312', 'KaiTi_GB2312',
]

export function registerChineseFonts(...fonts: string[]) {
    ChineseFonts.push(...fonts)
}

export type CharType = 'wide' | 'narrow' | 'ctrl' | 'unknown'
/**
 * 与字体相关的工具类。
 */
export class Font {

    /**
     * 缓存用于测量文本的离屏 Canvas 元素和上下文。
     */
    private static $canvas = document.createElement('canvas')
    private static $ctx = Font.$canvas.getContext('2d', { willReadFrequently: true, })!

    /**
     * 判断一个字符是否是 Unicode 标准中的常用宽字符。
     * 
     * @param c 要判断的字符
     * @returns 如果是常用宽字符，返回 'wide'；如果是常用窄字符，返回 'narrow'；如果是控制字符，则返回 'ctrl'；否则返回 'unknown'。
     */
    public static charType(c: string): CharType {
        const code = c.charCodeAt(0)!

        // 中日韩汉字为主
        if (code >= 0x3250 && code <= 0xA4C6) return 'wide'
        // ASCII 字符
        if (code >= 0x0020 && code < 0x007F) return 'narrow'
        // 控制符
        if (code <= 0x001F || (code >= 0x007F && code <= 0x009F)) return 'ctrl'
        // 其他宽字符
        if (code >= 0x2E80 && code <= 0x303E) return 'wide'
        if (code >= 0x3041 && code <= 0x3247) return 'wide'
        if (code >= 0xF900 && code <= 0xFAFF) return 'wide'
        if (code >= 0xFE10 && code <= 0xFE19) return 'wide'
        if (code >= 0xFE30 && code <= 0xFE6B) return 'wide'
        if (code >= 0xFF01 && code <= 0xFF60) return 'wide'
        if (code >= 0xFFE0 && code <= 0xFFE6) return 'wide'
        
        return 'unknown'
    }

    /**
     * 判断一个字符是否是常用中文字符。
     * 
     * @param c 要判断的字符
     * @returns 是常用中文字符，返回 true；否则返回 false。
     */
    public static isChineseChar(c: string): boolean {
        const code = c.codePointAt(0)!
        
        // CJK 统一汉字（基本区块）
        if (code >= 0x4E00 && code <= 0x9FFF) return true
        // 中日韩符号和标点
        if (code >= 0x3001 && code <= 0x301C) return true
        // 全角标点符号
        if (code >= 0xFF01 && code <= 0xFF60) return true

        return false
    }

    private _name: string
    private _sizeInPixel: number
    private _isChineseFont: boolean
    private _monoCharWidth: number
    private _charWidthCache: Map<string, number>
    private _hasGlyphCache: Map<number, boolean>

    constructor(name: string, sizeInPixel: number) {
        assert(name.length > 0)
        assert(sizeInPixel > 0)

        this._name = name
        this._sizeInPixel = sizeInPixel
        this._isChineseFont = ChineseFonts.includes(this._name)

        Font.$ctx.font = `${this._sizeInPixel}px ${this._name}`
        const w1 = this.measureText('i').width
        const w2 = this.measureText('W').width

        this._monoCharWidth = (w1 === w2) ? w1 : 0

        this._charWidthCache = new Map()
        if (! this._monoCharWidth) {
            this._charWidthCache.set('i', w1)
            this._charWidthCache.set('W', w2)
        }

        this._hasGlyphCache = new Map()
    }

    public get name(): string {
        return this._name
    }

    public get size(): number {
        return this._sizeInPixel
    }

    public get monoCharWidth(): number {
        return this._monoCharWidth
    }

    public eq(other: Font): boolean {
        return this._name === other._name && this._sizeInPixel === other._sizeInPixel
    }
    
    /**
     * 获取指定字符的显示宽度。
     * 
     * @param c 要计算宽度的字符
     * @returns 字符显示宽度，单位为像素。
     */
    public charWidth(c: string, bold?: boolean): number {
        assert(c.length === 1)

        const ct = Font.charType(c)
        if (ct === 'narrow' && this._monoCharWidth) return this._monoCharWidth
        if (ct === 'wide') return this._sizeInPixel
        if (ct === 'ctrl') return 0
        
        // 如果是未知字符，则先尝试从缓存中获取结果
        const k = c + (bold ? 'b' : '')
        const cached = this._charWidthCache.get(k)
        if (cached !== undefined)
            return cached

        // 否则，计算并缓存结果
        const w = this.measureText(c, bold).width
        this._charWidthCache.set(k, w)

        return w
    }

    /**
     * 检测本字体中是否包含指定字符的字形。
     * 
     * @param c 要检查的字符
     * @returns 本字体中是否包含指定字符的字形，返回 true；否则返回 false。
     */
    public hasGlyph(c: string): boolean {
        assert(c.length === 1)

        // 标准 ASCII 字符一定存在于所有字体
        const code = c.codePointAt(0)!
        if (code <= 0x007E)
            return true

        // 中文字体包含常用汉字和标点
        if (Font.isChineseChar(c) && this._isChineseFont)
            return true

        // 否则，先尝试预取缓存的结果
        const cached = this._hasGlyphCache.get(code)
        if (cached !== undefined)
            return cached

        // 否则，先从字符尺寸来判断
        Font.$ctx.font = `32px ${this._name}, monospace`
        const m1 = Font.$ctx.measureText(c)

        Font.$ctx.font = '32px monospace'
        const m2 = Font.$ctx.measureText(c)

        // 遍历 m1 和 m2 的几个关键属性，检查它们是否相等
        const fields = [
            'width',
            'actualBoundingBoxAscent',
            'actualBoundingBoxDescent',
            'actualBoundingBoxLeft',
            'actualBoundingBoxRight',
        ]
        for (const f of fields) {
            if (m1[f as keyof TextMetrics] !== m2[f as keyof TextMetrics]) {
                // 如果属性值不相等，说明没有发生 fallback，意味着本字体中包含此字形
                this._hasGlyphCache.set(code, true)
                return true
            }
        }

        // 如果 m1 和 m2 的属性都相等，进一步比较字形的像素点
        Font.$ctx.textBaseline = 'top'
        Font.$ctx.textAlign = 'left'
        Font.$ctx.fillStyle = 'white'

        const sz = 32
        Font.$ctx.font = `${sz}}px ${this._name}, monospace`
        Font.$ctx.clearRect(0, 0, sz, sz)
        Font.$ctx.fillText(c, m1.actualBoundingBoxAscent, 0)
        const data1 = new Uint32Array(Font.$ctx.getImageData(0, 0, sz, sz).data.buffer)

        Font.$ctx.font = `${sz}px monospace`
        Font.$ctx.clearRect(0, 0, sz, sz)
        Font.$ctx.fillText(c, m1.actualBoundingBoxAscent, 0)
        const data2 = new Uint32Array(Font.$ctx.getImageData(0, 0, sz, sz).data.buffer)

        for (let i = 0; i < data1.length; i++)
            if (data1[i] !== data2[i]) {
                this._hasGlyphCache.set(code, true)
                return true
            }

        this._hasGlyphCache.set(code, false)
        return false
    }

    /**
     * 测量本字体下的指定文本字符串的绘制尺寸信息。
     * 
     * @param text 要测量的文本字符串
     * @param bold 是否加粗，默认为 false
     * @returns 文本字符串的绘制尺寸信息。
     */
    public measureText(text: string, bold?: boolean): TextMetrics {
        Font.$ctx.font = `${bold ? 'bold ' : ''}${this._sizeInPixel}px ${this._name}`
        return Font.$ctx.measureText(text)
    }    
}
