import './shterm.css'

import * as shlib from '../shlib'

import { ShTerm_Options } from './ShTerm_Options'
import { ShTerm_Paragraph } from './ShTerm_Paragraph'


export class ShTerm {

    public readonly $el: HTMLElement
    public readonly options: ShTerm_Options

    private $main: HTMLElement
    private $content: HTMLElement
    private $footer: HTMLElement
    private $caret: HTMLElement
    private $input: HTMLInputElement
    private $scrollbar: HTMLElement

    private $rows: ShTerm_Paragraph[] = []

    private _rowHeight: number = 0
    private _columnWidth: number = 0
    private _maxVisibleRows: number = 0
    private _maxVisibleColumns: number = 0

    private _scrollRow: number = 0

    private _caretRow: number = 0
    private _caretColumn: number = 0
    private _caretMode: 'insert' | 'replace' = 'insert'
    private _caretPauseTimerId: number = -1

    private _resizeObserver: ResizeObserver

    constructor($container: HTMLElement, options: Partial<ShTerm_Options> = {}) {

        this.$el = $container
        this.$el.addClass('shterm-container')

        this.$el.innerHTML = `
            <div class="shterm-main">
                <div class="shterm-content" tabindex="0"></div>
                <div class="shterm-footer"></div>
                <div class="shterm-caret"></div>
                <div class="shterm-input"></div>
            </div>
            <div class="shterm-scrollbar"></div>
        `

        this.$main = this.$el.querySelector('.shterm-main')!
        this.$content = this.$el.querySelector('.shterm-content')!
        this.$footer = this.$el.querySelector('.shterm-footer')!
        this.$caret = this.$el.querySelector('.shterm-caret')!
        this.$input = this.$el.querySelector('.shterm-input')!
        this.$scrollbar = this.$el.querySelector('.shterm-scrollbar')!

        this.$content.onfocus = () => this.$input.focus()
        this.$input.onfocus = () => this.showCaret()
        // this.$input.onblur = () => this.showCaret(false)

        this._resizeObserver = new ResizeObserver(() => {
            this._onLayout()
        })
        this._resizeObserver.observe(this.$main)

        this.options = new ShTerm_Options(options)
        this._onLayout()

        // 预先创建第一个空行
        //this._appendParagraph()
    }

    public get rowHeight(): number { return this._rowHeight }
    public get columnWidth(): number { return this._columnWidth }

    public charWidthToColumns(cw: number): number {
        return (cw > this._columnWidth) ? 2 : 1
    }

    public showCaret(show: boolean = true) {
        this.$caret.style.display = show ? '' : 'none'
    }

    private _onLayout() {
        // 重新计算行高和屏幕行数
        this._rowHeight = Math.ceil(Math.max(this.options.defaultEnFont.size, this.options.defaultCnFont.size) * this.options.rowHeightRatio)
        this._maxVisibleRows = Math.floor(this.$main.clientHeight / this._rowHeight)

        // 重新计算列宽和屏幕列数
        this._columnWidth = Math.ceil(Math.max(this.options.defaultEnFont.monoCharWidth, this.options.defaultCnFont.size / 2))
        this._maxVisibleColumns = Math.floor(this.$main.clientWidth / this._columnWidth)

        this.$el.updateCssStyle({
            '--shterm-en-font': this.options.defaultEnFont.cssValue,
            '--shterm-cn-font': this.options.defaultCnFont.cssValue,
            '--shterm-row-height-ratio': `${this.options.rowHeightRatio}`,
            '--shterm-fore-color': this.options.foreColor,
            '--shterm-back-color': this.options.backColor,
            '--shterm-row-height': `${this._rowHeight}px`,
            '--shterm-column-width': `${this._columnWidth}px`,
        })

        // 重新计算屏幕的留白尺寸
        const paddingTop = (this.$main.clientHeight - this._rowHeight * this._maxVisibleRows) / 2
        const paddingLeft = (this.$main.clientWidth - this._columnWidth * this._maxVisibleColumns) / 2
        this.$main.style.padding = `${paddingTop}px ${paddingLeft}px`

        // 尺寸参数变化后，每个 Span 的尺寸要重新计算

        this._caretMove()

    }

    private _caretPauseBlink() {
        if (this.$caret.style.display === 'none')
            return

        if (this._caretPauseTimerId > 0)
            window.clearTimeout(this._caretPauseTimerId)

        this.$caret.style.animation = 'none'
        this._caretPauseTimerId = window.setTimeout(() => this.$caret.style.animation = '', 100)
    }

    private _caretMove(row?: number, col?: number) {

    }

}