'use strict';

module.exports = {
    getLines: getLines,
    newLine: newLine,
    checkLines: checkLines,
    openFile: openFile,
    saveAll: saveAll,
    getCaretPos: getCaretPos,
    sleep: sleep,
};

Object.defineProperty(module.exports, "__esModule", { value: true });

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getLines() {
    return window.edit.children.length;
}

function newLine() {
    window.lines++;
    let row = window.countcolumn.insertRow(window.lines - 1);
    let node = row.insertCell(0);
    row.className = 'column-item text';
    row.id = `line-${window.lines}`;
    node.innerHTML = window.lines;
}

function checkLines() {
    let lns = getLines();
    if (lns > window.lines) {
        while (lns !== window.lines) {
            newLine();
        }
    }
    else if (lns < window.lines) {
        while (lns !== window.lines) {
            if (window.lines > 1) {
                document.getElementById(`line-${window.lines}`).remove();
                window.lines--;
            }
            else break
        }
    }
}

function openFile(file) {
    for (let el of window.filesbar.children) {
        if ( el.children.length > 0 ) {
            el.children[0].style = 'color: #000000';
        }
    }

    if (file) {
        let tmp = document.getElementById(file.name); 
        
        if (tmp) {
            tmp.style = 'color: #3e9eba';
        }
    }

    window.edit.innerText = '';
    window.divcount = 0;
    window.lines = 0;
    window.countcolumn.children[0].innerHTML = '';

    if (file === undefined) {
        file = {
            value: '',
            path: undefined,
            name: 'untitled',
            type: 'file'
        };
    }

    if (file.value) {
        file.value.toString().split('\n').forEach(function (line) {
            let ln = document.createElement('div');
            ln.innerHTML = line;
            window.edit.appendChild(ln);
            newLine();
        });
    }
    else {
        window.edit.innerHTML = '';
        newLine();
    }
        
    window.currentfile = file;
    window.openfiles.dict[file.name] = file;

    if (window.openfiles.names.indexOf(file) === -1 && (Object.keys(window.openfiles.dict).length > window.openfiles.names.length || Object.keys(window.openfiles.dict).length === 0)) {
        let fileCont = document.createElement('div');
        fileCont.id = file.name;
        fileCont.innerHTML = `<p>${file.name}</p>`;
        let cell = window.filesbar.insertCell(window.openfiles.names.length-1);
        cell.className = 'open-files-bar-cont';

        fileCont.style = 'color: #3e9eba';

        cell.appendChild(fileCont);

        fileCont.onclick = function () {
            openFile(file);
            fileCont.style = 'color: #3e9eba';
        }

        window.openfiles.names.push(file.name);
    }
    checkLines();
}

function saveAll() {
    window.saveflag = false;
    window.settings['currentfile'] = window.currentfile;
    window.settings['openfiles'] = window.openfiles;

    fs.writeFileSync(`${__dirname}\\..\\storage\\storage.json`, JSON.stringify(window.settings));
    Object.keys(window.openfiles.dict).forEach((file) => {
        if (window.openfiles.dict[file].path !== undefined) {
            window.win.webContents.send('SAVE FILE', window.openfiles.dict[file]);
        }
    });
    window.saveflag = true;
}

function getCaretPos() {
    let element = window.edit
    let caretOffset = 0;
    let doc = element.ownerDocument || element.document;
    let win = doc.defaultView || doc.parentWindow;
    let sel;
    if (typeof win.getSelection != "undefined") {
        sel = win.getSelection();
        if (sel.rangeCount > 0) {
            let range = win.getSelection().getRangeAt(0);
            let preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(element);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            caretOffset = preCaretRange.toString().length;
        }
    } else if ( (sel = doc.selection) && sel.type != "Control") {
        let textRange = sel.createRange();
        let preCaretTextRange = doc.body.createTextRange();
        preCaretTextRange.moveToElementText(element);
        preCaretTextRange.setEndPoint("EndToEnd", textRange);
        caretOffset = preCaretTextRange.text.length;
    }
    return caretOffset;
}
