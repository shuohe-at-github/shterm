import { expect } from 'chai'

import * as shlib from '../../shlib'
import { ShTextSpan, ShTerm, ShSpanElement, ShRowElement } from '..'

describe('shterm.ShRowElement', () => {
    let $term: ShTerm | null = null

    before(() => {
        $term = new ShTerm(document.getElementById('shterm')!)
    })

    after(() => {
        $term!.remove()
    })

    describe('._columnToCharIndex(col: number): { $span: ShSpanElement | null, charIndex: number }', () => {
        it('空行', () => {
            const $row = ShRowElement.create($term!)
            expect($row._columnToCharIndex(0)).to.deep.eq({ $span: null, charIndex: 0 })
            expect($row._columnToCharIndex(3)).to.deep.eq({ $span: null, charIndex: 3 })
        })

        it('一个英文文本段', () => {
            const $row = ShRowElement.create($term!)
            const $span1 = ShSpanElement.create($term!, new ShTextSpan('abc', {}, $term!.options))
            $row.append($span1)
            expect($row._columnToCharIndex(0)).to.deep.eq({ $span: $span1, charIndex: 0 })
            expect($row._columnToCharIndex(1)).to.deep.eq({ $span: $span1, charIndex: 1 })
            expect($row._columnToCharIndex(2)).to.deep.eq({ $span: $span1, charIndex: 2 })
            expect($row._columnToCharIndex(3)).to.deep.eq({ $span: null, charIndex: 0 })
        })

        it('一个中文文本段', () => {
            const $row = ShRowElement.create($term!)
            const $span1 = ShSpanElement.create($term!, new ShTextSpan('中国', {}, $term!.options))
            $row.append($span1)
            expect($row._columnToCharIndex(0)).to.deep.eq({ $span: $span1, charIndex: 0 })
            expect($row._columnToCharIndex(1)).to.deep.eq({ $span: $span1, charIndex: 0.5 })
            expect($row._columnToCharIndex(2)).to.deep.eq({ $span: $span1, charIndex: 1 })
            expect($row._columnToCharIndex(3)).to.deep.eq({ $span: $span1, charIndex: 1.5 })
            expect($row._columnToCharIndex(4)).to.deep.eq({ $span: null, charIndex: 0 })
        })

        it('多个文本段', () => {
            const $row = ShRowElement.create($term!)
            const $span1 = ShSpanElement.create($term!, new ShTextSpan('abc', {}, $term!.options))
            const $span2 = ShSpanElement.create($term!, new ShTextSpan('中国', {}, $term!.options))
            const $span3 = ShSpanElement.create($term!, new ShTextSpan('def', {}, $term!.options))
            $row.append($span1, $span2, $span3)
            expect($row._columnToCharIndex(0)).to.deep.eq({ $span: $span1, charIndex: 0 })
            expect($row._columnToCharIndex(2)).to.deep.eq({ $span: $span1, charIndex: 2 })
            expect($row._columnToCharIndex(3)).to.deep.eq({ $span: $span2, charIndex: 0 })
            expect($row._columnToCharIndex(4)).to.deep.eq({ $span: $span2, charIndex: 0.5 })
            expect($row._columnToCharIndex(6)).to.deep.eq({ $span: $span2, charIndex: 1.5 })
            expect($row._columnToCharIndex(7)).to.deep.eq({ $span: $span3, charIndex: 0 })
            expect($row._columnToCharIndex(8)).to.deep.eq({ $span: $span3, charIndex: 1 })
            expect($row._columnToCharIndex(10)).to.deep.eq({ $span: null, charIndex: 0 })
            expect($row._columnToCharIndex(20)).to.deep.eq({ $span: null, charIndex: 10 })
        })
    })
})