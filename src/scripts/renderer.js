const { remote, ipcRenderer } = require('electron');
const { Menu, dialog, app } = remote;

const fs = require('fs');
const path = require('path');
const os = require('os');

import { newLine, checkLines, openFile, saveAll, getCaretPos, sleep, removeFile, getFile, insertInTextArea, setTaskBar } from '..\\src\\scripts\\utils.js';

window.win = remote.getCurrentWindow(); // current electron window
const Browserwindow = remote.BrowserWindow; // browser window constructor

let doublechars = {
    '(': ')',
    '{': '}',
    "'": "'",
    '"': '"',
};

(  
    window.edit, // editable element
    window.isdarktheme = false, // is durk theme currently | boolean
    window.curline, // editable element selected line
    window.countcolumn, // count column element
    window.form, // editable form element
    window.filesbar, // bar of opened files element
    window.rectButton, // maximize / minimize button
    window.currentfile = {}, // current file
    window.openfiles = { dict: {} }, // list of opened files
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
    window.taskbar = document.getElementById('task-bar-task-name');
    window.themechangebtn = document.getElementById('change-theme-btn');
    
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
                { label: 'Очистить рабочую область', click: () => { Object.keys(window.openfiles.dict).forEach((file) => { removeFile(window.openfiles.dict[file]); }); window.currentfile = null; openFile(undefined); } },
                { label: 'Сменить тему', click: () => { changetheme(); } },
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
        try { window.settings = JSON.parse(fs.readFileSync(`${window.appdir}\\storage\\storage.json`)); } catch (e) { window.settings = {}; fs.writeFileSync(`${window.appdir}\\storage\\storage.json`, '{}'); }
        if (Object.keys(window.settings).length > 0){
            Object.keys(window.settings.openfiles.dict).forEach((file) => {
                openFile(window.settings.openfiles.dict[file]);
            });
            if (window.settings.currentfile) { openFile(window.settings.currentfile); }
            
            if (Object.keys(window.openfiles.dict).length === 0) { openFile(undefined); }
        }
    }
    else {
        fs.writeFileSync(`${window.appdir}\\storage\\storage.json`, '{}');
        openFile(undefined);
    }

    if (process.defaultApp) {
        console.log(process);
        console.log(process.argv);
    }
    
    setInterval(() => { if (window.saveflag) { saveAll(); } }, 10000);
}

window.onload = function () {
    preload();

    window.onclick = function (e) {
        let x = e.clientY - 70;
        window.curline = Math.max(Math.min(Math.ceil(x / 19), edit.children.length), 1);
        
    }
    
    window.form.oninput = function (e) {
        let char = e.data;
    
        if (Object.keys(doublechars).indexOf(char) !== -1) {
            insertInTextArea(doublechars[char], window.edit.selectionStart);
            window.edit.selectionEnd--;
        }
    
        window.currentfile.value = window.edit.value;
        checkLines();
    }

    window.form.onpaste = function (e) {
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

    function changetheme () {
        if (window.isdarktheme) {
            let lnk = document.createElement('link');
            lnk.rel = `stylesheet`;
            lnk.href = 'styles/light-theme.css';
            lnk.id = 'light-theme';
            
            document.head.appendChild(lnk);
            document.getElementById('dark-theme').remove();

            for (let el of window.filesbar.children) {
                el.style.color = '#000000';
            }

            let tmp = document.getElementById(window.currentfile.name + ' ' + window.currentfile.path); 
        
            if (tmp) {
                tmp.style.color = '#3e9eba';
            }
        }
        else {
            let lnk = document.createElement('link');
            lnk.rel = `stylesheet`;
            lnk.href = 'styles/dark-theme.css';
            lnk.id = 'dark-theme';
            
            document.head.appendChild(lnk);
            document.getElementById('light-theme').remove();

            for (let el of window.filesbar.children) {
                el.style.color = '#ffffff';
            }

            let tmp = document.getElementById(window.currentfile.name + ' ' + window.currentfile.path); 
        
            if (tmp) {
                tmp.style.color = '#3e9eba';
            }
        }
        window.isdarktheme = !window.isdarktheme //window.themechangebtn
    }
}

// events emmiters

ipcRenderer.on('OPEN FILE FROM PATH', (e, pth) => {
        let fl = {
            value: fs.readFileSync(pth, 'utf8').toString(),
            path: pth,
            name: path.basename(pth),
            type: 'file',
        };
        openFile(fl);
    });

ipcRenderer.on('SET TASK NAME', (e, name) => {
    // window.taskbar.innerHTML = name;
});

ipcRenderer.on('NEW FILE', () => {
    if (Object.keys(window.openfiles.dict).indexOf('untitled') !== -1)
    openFile(undefined);
});

ipcRenderer.on('NEW WIN', () => {
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
ipcRenderer.on('OPEN FILE', () => {
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
        result.forEach((path) => {
            window.win.webContents.send('OPEN FILE FROM PATH', path);
        });
    }
});

ipcRenderer.on('SAVE FILE', (e, file) => {
    if (file && file.path) {
        fs.writeFileSync(file.path, file.value, 'utf8');
    }
    else if (window.currentfile.path && !file) {
        fs.writeFileSync(window.currentfile.path, window.edit.value, 'utf8');
    }
    else {
        window.win.webContents.send('SAVE FILE AS');
    }
});

ipcRenderer.on('SAVE FILE AS', () => {
    let result = dialog.showSaveDialogSync({
        title: 'Сохранить как',
        buttonLabel: 'Сохранить',
    });
    if (result != undefined) {
        fs.writeFileSync(result, window.edit.value, 'utf8');
        removeFile(window.currentfile);
        window.currentfile = { value: window.currentfile.value, path: result, name: path.basename(result), type: 'file' };
        openFile(window.currentfile);
    }
});
