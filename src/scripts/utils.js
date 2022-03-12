const { clipboard, shell } = require('electron');

'use strict';

module.exports = {
    getLines: getLines,
    newLine: newLine,
    checkLines: checkLines,
    openFile: openFile,
    saveAll: saveAll,
    getCaretPos: getCaretPos,
    sleep: sleep,
    removeFile: removeFile,
};

Object.defineProperty(module.exports, "__esModule", { value: true });

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getLines() {
    return window.edit.value.split('\n').length;
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
        el.style = 'color: #000000';
    }

    if (file) {
        let tmp = document.getElementById(file.name + ' ' + file.path); 
        
        if (tmp) {
            tmp.style = 'color: #3e9eba';
        }
    }

    window.edit.value = '';
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
    else if ( window.openfiles.names.length === 1 ) {
        removeFile({ value: '', path: undefined, name: 'untitled', type: 'file' });
    }

    if (file.value) {
        file.value.toString().split('\n').forEach(function (line) {
            window.edit.value += line.replace('\t', '    ') + '\n';
            newLine();
        });
        window.edit.style.height = window.edit.scrollHeight + 'px';
    }
    else {
        window.edit.value = '';
        newLine();
    }
        
    window.currentfile = file;

    if (file.path === undefined) { window.openfiles.dict['untitled'] = file; }
    else { window.openfiles.dict[file.path] = file; }

    if (window.openfiles.names.indexOf(file) === -1 && (Object.keys(window.openfiles.dict).length > window.openfiles.names.length || Object.keys(window.openfiles.dict).length === 0)) {
        let fileCont = document.createElement('div');
        fileCont.className = 'open-files-bar-cont';
        if (file.name.length > 20) {
            fileCont.innerHTML = `<p>${file.name.splice(17)}...</p>`;
        }
        else {
            fileCont.innerHTML = `<p>${file.name}</p>`;
        }
        
        let cell = window.filesbar.insertCell(window.openfiles.names.length-1);
        
        cell.id = file.name + ' ' + file.path;
        cell.className = 'open-files-bar-wrapper';

        // let filecloser = document.createElement('div');
        // filecloser.className = 'open-files-bar-cont-closer';
        // filecloser.id = '_' + file.name + ' ' + file.path;

        // filecloser.onclick = function () {
        //     document.getElementById(file.name + ' ' + file.path).remove();
        //     removeFile(file);
        // }
        
        
        cell.style = 'color: #3e9eba';

        // fileCont.appendChild(filecloser);
        cell.appendChild(fileCont);

        fileCont.onclick = function () {
            openFile(file);
            cell.style = 'color: #3e9eba';
        }

        fileCont.onmouseup = function (e) {
            if (e.which == 3) {
                let menu = Menu.buildFromTemplate([
                    { label: 'Закрыть', click: function () { removeFile(file); } },
                    { label: 'Скопировать путь', click: function () { clipboard.writeText(file.path); }, enabled: file.path === undefined? false : true },
                    { label: 'Показать в проводнике', click: function () { shell.showItemInFolder(file.path); }, enabled: file.path === undefined? false : true },
                ]);
    
                menu.popup({ window: window.win });
            }
        }

        window.openfiles.names.push(file.path);
    }
    checkLines();
    window.openfiles.names = Object.keys(window.openfiles.dict);
}

function removeFile(file) {
    let splindex = -1;
    window.openfiles.names.forEach((el, index) => {
        if (el === file.path && splindex > 0) { splindex = index };
    });
    window.openfiles.names.splice(splindex, 1);
    delete window.openfiles.dict[file.path];

    try { document.getElementById(file.name + ' ' + file.path).remove(); } catch (e) { console.log(e, file.name + ' ' + file.path, file); }

    if ( window.openfiles.names.length < 1 ) {
        openFile(undefined);
    }
    else {
        openFile(window.openfiles.dict[window.openfiles.names[0]]);
    }

    window.openfiles.names = Object.keys(window.openfiles.dict);
}

function saveAll() {
    window.saveflag = false;
    window.settings['currentfile'] = window.currentfile;
    window.settings['openfiles'] = window.openfiles;

    fs.writeFileSync(`${window.appdir}\\storage\\storage.json`, JSON.stringify(window.settings));
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
