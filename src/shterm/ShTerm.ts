import './shterm.css'

import * as shlib from '../shlib'

import { ShTermOptions } from './ShTermOptions'
import { ShTextSpan, ShTextStyle } from './ShTextSpan'
import { ShSpanElement } from './ShSpanElement'
import { ShRowElement } from './ShRowElement'


export class ShTerm {

    private _options!: ShTermOptions

    private $container: HTMLElement
    private $screen: HTMLElement
    private $scrollbar: HTMLElement
    private $input: HTMLInputElement
    private $caret: HTMLElement

    private _rowHeight: number = 0
    private _columnWidth: number = 0
    private _maxRows: number = 0
    private _maxColumns: number = 0

    private _scrollRow: number = 0

    private _caretRow: number = 0
    private _caretColumn: number = 0
    private _caretMode: 'insert' | 'replace' = 'insert'
    private _caretPauseTimerId: number = -1

    private _resizeObserver: ResizeObserver

    constructor($container: HTMLElement, options: Partial<ShTermOptions> = {}) {
        this.$container = $container
        this.$container.addClass('shterm-container')
        
        this.$screen = shlib.createElement('div', 'shterm-screen') as HTMLElement
        this.$screen.setAttribute('tabindex', '0')
        this.$screen.onfocus = () => this.$input.focus()
        this.$container.append(this.$screen)

        this.$scrollbar = shlib.createElement('div', 'shterm-scrollbar') as HTMLElement
        this.$container.append(this.$scrollbar)

        // 预先创建第一个空行
        this.$screen.append(ShRowElement.create(this))

        // 创建光标
        this.$caret = shlib.createElement('div', 'shterm-caret') as HTMLElement
        this.$caret.style.display = 'none'
        this.$container.append(this.$caret)

        // 创建平时隐藏的输入框，专用于中文输入
        this.$input = shlib.createElement('input', 'shterm-input') as HTMLInputElement
        this.$input.onfocus = () => this.showCaret()
        this.$input.onblur = () => this.showCaret(false)
        this.$container.append(this.$input)

        this._resizeObserver = new ResizeObserver(() => {
            this._updateLayout()
        })
        this._resizeObserver.observe(this.$screen)

        this.setOptions(options)
    }

    public remove() {
        this._resizeObserver.disconnect()
        this.$screen.remove()
        this.$caret.remove()
        this.$input.remove()
        this.$container.removeClass('shterm-container')
    }

    public get options(): ShTermOptions {
        return this._options
    }

    public setOptions(options: Partial<ShTermOptions>) {
        this._options = new ShTermOptions(options)

        if (! this._options.defaultEnFont.monoCharWidth)
            throw new Error(`错误: '${this._options.defaultEnFont.name}' 不是等宽字体。`)

        if (! this._options.defaultCnFont.hasGlyph('中'))
            throw new Error(`错误: '${this._options.defaultCnFont.name}' 不包含汉字。`)

        this._updateLayout()
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

        while (this._scrollRow + row >= this.$screen.children.length)
            this.$screen.append(ShRowElement.create(this))

        const $row = this._getRowAt(row)
        const spans = ShTextSpan.splitText(text, style, this._options)

        $row.replaceSpans(col, spans)
        $row.deleteColumns(this._maxColumns)
    }

