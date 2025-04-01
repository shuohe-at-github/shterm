import * as shlib from '../shlib'

import { TextStyle, TextSpan, SpanElement, ShTerm } from './index'
export class RowElement extends HTMLElement {

    public static create($term: ShTerm) {
        const $row = shlib.createElement('shterm-row') as RowElement
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
            ncols += (this.children[i] as SpanElement).countColumns()

        return ncols
    }

    /**
     * 根据列号定位到文本段，以及文本段中的字符位置。
     * 
     * @param col 列号，从 0 开始，不得大于等于本行的总列数。
     * @returns 文本段和文本段中的字符位置。
     */
    public _columnToCharIndex(col: number): { $span: SpanElement | null, charIndex: number } {
        shlib.assert(0 <= col && col < this.countColumns())

        let colInSpan = col
        let $span: SpanElement | null = this.firstElementChild as SpanElement
        let spanCols = $span?.countColumns() || 0
        while ($span?.nextElementSibling && colInSpan >= spanCols) {
            colInSpan -= spanCols
            $span = $span!.nextElementSibling as SpanElement
        }

        if ($span)
            return {
                $span,
                charIndex: colInSpan / ($span.hasAttribute('w')? 2 : 1),
            }
        
        return {
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

    public _mergeSpan($prev: HTMLElement, $next: HTMLElement): boolean {
        if ($prev.hasAttribute('w') !== $next.hasAttribute('w'))
            return false

        if ($prev.style.fontFamily !== $next.style.fontFamily)
            return false

        if ($prev.style.fontSize !== $next.style.fontSize)
            return false

        if ($prev.style.color !== $next.style.color)
            return false

        if ($prev.style.backgroundColor !== $next.style.backgroundColor)
            return false

        if ($prev.style.fontWeight !== $next.style.fontWeight)
            return false

        if ($prev.style.fontStyle !== $next.style.fontStyle)
            return false

        if ($prev.style.textDecoration !== $next.style.textDecoration)
            return false

        if ($prev.style.letterSpacing !== $next.style.letterSpacing)
            return false

        $prev.textContent += $next.textContent!
        return true
    }

    public _appendSpan(...spans: TextSpan[]) {
        for (const sp of spans) {
            const $span = SpanElement.create(this._$term!, sp)
            const $last = this.lastElementChild as HTMLElement
            if ((! $last) || (! this._mergeSpan($last, $span)))
                this.append($span)
        }
    }
}

customElements.define('shterm-row', RowElement)