import * as shlib from '../shlib'

import { ShTextStyle, compareTextStyle, ShTextSpan } from './ShTextSpan'
import { ShTerm } from './index'


export class ShSpanElement extends HTMLElement {

    public static create($term: ShTerm, text: string, style: Partial<ShTextStyle>): ShSpanElement;
    public static create($term: ShTerm, span: ShTextSpan): ShSpanElement;

    public static create($term: ShTerm, textOrSpan: string | ShTextSpan, style: Partial<ShTextStyle> = {}): ShSpanElement {
        const $span = shlib.createElement('shterm-span') as ShSpanElement
        $span._$term = $term

        if (typeof textOrSpan === 'string')
            $span.fromTextSpan(ShTextSpan.create(textOrSpan, style, $term.options))
        else
            $span.fromTextSpan(textOrSpan)

        return $span
    }

    private _$term: ShTerm | null = null
    private _charWidth: number | null = null

    constructor() {
        super()
    }

    public set $term(val: ShTerm) {
        this._$term = val
    }

    public get textStyle(): ShTextStyle {
        let f: shlib.Font
        if (! this.style.font)
            f = this._$term!.options.defaultEnFont
        else if (this.style.font === 'var(--shterm-cn-font)')
            f = this._$term!.options.defaultCnFont
        else
            f = shlib.Font.fromCssValue(this.style.font)

        return {
            font: f,
            foreColor: this.style.color,
            backColor: this.style.backgroundColor,
            bold: this.style.fontWeight === 'bold',
            italic: this.style.fontStyle === 'italic',
            underline: this.style.textDecoration === 'underline',
        }
    }

    public get charWidth(): number {
        shlib.assert(this._charWidth).hasValue()
        return this._charWidth!
    }

    public countColumns(): number {
        return this.textContent!.length * (this.hasAttribute('w') ? 2 : 1)
    }

    public columnToCharIndex(col: number): number {
        return col / (this.hasAttribute('w')? 2 : 1)
    }

    public fromTextSpan(span: ShTextSpan) {
        shlib.assert(this._$term).hasValue()
        shlib.assert(shlib.Font.charType(span.text[0]) !== 'ctrl')

        const __makeFontCssValue = (font: shlib.Font) => {
            if (font === this._$term!.options.defaultEnFont)
                return ''
            else if (font === this._$term!.options.defaultCnFont)
                return 'var(--shterm-cn-font)'
            else
                return font.cssValue
        } 

        this.textContent = span.text

        this.updateCssStyle({
            font: __makeFontCssValue(span.style.font),
            color: span.style.foreColor,
            backgroundColor: span.style.backColor,
            fontWeight: span.style.bold ? 'bold' : '',
            fontStyle: span.style.italic ? 'italic' : '',
            textDecoration: span.style.underline ? 'underline' : '',
        })

        this.updateLayout()
    }

    public toTextSpan(): ShTextSpan {
        shlib.assert(this._$term).hasValue()

        return ShTextSpan.create(this.textContent!, this.textStyle, this._$term!.options)
    }

    /**
     * 尝试将一个文本段合并入本元素的文本内容中。
     * 
     * @param span 要合并的文本段
     * @param where 合并位置。'begin' 表示将 span.text 加在头部，'end' 表示将 span.text 加在尾部
     * @returns 如果因为字符显示宽度不同或显示风格不同无法合并，返回 false，否则进行合并并返回 true
     */
    public mergeTextSpan(span: ShTextSpan, where: 'begin' | 'end'): boolean {
        shlib.assert(this._$term).hasValue()
        const thisSpan = this.toTextSpan()

        if (! compareTextStyle(thisSpan.style, span.style))
            return false

        if (thisSpan.charWidth !== span.charWidth)
            return false

        if (where === 'begin')
            this.setText(span.text + this.textContent)
        else
            this.setText(this.textContent + span.text)

        return true
    }

    /**
     * 更改文本段内容，并同步更新 CSS 样式宽度。
     * 
     * @param text 要设置的文本内容
     */
    public setText(text: string) {
        shlib.assert(this._$term).hasValue()
        shlib.assert(ShTextSpan.create(text, this.textStyle, this._$term!.options).charWidth === this.toTextSpan().charWidth)

        this.textContent = text

        const nc = this._$term!.charWidthToColumns(this.textStyle.font.charWidth(this.textContent![0], this.textStyle.bold))
        this.style.width = nc * this._$term!.columnWidth * text.length + 'px'
    }

    public mergeSibling() {
        const $prev = this.previousElementSibling as ShSpanElement | null
        const $next = this.nextElementSibling as ShSpanElement | null

        if ($prev && this.mergeTextSpan($prev.toTextSpan(), 'begin'))
            $prev.remove()
        if ($next && this.mergeTextSpan($next.toTextSpan(), 'end'))
            $next.remove()
    }

    public updateLayout() {
        shlib.assert(this._$term).hasValue()

        const span = this.toTextSpan()

        const nc = this._$term!.charWidthToColumns(span.charWidth)
        const letterSpacing = nc * this._$term!.columnWidth - span.charWidth
        this._charWidth = span.charWidth

        if (nc === 2)
            this.setAttribute('w', '')
        else
            this.removeAttribute('w')

        this.updateCssStyle({
            width: nc * this._$term!.columnWidth * span.text.length + 'px',
            '--shterm-span-letterspacing': letterSpacing + 'px',
        })
    }
}

customElements.define('shterm-span', ShSpanElement)