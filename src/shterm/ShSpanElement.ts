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
    private _textStyle: ShTextStyle | null = null
    private _charWidth: number | null = null

    constructor() {
        super()
    }

    public set $term(val: ShTerm) {
        this._$term = val
    }

    public get textStyle(): ShTextStyle {
        shlib.assert(this._textStyle).hasValue()
        return this._textStyle!
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

        const nc = this._$term!.charWidthToColumns(span.charWidth!)
        const letterSpacing = nc * this._$term!.columnWidth - span.charWidth
        this._charWidth = span.charWidth

        this.textContent = span.text
        if (nc === 2)
            this.setAttribute('w', '')
        else
            this.removeAttribute('w')

        const st = span.style
        this._textStyle = st
        this.updateStyle({
            fontFamily: st.font.name === this._$term!.options.defaultEnFont.name ? '' : st.font.name,
            fontSize: st.font.size === this._$term!.options.defaultEnFont.size ? '' : `${st.font.size}px`,
            color: st.foreColor === this._$term!.options.foreColor ? '' : st.foreColor,
            backgroundColor: st.backColor === this._$term!.options.backColor ? '' : st.backColor!,
            fontWeight: st.bold ? 'bold' : '',
            fontStyle: st.italic ? 'italic' : '',
            textDecoration: st.underline ? 'underline' : '',
            width: nc * this._$term!.columnWidth * span.text.length + 'px',
            paddingLeft: letterSpacing ? (letterSpacing / 2 + 'px') : '',
            letterSpacing: letterSpacing ? (letterSpacing + 'px') : '',
        })
    }

    public toTextSpan(): ShTextSpan {
        shlib.assert(this._$term).hasValue()
        shlib.assert(this._textStyle).hasValue()

        return ShTextSpan.create(this.textContent!, this._textStyle!, this._$term!.options)
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
        shlib.assert(ShTextSpan.create(text, this._textStyle!, this._$term!.options).charWidth === this.toTextSpan().charWidth)

        this.textContent = text

        const nc = this._$term!.charWidthToColumns(this._textStyle!.font.charWidth(this.textContent![0], this._textStyle!.bold))
        this.style.width = nc * this._$term!.columnWidth * text.length + 'px'
    }
}

customElements.define('shterm-span', ShSpanElement)