const { initializeApp } = require("firebase/app");
const firebaseConfig = require("./firebase-config.json")
initializeApp(firebaseConfig);

const {
    init,
    dataSetChangeListener,
    changeOption
} = require("./protocol");

const {
    requestAction,
    sendFindTargetDesignatedNotification,
    removePairedDevice,
    requestRemovePair,
    requestData,
    requestDeviceListWidely, requestPair
} = require("syncprotocol/src/ProcessUtil");

const Device = require("syncprotocol/src/Device");
const Store = require('electron-store');

const {
    getBackgroundColor,
    getForegroundColor
} = require("./randColor");

const {
    getEventListener,
    EVENT_TYPE
} = require("syncprotocol/src/Listener");

const store = new Store();

const isDesignDebugMode = false
if (!isDesignDebugMode) init()

const taskSelect = getElement('TaskSelection')
const deviceSelect = getElement("DeviceSelection")

const Args1Form = getElement("Args1Form")
const Args2Form = getElement("Args2Form")

const Args1EditText = getElement("Args1")
const Args2EditText = getElement("Args2")

const SubmitButton = getElement("submitButton")

const DeviceList = getElement("deviceList")
const deviceDetail = getElement("deviceDetail")
const pairModalList = getElement("pairModalList")
const pairModal = getElement("pairModal")
const pairProgress = getElement("pairProgress")

const pairingKey = getElement("pairingKey")
const encryptionEnabled = getElement("encryptionEnabled")
const encryptionPassword = getElement("encryptionPassword")
const hmacAuthEnabled = getElement("hmacAuthEnabled")
const printDebugLog = getElement("printDebugLog")
const showAlreadyConnected = getElement("showAlreadyConnected")
const allowRemovePairRemotely = getElement("allowRemovePairRemotely")
const receiveFindRequest = getElement("receiveFindRequest")
const startWhenBoot = getElement("startWhenBoot")

SubmitButton.disabled = true

const deviceList = []
let deviceListIndex = 0
let modalSelectedDevice

let pairDeviceList = []
let pairDeviceListIndex = 0
let pairModalSelectedDevice

function loadDeviceList() {
    while (deviceList.length) deviceList.pop()
    deviceListIndex = 0

    deviceSelect.innerHTML = '<option value="0">Select Device</option>'
    DeviceList.innerHTML = ""

    let value = [];
    if(store.has("paired_list")) value = JSON.parse(store.get("paired_list"))
    
    for (let i = 0; i < value.length; i++) {
        const arr = value[i].split("|")
        deviceList.push(new Device(arr[0], arr[1]))
        deviceSelect.add(new Option(arr[0]))
        DeviceList.innerHTML += '<li class="mdl-list__item" style="height: 65px">\n' +
            '                     <div class="device_icon_background" style="background-color: ' + getBackgroundColor(arr[0]) + '">\n' +
            '                           <i class="device_icon_text material-icons" style="color: ' + getForegroundColor(arr[0]) + '">smartphone</i>' +
            '                     </div>\n' +
            '                    <span class="mdl-list__item-primary-content">\n' +
            '                       &nbsp;&nbsp;&nbsp;' + arr[0] + '\n' +
            '                    </span>\n' +
            '                    <span class="mdl-list__item-secondary-action">\n' +
            '                         <a class="icon material-icons" onclick="onDeviceItemClick(this.id)" id="device' + deviceListIndex + '" href="#" style="text-decoration:none;">settings</a>\n' +
            '                    </span>\n' +
            '                </li>'
        deviceListIndex += 1;
    }
}

loadDeviceList()
dataSetChangeListener.on("changed", function () {
    loadDeviceList()
})

function onTaskSelected() {
    SubmitButton.disabled = (taskSelect.value === "0" || deviceSelect.value === "0")

    switch (taskSelect.value) {
        case "1":
            Args1Form.style.display = "block"
            Args2Form.style.display = "block"

            getElement("Args1Text").innerText = "Notification Title"
            getElement("Args2Text").innerText = "Notification Content"
            break;

        case "2":
            Args1Form.style.display = "block"
            Args2Form.style.display = "none"

            getElement("Args1Text").innerText = "Text to send"
            break;

        case "3":
            Args1Form.style.display = "block"
            Args2Form.style.display = "none"

            getElement("Args1Text").innerText = "Url to open in browser"
            break;

        case "4":
            Args1Form.style.display = "none"
            Args2Form.style.display = "none"
            break;

        case "5":
            Args1Form.style.display = "block"
            Args2Form.style.display = "none"

            getElement("Args1Text").innerText = "app's package name to open"
            break;

        case "6":
            Args1Form.style.display = "block"
            Args2Form.style.display = "none"

            getElement("Args1Text").innerText = "Type terminal command to run"
            break;

        default:
            Args1Form.style.display = "none"
            Args2Form.style.display = "none"
            break;
    }
}

function onDeviceSelected() {
    SubmitButton.disabled = (taskSelect.value === "0" || deviceSelect.value === "0")
}

