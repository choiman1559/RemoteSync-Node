const Protocol = require("syncprotocol");
const ConnectionOption = require("syncprotocol/src/ConnectionOption");
const {PairAction} = require("syncprotocol/src/Actions");
const {responsePairAcceptation, responseDataRequest, requestPair} = require("syncprotocol/src/ProcessUtil");
const Device = require("syncprotocol/src/Device");
const Store = require('electron-store');

const path = require("path");
const battery = require("battery");
const {machineIdSync} = require('node-machine-id');
const EventEmitter = require("events");
const {setConnectionOption} = require("syncprotocol");
const clipboard = require('electron').clipboard;

const store = new Store()

function getPreferenceValue(key, defValue) {
    const value = store.get(key)
    return value == null ? defValue : value
}

function settingOption() {
    const option = new ConnectionOption()

    //Customizable options
    option.enabled = true
    option.encryptionEnabled = getPreferenceValue("encryptionEnabled", false)
    option.encryptionPassword = getPreferenceValue("encryptionPassword", "")
    option.printDebugLog = getPreferenceValue("printDebugLog", false)
    option.showAlreadyConnected = getPreferenceValue("showAlreadyConnected", false)
    option.receiveFindRequest = getPreferenceValue("receiveFindRequest", false)
    option.allowRemovePairRemotely = getPreferenceValue("allowRemovePairRemotely", true)
    option.pairingKey = getPreferenceValue("pairingKey", "test100")

    //Non-Customizable options
    option.senderId = '301874398852'
    option.serverKey = "key=AAAARkkdxoQ:APA91bFH_JU9abB0B7OJT-fW0rVjDac-ny13ifdjLU9VqFPp0akohPNVZvfo6mBTFBddcsbgo-pFvtYEyQ62Ohb_arw1GjEqEl4Krc7InJXTxyGqPUkz-VwgTsGzP8Gv_5ZfuqICk7S2"
    option.identifierValue = machineIdSync(true)
    option.deviceName = require("os").hostname()

    return option
}

class dataSetChange extends EventEmitter {
}

const dataSetChangeListener = new dataSetChange()

class Actions extends PairAction {
    async onActionRequested(map) {
        super.onActionRequested(map);
        const actionType = map.request_action
        const actionArg = map.action_args
        let actionArgs = [];

        if (actionArg != null) {
            actionArgs = actionArg.split("\|");
        }

        if (actionType != null) {
            switch (actionType) {
                case "Show notification with text":
                    new Notification(actionArgs[0], {
                        body: actionArgs[1],
                        icon: path.join(__dirname, '/res/icon.png'),
                    })
                    break;

                case "Copy text to clipboard":
                    clipboard.writeText(actionArgs[0])
                    break;

                case "Open link in Browser":
                    let url = actionArgs[0];
                    if (!url.startsWith("http://") && !url.startsWith("https://")) url = "http://" + url;
                    await require('electron').shell.openExternal(url)
                    break;

                case "Run application":
                    await open.openApp(actionArgs[0]);
                    break;

                case "Run command":
                    require('child_process').exec(actionArgs[0], (error, stdout, stderr) => {
                        if (error) {
                            console.log(`error: ${error.message}`);
                            return;
                        }
                        if (stderr) {
                            console.log(`stderr: ${stderr}`);
                            return;
                        }
                        console.log(`stdout: ${stdout}`);
                    });
                    break;

                case "Share file":
                    //TODO: How to get file from FCM cloud without actual-file path & url ???
                    break;
            }
        }
    }

    onDataRequested(map) {
        super.onDataRequested(map);
        let dataToSend;
        switch (map.request_data) {
            case "battery_info":
                (async () => {
                    const {level, charging} = await battery();
                    dataToSend = (level * 100) + "|" + charging + "|false"
                    responseDataRequest(new Device(map.device_name, map.device_id), map.request_data, dataToSend);
                    //TODO: What about desktop devices?
                })();
                return;

            case "speed_test":
                dataToSend = new Date().getTime().toString();
                break;

            default:
                dataToSend = "";
                break;
        }

        if (dataToSend !== "") {
            responseDataRequest(new Device(map.device_name, map.device_id), map.request_data, dataToSend);
        }
    }

    onFindRequest() {
        super.onFindRequest();
        //Ignore for now
    }

    showPairChoiceAction(device) {
        super.showPairChoiceAction(device);
        let pairNotification = new Notification('New pair request incoming', {
            body: 'Requested Device: ' + device.deviceName + "\n\nClick this notification to pair",
            icon: path.join(__dirname, '/res/icon.png'),
        })

        pairNotification.onclick = () => {
            responsePairAcceptation(device, true)
        }
    }

    onDeviceRemoved(device) {
        dataSetChangeListener.emit("changed")
    }

    onDeviceFound(device) {
        requestPair(device)
    }

    onDevicePairResult(data) {
        if (data.pair_accept) {
            dataSetChangeListener.emit("changed")
        }
    }

    onDataReceived(data) {
        //Nothing to do yet
    }
}

function init() {
    Protocol.initialize(settingOption(), new Actions())
}

function changeOption() {
    setConnectionOption(settingOption())
}

module.exports = {
    init,
    dataSetChangeListener,
    changeOption
}