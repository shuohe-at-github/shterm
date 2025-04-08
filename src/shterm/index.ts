export * from './ShRowElement'
export * from './ShTermOptions'
export * from './ShSpanElement'
export * from './ShTextSpan'

import './shterm.css'

import * as shlib from '../shlib'

import { ShTermOptions } from './ShTermOptions'
import { ShTextSpan, ShTextStyle } from './ShTextSpan'
import { ShRowElement } from './ShRowElement'
import { ShSpanElement } from './ShSpanElement'

export class ShTerm {

    private _options: ShTermOptions

    private $container: HTMLElement
    private $screen: HTMLElement
    private $scrollbar: HTMLElement

    private _rowHeight: number = 0
    private _columnWidth: number = 0
    private _maxRows: number = 0
    private _maxColumns: number = 0

    private _scrollRow: number = 0

    private _caretRow: number = 0
    private _caretColumn: number = 0
    private _caretMode: 'insert' | 'replace' = 'insert'

    private _resizeObserver: ResizeObserver

    constructor($container: HTMLElement, options: Partial<ShTermOptions> = {}) {
        this._options = new ShTermOptions(options)

        if (! this._options.defaultEnFont.monoCharWidth)
            throw new Error(`错误: '${this._options.defaultEnFont.name}' 不是等宽字体。`)

        if (! this._options.defaultCnFont.hasGlyph('中'))
            throw new Error(`错误: '${this._options.defaultCnFont.name}' 不包含汉字。`)

        this.$container = $container
        this.$container.addClass('shterm-container')
        
        this.$screen = shlib.createElement('div', 'shterm-screen') as HTMLElement
        this.$screen.updateStyle({
            '--shterm-main-font': this._options.defaultEnFont.name,
            '--shterm-main-font-size': `${this._options.defaultEnFont.size}px`,
            '--shterm-fore-color': this._options.foreColor,
            '--shterm-back-color': this._options.backColor,
        })
        this.$container.append(this.$screen)

        this.$scrollbar = shlib.createElement('div', 'shterm-scrollbar') as HTMLElement
        this.$container.append(this.$scrollbar)

        // 创建第一个行对象
        this.$screen.append(ShRowElement.create(this))

        this._updateLayout()
        this._resizeObserver = new ResizeObserver(() => {
            this._updateLayout()
        })
        this._resizeObserver.observe(this.$screen)
    }

    public remove() {
        this._resizeObserver.disconnect()
        this.$screen.remove()
        this.$screen.remove()
        this.$container.removeClass('shterm-container')
    }

    public get options(): ShTermOptions {
        return this._options
    }

    public get rowHeight(): number {
        return this._rowHeight
    }

    public get columnWidth(): number {
        return this._columnWidth
    }

    public get maxRows(): number {
        return this._maxRows
    }

    public get maxColumns(): number {
        return this._maxColumns
    }

    public charWidthToColumns(cw: number): number {
        return (cw > this._columnWidth) ? 2 : 1
    }

    public drawText(row: number, col: number, text: string, style: Partial<ShTextStyle> = {}) {
        shlib.assert(0 <= row && row < this._maxRows)
        shlib.assert(0 <= col && col < this._maxColumns)
        shlib.assert(text.length > 0)

        // const $row = this._getRowAtScreen(row)
        // const spans = ShTextSpan.splitText(text, style, this._options)

        // const $p = $row.deleteColumns(col, col + this._countSpansColumns(spans))
        // for (const sp of spans) {
        //     if (shlib.Font.charType(sp.text[0]) === 'ctrl')
        //         continue

        //     // 将 sp 插入到 $p 的前面
        // }
    }

    /**
     * 返回显示在屏幕上的第 row 行的 Row 对象。必要时创建该对象。
     * 
     * @param row 屏幕上的行号，从 0 开始。
     * @returns 显示在屏幕上第 row 行的 Row 对象。
     */
    public _getRowAtScreen(row: number): ShRowElement {
        shlib.assert(row >= 0 && row < this._maxRows)

        const index = this._scrollRow + row
        while (index >= this.$screen.children.length)
            this.$screen.append(ShRowElement.create(this))

        return this.$screen.children[index] as ShRowElement
    }

    public _updateLayout() {
        this._rowHeight = Math.ceil(Math.max(this._options.defaultEnFont.size, this._options.defaultCnFont.size) * this._options.rowHeightRatio)
        this._maxRows = Math.floor(this.$screen.clientHeight / this._rowHeight)

        this._columnWidth = Math.ceil(Math.max(this._options.defaultEnFont.monoCharWidth, this._options.defaultCnFont.size / 2))
        this._maxColumns = Math.floor(this.$screen.clientWidth / this._columnWidth)

        const paddingTop = (this.$screen.clientHeight - this._rowHeight * this._maxRows) / 2
        const paddingLeft = (this.$screen.clientWidth - this._columnWidth * this._maxColumns) / 2
        this.$screen.updateStyle({
            '--shterm-row-height': `${this._rowHeight}px`,
            padding: `${paddingTop}px ${paddingLeft}px`,
        })
    }

    private _countSpansColumns(spans: ShTextSpan[]): number {
        let nc = 0
        for (const sp of spans) {
            if (sp.charWidth === 0)
                continue
            nc += this.charWidthToColumns(sp.charWidth) * sp.text.length
        }

        return nc
    }
}