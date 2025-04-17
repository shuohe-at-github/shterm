import { expect } from 'chai'

import * as shlib from '../../shlib'
import { ShTerm, ShSpanElement, ShTextSpan } from '..'

describe('shterm.ShSpanElement', () => {
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
                ShSpanElement.create($term!, ShTextSpan.create('', {}, $term!.options))
            }).to.throw()
        })

        it('默认英文字体', () => {
            const $span = ShSpanElement.create($term!, ShTextSpan.create('abc', {}, $term!.options))
            expect($span.style.fontFamily).to.eq('')
            expect($span.style.fontSize).to.eq('')
        })

        it('默认中文字体', () => {
            const $span = ShSpanElement.create($term!, ShTextSpan.create('中国', {}, $term!.options))
            expect($span.style.fontFamily).to.eq($term!.options.defaultCnFont.name)
            expect($span.style.fontSize).to.eq('')
        })

        it('指定其他字体', () => {
            const $span = ShSpanElement.create($term!, ShTextSpan.create('中国', { font: new shlib.Font('Arial', 20) }, $term!.options))
            expect($span.style.fontFamily).to.eq('Arial')
            expect($span.style.fontSize).to.eq('20px')
        })
    })

    describe('.countColumns(): number', () => {
        it('英文，一个字符一列', () => {
            const $span = ShSpanElement.create($term!, ShTextSpan.create('abc', {}, $term!.options))
            expect($span.countColumns()).to.eq(3)
        })

        it('中文，一个字符两列', () => {
            const $span = ShSpanElement.create($term!, ShTextSpan.create('中国', {}, $term!.options))
            expect($span.countColumns()).to.eq(4)
        })
    })

    describe('.columnToCharIndex(col: number): number', () => {
        it('英文，结果是整数', () => {
            const $span = ShSpanElement.create($term!, ShTextSpan.create('abc', {}, $term!.options))
            expect($span.columnToCharIndex(0)).to.eq(0)
            expect($span.columnToCharIndex(1)).to.eq(1)
            expect($span.columnToCharIndex(2)).to.eq(2)
            expect($span.columnToCharIndex(3)).to.eq(3)
        })

        it('中文，结果会有小数点', () => {
            const $span = ShSpanElement.create($term!, ShTextSpan.create('中国', {}, $term!.options))
            expect($span.columnToCharIndex(0)).to.eq(0)
            expect($span.columnToCharIndex(1)).to.eq(0.5)
            expect($span.columnToCharIndex(2)).to.eq(1)
            expect($span.columnToCharIndex(3)).to.eq(1.5)
        })
    })

    describe('.mergeTextSpan(span: TextSpan, where: \'begin\' | \'end\'): boolean', () => {
        it('英文，正常合并在头部', () => {
            const $span = ShSpanElement.create($term!, new ShTextSpan('abc', {}, $term!.options))
            expect($span.mergeTextSpan(new ShTextSpan('def', {}, $term!.options), 'begin')).is.true
            expect($span.textContent!).eq('defabc')
        })
        it('英文，正常合并在尾部', () => {
            const $span = ShSpanElement.create($term!, new ShTextSpan('abc', {}, $term!.options))
            expect($span.mergeTextSpan(new ShTextSpan('def', {}, $term!.options), 'end')).is.true
            expect($span.textContent!).eq('abcdef')
        })
        it('中文，正常合并在头部', () => {
            const $span = ShSpanElement.create($term!, new ShTextSpan('中国', {}, $term!.options))
            expect($span.mergeTextSpan(new ShTextSpan('人民', {}, $term!.options), 'begin')).is.true
            expect($span.textContent!).eq('人民中国')
        })
        it('中文，正常合并在尾部', () => {
            const $span = ShSpanElement.create($term!, new ShTextSpan('中国', {}, $term!.options))
            expect($span.mergeTextSpan(new ShTextSpan('人民', {}, $term!.options), 'end')).is.true
            expect($span.textContent!).eq('中国人民')
        })
        it('中英文，不能合并', () => {
            let $span = ShSpanElement.create($term!, new ShTextSpan('中国', {}, $term!.options))
            expect($span.mergeTextSpan(new ShTextSpan('abc', {}, $term!.options), 'end')).is.false
            $span = ShSpanElement.create($term!, new ShTextSpan('abc', {}, $term!.options))
            expect($span.mergeTextSpan(new ShTextSpan('中国', {}, $term!.options), 'end')).is.false
        })
        it('显示风格不同，不能合并', () => {
            const $span = ShSpanElement.create($term!, new ShTextSpan('中国', {}, $term!.options))
            expect($span.mergeTextSpan(new ShTextSpan('人民', { foreColor: 'red', }, $term!.options), 'end')).is.false
            expect($span.mergeTextSpan(new ShTextSpan('人民', { font: new shlib.Font('楷体', 16), }, $term!.options), 'end')).is.false
        })
    })
})