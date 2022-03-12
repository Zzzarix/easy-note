const { clipboard, shell, ipcRenderer } = require('electron');

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
    insertInTextArea: insertInTextArea,
    setTaskBar: setTaskBar,
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
    try { window.win.send('SET TASK NAME', `Открываю '${file.name}'...`); } catch (e) {}
    for (let el of window.filesbar.children) {
        if (window.isdarktheme) { el.style.color = '#ffffff'; }
        else { el.style.color = '#000000'; }
    }

    if (file) {
        let tmp = document.getElementById(file.name + ' ' + file.path); 
        
        if (tmp) {
            tmp.style.color = '#3e9eba';
        }
    }

    window.edit.value = '';
    window.divcount = 0;
    window.lines = 0;
    window.countcolumn.children[0].innerHTML = '';
    
    if (!file) {
        file = {
            value: '',
            path: '',
            name: 'untitled',
            type: 'file'
        };
    }
    else if (Object.keys(window.openfiles.dict).length === 1 && Object.keys(window.openfiles.dict).indexOf('') !== -1 ) {
        if (window.openfiles.dict[''].value === '') { console.log(1); removeFile({ path: '', name: 'untitled' }); }
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

    if (Object.keys(window.openfiles.dict).indexOf(file.path) === -1 || Object.keys(window.openfiles.dict).length === 0 ) {
        let fileCont = document.createElement('div');
        fileCont.className = 'open-files-bar-cont';
        if (file.name.length > 18) {
            fileCont.innerHTML = `<p>${file.name.substr(0, 15)}...</p>`;
        }
        else {
            fileCont.innerHTML = `<p>${file.name}</p>`;
        }
        
        let cell = window.filesbar.insertCell(Object.keys(window.openfiles.dict).length-1);
        
        cell.id = file.name + ' ' + file.path;
        cell.className = 'open-files-bar-wrapper';

        // let filecloser = document.createElement('div');
        // filecloser.className = 'open-files-bar-cont-closer';
        // filecloser.id = '_' + file.name + ' ' + file.path;

        // filecloser.onclick = function () {
        //     document.getElementById(file.name + ' ' + file.path).remove();
        //     removeFile(file);
        // }
        
        
        cell.style = `color: #3e9eba; width: ${Math.max(fileCont.clientWidth + 20, 150)}`;

        // fileCont.appendChild(filecloser);
        cell.appendChild(fileCont);

        fileCont.onclick = function () {
            if (window.currentfile === file) { return; }
            openFile(file);
            cell.style = 'color: #3e9eba';
        }

        fileCont.onmouseup = function (e) {
            if (e.which == 3) {
                let menu = Menu.buildFromTemplate([
                    { label: 'Закрыть', click: function () { saveAll(); if (!window.saveflag) { while (true) { if (window.saveflag) { break; } sleep(60); } } removeFile(file); } },
                    { label: 'Скопировать путь', click: function () { clipboard.writeText(file.path); }, enabled: file.path === undefined? false : true },
                    { label: 'Показать в проводнике', click: function () { shell.showItemInFolder(file.path); }, enabled: file.path === undefined? false : true },
                ]);
    
                menu.popup({ window: window.win });
            }
        }
    }
    checkLines();
    window.openfiles.dict[file.path] = file;

    sleep(500);
    setTaskBar();
}

function setTaskBar(text='Готово') {
    try { window.win.send('SET TASK NAME', text); } catch (e) { console.log(e); }
}

function removeFile(file) {
    delete window.openfiles.dict[file.path];

    try { document.getElementById(file.name + ' ' + file.path).remove(); } catch (e) { console.log(e, file.name + ' ' + file.path, file); }

    if ( Object.keys(window.openfiles.dict).length === 0  ) {
        openFile(undefined);
    }
    else {
        openFile(window.openfiles.dict[Object.keys(window.openfiles.dict)[0]]);
    }
}

function saveAll() {
    setTaskBar('Сохранение...');
    window.saveflag = false;
    window.settings['currentfile'] = window.currentfile;
    Object.keys(window.openfiles.dict).forEach(function (file) {
        if (!window.openfiles.dict[file].name) { window.openfiles.dict[file].name = 'untitled' }
        if (!window.openfiles.dict[file].value) { window.openfiles.dict[file].value = '' }
    });
    window.settings['openfiles'] = window.openfiles;

    fs.writeFileSync(`${window.appdir}\\storage\\storage.json`, JSON.stringify(window.settings));
    Object.keys(window.openfiles.dict).forEach((file) => {
        if (window.openfiles.dict[file].path) {
            window.win.webContents.send('SAVE FILE', window.openfiles.dict[file]);
        }
    });

    ipcRenderer.send('SET TOSAVE DATA', { openfiles: window.openfiles, currentfile: window.currentfile, settings: window.settings }, { storage: `${window.appdir}\\storage\\storage.json` });

    window.saveflag = true;

    sleep(500);
    setTaskBar();
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

function insertInTextArea(text, pos) {
    window.edit.value = window.edit.value.substr(0, pos) + text + window.edit.value.slice(pos+1);
}
