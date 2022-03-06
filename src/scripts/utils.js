'use strict';

module.exports = {
    getLines: getLines,
    newLine: newLine,
    checkLines: checkLines,
    openFile: openFile,
    saveAll: saveAll,
};

Object.defineProperty(module.exports, "__esModule", { value: true });

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

    if (file.value !== undefined) {
        file.value.toString().split('\n').forEach(function (line) {
            let ln = document.createElement('br');
            window.edit.innerHTML += line;
            window.edit.appendChild(ln);
            newLine();
        });
        
        window.currentfile = file;

        if (window.openfiles.names.indexOf(file) === -1 && (Object.keys(window.openfiles.dict).length > window.openfiles.names.length || Object.keys(window.openfiles.dict).length === 0)) {
            let fileCont = document.createElement('div');
            fileCont.id = file.name;
            fileCont.innerHTML = `<p>${file.name}</p>`;
            let cell = window.filesbar.insertCell(window.openfiles.names.length-1);
            cell.className = 'open-files-bar-cont';
            cell.appendChild(fileCont);

            fileCont.onclick = function () {
                openFile(file);
            }
            window.openfiles.dict[file.name] = file;
            window.openfiles.names.push(file.name);
        }
    }
    checkLines();
}

function saveAll() {
    window.settings['currentfile'] = window.currentfile;
    window.settings['openfiles'] = window.openfiles;

    fs.writeFileSync('../easy-note/src/storage/storage.json', JSON.stringify(window.settings));
    Object.keys(window.openfiles.dict).forEach((file) => {
        if (window.openfiles.dict[file].path != undefined) {
            window.win.webContents.send('SAVE FILE', window.openfiles.dict[file]);
        }
    });

}
