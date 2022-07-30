const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const Tray = electron.Tray
const Menu = electron.Menu

const path = require('path')
const url = require('url')
const {initConfig} = require("syncprotocol/src/Store");

let mainWindow
let isQuiting

let iconPath = path.join(__dirname, '/res/icon.png')

function createWindow() {
    mainWindow = new BrowserWindow({
        minWidth: 440,
        maxWidth: 440,
        width: 440,

        minHeight: 670,
        maxHeight: 670,
        height: 670,
        maximizable: false,
        icon: iconPath,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        }
    });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    })).then(() => {
        mainWindow.title = "SyncProtocol"
        return true;
    })

    initConfig(mainWindow)

    const appIcon = new Tray(electron.nativeImage.createFromPath(iconPath));
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Open SyncProtocol', click: function () {
                mainWindow.show()
            }
        },
        {
            label: 'Quit SyncProtocol', click: function () {
                app.isQuiting = true
                app.quit()
            }
        }
    ]);

    appIcon.setContextMenu(contextMenu)

    mainWindow.on('close', function (event) {
        if(!isQuiting) {
            event.preventDefault()
            mainWindow.hide()
        }
    })

    mainWindow.on('minimize', function () {
    })

    mainWindow.on('show', function () {
    })

    mainWindow.setMenuBarVisibility(false)
}

app.on('before-quit', function () {
    isQuiting = true
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow()
    }
})

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
    app.quit()
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.focus()
        }
    })

    app.on('ready', () => {
        createWindow()
    })
}