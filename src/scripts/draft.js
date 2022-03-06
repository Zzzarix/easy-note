function makeFileList(files) {
    let list = document.createElement('ul');
    list.type = 'none';
    list.className = 'file-tree';
    Object.keys(files).forEach(function (name, index, arr) {
        let fls = document.createElement('li');
        let flsCont = document.createElement('div');
        flsCont.className = 'file-tree-el';

        let upCont = document.createElement('div');

        flsCont.appendChild(upCont);

        fls.id = name;
        upCont.innerHTML = name
        if (files[name].type == 'file') {
            upCont.className = 'file-tree-el-up-cont file-point';
            upCont.onclick = function () {
                openFile(files[name].value, files[name]);
                window.openedfiles = files[name];
            }
        }
        else {
            let botCont = document.createElement('div');
            botCont.className = 'file-tree-el-bot-cont';
            upCont.className = 'file-tree-el-up-cont dir-point-close';
            flsCont.appendChild(botCont);

            upCont.onclick = function () {
                if (files[name].isOpen) {
                    upCont.className = 'file-tree-el-up-cont dir-point-close';
                    files[name].isOpen = false;
                    if (botCont.children.length > 0) {
                        botCont.removeChild(botCont.children[0]);
                    }
                }
                else {
                    upCont.className = 'file-tree-el-up-cont dir-point-open';
                    files[name].isOpen = true;
                    botCont.appendChild(makeFileList(files[name].files));
                }
            }
        }
        flsCont.className = 'file-tree-el-cont';
        flsCont.appendChild(fls);
        list.appendChild(flsCont);
    });
    return list;
}

function readdir(dir, dirPath) {
    let temp = {}
    let file;
    dir.forEach(function (val, index, arr) {
        try {
            file = fs.readFileSync(path.join(dirPath, val));
            temp[path.basename(path.join(dirPath, val))] = {
                value: file.toString(),
                path: path.join(dirPath, val),
                name: path.basename(path.join(dirPath, val)),
                type: 'file'
            }
        }
        catch (err) {
            file = fs.readdirSync(path.join(dirPath, val));
            temp[path.basename(path.join(dirPath, val))] = {
                path: path.join(dirPath, val),
                name: path.basename(path.join(dirPath, val)),
                type: 'dir',
                isOpen: false,
                files: readdir(file, path.join(dirPath, val))
            }
        }
    });
    return temp;
}

function openSettings() {
    let newWin = new BrowserWindow({
        width: 800,
        height: 600,
        title: 'Настройки',
        backgroundColor: bgColor,
        frame: false,
        movable: true,
        resizable: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    newWin.loadURL(`file://${__dirname}/../settings/index.html`);
}

function checkSyntax() {
    let pySupport = JSON.parse(fs.readFileSync('../main/exts/langs support/python.json'));
    let syntax = pySupport['syntax'];
    let content = window.openedfiles.value;
    syntax.forEach(function(el){
        let expr = new RegExp(el['rexpr']);
        console.log(content.match(expr), el['name']);
    });

}
function getExt(name) {
    let ext = name.split('.')
    if (ext.length < 2) {
        return '';
    }
    return ext[ext.length - 1];
}
function getPos() {
    let sel = document.getSelection();
    if (sel.type == 'Caret') {
        return {
            el: sel.anchorNode,
            offset: sel.anchorOffset,
            selection: sel
        };
    }
    return undefined;
}
ipcRenderer.on('OPEN DIR', function () {
    let result = dialog.showOpenDialogSync({
        title: 'Открыть папку',
        buttonLabel: 'Открыть',
        properties: [
            'openDirectory'
        ]
    });
    if (result != undefined) {
        files = {};
        curDir = result[0];
        let temp = fs.readdirSync(result[0]);
        files = readdir(temp, curDir);
        if (sideMenu.children.length > 0) {
            sideMenu.removeChild(sideMenu.children[0]);
        }
        sideMenu.appendChild(makeFileTree(files));
    }
});