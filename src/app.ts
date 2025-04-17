import * as shlib from './shlib'
import { ShTerm } from './shterm'

shlib.init()
const $term = new ShTerm(document.getElementById('shterm')!, {
    enFontName: 'Consolas',
    enFontSize: 18,
    cnFontName: '楷体',
    cnFontSize: 18,
})

$term.enableKeyboardInput()

document.getElementById('cmdbar')!.onclick = () => {
    $term.setOptions({
        enFontName: 'Consolas',
        enFontSize: 14,
        cnFontName: '微软雅黑',
        cnFontSize: 14,
    })
}