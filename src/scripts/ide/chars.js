import { checkLines,  insertInTextArea } from '..\\src\\scripts\\utils.js';

let doublechars = {
    '(': ')',
    '{': '}',
    "'": "'",
    '"': '"',
}

window.form.oninput = function (e) {
    let char = e.data;

    console.log(e, char);
    console.log(window.edit.selectionStart, window.edit.selectionEnd)

    if (Object.keys(doublechars).indexOf(char) !== -1) {
        insertInTextArea(doublechars[char], window.edit.selectionStart);
        window.edit.selectionEnd--;
    }

    window.currentfile.value = window.edit.value;
    checkLines();
}

