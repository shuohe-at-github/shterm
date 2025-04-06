import * as shlib from '../shlib'

import { ShTextStyle, compareTextStyle, ShTextSpan } from './ShTextSpan'
import { ShTerm } from './index'


export class ShSpanElement extends HTMLElement {

    public static create($term: ShTerm, span: ShTextSpan): ShSpanElement {
        const $span = shlib.createElement('shterm-span') as ShSpanElement
        $span._$term = $term
        $span.fromTextSpan(span)

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

        const nc = this._$term!.charWidthToCols(span.charWidth!)
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
            this.textContent = span.text + this.textContent
        else
            this.textContent += span.text

        return true
    }

    /**
     * 将文本段从指定位置分裂成两个文本段。
     * 
     * @param charIndex 要分裂的字符位置，从 0 开始，必须小于文本长度。
     * @returns 分裂出的文本段元素数组。如果要分裂的位置在一个宽字符中间，则该宽字符会被分裂成两个窄的空白字符。
     */
    public split(charIndex: number): (ShSpanElement | null)[] {
        shlib.assert(this._$term).hasValue()
        shlib.assert(0 <= charIndex && charIndex <= this.textContent!.length)

        const txt = this.textContent!

        if (charIndex === 0)
            return [null, this]
        else if (charIndex === txt.length)
            return [this, null]

        if (charIndex === Math.floor(charIndex)) {
            const $span2 = this.cloneNode(true) as ShSpanElement
            this.textContent = txt.substring(0, charIndex)
            $span2.textContent = txt.substring(charIndex)
            return [this, $span2] 
        }

        // charIndex 是小数，意味着分裂位置在一个宽字符中间，需要将这个宽字符分裂成两个窄的空白字符
        const $span2 = ShSpanElement.create(this._$term!, ShTextSpan.create(' ', this._textStyle!, this._$term!.options))
        const $span3 = $span2.cloneNode(true) as ShSpanElement
        const $span4 = this.cloneNode(true) as ShSpanElement
        this.textContent = txt.substring(0, Math.floor(charIndex))
        $span4.textContent = txt.substring(Math.ceil(charIndex))

        return [
            charIndex > 1 ? this : null,
            $span2,
            $span3,
            charIndex < txt.length - 1 ? $span4 : null,
        ]

    }

    /**
     * 将本文本段当中的指定列数的内容删除，返回因为删除而分裂出的文本段数组。
     * 
     * @param startCol 要删除内容的在本文本段内的起始列号。必须满足 0 <= startCol < endCol。
     * @param endCol 要删除内容在本文本段内的结束列号（不包括）。如果未指定，或者值大于文本段的总列数，则视为删除到文本段末尾。
     * @returns 因为删除而分裂出的文本段数组。
     */
    public deleteText(startCol: number, endCol?: number): ShSpanElement[] {
        shlib.assert(this._$term).hasValue()

        const ncols = this.countColumns()
        if (endCol === undefined || endCol > ncols)
            endCol = ncols
        shlib.assert(0 <= startCol && startCol < endCol)

        const startIndex = this.columnToCharIndex(startCol)
        const endIndex = this.columnToCharIndex(endCol)
    
        const ts = this.toTextSpan()
        const $spans = [] as ShSpanElement[]

        if (startIndex >= 1) {
            this.textContent = ts.text.substring(0, Math.floor(startIndex))
            $spans.push(this)
        }
        if (startIndex > Math.floor(startIndex))
            $spans.push(ShSpanElement.create(this._$term!, new ShTextSpan(
                ' ',
                Object.assign({}, ts.style, { font: this._$term!.options.defaultEnFont, }),
                this._$term!.options,
            )))
        if (endIndex > Math.floor(endIndex))
            $spans.push(ShSpanElement.create(this._$term!, new ShTextSpan(
                ' ',
                Object.assign({}, ts.style, { font: this._$term!.options.defaultEnFont, }),
                this._$term!.options,
            )))
        if (Math.ceil(endIndex) < ts.text.length) {
            if (startIndex >= 1) {
                $spans.push(ShSpanElement.create(this._$term!, {
                    text: ts.text.substring(Math.ceil(endIndex)),
                    style: ts.style,
                    charWidth: ts.charWidth,
                }))
            } else {
                this.textContent = ts.text.substring(Math.ceil(endIndex))
                $spans.push(this)
            }
        }

        return $spans
    }
}

customElements.define('shterm-span', ShSpanElement)