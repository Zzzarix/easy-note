const { remote, ipcRenderer } = require('electron');
const { Menu, dialog, app } = remote;

const fs = require('fs');
const path = require('path');
const os = require('os');

import { newLine, checkLines, openFile, saveAll, getCaretPos, sleep, removeFile } from '..\\src\\scripts\\utils.js';

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
    window.saveflag = true, // app can be closed - boolean
    window.homedir = os.homedir() + '\\AppData\\Local', // homedir 
    window.appdir, // app local dir for saving system files
    window.settings = {} // current window settings {
                    //   'currentfile':  window.currentfile,
                    //   'openfiles': window.openfiles
                    //}
);

function preload() {
    document.getElementById('close-btn').addEventListener('click', () => { if (!window.saveflag) { while (true) { if (window.saveflag) { break; } sleep(60) } } window.win.close(); });

    window.rectButton = document.getElementById('rect-btn');
    window.rectButton.addEventListener('click', () => { if (window.win.isMaximized()) { window.win.unmaximize() } else { window.win.maximize() } });
    
    setInterval(() => { if (!window.win.isMaximized()) { window.rectButton.className = 'rect-btn-max' } else { window.rectButton.className = 'rect-btn-min' } }, 10);

    document.getElementById('minus-btn').addEventListener('click', () => { window.win.minimize() });
    
    window.edit = document.getElementById('field');
    window.countcolumn = document.getElementById('column-table');
    window.form = document.getElementById('form');
    
    newLine();
    
    app.whenReady().then(() => {
        document.getElementById('file-menu').addEventListener('click', () => {
            let menu = Menu.buildFromTemplate([
                { label: 'Новый файл', click: () => window.win.webContents.send('NEW FILE'), accelerator: 'CommandOrControl+N' },
                { label: 'Новое окно', click: () => window.win.webContents.send('NEW WIN'), accelerator: 'CommandOrControl+Shift+N' },
                { type: 'separator' },
                { label: 'Открыть файл...', click: () => window.win.webContents.send('OPEN FILE'), accelerator: 'CommandOrControl+O' },
                // { label: 'Открыть папку...', click: () => window.win.webContents.send('OPEN DIR'), accelerator: 'CommandOrControl+K' },
                { type: 'separator' },
                { label: 'Сохранить', click: () => window.win.webContents.send('SAVE FILE', undefined), accelerator: 'CommandOrControl+S' },
                { label: 'Сохранить как...', click: () => window.win.webContents.send('SAVE FILE AS'), accelerator: 'CommandOrControl+Shift+S' },
            ]);

            menu.popup({ window: window.win, x: 0, y: 31 });
        });
        document.getElementById('edit-menu').addEventListener('click', () => {
            let menu = Menu.buildFromTemplate([
                { label: 'Отменить', role: 'undo', accelerator: 'CommandOrControl+Z' },
                { label: 'Повторить', role: 'redo', accelerator: 'CommandOrControl+Y' },
                { type: 'separator' },
                { label: 'Вырезать', role: 'cut', accelerator: 'CommandOrControl+X' },
                { label: 'Копировать', role: 'copy', accelerator: 'CommandOrControl+C' },
                { label: 'Вставить', role: 'paste', accelerator: 'CommandOrControl+V' },
            ]);

            menu.popup({ window: window.win, x: 54, y: 31 });
        });
        document.getElementById('view-menu').addEventListener('click', () => {
            let menu = Menu.buildFromTemplate([
                { label: 'Приблизить', role: 'zoomIn', accelerator: 'CommandOrControl+Plus' },
                { label: 'Отдалить', role: 'zoomOut', accelerator: 'CommandOrControl+-' },
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
    })

    window.filesbar = document.getElementById('open-files-bar-table');

    if (!fs.existsSync(`${window.homedir}\\Atom prod`)) {
        fs.mkdirSync(`${window.homedir}\\Atom prod`)
    }

    if (!fs.existsSync(`${window.homedir}\\Atom prod\\Easy app`)) {
        fs.mkdirSync(`${window.homedir}\\Atom prod\\Easy app`)
    }

    if (!fs.existsSync(`${window.homedir}\\Atom prod\\Easy app\\storage`)) {
        fs.mkdirSync(`${window.homedir}\\Atom prod\\Easy app\\storage`)
    }

    window.appdir = `${window.homedir}\\Atom prod\\Easy app`

    if (fs.existsSync(`${window.appdir}\\storage\\storage.json`)) {
        window.settings = JSON.parse(fs.readFileSync(`${window.appdir}\\storage\\storage.json`));
        if (Object.keys(window.settings).length > 0){
            Object.keys(window.settings.openfiles.dict).forEach((file, index) => {
                openFile(window.settings.openfiles.dict[file]);
            });
            openFile(window.settings.currentfile);
            if (window.openfiles.names.length === 0){
                openFile(undefined);
            }
        }
    }
    else {
        fs.writeFileSync(`${window.appdir}\\storage\\storage.json`, '{}');
        openFile(undefined);
    }
    
    setInterval(() => { if (window.saveflag) saveAll() }, 10000);
}

window.onload = function () {
    preload();

    window.onclick = function (e) {
        let x = e.clientY - 70;
        window.curline = Math.max(Math.min(Math.ceil(x / 19), edit.children.length), 1);
        
    }

    window.edit.addEventListener('DOMNodeInserted', function(e) {
        if (e.target === 'text' && window.edit.children.length === 0) {
            
        }

        if (e.target === 'div') e.target.id = `input-line-edit-${window.edit.children.line}`
    });

    window.edit.addEventListener('DOMNodeRemoved', function(e) {
    });

    window.form.onpaste = function (e) {
        window.currentfile.value = window.edit.value;
        checkLines();
    }

    window.form.oninput = function (e) {
        if (window.edit.children.length === 0) {
            let cont = document.createElement('div');

            window.edit.appendChild(cont);
        }

        window.currentfile.value = window.edit.value;
        checkLines();
    }

    window.form.onclick = function () {
        window.edit.focus();
    }

    window.form.onmouseup = function (e) {
        if (e.which == 3) {
            let menu = Menu.buildFromTemplate([
                { label: 'Отменить', role: 'undo', accelerator: 'CommandOrControl+Z' },
                { label: 'Повторить', role: 'redo', accelerator: 'CommandOrControl+Y' },
                { type: 'separator' },
                { label: 'Вырезать', role: 'cut', accelerator: 'CommandOrControl+X' },
                { label: 'Копировать', role: 'copy', accelerator: 'CommandOrControl+C' },
                { label: 'Вставить', role: 'paste', accelerator: 'CommandOrControl+V' },
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

// events emmiters

ipcRenderer.on('SAVE ALL', function () {
    saveAll();
    if (!window.saveflag) {
        while (true) {
            if (window.saveflag) {
                break;
            }
            sleep(60)
        }
    }

    app.quit();
});

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
    win.loadURL(`file://${__dirname}\\index.html`);
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
            window.openfiles.dict[pth] = {
                value: fs.readFileSync(pth, 'utf8').toString(),
                path: pth,
                name: path.basename(pth),
                type: 'file',
            };
            openFile(window.openfiles.dict[pth]);
        });
    }
});

ipcRenderer.on('SAVE FILE', function (e, file) {
    if (file !== undefined && file.path !== undefined) {
        fs.writeFileSync(file.path, window.edit.value, 'utf8');
    }
    else if (window.currentfile.path !== undefined && file === undefined) {
        fs.writeFileSync(window.currentfile.path, window.edit.value, 'utf8');
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
        fs.writeFileSync(result, window.edit.value, 'utf8');
        window.currentfile.path = result;
        let fileCont = document.getElementById(window.currentfile.name);
        fileCont.id = path.basename(result);
        fileCont.innerHTML = path.basename(result);
        window.openfiles.dict[result] = window.openfiles.dict[window.currentfile.path];
        removeFile(window.currentfile.path);
        window.currentfile.name = path.basename(result);
    }
});
