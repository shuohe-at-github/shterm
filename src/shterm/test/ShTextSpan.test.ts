import { expect } from 'chai'

import * as shlib from '../../shlib'
import { ShTermOptions, ShTerm, ShTextSpan } from '..'

describe('shterm.ShTextSpan', () => {
    let $term: ShTerm | null = null

    before(() => {
        // ShTermOptions 为默认值
        $term = new ShTerm(document.getElementById('shterm')!)
    })

    after(() => {
        $term!.remove()
    })

    describe('::create(text: string, style: Partial<TextStyle>, options?: ShTermOptions): TextSpan', () => {
        it('英文文本段，默认风格', () => {
            const span = ShTextSpan.create('Hello, World!', {})
            expect(span.text).to.equal('Hello, World!')
            expect(span.style.font.name).to.equal('Consolas')
            expect(span.style.font.size).to.equal(16)
            expect(span.style.foreColor).to.equal('white')
            expect(span.style.backColor).to.equal('black')
            expect(span.style.bold).to.be.false
            expect(span.style.italic).to.be.false
            expect(span.style.underline).to.be.false
            expect(span.charWidth).to.equal(new shlib.Font('Consolas', 16).charWidth('H'))
        })

        it('中文文本段，默认风格', () => {
            const span = ShTextSpan.create('你好，世界！', {})
            expect(span.text).to.equal('你好，世界！')
            expect(span.style.font.name).to.equal('微软雅黑')
            expect(span.style.font.size).to.equal(16)
            expect(span.style.foreColor).to.equal('white')
            expect(span.style.backColor).to.equal('black')
            expect(span.style.bold).to.be.false
            expect(span.style.italic).to.be.false
            expect(span.style.underline).to.be.false
            expect(span.charWidth).to.equal(new shlib.Font('微软雅黑', 16).charWidth('你'))
        })

        it('英文文本段，自定义风格', () => {
            const span = ShTextSpan.create('Hello, World!', {
                font: new shlib.Font('Courier', 20),
                foreColor: 'red',
                backColor: 'blue',
                bold: true,
                italic: true,
                underline: true,
            })

            expect(span.text).to.equal('Hello, World!')
            expect(span.style.font.name).to.equal('Courier')
            expect(span.style.font.size).to.equal(20)
            expect(span.style.foreColor).to.equal('red')
            expect(span.style.backColor).to.equal('blue')
            expect(span.style.bold).to.be.true
            expect(span.style.italic).to.be.true
            expect(span.style.underline).to.be.true
            expect(span.charWidth).to.equal(new shlib.Font('Courier', 20).charWidth('H'))
        })

        it('中文文本段，自定义风格', () => {
            const span = ShTextSpan.create('你好，世界！', {
                font: new shlib.Font('黑体', 20),
                foreColor: 'red',
                backColor: 'blue',
                bold: true,
                italic: true,
                underline: true,
            })
            expect(span.text).to.equal('你好，世界！')
            expect(span.style.font.name).to.equal('黑体')
            expect(span.style.font.size).to.equal(20)
            expect(span.style.foreColor).to.equal('red')
            expect(span.style.backColor).to.equal('blue')
            expect(span.style.bold).to.be.true
            expect(span.style.italic).to.be.true
            expect(span.style.underline).to.be.true
            expect(span.charWidth).to.equal(new shlib.Font('黑体', 20).charWidth('你'))
        })

        it('英文文本段，自定义风格，指定 ShTermOptions', () => {
            const span = ShTextSpan.create('Hello, World!', {
                backColor: 'blue',
                bold: true,
                italic: true,
                underline: true,
            }, new ShTermOptions({
                enFontName: 'Courier',
                foreColor: 'yellow',
            }))
            expect(span.text).to.equal('Hello, World!')
            expect(span.style.font.name).to.equal('Courier')
            expect(span.style.font.size).to.equal(16)
            expect(span.style.foreColor).to.equal('yellow')
            expect(span.style.backColor).to.equal('blue')
            expect(span.style.bold).to.be.true
            expect(span.style.italic).to.be.true
            expect(span.style.underline).to.be.true
            expect(span.charWidth).to.equal(new shlib.Font('Courier', 16).charWidth('H'))
        })

        it('中文文本段，自定义风格，指定 ShTermOptions', () => {
            const span = ShTextSpan.create('你好，世界！', {
                backColor: 'blue',
                bold: true,
                italic: true,
                underline: true,
            }, new ShTermOptions({
                cnFontName: '黑体',
                foreColor: 'yellow',
            }))
            expect(span.text).to.equal('你好，世界！')
            expect(span.style.font.name).to.equal('黑体')
            expect(span.style.font.size).to.equal(16)
            expect(span.style.foreColor).to.equal('yellow')
            expect(span.style.backColor).to.equal('blue')
            expect(span.style.bold).to.be.true
            expect(span.style.italic).to.be.true
            expect(span.style.underline).to.be.true
            expect(span.charWidth).to.equal(new shlib.Font('黑体', 16).charWidth('你'))
        })

        it('英文文本段，字符不等宽', () => {
            expect(() => {
                ShTextSpan.create('Hello中World!', {})
            }).to.throw('错误：文本段中字符显示宽度不同。')
        })
    })

    describe('::splitText(text: string, style: Partial<TextStyle>, options?: ShTermOptions): TextSpan[]', () => {
        it('空文本段', () => {
            expect(ShTextSpan.splitText('', {})).to.deep.equal([])
        })

        it('单一英文文本段', () => {
            expect(ShTextSpan.splitText('Hello', {})).to.deep.equal([
                ShTextSpan.create('Hello', {}),
            ])
        })

        it('单一中文文本段', () => {
            expect(ShTextSpan.splitText('你好', {})).to.deep.equal([
                ShTextSpan.create('你好', {}),
            ])
        })

        it('中英文混杂', () => {
            expect(ShTextSpan.splitText('hello::你好, 世界!', {})).to.deep.equal([
                ShTextSpan.create('hello::', {}),
                ShTextSpan.create('你好', {}),
                ShTextSpan.create(', ', {}),
                ShTextSpan.create('世界', {}),
                ShTextSpan.create('!', {}),
            ])
        })
    })
})