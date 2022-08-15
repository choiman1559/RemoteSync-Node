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

function initialize(option, action) {
    global.globalOption = option
    global.isFindingDeviceToPair = false;
    global.isListeningToPair = false;
    global.actionListener = action
    global.pairingProcessList = []
    global.store = new Store()

    ipcRenderer.on(NOTIFICATION_SERVICE_STARTED, (_, token) => {
        if (option.printDebugLog) console.log('service successfully started', token)

        fetch('https://iid.googleapis.com/iid/v1/' + token + '/rel/topics/' + option.pairingKey, {
            method: 'POST',
            headers: new Headers({
                'Authorization': option.serverKey
            })
        }).then(response => {
            if (response.status < 200 || response.status >= 400) {
                throw 'Error subscribing to topic: ' + response.status + ' - ' + response.text();
            }
            if (option.printDebugLog) console.log('Subscribed to "' + option.pairingKey + '"');
        }).catch(error => {
            if (option.printDebugLog) console.error(error);
        })
    })

    ipcRenderer.on(NOTIFICATION_SERVICE_ERROR, (_, error) => {
        if (option.printDebugLog) console.log('notification error', error)
    })

    ipcRenderer.on(TOKEN_UPDATED, (_, token) => {
        if (option.printDebugLog) console.log('token updated', token)
    })

    ipcRenderer.on(NOTIFICATION_RECEIVED, (_, serverNotificationPayload) => {
        onMessageReceived(serverNotificationPayload.data)
    })

    const senderId = option.senderId
    if (option.printDebugLog) console.log('starting service and registering a client')
    ipcRenderer.send(START_NOTIFICATION_SERVICE, senderId)
}

module.exports = {
    initialize
};