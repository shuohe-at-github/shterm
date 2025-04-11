import { expect } from 'chai'

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

    describe('.deleteColumns(startCol: number, endCol?: number): ShSpanElement | null', () => {
        it('空行', () => {
            const $row = ShRowElement.create($term!)

            expect($row.deleteColumns(0)).to.be.null
            expect($row.deleteColumns(3)).to.be.null
        })

        it('一个英文文本段', () => {
            const $row = ShRowElement.create($term!)

            $row.append(ShSpanElement.create($term!, new ShTextSpan('abcdefg', {}, $term!.options)))
            let $result = $row.deleteColumns(0)
            expect($result).to.be.null
            expect($row.children.length).to.eq(0)

            $row.innerHTML = ''
            $row.append(ShSpanElement.create($term!, new ShTextSpan('abcdefg', {}, $term!.options)))
            $result = $row.deleteColumns(1)
            expect($result).to.be.null
            expect($row.children.length).to.eq(1)
            expect($row.children[0].textContent).to.eq('a')

            $row.innerHTML = ''
            $row.append(ShSpanElement.create($term!, new ShTextSpan('abcdefg', {}, $term!.options)))
            $result = $row.deleteColumns(2, 2)
            expect($result!.textContent).to.eq('cdefg')
            expect($row.children.length).to.eq(2)
            expect($row.children[0].textContent).to.eq('ab')
        })

        it('一个中文文本段', () => {
            const $row = ShRowElement.create($term!)

            $row.append(ShSpanElement.create($term!, new ShTextSpan('中华人民共和国', {}, $term!.options)))
            let $result = $row.deleteColumns(0)
            expect($result).to.be.null
            expect($row.children.length).to.eq(0)

            $row.innerHTML = ''
            $row.append(ShSpanElement.create($term!, new ShTextSpan('中华人民共和国', {}, $term!.options)))
            $result = $row.deleteColumns(2)
            expect($result).to.be.null
            expect($row.children.length).to.eq(1)
            expect($row.children[0].textContent).to.eq('中')

            $row.innerHTML = ''
            $row.append(ShSpanElement.create($term!, new ShTextSpan('中华人民共和国', {}, $term!.options)))
            $result = $row.deleteColumns(4, 4)
            expect($result!.textContent).to.eq('人民共和国')
            expect($row.children.length).to.eq(2)
            expect($row.children[0].textContent).to.eq('中华')

            $row.innerHTML = ''
            $row.append(ShSpanElement.create($term!, new ShTextSpan('中华人民共和国', {}, $term!.options)))
            $result = $row.deleteColumns(4, 8)
            expect($result!.textContent).to.eq('共和国')
            expect($row.children.length).to.eq(2)
            expect($row.children[0].textContent).to.eq('中华')

            $row.innerHTML = ''
            $row.append(ShSpanElement.create($term!, new ShTextSpan('中华人民共和国', {}, $term!.options)))
            $result = $row.deleteColumns(3)
            expect($result).to.be.null
            expect($row.children.length).to.eq(2)
            expect($row.children[0].textContent).to.eq('中')
            expect($row.children[1].textContent).to.eq(' ')

            $row.innerHTML = ''
            $row.append(ShSpanElement.create($term!, new ShTextSpan('中华人民共和国', {}, $term!.options)))
            $result = $row.deleteColumns(1, 4)
            expect($result!.textContent).to.eq('人民共和国')
            expect($row.children.length).to.eq(2)
            expect($row.children[0].textContent).to.eq(' ')

            $row.innerHTML = ''
            $row.append(ShSpanElement.create($term!, new ShTextSpan('中华人民共和国', {}, $term!.options)))
            $result = $row.deleteColumns(3, 4)
            expect($result!.textContent).to.eq('人民共和国')
            expect($row.children.length).to.eq(3)
            expect($row.children[0].textContent).to.eq('中')
            expect($row.children[1].textContent).to.eq(' ')

            $row.innerHTML = ''
            $row.append(ShSpanElement.create($term!, new ShTextSpan('中华人民共和国', {}, $term!.options)))
            $result = $row.deleteColumns(3, 7)
            expect($result!.textContent).to.eq(' ')
            expect($row.children.length).to.eq(4)
            expect($row.children[0].textContent).to.eq('中')
            expect($row.children[1].textContent).to.eq(' ')
            expect($result).to.eq($row.children[2])
            expect($row.children[3].textContent).to.eq('共和国')
        })

        describe('跨越多个文本段', () => {
            let $row = null as ShRowElement | null

            before(() => {
                $row = ShRowElement.create($term!)
            })

            after(() => {
                $row?.remove()
            })

            beforeEach(() => {
                $row!.innerHTML = ''
                $row!.append(ShSpanElement.create($term!, new ShTextSpan('abcdefg', {}, $term!.options)))
                $row!.append(ShSpanElement.create($term!, new ShTextSpan('中华人民共和国', {}, $term!.options)))
                $row!.append(ShSpanElement.create($term!, new ShTextSpan('uvwxyz', {}, $term!.options)))    
            })

            it('全部删除', () => {
                let $result = $row!.deleteColumns(0)
                expect($result).to.be.null
                expect($row!.children.length).to.eq(0)    
            })

            it ('从第一段中间删除到第二段中间', () => {
                let $result = $row!.deleteColumns(3, 10)
                expect($row!.children.length).to.eq(4)
                expect($row!.children[0].textContent).to.eq('abc')
                expect($row!.children[1].textContent).to.eq(' ')
                expect($row!.children[2].textContent).to.eq('人民共和国')
                expect($row!.children[3].textContent).to.eq('uvwxyz')
                expect($result).to.eq($row!.children[1])
            })

            it('从第一段中间删除到第三段中间', () => {
                let $result = $row!.deleteColumns(3, 25)
                expect($row!.children.length).to.eq(2)
                expect($row!.children[0].textContent).to.eq('abc')
                expect($row!.children[1].textContent).to.eq('yz')
                expect($result).to.eq($row!.children[1])
            })

            it('从第二段中间删除到第三段中间', () => {
                let $result = $row!.deleteColumns(10, 25)
                expect($row!.children.length).to.eq(4)
                expect($row!.children[0].textContent).to.eq('abcdefg')
                expect($row!.children[1].textContent).to.eq('中')
                expect($row!.children[2].textContent).to.eq(' ')
                expect($row!.children[3].textContent).to.eq('yz')
                expect($result).to.eq($row!.children[3])
            })

            it('删除点就在两段中间', () => {
                let $result = $row!.deleteColumns(7, 7)
                expect($row!.children.length).to.eq(3)
                expect($row!.children[0].textContent).to.eq('abcdefg')
                expect($row!.children[1].textContent).to.eq('中华人民共和国')
                expect($row!.children[2].textContent).to.eq('uvwxyz')
                expect($result).to.eq($row!.children[1])
            })
        })
    })
})