import * as shlib from '../shlib'

/**
 * 全局默认选项。
 */
export class ShTermOptions {
    /**
     * 单例的全局默认选项。
     */
    private static global: ShTermOptions = new ShTermOptions({})

    /**
     * 按需设置全局默认选项。
     * 
     * @param options 选项值。
     */
    public static setGlobal(options: Partial<ShTermOptions>) {
        ShTermOptions.global = new ShTermOptions(options)
    }

    /**
     * 获取全局默认选项。
     */
    public static getGlobal(): ShTermOptions {
        return ShTermOptions.global
    }

    public create(options: Partial<ShTermOptions>): ShTermOptions {
        return new ShTermOptions(options)
    }

    public readonly enFontName: string
    public readonly enFontSize: number
    public readonly cnFontName: string
    public readonly cnFontSize: number
    public readonly rowHeightRatio: number  // 行高相对于字体大小的倍数
    public readonly foreColor: string
    public readonly backColor: string

    public readonly defaultEnFont: shlib.Font
    public readonly defaultCnFont: shlib.Font

    /**
     * 构造函数。全局默认选项对象创建后，其中的值不能更改。只能重新创建新的对象。
     * 
     * @param options 按需设置的选项值。
     */
    constructor(options: Partial<ShTermOptions>) {
        this.enFontName = options.enFontName || 'Consolas'
        this.enFontSize = options.enFontSize || 16
        this.cnFontName = options.cnFontName || '微软雅黑'
        this.cnFontSize = options.cnFontSize || 16
        this.rowHeightRatio = options.rowHeightRatio || 1.5
        this.foreColor = options.foreColor || 'white'
        this.backColor = options.backColor || 'black'

        this.defaultEnFont = new shlib.Font(this.enFontName, this.enFontSize)
        shlib.assert(this.defaultEnFont.monoCharWidth > 0)

        this.defaultCnFont = new shlib.Font(this.cnFontName, this.cnFontSize)
        shlib.assert(this.defaultCnFont.hasGlyph('中'))
    }

    /**
     * 为指定的字符选择合适的字体。
     * 
     * @param c 字符。
     * @returns 英文或中文字体对象。
     */
    public chooseFontForChar(c: string): shlib.Font {
        const t = shlib.Font.charType(c)
        
        if (t === 'ctrl' || t === 'narrow')
            return this.defaultEnFont
        
        if (t === 'wide')
            return this.defaultCnFont

        return this.defaultEnFont.hasGlyph(c) ? this.defaultEnFont : this.defaultCnFont
    }

}
