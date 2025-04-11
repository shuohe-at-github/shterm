import * as shlib from '../shlib'

import { ShTextSpan, ShSpanElement, ShTerm } from './index'


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

    public clear() {
        this.innerHTML = ''
    }

    /**
     * 删除本行中指定头尾列号当中的文本。
     * 
     * @param startCol 要删除的起始列号，从 0 开始，不能大于 endCol，最大值也不能超过本行总列数。
     * @param endCol 删除结束列号，从 0 开始，如果传入值大于本行文本的总列数，则其值被设置为本行文本的总列数。
     * @returns 执行删除后，删除点所在元素。如果 endCol 在行尾，则返回 null。
     * 
     * 从 startCol 列开始，到 endCol - 1 列的内容会被删除。剩余内容自然向左靠，原先第 endCol 列的内容在执行删除后会挪到第 startCol 列。
     * 
     * 如果 endCol 大于等于本行总列数，意味着从 startCol 列开始的剩余内容会被删除，执行删除后会返回 null。
     * 
     * 如果 startCol 和 endCol 相等，则没有内容会被删除，包含该位置的本文段会从该位置处被断开，并且返回断开后的右半部分文本段。
     */
    public deleteColumns(startCol: number, endCol?: number): ShSpanElement | null {
        shlib.assert(this._$term).hasValue()
        shlib.assert(0 <= startCol && (endCol === undefined || startCol <= endCol))

        const ncols = this.countColumns()
        endCol = endCol ?? ncols
        
        // 如果起始位置就在行尾，则直接返回
        if (startCol >= ncols)
            return null

        const { $span: $span1, charIndex: charIndex1 } = this._columnToCharIndex(startCol)
        const { $span: $span2, charIndex: charIndex2 } = this._columnToCharIndex(endCol)
        
        // startCol 所在文本段中的剩余文本（在左边）
        const txt1 = $span1!.textContent!.substring(0, Math.floor(charIndex1))
        // endCol 所在文本段的剩余文本（在右边）；如果 endCol 在行尾，则为空字符串
        const txt2 = $span2?.textContent!.substring(Math.ceil(charIndex2)) || ''

        // 如果 startCol 和 endCol 破开了宽字符，则准备一个空格文本段
        const $space1 = (Math.floor(charIndex1) < charIndex1) ? ShSpanElement.create(this._$term!, ' ', $span1!.textStyle) : null
        const $space2 = (charIndex2 < Math.ceil(charIndex2)) ? ShSpanElement.create(this._$term!, ' ', $span2!.textStyle): null

        // 插入 txt1 和 $space1
        if (txt1)
            $span1!.insertAdjacentElement('beforebegin', ShSpanElement.create(this._$term!, txt1, $span1!.textStyle))
        if ($space1)
            $span1!.insertAdjacentElement('beforebegin', $space1)

        // 删除 $span1 及其后面的文本段，直到遇到 $span2
        let $sp: ShSpanElement | null = $span1!
        while ($sp !== $span2) {
            const $next = $sp.nextElementSibling as ShSpanElement
            $sp.remove()
            $sp = $next
        }

        if ($span2) {
            // 在 $span2 的右边插入 txt2
            const $right = ShSpanElement.create(this._$term!, txt2, $span2!.textStyle)
            $span2.insertAdjacentElement('afterend', $right)
            $sp = $right

            // 在 $span2 的右边插入 $space2
            if ($space2) {
                $span2.insertAdjacentElement('afterend', $space2)
                $sp = $space2
            }

            // 删除 $span2
            $span2.remove()
        }

        // 返回 endCol 所在文本段的剩余文本段内容
        return $sp
    }

    public appendSpan(span: ShTextSpan) {
        shlib.assert(this._$term).hasValue()
        shlib.assert(span.charWidth > 0)

        const $last = this.lastElementChild as ShSpanElement
        if ($last && $last.mergeTextSpan(span, 'end'))
            return

        this.append(ShSpanElement.create(this._$term!, span.text, span.style))
    }

    public insertSpanBefore(span: ShTextSpan, $ref: ShSpanElement | null) {
        shlib.assert(this._$term).hasValue()
        shlib.assert(span.charWidth > 0)
        shlib.assert($ref === null || $ref.parentElement === this)

        if (! $ref) {
            this.appendSpan(span)
            return
        }

        const $left = $ref.previousElementSibling as ShSpanElement

        if ($left && $left.mergeTextSpan(span, 'end')) {
            if ($left.mergeTextSpan($ref.toTextSpan(), 'end'))
                $ref.remove()
            return
        }
        if ($ref.mergeTextSpan(span, 'begin')) {
            if ($left && $ref.mergeTextSpan($left.toTextSpan(), 'begin'))
                $left.remove()
            return
        }

        $ref.insertAdjacentElement('beforebegin', ShSpanElement.create(this._$term!, span.text, span.style))
    }

    public replaceSpans(col: number, spans: ShTextSpan[]) {
        shlib.assert(this._$term).hasValue()

        const lcols = this.countColumns()

        // 如果起始点在本行文本右边
        if (col >= lcols) {
            // 先填充空格
            if (col > lcols)
                this.appendSpan(ShTextSpan.create(' '.repeat(col - lcols), {}, this._$term!.options))

            // 再插入 spans
            for (const sp of spans.filter(sp => sp.charWidth > 0))
                this.appendSpan(sp)
        }
        // 如果起始点在本行文本内部
        else {
            let ncols = 0
            for (let i = 0; i < spans.length; i++)
                ncols += this._$term!.charWidthToColumns(spans[i].charWidth) * spans[i].text.length
    
            // 先删除起始点开始的同样列数的文本
            const $p = this.deleteColumns(col, col + ncols)

            // 如果删除后，还有剩余的文本，则将 spans 插入到 $p 的前面
            if ($p) {
                for (const sp of spans.filter(sp => sp.charWidth > 0))
                    this.insertSpanBefore(sp, $p)
            }
            // 否则，直接将 spans 插入到本行尾部
            else {
                for (const sp of spans.filter(sp => sp.charWidth > 0))
                    this.appendSpan(sp)
            }
        }
    }
}

customElements.define('shterm-row', ShRowElement)