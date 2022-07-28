const {init, dataSetChangeListener} = require("./protocol");
const propertiesReader = require("properties-reader");
const Device = require("syncprotocol/src/Device");
const {requestAction} = require("syncprotocol/src/ProcessUtil");

init()

const taskSelect = getElement('TaskSelection')
const deviceSelect = getElement("DeviceSelection")

const Args1Form = getElement("Args1Form")
const Args2Form = getElement("Args2Form")

const Args1EditText = getElement("Args1")
const Args2EditText = getElement("Args2")

const SubmitButton = getElement("submitButton")

let reader = propertiesReader(global.globalOption.propertiesLocation);
SubmitButton.disabled = true
const deviceList = []

function loadDeviceList() {
    reader = propertiesReader(global.globalOption.propertiesLocation);
    while(deviceList.length) deviceList.pop()
    deviceSelect.innerHTML = '<option value="0">Select Device</option>'

    const value = JSON.parse(reader.get("paired_list"))
    for (let i = 0; i < value.length; i++) {
        const arr = value[i].split("|")
        deviceList.push(new Device(arr[0], arr[1]))
        deviceSelect.add(new Option(arr[0]))
    }
}

loadDeviceList()
dataSetChangeListener.on("changed", function() {
    loadDeviceList()
})

function onTaskSelected() {
    SubmitButton.disabled = (taskSelect.value === "0" || deviceSelect.value === "0")

    switch (taskSelect.value) {
        case "1":
            Args1Form.style.display = "block"
            Args2Form.style.display = "block"

            getElement("Args1Text").innerText = "Notification Title: "
            getElement("Args2Text").innerText = "Notification Content: "
            break;

        case "2":
            Args1Form.style.display = "block"
            Args2Form.style.display = "none"

            getElement("Args1Text").innerText = "Text to send: "
            break;

        case "3":
            Args1Form.style.display = "block"
            Args2Form.style.display = "none"

            getElement("Args1Text").innerText = "Url to open in browser: "
            break;

        case "4":
            Args1Form.style.display = "none"
            Args2Form.style.display = "none"
            break;

        case "5":
            Args1Form.style.display = "block"
            Args2Form.style.display = "none"

            getElement("Args1Text").innerText = "app's package name to open: "
            break;

        case "6":
            Args1Form.style.display = "block"
            Args2Form.style.display = "none"

            getElement("Args1Text").innerText = "Type terminal command to run: "
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
    } else if (isArgs1Visible) {
        requestAction(deviceList[deviceSelect.selectedIndex - 1], taskSelect.options[taskSelect.value].text, Args1EditText.value.trim())
    } else {
        requestAction(deviceList[deviceSelect.selectedIndex - 1], taskSelect.options[taskSelect.value].text)
    }
}

function getElement(name) {
    return document.getElementById(name)
}

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency])
    }
})
