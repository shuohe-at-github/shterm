import * as shlib from '../shlib'

import { TextSpan } from './TextSpan'
import { ShTerm } from './index'


export class SpanElement extends HTMLElement {

    public static create($term: ShTerm, span: TextSpan): SpanElement {
        const $span = shlib.createElement('shterm-span') as SpanElement
        $span._$term = $term
        $span.fromTextSpan(span)

        return $span
    }

    private _$term: ShTerm | null = null

    constructor() {
        super()
    }

    public set $term(val: ShTerm) {
        this._$term = val
    }

    public countColumns(): number {
        return this.textContent!.length * (this.hasAttribute('w')? 2 : 1)
    }

    public columnToCharIndex(col: number): number {
        return col / (this.hasAttribute('w')? 2 : 1)
    }

    public fromTextSpan(span: TextSpan) {
        shlib.assert(this._$term).hasValue()
        shlib.assert(span.text.length !== 0)
        shlib.assert(shlib.Font.charType(span.text[0]) !== 'ctrl')

        const nc = this._$term!.charWidthToCols(span.charWidth!)
        const letterSpacing = nc * this._$term!.columnWidth - span.charWidth!

        this.textContent = span.text
        if (nc === 2)
            this.setAttribute('w', '')
        else
            this.removeAttribute('w')

        const st = span.style
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

    public toTextSpan(): TextSpan {
        shlib.assert(this._$term).hasValue()

        const ff = this.style.fontFamily
        const fs = parseInt(this.style.fontSize)
        let font: shlib.Font

        if (ff === '') {
            shlib.assert(isNaN(fs))
            font = this._$term!.options.defaultEnFont
        } else {
            shlib.assert(fs > 0)
            const f = new shlib.Font(ff, fs)
            if (f.eq(this._$term!.options.defaultEnFont))
                font = this._$term!.options.defaultEnFont
            else if (f.eq(this._$term!.options.defaultCnFont))
                font = this._$term!.options.defaultCnFont
            else
                font = f
        }

        return TextSpan.create(this.textContent!, {
            font: font,
            foreColor: this.style.color || this._$term!.options.foreColor,
            backColor: this.style.backgroundColor || this._$term!.options.backColor,
            bold: this.style.fontWeight === 'bold',
            italic: this.style.fontStyle === 'italic',
            underline: this.style.textDecoration === 'underline',
        }, this._$term!.options)
    }

    public mergeTextSpan(span: TextSpan, where: 'begin' | 'end'): boolean {
        shlib.assert(this._$term).hasValue()
        const thisSpan = this.toTextSpan()

        if (thisSpan.charWidth !== span.charWidth)
            return false

        const st = span.style
        if (! thisSpan.style.font.eq(st.font))
            return false

        if (thisSpan.style.foreColor !== st.foreColor || thisSpan.style !.backColor!== st.backColor)
            return false

        if (thisSpan.style!.bold !== st.bold || thisSpan.style!.italic !== st.italic || thisSpan.style!.underline !== st.underline)
            return false

        if (where === 'begin')
            this.textContent = span.text + this.textContent
        else
            this.textContent += span.text

        return true
    }

    public deleteColumns(startCol: number, endCol?: number): SpanElement[] {
        shlib.assert(this._$term).hasValue()

        const ncols = this.countColumns()
        if (endCol === undefined || endCol > ncols)
            endCol = ncols
        shlib.assert(0 <= startCol && startCol <= endCol && endCol <= ncols)

        if (startCol === endCol)
            return []

        const startIndex = this.columnToCharIndex(startCol)
        const endIndex = this.columnToCharIndex(endCol)
    
        const ts = this.toTextSpan()
        const $spans = [] as SpanElement[]

        if (startIndex >= 1) {
            this.textContent = this.textContent!.substring(0, Math.floor(startIndex))
            $spans.push(this)
        }
        if (startIndex > Math.floor(startIndex))
            $spans.push(SpanElement.create(this.$term!, new TextSpan(
                ' ',
                Object.assign({}, ts.style, { font: this.$term!.options.defaultEnFont, }),
                this.$term!.options,
            )))
        if (endIndex > Math.floor(endIndex))
            $spans.push(SpanElement.create(this.$term!, new TextSpan(
                ' ',
                Object.assign({}, ts.style, { font: this.$term!.options.defaultEnFont, }),
                this.$term!.options,
            )))
        if (Math.ceil(endIndex) < this.textContent!.length) {
            if (startIndex < 1) {
                this.textContent = this.textContent!.substring(Math.ceil(endIndex))
                $spans.push(this)
            } else {
                $spans.push(SpanElement.create(this.$term!, {
                    text: this.textContent!.substring(Math.ceil(endIndex)),
                    style: ts.style,
                    charWidth: ts.charWidth,
                }))
            }
        }

        return $spans
    }
}

customElements.define('shterm-span', SpanElement)