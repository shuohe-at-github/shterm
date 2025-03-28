import * as shlib from '../shlib'

import { TextStyle, TextSpan, ShTerm } from './index'

export class Row extends HTMLElement {

    public static create($term: ShTerm) {
        const $row = shlib.createElement('shterm-row') as Row
        $row.$term = $term

        return $row
    }

    private $term: ShTerm | null = null

    constructor() {
        super()
    }

    public countColumns(): number {
        let cols = 0
        let $span = this.firstElementChild as HTMLElement
        while ($span) {
            cols += this.countColumnsInSpan($span)
            $span = $span.nextElementSibling as HTMLElement
        }

        return cols
    }

    private countColumnsInSpan($span: HTMLElement | null): number {
        return $span ? ($span.textContent!.length * ($span.hasAttribute('w')? 2 : 1)) : 0
    }

    /**
     * 根据列号定位到文本段和文本段中的字符位置。
     * 
     * @param col 列号，从 0 开始
     * @returns 文本段和文本段中的字符位置。
     */
    public _columnToCharIndex(col: number): { $span: HTMLElement | null, charIndex: number } {
        let $span = this.firstElementChild as HTMLElement
        let cols = this.countColumnsInSpan($span)
        while ($span && cols <= col) {
            $span = $span.nextElementSibling as HTMLElement
            cols += this.countColumnsInSpan($span)
        }

        if (! $span)
            return {
                $span: null,
                charIndex: col - cols,
            }

        const nw = $span.hasAttribute('w')? 2 : 1
        return {
            $span,
            charIndex: $span.textContent!.length - (cols - col) / nw,
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

    public deleteColumns(startCol: number, endCol?: number) {
        endCol = endCol ?? this.countColumns()
        shlib.assert(startCol >= 0 && startCol <= endCol)
        if (startCol === endCol)
            return

        const { $span, charIndex } = this._columnToCharIndex(startCol)
        shlib.assert($span) // startCol 一定落在某个文本段中

        if (charIndex > Math.floor(charIndex)) {
            // startCol 落在一个宽字符的中间，需要将这个字符分解为两个窄的空白字符
            const $twospaces = this._createSpan({
                text: ' '.repeat(2),
                style: { font: this.$term!.defaultEnFont },
            })
        }
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
            const $span = this._createSpan(sp)
            const $last = this.lastElementChild as HTMLElement
            if ((! $last) || (! this._mergeSpan($last, $span)))
                this.append($span)
        }
    }
}

customElements.define('shterm-row', Row)