    public writeText(text: string, style: Partial<ShTextStyle> = {}) {
        shlib.assert(text.length > 0)

        const spans = ShTextSpan.splitText(text, style, this._options)
        for (const sp of spans) {
            // 换行符
            if (sp.text === '\n') {
                const $row = this._getRowAt(this._caretRow)
                const rightSpans = $row.extractSpans(this._caretColumn)
                $row.deleteColumns(this._caretColumn)
                const $newRow = ShRowElement.create(this)
                $row.insertAdjacentElement('afterend', $newRow)
                if (rightSpans)
                    for (const sp of rightSpans)
                        $newRow.appendSpan(sp)
                
                if (this._caretRow === this._maxRows - 1) {
                    this._vscroll(1)
                    this._caretMove(this._caretRow, 0)
                } else {
                    this._caretMove(this._caretRow + 1, 0)
                }

                continue
            }
            // 退格符
            if (sp.text === '\b') {
                // 删除光标左边的字符
                if (this._caretColumn > 0) {
                    const $row = this._getRowAt(this._caretRow)
                    const $sp = $row.deleteColumns(this._caretColumn - 1, this._caretColumn)
                    $sp?.mergeSibling()
                    this._caretMove(this._caretRow, this._caretColumn - 1)
                }
                continue
            }
            // ANSI 转义序列
            if (sp.text[0] === '\x1b') {
                const matchResult = sp.text.match(/^\x1b\[(\d+)?(;(\d+))*([A-Hm])/)
                if (! matchResult)
                    continue

                // 光标上移
                if (matchResult[4] === 'A') {
                    const n = parseInt(matchResult[1]) || parseInt(matchResult[3]) || 1
                    if (this._caretRow - n < 0) {
                        const m = this._vscroll(this._caretRow - n)
                        this._caretMove(this._caretRow + m, this._caretColumn)
                    } else {
                        this._caretMove(this._caretRow - n, this._caretColumn)
                    }
                    continue
                }
                // 光标下移
                if (matchResult[4] === 'B') {
                    const n = parseInt(matchResult[1]) || parseInt(matchResult[3]) || 1
                    if (this._caretRow + n >= this._maxRows) {
                        const m = this._vscroll(this._caretRow + n - this._maxRows + 1)
                        this._caretMove(this._caretRow + m, this._caretColumn)
                    } else {
                        this._caretMove(this._caretRow + n, this._caretColumn)
                    }
                    continue
                }
                // 光标右移
                if (matchResult[4] === 'C') {
                    const n = parseInt(matchResult[1]) || parseInt(matchResult[3]) || 1
                    this._caretMove(this._caretRow, this._caretColumn + n)
                    continue
                }
                // 光标左移
                if (matchResult[4] === 'D') {
                    const n = parseInt(matchResult[1]) || parseInt(matchResult[3]) || 1
                    this._caretMove(this._caretRow, this._caretColumn - n)
                    continue
                }
                // 光标下移，且回车
                if (matchResult[4] === 'E') {
                    const n = parseInt(matchResult[1]) || parseInt(matchResult[3]) || 1
                    this._caretMove(this._caretRow + n, 0)
                    continue
                }
                // 光标上移，且回车
                if (matchResult[4] === 'F') {
                    const n = parseInt(matchResult[1]) || parseInt(matchResult[3]) || 1
                    this._caretMove(this._caretRow - n, 0)
                    continue
                }
                // 光标移动到指定列
                if (matchResult[4] === 'G') {
                    const n = parseInt(matchResult[1]) || parseInt(matchResult[3]) || 1
                    this._caretMove(n, this._caretColumn)
                    continue
                }
                // 光标移动到指定行和列
                if (matchResult[4] === 'H') {
                    continue
                }
                // 设置文本样式
                if (matchResult[4] === 'm') {
                    continue
                }
            }
            // 回车符
            if (sp.text === '\r') {
                this._caretMove(this._caretRow, 0)
                continue
            }
            // 横向制表符
            if (sp.text === '\t') {
                continue
            }
            // 纵向制表符
            if (sp.text === '\v') {
                continue
            }
            // 换页符
            if (sp.text === '\f') {
                continue
            }
            // 删除符
            if (sp.text[0] === '\x7F') {
                continue
            }

            // 忽略其他不能显示的字符
            if (sp.charWidth === 0) {
                continue
            }

            // 正常文本
            const $row = this._getRowAt(this._caretRow)
            if (this._caretMode === 'insert') {
                const $sp = $row.deleteColumns(this._caretColumn, this._caretColumn)
                if (! $sp) {
                    const ncols = $row.countColumns()
                    if (this._caretColumn > ncols)
                        $row.appendSpan(ShTextSpan.create(' '.repeat(this._caretColumn - ncols), {}, this._options))
                }
                $row.insertSpanBefore(sp, $sp)
            }
            else {
                $row.replaceSpans(this._caretColumn, [sp])
            }
            this._caretMove(this._caretRow, this._caretColumn + this.charWidthToColumns(sp.charWidth) * sp.text.length)
        }
    }

    public showCaret(show: boolean = true) {
        this.$caret.style.display = show ? '' : 'none'
    }

    public enableKeyboardInput(enable: boolean = true) {
        const $input_compositionstart = () => {
            this.$input.updateCssStyle({
                left: this.$caret.offsetLeft + 'px',
                top: this.$caret.offsetTop + (this._rowHeight + this._options.defaultEnFont.size) / 2  - this.$input.offsetHeight + 'px',
            })
        }

        const $input_compositionend = () => {
            if (this.$input.value.length > 0) {
                this.writeText(this.$input.value)
                this.$input.value = ''
            }
            this.$input.style.left = '-9999px'
        }

        if (enable && this.$input.onkeydown === null) {
            this.$input.onkeydown = (e) => {
                this._caretPauseBlink()

                if (e.key === 'Enter') {
                    this.writeText('\n')
                }
                else if (e.key === 'Backspace') {
                    this.writeText('\b')
                }
                else if (e.key === 'ArrowLeft') {
                    this.writeText('\x1b[1D')
                }
                else if (e.key === 'ArrowRight') {
                    this.writeText('\x1b[1C')
                }
                else if (e.key === 'ArrowUp') {
                    this.writeText('\x1b[1A')
                }
                else if (e.key === 'ArrowDown') {
                    this.writeText('\x1b[1B')
                }
            }
            this.$input.oninput = (e) => {
                if ((e as InputEvent).isComposing)
                    return
                if (this.$input.value.length > 0) {
                    this.writeText(this.$input.value)
                    this.$input.value = ''
                }
            }
            this.$input.on('compositionstart', $input_compositionstart)
            this.$input.on('compositionend', $input_compositionend)
            this.$input.focus()
        }
        else {
            this.$input.oninput = null
            this.$input.onkeydown = null
            this.$input.off('compositionstart', $input_compositionstart)
            this.$input.off('compositionend', $input_compositionend)
            this.$input.blur()
        }

    }

    /**
     * 返回显示在屏幕上的第 row 行的 Row 对象。
     * 
     * @param row 屏幕上的行号，从 0 开始。
     * @returns 显示在屏幕上第 row 行的 Row 对象。
     */
    private _getRowAt(row: number): ShRowElement {
        const index = this._scrollRow + row
        shlib.assert(row >= 0 && row < this._maxRows && index < this.$screen.children.length)

        return this.$screen.children[index] as ShRowElement
    }

    private _insertRowAt(row: number): ShRowElement {
        const index = this._scrollRow + row
        shlib.assert(row >= 0 && row <= this._maxRows && index <= this.$screen.children.length)

        if (row === this._maxRows) {
            this._vscroll(1)
            row--
        }

        if (index < this.$screen.children.length)
            return this.$screen.children[index].insertAdjacentElement('beforebegin', ShRowElement.create(this)) as ShRowElement
        else {
            this.$screen.append(ShRowElement.create(this))
            return this.$screen.lastElementChild as ShRowElement
        }
    }

    private _updateLayout() {
        // 重新计算行高和屏幕行数
        this._rowHeight = Math.ceil(Math.max(this._options.defaultEnFont.size, this._options.defaultCnFont.size) * this._options.rowHeightRatio)
        this._maxRows = Math.floor(this.$screen.clientHeight / this._rowHeight)

        // 重新计算列宽和屏幕列数
        this._columnWidth = Math.ceil(Math.max(this._options.defaultEnFont.monoCharWidth, this._options.defaultCnFont.size / 2))
        this._maxColumns = Math.floor(this.$screen.clientWidth / this._columnWidth)

        this.$container.updateCssStyle({
            '--shterm-en-font': this._options.defaultEnFont.cssValue,
            '--shterm-cn-font': this._options.defaultCnFont.cssValue,
            '--shterm-row-height-ratio': `${this._options.rowHeightRatio}`,
            '--shterm-fore-color': this._options.foreColor,
            '--shterm-back-color': this._options.backColor,
            '--shterm-row-height': `${this._rowHeight}px`,
            '--shterm-column-width': `${this._columnWidth}px`,
        })

        // 重新计算屏幕的留白尺寸
        const paddingTop = (this.$screen.clientHeight - this._rowHeight * this._maxRows) / 2
        const paddingLeft = (this.$screen.clientWidth - this._columnWidth * this._maxColumns) / 2
        this.$screen.style.padding = `${paddingTop}px ${paddingLeft}px`

        // 尺寸参数变化后，每个 ShSpanElement 的尺寸要重新计算
        for (let i = 0; i < this.$screen.children.length; i++) {
            const $row = this.$screen.children[i] as ShRowElement
            for (let j = 0; j < $row.children.length; j++) {
                const $sp = $row.children[j] as ShSpanElement
                $sp.updateLayout()
            }
        }

        this._caretMove()
    }

    /**
     * 移动光标到屏幕上的指定位置。
     * 
     * @param row 光标在屏幕上的行号，从 0 开始。
     * @param col 光标在屏幕上的列号，从 0 开始。
     */
    private _caretMove(row?: number, col?: number) {
        if (row === undefined) {
            row = this._caretRow
            col = this._caretColumn
        } else {
            shlib.assert(col).hasValue()
            col = col!
        }

        if (row < 0)
            row = 0
        if (row >= this._maxRows)
            row = this._maxRows - 1
        if (this._scrollRow + row >= this.$screen.children.length)
            row = this.$screen.children.length - 1 - this._scrollRow

        const $row = this._getRowAt(row)

        if (col < 0)
            col = 0
        if (col >= this._maxColumns)
            col = this._maxColumns - 1
        if (col > $row.countColumns())
            col = $row.countColumns()

        const paddingTop = (this.$screen.clientHeight - this._rowHeight * this._maxRows) / 2
        const paddingLeft = (this.$screen.clientWidth - this._columnWidth * this._maxColumns) / 2
        this.$caret.updateCssStyle({
            left: paddingLeft + col * this._columnWidth + 'px',
            top: paddingTop + row! * this._rowHeight + 'px',
        })

        this._caretRow = row
        this._caretColumn = col
    }

    private _caretPauseBlink() {
        if (this._caretPauseTimerId > 0)
            window.clearTimeout(this._caretPauseTimerId)

        this.$caret.style.animation = 'none'
        this._caretPauseTimerId = window.setTimeout(() => this.$caret.style.animation = '', 100)
    }

    private _vscroll(deltaRow: number): number {
        if (deltaRow === 0)
            return 0
        
        if (this._scrollRow + deltaRow < 0)
            deltaRow = -this._scrollRow

        if (this._scrollRow + deltaRow >= this.$screen.children.length)
            deltaRow = this.$screen.children.length - 1 - this._scrollRow

        this._scrollRow += deltaRow
        this.$screen.scrollBy(0, deltaRow * this._rowHeight)
        console.log(this._scrollRow)
        
        return deltaRow
    }
}