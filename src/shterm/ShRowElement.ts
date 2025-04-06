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

    public _splitSpan($span: HTMLElement, charIndex: number) {
        shlib.assert($span.parentElement === this)
        shlib.assert(charIndex >= 0 && charIndex < $span.textContent!.length)

        const $span2 = $span.cloneNode(false) as HTMLElement

        // startCol 落在一个宽字符的中间，需要将这个字符分解为两个窄的空白字符
        if (charIndex > Math.floor(charIndex)) {

        }

        $span.textContent = $span.textContent!.substring(0, charIndex)
        this.insertBefore($span2, $span.nextSibling)
        $span2.textContent = $span.textContent!.substring(charIndex)
    }

    /**
     * 在指定位置插入文本段。
     * 
     * @param startCol 文本段插入位置，从 0 开始。
     * @param span 要插入的文本段。
     */
    public insertText(startCol: number, span: ShTextSpan) {
        shlib.assert(0 <= startCol)
        
        const { $span, charIndex } = this._columnToCharIndex(startCol)
        // 将文本段追加到行尾
        if (! $span) {
            const $last = this.lastElementChild as ShSpanElement
            if (! $last?.mergeTextSpan(span, 'end'))
                this.append(ShSpanElement.create(this._$term!, span))
        }
        // 将文本段插入到两个元素当中
        else if (charIndex === 0) {
            const $prev = $span.previousElementSibling as ShSpanElement
            if (! $prev || ! $prev.mergeTextSpan(span, 'end')) {
                if (! $span.mergeTextSpan(span, 'begin'))
                    this.insertBefore(ShSpanElement.create(this._$term!, span), $span)
            }
        }
        // 将文本段插入到一个元素中的指定位置
        else {
            // 如果要插入的文本段和当前元素的文本风格相同，并且字符显示宽度也相同，且插入位置没有在一个宽字符的中间，那么可以直接合并
            if (charIndex === Math.floor(charIndex) && compareTextStyle($span.textStyle, span.style) && $span.charWidth === span.charWidth) {
                $span.textContent = $span.textContent!.substring(0, charIndex) + span.text + $span.textContent!.substring(charIndex)
            }
            // 否则需要将当前元素分裂后再插入
            else {

            }
        }
    }
}

customElements.define('shterm-row', ShRowElement)