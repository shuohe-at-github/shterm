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

        const ncols = this.countColumns()
        if (endCol === undefined || endCol > ncols)
            endCol = ncols
        shlib.assert(0 <= startCol && startCol <= endCol)

        const { $span: $span1, charIndex: charIndex1 } = this._columnToCharIndex(startCol)
        const { $span: $span2, charIndex: charIndex2 } = this._columnToCharIndex(endCol)

        if (! $span1)
            return null
        
        let $delete = this._splitSpan($span1!, charIndex1)
        // 如果要删除的内容在同一个文本段内
        if ($span1 === $span2) {

        }

    }

    /**
     * 将文本段元素从指定位置断开，为删除和插入文本段做准备。
     * 
     * @param $span 要断开的文本段元素。
     * @param charIndex 断开位置的字符索引，必须大于等于 0，且小于等于文本段内容字符长度。如果该索引是小数，说明断开位置在一个宽字符的中间。
     * @returns 紧挨在断开位置右边的文本段元素，如果断开位置在文本段尾部，则返回 null
     */
    private _splitSpan($span: ShSpanElement, charIndex: number): ShSpanElement | null {
        shlib.assert($span.parentElement === this)
        shlib.assert($span.textContent!.length > 0)
        shlib.assert(0 <= charIndex && charIndex <= $span.textContent!.length)

        if (charIndex === 0)
            return $span
        if (charIndex === $span.textContent!.length)
            return $span.nextElementSibling as ShSpanElement
        
        const txt1 = $span.textContent!.substring(0, Math.floor(charIndex))
        const txt2 = $span.textContent!.substring(Math.ceil(charIndex))

        let $space1: ShSpanElement | null = null
        let $space2: ShSpanElement | null = null
        if (Math.floor(charIndex) < charIndex) {
            $space1 = ShSpanElement.create(this._$term!, ' ', $span.textStyle)
            $space2 = ShSpanElement.create(this._$term!, ' ', $span.textStyle)
        }

        // 如果切割点左边有内容
        if (txt1) {
            $span.textContent = txt1
            if ($space1) {
                $span.insertAdjacentElement('afterend', $space1)
                $space1.insertAdjacentElement('afterend', $space2!)
            }

            let $right: ShSpanElement | null = null
            if (txt2) {
                $right = ShSpanElement.create(this._$term!, txt2, $span.textStyle)
                if ($space2)
                    $space2.insertAdjacentElement('afterend', $right)
                else
                    $span.insertAdjacentElement('afterend', $right)
            }

            return $space2 || $right
        }
        // 如果切割点左边没内容
        else {
            // 此时一定是切割在第一个字符（一定是宽字符）的中间，即 charIndex === 0.5
            shlib.assert($space1).hasValue()
            $span.insertAdjacentElement('beforebegin', $space1!)
            $span.insertAdjacentElement('beforebegin', $space2!)                
            if (txt2)
                $span.textContent = txt2
            else
                $span.remove()

            return $space2
        }
    }

}

customElements.define('shterm-row', ShRowElement)