function onClickSubmit() {
    let isArgs1Visible = Args1Form.style.display === "block"
    let isArgs2Visible = Args2Form.style.display === "block"

    if (isArgs1Visible && isArgs2Visible) {
        requestAction(deviceList[deviceSelect.selectedIndex - 1], taskSelect.options[taskSelect.value].text, Args1EditText.value.trim(), Args2EditText.value.trim())
        resetTextField()
    } else if (isArgs1Visible) {
        requestAction(deviceList[deviceSelect.selectedIndex - 1], taskSelect.options[taskSelect.value].text, Args1EditText.value.trim())
        resetTextField()
    } else {
        requestAction(deviceList[deviceSelect.selectedIndex - 1], taskSelect.options[taskSelect.value].text)
        resetTextField()
    }
}

function resetTextField() {
    createToastNotification('Your request has been transmitted!', 'Okay')
    Args1EditText.value = ""
    Args2EditText.value = ""
}

function createToastNotification(message, action) {
    const data = {
        message: message,
        timeout: 2000,
        actionText: action
    };

    const snackbarDom = document.querySelector('#snackbar')
    snackbarDom.MaterialSnackbar.showSnackbar(data);
}

function onDeviceItemClick(index) {
    modalSelectedDevice = deviceList[index.replace("device", "")]

    getElement("battery").innerText = ""
    getElement("deviceTag").innerHTML =
        '                     <div class="device_icon_background" style="background-color: ' + getBackgroundColor(modalSelectedDevice.deviceName) + '">\n' +
        '                           <i class="device_icon_text material-icons" style="color: ' + getForegroundColor(modalSelectedDevice.deviceName) + '">smartphone</i>' +
        '                    </div><br>\n' +
        '                    <span class="mdl-list__item-primary-content name_style">' + modalSelectedDevice.deviceName + '\n' +
        '                    </span><br>'

    deviceDetail.style.display = "block"
    requestData(modalSelectedDevice, "battery_info")
    getEventListener().on(EVENT_TYPE.ON_DATA_RECEIVED, function (data) {
        getElement("battery").innerText = data.receive_data
    })
}

function onFindButtonClick() {
    sendFindTargetDesignatedNotification(modalSelectedDevice)
}

function onForgetButtonClick() {
    removePairedDevice(modalSelectedDevice)
    requestRemovePair(modalSelectedDevice)
    onModalCloseClick()
    loadDeviceList()
}

function onAddButtonClick() {
    pairModal.style.display = "block"
    pairProgress.style.display = "block"
    while (pairDeviceList.length) pairDeviceList.pop()
    pairDeviceListIndex = 0
    pairModalList.innerHTML = ""

    requestDeviceListWidely()
    getEventListener().on(EVENT_TYPE.ON_DEVICE_FOUND, function (device) {
        pairModalList.innerHTML += '<li class="mdl-list__item" style="height: 65px" onclick="onPairDeviceItemClick(this.id)" id="pairDevice' + pairDeviceListIndex + '">\n' +
            '                     <div class="device_icon_background" style="background-color: ' + getBackgroundColor(device.deviceName) + '">\n' +
            '                           <i class="device_icon_text material-icons" style="color: ' + getForegroundColor(device.deviceName) + '">smartphone</i>' +
            '                     </div>\n' +
            '                    <span class="mdl-list__item-primary-content">\n' +
            '                       &nbsp;' + device.deviceName + '\n' +
            '                    </span>\n' +
            '                     <span class="mdl-list__item-secondary-content" id="pairDeviceStatus' + pairDeviceListIndex + '" style="font-size: 12px"></span>\n' +
            '                </li>'

        pairDeviceList.push(device)
        pairDeviceListIndex += 1;
    })
}

function onPairDeviceItemClick(index) {
    let statusText = getElement(index.replace("pairDevice", "pairDeviceStatus"))
    pairModalSelectedDevice = pairDeviceList[index.replace("pairDevice", "")]
    statusText.innerText = "Connecting..."
    pairProgress.style.display = "none"

    requestPair(pairModalSelectedDevice)
    getEventListener().on(EVENT_TYPE.ON_DEVICE_PAIR_RESULT, function (map) {
        if(map.pair_accept === "true") {
            dataSetChangeListener.emit("changed")
            onModalCloseClick()
            createToastNotification("Device Connected!", "OK")
        } else {
            statusText.innerText = "Failed"
        }
    })
}

function onModalCloseClick() {
    deviceDetail.style.display = "none"
    pairModal.style.display = "none"
}

window.onclick = function (event) {
    if (event.target === deviceDetail) {
        deviceDetail.style.display = "none";
    }

    if (event.target === pairModal) {
        pairModal.style.display = "none";
    }
}

function getElement(name) {
    return document.getElementById(name)
}

function getPreferenceValue(key, defValue) {
    const value = store.get(key)
    return value == null ? defValue : value
}

encryptionEnabled.checked = getPreferenceValue("encryptionEnabled", false)
hmacAuthEnabled.checked = getPreferenceValue("hmacAuthEnabled", false)
encryptionPassword.value = getPreferenceValue("encryptionPassword", "")
printDebugLog.checked = getPreferenceValue("printDebugLog", false)
showAlreadyConnected.checked = getPreferenceValue("showAlreadyConnected", false)
receiveFindRequest.checked = getPreferenceValue("receiveFindRequest", false)
allowRemovePairRemotely.checked = getPreferenceValue("allowRemovePairRemotely", true)
startWhenBoot.checked = getPreferenceValue("startWhenBoot", true)
pairingKey.value = getPreferenceValue("pairingKey", "test100")

function onValueChanged(id, type) {
    store.set(id, type === "checked" ? getElement(id).checked : getElement(id).value)
    changeOption()
}
