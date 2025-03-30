/**
 * @jest-environment jsdom
 */

import { expect } from 'chai'

import * as shlib from '../index'
shlib.init()


describe('shlib.Font', () => {
    describe('.monoCharWidth', () => {
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
})
