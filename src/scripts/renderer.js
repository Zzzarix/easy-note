const { remote, ipcRenderer } = require('electron');
const { Menu, dialog } = remote;

const fs = require('fs');
const path = require('path');

import { newLine, checkLines, openFile, saveAll, getCaretPos } from '../src/scripts/utils.js';

window.win = remote.getCurrentWindow(); // current electron window
const Browserwindow = remote.BrowserWindow; // browser window constructor

(  
    window.edit, // editable element
    window.curline, // editable element selected line
    window.countcolumn, // count column element
    window.form, // editable form element
    window.filesbar, // bar of opened files element
    window.rectButton, // maximize / minimize button 
    window.currentfile = {}, // current file
    window.openfiles = { names: [], dict: {} }, // list of opened files
    window.divcount = 0, // count of div's in editable element
    window.lines = 0, // total lines in count column element
    window.saveflag, // can be saved boolean
    window.settings = {} // current window settings {
                    //   'currentfile':  window.currentfile,
                    //   'openfiles': window.openfiles
                    //}
);

function preload() {
    document.getElementById('close-btn').addEventListener('click', () => { window.saveflag = false; saveAll(); window.win.close(); });

    window.rectButton = document.getElementById('rect-btn');
    window.rectButton.addEventListener('click', () => { if (window.win.isMaximized()) { window.win.unmaximize() } else { window.win.maximize() } });
    
    setInterval(() => { if (!window.win.isMaximized()) { window.rectButton.className = 'rect-btn-max' } else { window.rectButton.className = 'rect-btn-min' } }, 10);

    document.getElementById('minus-btn').addEventListener('click', () => { window.win.minimize() });
    
    window.edit = document.getElementById('field');
    window.countcolumn = document.getElementById('column-table');
    window.form = document.getElementById('form');
    
    document.getElementById('file-menu').addEventListener('click', () => {
        let menu = Menu.buildFromTemplate([
            { label: 'Новый файл', click: () => window.win.webContents.send('NEW FILE'), accelerator: 'CmdOrCtrl+N' },
            { label: 'Новое окно', click: () => window.win.webContents.send('NEW WIN'), accelerator: 'CmdOrCtrl+Shift+N' },
            { type: 'separator' },
            { label: 'Открыть файл...', click: () => window.win.webContents.send('OPEN FILE', dialog), accelerator: 'CmdOrCtrl+O' },
            // { label: 'Открыть папку...', click: () => window.win.webContents.send('OPEN DIR'), accelerator: 'CmdOrCtrl+K' },
            { type: 'separator' },
            { label: 'Сохранить', click: () => window.win.webContents.send('SAVE FILE', undefined), accelerator: 'CmdOrCtrl+S' },
            { label: 'Сохранить как...', click: () => window.win.webContents.send('SAVE FILE AS', dialog), accelerator: 'CmdOrCtrl+Shift+S' },
        ]);

        menu.popup({ window: window.win, x: 0, y: 31 });
    });
    document.getElementById('edit-menu').addEventListener('click', () => {
        let menu = Menu.buildFromTemplate([
            { label: 'Отменить', role: 'undo', accelerator: 'CmdOrCtrl+Z' },
            { label: 'Повторить', role: 'redo', accelerator: 'CmdOrCtrl+Y' },
            { type: 'separator' },
            { label: 'Вырезать', role: 'cut', accelerator: 'CmdOrCtrl+X' },
            { label: 'Копировать', role: 'copy', accelerator: 'CmdOrCtrl+C' },
            { label: 'Вставить', role: 'paste', accelerator: 'CmdOrCtrl+V' },
        ]);

        menu.popup({ window: window.win, x: 54, y: 31 });
    });
    document.getElementById('view-menu').addEventListener('click', () => {
        let menu = Menu.buildFromTemplate([
            { label: 'Приблизить', role: 'zoomIn', accelerator: 'CmdOrCtrl+=' },
            { label: 'Отдалить', role: 'zoomOut', accelerator: 'CmdOrCtrl+-' },
        ]);

        menu.popup({ window: window.win, x: 123, y: 31 });
    });
    document.getElementById('win-menu').addEventListener('click', () => {
        let menu = Menu.buildFromTemplate([
            { label: 'Свернуть', role: 'minimize' },
            { label: 'Закрыть', role: 'quit' },
            { label: 'Открыть консоль', click: () => { window.win.webContents.openDevTools({mode: 'undocked'}); } },
        ]);

        menu.popup({ window: window.win, x: 163, y: 31 });
    });
    window.filesbar = document.getElementById('open-files-bar-table');

    newLine();

    if (fs.exists('../easy-note/src/storage/storage.json', (err) => { if (err) console.warn('Settings file cannot be found'); })) {
        window.settings = JSON.parse(fs.readFile('../easy-note/src/storage/storage.json', (err) => { if (err) console.warn(`Settings file cannot be read: ${err}`); }));
        window.currentfile = window.settings['currentfile'];
        if (window.currentfile.name !== 'untitled') {
            openFile(window.currentfile);
        }
        else {
            openFile(undefined);
        }
    }
    else {
        fs.writeFile('../easy-note/src/storage/storage.json', '{}', (err) => { console.warn(`Settings file cannot be written: ${err}`); });
        openFile(undefined);
    }
    
    // setInterval(() => { if (window.saveflag) saveAll() }, 10000);
}

