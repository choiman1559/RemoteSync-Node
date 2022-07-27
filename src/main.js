const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const Tray = electron.Tray
const Menu = electron.Menu

const path = require('path')
const url = require('url')
const {setup: setupPushReceiver} = require('electron-push-receiver')

let mainWindow
let isQuiting

let iconPath = path.join(__dirname, 'icon.png')

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 440,
        height: 670,
        maximizable: false,
        icon: iconPath,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
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

    setupPushReceiver(mainWindow.webContents);

    const appIcon = new Tray(electron.nativeImage.createFromPath(iconPath));
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Open SyncProtocol', click: function () {
                mainWindow.show()
            }
        },
        {
            label: 'Quit', click: function () {
                app.isQuiting = true
                app.quit()
            }
        }
    ]);

    appIcon.setContextMenu(contextMenu)

    mainWindow.on('close', function () {
        mainWindow = null
    })

    mainWindow.on('minimize', function (event) {
        event.preventDefault()
        mainWindow.hide()
    })

    mainWindow.on('show', function () {
    })

    mainWindow.setMenuBarVisibility(false)
    mainWindow.webContents.openDevTools()
}

app.on('before-quit', function () {
    isQuiting = true;
});


app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('ready', createWindow)
app.on('activate', function () {
    if (mainWindow === null) {
        createWindow()
    }
})