import * as shlib from '../shlib'

import { ShTermOptions } from './ShTermOptions'

/**
 * 文本显示样式。
 */
export interface ShTextStyle {
    font: shlib.Font
    foreColor: string   // CSS 颜色字符串
    backColor: string   // CSS 颜色字符串
    bold: boolean
    italic: boolean
    underline: boolean
}

/**
 * 文本段类。一个文本段中，所有字符的显示宽度都相同。
 */
export class ShTextSpan {

    /**
     * 创建新的文本段对象。
     * 
     * @param text 文本段内容
     * @param style 文本显示样式
     * @param options 全局默认选项
     * @returns 生成的文本段对象
     */
    public static create(text: string, style: Partial<ShTextStyle>, options?: ShTermOptions): ShTextSpan {
        return new ShTextSpan(text, style, options)
    }

    /**
     * 按字符显示宽度分割文本。让分割出来的每个文本段中的字符具有相同的显示宽度。字符显示宽度的测量依赖于当前中英文字体的设置。
     * 
     * @param text 要分割的文本
     * @param style 文本的样式
     * @param options 全局默认选项
     * @returns 分割后的文本段数组
     */
    public static splitText(text: string, style: Partial<ShTextStyle>, options?: ShTermOptions): ShTextSpan[] {
        if (!options)
            options = ShTermOptions.getGlobal()

        const result: ShTextSpan[] = []
        let ci = -1
        let cw = -1
        let cf = options.defaultEnFont

        for (let i = 0; i < text.length; i++) {
            const c = text[i]
            const f = style.font || options.chooseFontForChar(c)
            const w = f.charWidth(c, style.bold)
            if (shlib.Font.charType(c) === 'ctrl' || cw !== w || !cf.eq(f)) {
                // 本字符开始是一个新的文本段
                // 如果前一个文本段有积累，将其加入结果集
                if (ci >= 0) {
                    result.push(ShTextSpan.create(
                        text.substring(ci, i),
                        Object.assign({}, style, { font: cf }),
                        options,
                    ))
                }
                // 标记新的文本段开始
                ci = i
                cw = w
                cf = f
            }

            // 继续累积当前文本段
        }
        if (ci >= 0) {
            result.push(ShTextSpan.create(
                text.substring(ci),
                Object.assign({}, style, { font: cf }),
                options,
            ))
        }

        return result
    }

    public text: string               // 文本内容
    public style: ShTextStyle           // 文本绘制样式
    public charWidth: number          // 文本字符实际绘制宽度，单位为像素

    /**
     * 构造函数。
     * 
     * @param text 本文段内容
     * @param style 文本显示样式
     * @param options 全局默认选项
     */
    constructor(text: string, style: Partial<ShTextStyle>, options?: ShTermOptions) {
        shlib.assert(text.length > 0)

        if (! options)
            options = ShTermOptions.getGlobal()

        this.text = text
        this.style = {
            font: style.font || options.chooseFontForChar(text[0]),
            foreColor: style.foreColor || options.foreColor,
            backColor: style.backColor || options.backColor,
            bold: style.bold || false,
            italic: style.italic || false,
            underline: style.underline || false,
        }
        this.charWidth = this.style.font.charWidth(text[0], this.style.bold)

        // 检查文本段中每个字符的显示宽度是否一致
        for (let i = 1; i < text.length; i++) {
            const w = this.style.font.charWidth(text[i], this.style.bold)
            shlib.assert(w === this.charWidth, '错误：文本段中字符显示宽度不同。')
        }
    }
}
