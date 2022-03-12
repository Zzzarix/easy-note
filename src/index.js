import { app, BrowserWindow, globalShortcut } from 'electron';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

app.allowRendererProcessReuse = true;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}\\index.html`);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools({mode: 'undocked'});

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
};

const savedata = () => {
  
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

app.on('before-quit', savedata)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  mainWindow.webContents.send('SAVE ALL');
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  // globalShortcut.register('CmdOrCtrl+N', mainWindow.webContents.send('NEW FILE'));
  // globalShortcut.register('CmdOrCtrl+Shift+N', mainWindow.webContents.send('NEW WIN'));
  // globalShortcut.register('CmdOrCtrl+O', mainWindow.webContents.send('OPEN FILE'));
  // globalShortcut.register('CmdOrCtrl+S', mainWindow.webContents.send('SAVE FILE', undefined));
  // globalShortcut.register('CmdOrCtrl+Shift+S', mainWindow.webContents.send('SAVE FILE AS'));
  // globalShortcut.register('CmdOrCtrl+N', mainWindow.webContents.send('NEW FILE'));
  // globalShortcut.register('CmdOrCtrl+N', mainWindow.webContents.send('NEW FILE'));
  
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
