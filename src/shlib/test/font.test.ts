/**
 * @jest-environment jsdom
 */

import { expect } from 'chai'

import * as shlib from '../index'
shlib.init()


describe('shlib.Font', () => {
    describe('.monoCharWidth: number', () => {
        it('等宽字体', () => {
            let font = new shlib.Font('monospace', 16)
            expect(font.monoCharWidth).to.eq(8)

            font = new shlib.Font('Consolas', 16)
            expect(font.monoCharWidth).greaterThan(0)
        })

        it('非等宽字体，应该等于零', () => {
            const font = new shlib.Font('Arial', 16)
            expect(font.monoCharWidth).to.eq(0)
        })
    })

    describe('.hasGlyph(c: string): boolean', () => {
        it('英文字体，一定包含英文', () => {
            expect(new shlib.Font('Consolas', 16).hasGlyph('A')).is.true
        })

        it ('中文字体，一定包含中文', () => {
            expect(new shlib.Font('宋体', 16).hasGlyph('中')).is.true
        })

        it('英文字体不包含中文', () => {
            expect(new shlib.Font('"Times New Roman"', 16).hasGlyph('中')).is.false
        })
    })
})
