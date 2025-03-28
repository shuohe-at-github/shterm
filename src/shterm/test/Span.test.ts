import { expect } from 'chai'

import * as shlib from '../../shlib'
import { ShTerm, SpanElement } from '../../shterm'

describe('shterm.Span', () => {
    let $term: ShTerm | null = null

    before(() => {
        $term = new ShTerm(document.getElementById('shterm')!)
    })

    after(() => {
        $term!.remove()
    })

    describe('::create($term: ShTerm, span: TextSpan): SpanElement', () => {
        it('参数异常：span.text 不能是空字符串', () => {
            expect(() => {
                SpanElement.create($term!, { text: '', })
            }).to.throw()
        })

        it('默认英文字体', () => {
            const $span = SpanElement.create($term!, { text: 'abc', })
            expect($span.style.fontFamily).to.eq('')
            expect($span.style.fontSize).to.eq('')
        })

        it('默认中文字体', () => {
            const $span = SpanElement.create($term!, { text: '中国', })
            expect($span.style.fontFamily).to.eq($term!.defaultCnFont.name)
            expect($span.style.fontSize).to.eq('')
        })

        it('指定其他字体', () => {
            const $span = SpanElement.create($term!, { text: '中国', style: { font: new shlib.Font('Arial', 20) }, })
            expect($span.style.fontFamily).to.eq('Arial')
            expect($span.style.fontSize).to.eq('20px')
        })
    })

    describe('.countColumns(): number', () => {
        it('英文，一个字符一列', () => {
            const $span = SpanElement.create($term!, { text: 'abc', })
            expect($span.countColumns()).to.eq(3)
        })

        it('中文，一个字符两列', () => {
            const $span = SpanElement.create($term!, { text: '中国', })
            expect($span.countColumns()).to.eq(4)
        })
    })

    describe('.columnToCharIndex(col: number): number', () => {
        it('英文，结果是整数', () => {
            const $span = SpanElement.create($term!, { text: 'abc', })
            expect($span.columnToCharIndex(0)).to.eq(0)
            expect($span.columnToCharIndex(1)).to.eq(1)
            expect($span.columnToCharIndex(2)).to.eq(2)
            expect($span.columnToCharIndex(3)).to.eq(3)
        })

        it('中文，结果会有小数点', () => {
            const $span = SpanElement.create($term!, { text: '中国', })
            expect($span.columnToCharIndex(0)).to.eq(0)
            expect($span.columnToCharIndex(1)).to.eq(0.5)
            expect($span.columnToCharIndex(2)).to.eq(1)
            expect($span.columnToCharIndex(3)).to.eq(1.5)
        })
    })

    describe('.deleteColumns()', () => {
        it('参数异常', () => {
            const $span = SpanElement.create($term!, { text: '中国', })

            expect(() => {
                $span.deleteColumns(-1, 0)
            }).to.throw()

            expect(() => {
                $span.deleteColumns(0, -1)
            }).to.throw()

        })
    })
})