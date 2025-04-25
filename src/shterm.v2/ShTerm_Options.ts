import * as shlib from '../shlib'

/**
 * 全局默认选项。
 */
export class ShTerm_Options {
    /**
     * 单例的全局默认选项。
     */
    private static global: ShTerm_Options = new ShTerm_Options({})

    /**
     * 按需设置全局默认选项。
     * 
     * @param options 选项值。
     */
    public static setGlobal(options: Partial<ShTerm_Options>) {
        ShTerm_Options.global = new ShTerm_Options(options)
    }

    /**
     * 获取全局默认选项。
     */
    public static getGlobal(): ShTerm_Options {
        return ShTerm_Options.global
    }

    public static create(options: Partial<ShTerm_Options>): ShTerm_Options {
        return new ShTerm_Options(options)
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
     * 传入的 enFontName 必须是等宽字体；cnFontName 必须是中文字体。
     * 
     * @param options 按需设置的选项值。
     */
    constructor(options: Partial<ShTerm_Options>) {
        this.enFontName = options.enFontName || 'Consolas'
        this.enFontSize = options.enFontSize || 16
        this.cnFontName = options.cnFontName || '微软雅黑'
        this.cnFontSize = options.cnFontSize || 16
        this.rowHeightRatio = options.rowHeightRatio || 1.5
        this.foreColor = options.foreColor || 'white'
        this.backColor = options.backColor || 'black'

        this.defaultEnFont = new shlib.Font(this.enFontName, this.enFontSize)
        shlib.assert(this.defaultEnFont.monoCharWidth > 0, `错误："${this.enFontName}" 不是一个等宽字体。`)

        this.defaultCnFont = new shlib.Font(this.cnFontName, this.cnFontSize)
        shlib.assert(this.defaultCnFont.hasGlyph('中'), `错误："${this.cnFontName}" 不是一个中文字体。`)
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
