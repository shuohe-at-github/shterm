import * as shlib from '../shlib'

import { ShTerm_Span } from './ShTerm_Span'
import { ShTerm } from './ShTerm'


export class ShTerm_Paragraph extends HTMLElement {

    public $term!: ShTerm

    public static create($term: ShTerm): ShTerm_Paragraph {
        const $row = shlib.createElement('shterm-row') as ShTerm_Paragraph
        $row.$term = $term

        return $row
    }

    constructor() {
        super()
    }

    public countColumns(): number {
        let count = 0
        for (let i = 0; i < this.children.length; i++) {
            const $sp = this.children[i] as ShTerm_Span
            count += $sp.countColumns()
        }

        return count
    }
}

customElements.define('shterm-p', ShTerm_Paragraph)