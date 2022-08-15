const {init, dataSetChangeListener} = require("./protocol");
const Device = require("syncprotocol/src/Device");
const {
    requestAction,
    sendFindTargetDesignatedNotification,
    removePairedDevice,
    requestRemovePair
} = require("syncprotocol/src/ProcessUtil");
const Store = require('electron-store');
const store = new Store();

init()

const taskSelect = getElement('TaskSelection')
const deviceSelect = getElement("DeviceSelection")

const Args1Form = getElement("Args1Form")
const Args2Form = getElement("Args2Form")

const Args1EditText = getElement("Args1")
const Args2EditText = getElement("Args2")

const SubmitButton = getElement("submitButton")

const DeviceList = getElement("deviceList")
const deviceDetail = getElement("deviceDetail")

const pairingKey = getElement("pairingKey")
const encryptionEnabled = getElement("encryptionEnabled")
const encryptionPassword = getElement("encryptionPassword")
const printDebugLog = getElement("printDebugLog")
const showAlreadyConnected = getElement("showAlreadyConnected")
const allowRemovePairRemotely = getElement("allowRemovePairRemotely")
const receiveFindRequest = getElement("receiveFindRequest")

SubmitButton.disabled = true
const deviceList = []
let deviceListIndex = 0
let modalSelectedDevice

function loadDeviceList() {
    while (deviceList.length) deviceList.pop()
    deviceListIndex = 0

    deviceSelect.innerHTML = '<option value="0">Select Device</option>'
    DeviceList.innerHTML = ""

    const value = JSON.parse(store.get("paired_list"))
    for (let i = 0; i < value.length; i++) {
        const arr = value[i].split("|")
        deviceList.push(new Device(arr[0], arr[1]))
        deviceSelect.add(new Option(arr[0]))
        DeviceList.innerHTML += '<li class="mdl-list__item" style="height: 65px">\n' +
            '                    <span class="mdl-list__item-primary-content">\n' +
            '                        <i class="material-icons mdl-list__item-avatar">smartphone</i>\n' + arr[0] + '\n' +
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
        createToastNotification()
    } else if (isArgs1Visible) {
        requestAction(deviceList[deviceSelect.selectedIndex - 1], taskSelect.options[taskSelect.value].text, Args1EditText.value.trim())
        createToastNotification()
    } else {
        requestAction(deviceList[deviceSelect.selectedIndex - 1], taskSelect.options[taskSelect.value].text)
        createToastNotification()
    }
}

function createToastNotification() {
    const data = {
        message: 'Your request has been transmitted!',
        timeout: 2000,
        actionText: 'Okay'
    };

    const snackbarDom = document.querySelector('#snackbar')
    snackbarDom.MaterialSnackbar.showSnackbar(data);

    Args1EditText.value = ""
    Args2EditText.value = ""
}

function onDeviceItemClick(index) {
    modalSelectedDevice = deviceList[index.replace("device", "")]
    getElement("deviceName").innerText = modalSelectedDevice.deviceName
    deviceDetail.style.display = "block"
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

function onModalCloseClick() {
    deviceDetail.style.display = "none"
}

function getElement(name) {
    return document.getElementById(name)
}

function getPreferenceValue(key, defValue) {
    const value = store.get(key)
    return value == null ? defValue : value
}

encryptionEnabled.checked = getPreferenceValue("encryptionEnabled", false)
encryptionPassword.value = getPreferenceValue("encryptionPassword", "")
printDebugLog.checked = getPreferenceValue("printDebugLog", false)
showAlreadyConnected.checked = getPreferenceValue("showAlreadyConnected", false)
receiveFindRequest.checked = getPreferenceValue("receiveFindRequest", false)
allowRemovePairRemotely.checked = getPreferenceValue("allowRemovePairRemotely", true)
pairingKey.value = getPreferenceValue("pairingKey", "test100")

function onValueChanged(id, type) {
    store.set(id, type === "checked" ? getElement(id).checked : getElement(id).value)
}