const {ipcRenderer} = require('electron')
const {onMessageReceived} = require("./Process");
const Store = require('electron-store');

const {
    START_NOTIFICATION_SERVICE,
    NOTIFICATION_SERVICE_STARTED,
    NOTIFICATION_SERVICE_ERROR,
    NOTIFICATION_RECEIVED,
    TOKEN_UPDATED,
} = require('electron-push-receiver/src/constants')

function setConnectionOption(option) {
    global.globalOption = option
}

function initialize(option, action) {
    global.globalOption = option
    global.isFindingDeviceToPair = false;
    global.isListeningToPair = false;
    global.actionListener = action
    global.pairingProcessList = []
    global.store = new Store()

    ipcRenderer.on(NOTIFICATION_SERVICE_STARTED, (_, token) => {
        if (global.globalOption.printDebugLog) console.log('service successfully started', token)

        fetch('https://iid.googleapis.com/iid/v1/' + token + '/rel/topics/' + global.globalOption.pairingKey, {
            method: 'POST',
            headers: new Headers({
                'Authorization': global.globalOption.serverKey
            })
        }).then(response => {
            if (response.status < 200 || response.status >= 400) {
                throw 'Error subscribing to topic: ' + response.status + ' - ' + response.text();
            }
            if (global.globalOption.printDebugLog) console.log('Subscribed to "' + global.globalOption.pairingKey + '"');
        }).catch(error => {
            if (global.globalOption.printDebugLog) console.error(error);
        })
    })

    ipcRenderer.on(NOTIFICATION_SERVICE_ERROR, (_, error) => {
        if (global.globalOption.printDebugLog) console.log('notification error', error)
    })

    ipcRenderer.on(TOKEN_UPDATED, (_, token) => {
        if (global.globalOption.printDebugLog) console.log('token updated', token)
    })

    ipcRenderer.on(NOTIFICATION_RECEIVED, (_, serverNotificationPayload) => {
        if(global.globalOption.enabled) onMessageReceived(serverNotificationPayload.data)
    })

    const senderId = global.globalOption.senderId
    if (global.globalOption.printDebugLog) console.log('starting service and registering a client')
    ipcRenderer.send(START_NOTIFICATION_SERVICE, senderId)
}

module.exports = {
    initialize, setConnectionOption
};