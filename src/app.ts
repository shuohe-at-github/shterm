import * as shlib from './shlib'
import { ShTerm } from './shterm.v2/ShTerm'

shlib.init()
const $term = new ShTerm(document.getElementById('shterm')!, {
    enFontName: 'Consolas',
    enFontSize: 18,
    cnFontName: '楷体',
    cnFontSize: 18,
})