window.onload = function () {
    preload();

    window.onclick = function (e) {
        let x = e.clientY - 70;
        window.curline = Math.max(Math.min(Math.ceil(x / 19), edit.children.length), 1);
        
        console.log(window.curline);
    }

    window.edit.addEventListener('DOMNodeInserted', function(e) {
        console.log(e);
        if (e.target === 'text' && window.edit.children.length === 0) {
            
        }

        if (e.target === 'div') e.target.id = `input-line-edit-${window.edit.children.line}`
    });

    window.edit.addEventListener('DOMNodeRemoved', function(e) {
        console.log(e);
    });

    window.form.onpaste = function (e) {
        window.currentfile.value = window.edit.innerText;
        checkLines();
    }

    window.form.oninput = function (e) {
        if (window.edit.children.length === 0) {
            let cont = document.createElement('div');

            window.edit.appendChild(cont);
        }

        console.log(getCaretPos())

        window.currentfile.value = window.edit.innerText;
        checkLines();
    }

    window.form.onclick = function () {
        window.edit.focus();
    }

    window.form.onmouseup = function (e) {
        if (e.which == 3) {
            let menu = Menu.buildFromTemplate([
                { label: 'Отменить', role: 'undo', accelerator: 'CmdOrCtrl+Z' },
                { label: 'Повторить', role: 'redo', accelerator: 'CmdOrCtrl+Y' },
                { type: 'separator' },
                { label: 'Вырезать', role: 'cut', accelerator: 'CmdOrCtrl+X' },
                { label: 'Копировать', role: 'copy', accelerator: 'CmdOrCtrl+C' },
                { label: 'Вставить', role: 'paste', accelerator: 'CmdOrCtrl+V' },
            ]);

            menu.popup({ window: window.win });
        }
    }

    window.edit.addEventListener('DOMNodeInserted', function (e) {
        if (e.target.tagName === 'div') {
            e.target.className = 'input-line';
            e.target.id = `input-line-${window.divcount}`;
            window.divcount++;
        }
    });
}

// events emmiter

ipcRenderer.on('NEW FILE', function () {
    if (window.openfiles.names.indexOf('untitled') !== -1)
    openFile(undefined);
});

ipcRenderer.on('NEW WIN', function () {
    let win = new Browserwindow({
        width: 800,
        height: 600,
        title: 'Easy app',
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    win.loadURL(`file://${__dirname}/index.html`);
});
ipcRenderer.on('OPEN FILE', function () {
    let result = dialog.showOpenDialogSync({
        title: 'Открыть файл',
        buttonLabel: 'Открыть',
        filters: [
            { name: 'Все файлы', extensions: ['*'] },
        ],
        properties: [
            'openFile'
        ]
    });
    if (result != undefined) {
        result.forEach((pth) => {
            window.openfiles.dict[path.basename(pth)] = {
                value: fs.readFileSync(pth, 'utf8').toString(),
                path: pth,
                name: path.basename(pth),
                type: 'file',
            };
            openFile(window.openfiles.dict[path.basename(pth)]);
        });
    }
});
ipcRenderer.on('SAVE FILE', function (file) {
    if (file !== undefined && file.path !== undefined) {
        fs.writeFileSync(file.path, window.edit.innerText, 'utf8');
    }
    else if (window.currentfile.path !== undefined) {
        fs.writeFileSync(window.currentfile.path, window.edit.innerText, 'utf8');
    }
    else {
        window.win.webContents.send('SAVE FILE AS');
    }
});
ipcRenderer.on('SAVE FILE AS', function () {
    let result = dialog.showSaveDialogSync({
        title: 'Сохранить как',
        buttonLabel: 'Сохранить',
    });
    if (result != undefined) {
        fs.writeFileSync(result, window.edit.innerText, 'utf8');
        window.currentfile.path = result;
        let fileCont = document.getElementById(window.currentfile.name);
        fileCont.id = path.basename(result);
        fileCont.innerHTML = path.basename(result);
        window.openfiles.dict[path.basename(result)] = window.openfiles.dict[window.currentfile.name];
        delete window.openfiles.dict[window.currentfile.name];
        let splindex = -1;
        window.openfiles.names.forEach((el, index) => {
            if (el === window.openfiles.dict && splindex > 0) splindex = index;
        });
        window.openfiles.names.splice(splindex, 1);
        window.openfiles.names.push(path.basename(result));
        window.currentfile.name = path.basename(result);
    }
});