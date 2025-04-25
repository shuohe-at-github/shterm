import * as shlib from '../shlib'

import { ShTerm } from './ShTerm'
import { ShTerm_Paragraph } from './ShTerm_Paragraph'


/**
 * 文本显示样式。
 */
interface ShTerm_TextStyle {
    font: 'en' | 'cn' | shlib.Font
    foreColor: string   // CSS 颜色字符串，'' 表示默认颜色
    backColor: string   // CSS 颜色字符串，'' 表示默认颜色
    bold: boolean
    italic: boolean
    underline: boolean
}


export class ShTerm_Span extends HTMLElement{

    private _style!: ShTerm_TextStyle

    public static create($p: ShTerm_Paragraph, text: string, style: Partial<ShTerm_TextStyle> = {}): ShTerm_Span {
        const $sp = shlib.createElement('shterm-span') as ShTerm_Span
        $sp.setTextStyle(style)
        $sp.setText(text)
        $sp.onLayout($p.$term)

        return $sp
    }

    constructor() {
        super()
    }

    public get textStyle(): ShTerm_TextStyle {
        shlib.assert(this._style).hasValue()
        return this._style
    }

    public countColumns(): number {
        return this.innerText.length * (this.hasAttribute('w') ? 2 : 1)
    }

    public onLayout($term?: ShTerm) {
        if (! $term) {
            $term = (this.parentElement as ShTerm_Paragraph)?.$term
            shlib.assert($term).hasValue()    
        }
        
        const _get_shlib_font = (font: 'en' | 'cn' | shlib.Font): shlib.Font => {
            if (font === 'en')
                return $term.options.defaultEnFont
            else if (font === 'cn')
                return $term.options.defaultCnFont
            else
                return font
        }

        const cw = _get_shlib_font(this._style.font).charWidth(this.innerText[0])
        const nc = $term.charWidthToColumns(cw)
        const letterSpacing = nc * $term!.columnWidth - cw

        if (nc === 2)
            this.setAttribute('w', '')
        else
            this.removeAttribute('w')

        this.updateCssStyle({
            width: nc * $term.columnWidth * this.innerText.length + 'px',
            '--shterm-span-letterspacing': letterSpacing + 'px',
        })
    }

    public setText(text: string) {
        this.innerText = text
        
        if (this.parentElement)
            this.onLayout()
    }

    public setTextStyle(style: Partial<ShTerm_TextStyle>) {
        this._style = Object.assign({
            font: 'en',
            foreColor: '',
            backColor: '',
            bold: false,
            italic: false,
            underline: false,
        }, style)

        const _make_font_css_value = (font: 'en' | 'cn' | shlib.Font) => {
            if (font === 'en')
                return ''
            else if (font === 'cn')
                return 'var(--shterm-cn-font)'
            else
                return font.cssValue
        }

        this.updateCssStyle({
            font: _make_font_css_value(this._style.font),
            color: this._style.foreColor,
            backgroundColor: this._style.backColor,
            fontWeight: this._style.bold ? 'bold' : '',
            fontStyle: this._style.italic ? 'italic' : '',
            textDecoration: this._style.underline ? 'underline' : '',
        })

        if (this.parentElement)
            this.onLayout()
    }
}

customElements.define('shterm-span', ShTerm_Span)