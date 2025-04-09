import * as shlib from '../shlib'

import { ShTextStyle, compareTextStyle, ShTextSpan, ShSpanElement, ShTerm } from './index'


export class ShRowElement extends HTMLElement {

    public static create($term: ShTerm) {
        const $row = shlib.createElement('shterm-row') as ShRowElement
        $row._$term = $term

        return $row
    }

    private _$term: ShTerm | null = null

    constructor() {
        super()
    }

    public countColumns(): number {
        let ncols = 0
        for (let i = 0; i < this.children.length; i++)
            ncols += (this.children[i] as ShSpanElement).countColumns()

        return ncols
    }

    
    /**
     * 根据列号定位到文本段，以及文本段中的字符位置。
     * 
     * @param col 列号，从 0 开始，不得大于等于本行的总列数。
     * 
     * @returns $span: 指定列号落在哪个 ShSpanElement 元素内。如果指定列号超出了本行最后一个 ShSpanElement 元素中最后字符的列号，那么 $span 为 null。
     * 
     *          charIndex: 指定列号在 $span 中的字符位置，从 0 开始。如果指定列号大于本行最后一个字符的列号，那么 charIndex 为指定列号减去本行文本的总列数。
     *                     例如，对于一行文本 "abc"，如果指定列号为 4，那么 $span 为 null，charIndex 为 1。
     */
    public _columnToCharIndex(col: number): { $span: ShSpanElement | null, charIndex: number } {
        shlib.assert(0 <= col)

        let colInSpan = col
        let $span: ShSpanElement | null = this.firstElementChild as ShSpanElement
        let spanCols = $span?.countColumns() || 0
        while ($span && colInSpan >= spanCols) {
            colInSpan -= spanCols
            $span = $span!.nextElementSibling as ShSpanElement
            spanCols = $span?.countColumns() || 0
        }

        return $span ? {
            $span,
            charIndex: colInSpan / ($span.hasAttribute('w')? 2 : 1),
        } : {
            $span: null,
            charIndex: colInSpan,
        }
    }

    public deleteColumns(startCol: number, endCol?: number): ShSpanElement | null {
        shlib.assert(this._$term).hasValue()

        // 结束位置最多到行尾，起始位置不能大于结束位置
        const ncols = this.countColumns()
        if (endCol === undefined || endCol > ncols)
            endCol = ncols
        shlib.assert(0 <= startCol && startCol <= endCol)

        const { $span: $span1, charIndex: charIndex1 } = this._columnToCharIndex(startCol)
        const { $span: $span2, charIndex: charIndex2 } = this._columnToCharIndex(endCol)
        // 如果起始位置就在行尾，则直接返回
        if (! $span1)
            return null
        
        const txt1 = $span1.textContent!.substring(0, Math.floor(charIndex1))
        const txt2 = $span2?.textContent!.substring(Math.ceil(charIndex2)) || ''

        const $space1 = (Math.floor(charIndex1) < charIndex1) ? ShSpanElement.create(this._$term!, ' ', $span1!.textStyle) : null
        const $space2 = (charIndex2 < Math.ceil(charIndex2)) ? ShSpanElement.create(this._$term!, ' ', $span2!.textStyle): null

        if (txt1)
            $span1.insertAdjacentElement('beforebegin', ShSpanElement.create(this._$term!, txt1, $span1!.textStyle))
        if ($space1)
            $span1.insertAdjacentElement('beforebegin', $space1)

        let $sp: ShSpanElement | null = $span1
        while ($sp !== $span2) {
            const $next = $sp.nextElementSibling as ShSpanElement
            $sp.remove()
            $sp = $next
        }

        if ($span2) {
            const $right = ShSpanElement.create(this._$term!, txt2, $span2!.textStyle)
            $span2.insertAdjacentElement('afterend', $right)
            $sp = $right

            if ($space2) {
                $span2.insertAdjacentElement('afterend', $space2)
                $sp = $space2
            }

            $span2.remove()
        }

        return $sp
    }
}

customElements.define('shterm-row', ShRowElement)