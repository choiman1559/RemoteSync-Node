const {postRestApi} = require("./PostRequset");
const propertiesReader = require("properties-reader");
const {pairListener} = require("./index");

function responseDeviceInfoToFinder(device) {
    let data = {
        "type" : "pair|response_device_list",
        "device_name" : global.globalOption.deviceName,
        "device_id" : global.globalOption.identifierValue,
        "send_device_name" : device.deviceName,
        "send_device_id" : device.deviceId
    }

    if(global.globalOption.printDebugLog) console.log("sync sent", "response list: " + JSON.stringify(data))
    postRestApi(data)
}

function requestDeviceListWidely() {
    global.isFindingDeviceToPair = true
    let data = {
        "type" : "pair|request_device_list",
        "device_name" : global.globalOption.deviceName,
        "device_id" : global.globalOption.identifierValue
    }

    if(global.globalOption.printDebugLog) console.log("sync sent", "request list: " + JSON.stringify(data))
    postRestApi(data)
}

function onReceiveDeviceInfo(device) {
    pairListener.emit("onDeviceFound", device)
}

function requestPair(device) {
    global.isFindingDeviceToPair = true
    let data = {
        "type" : "pair|request_pair",
        "device_name" : global.globalOption.deviceName,
        "device_id" : global.globalOption.identifierValue,
        "send_device_name" : device.deviceName,
        "send_device_id" : device.deviceId
    }

    if(global.globalOption.printDebugLog) console.log("sync sent", "request pair: " + JSON.stringify(data))
    postRestApi(data)
}

function responsePairAcceptation(device, accept) {
    if(accept) {
        for (let info in global.pairingProcessList) {
            if (info === device.toString()) {
                global.isListeningToPair = false

                const index = global.pairingProcessList.indexOf(info)
                if (index > -1) {
                    global.pairingProcessList.splice(index, 1)
                }
                break;
            }
        }
    }

    let data = {
        "type" : "pair|accept_pair",
        "device_name" : global.globalOption.deviceName,
        "device_id" : global.globalOption.identifierValue,
        "send_device_name" : device.deviceName,
        "send_device_id" : device.deviceId,
        "pair_accept" : accept
    }

    let isNotRegistered = true;
    let dataToSave = device.deviceName + "|" + device.deviceId
    const reader = propertiesReader(global.globalOption.propertiesLocation);

    for (let str in JSON.parse(reader.get("paired_list"))) {
        if (str === dataToSave) {
            isNotRegistered = false;
            break;
        }
    }

    if(isNotRegistered) {
        let newData = JSON.parse(reader.get("paired_list"))
        newData.push(dataToSave)
        reader.set("paired_list", JSON.stringify(newData));
        reader.save(global.globalOption.propertiesLocation)
    }

    postRestApi(data)
}

function checkPairResultAndRegister(map, device) {
    pairListener.emit("onDevicePairResult", map)

    if(map.pair_accept) {
        let isNotRegistered = true;
        let dataToSave = device.deviceName + "|" + device.deviceId
        const reader = propertiesReader(global.globalOption.propertiesLocation);

        for (let str in JSON.parse(reader.get("paired_list"))) {
            if (str === dataToSave) {
                isNotRegistered = false;
                break;
            }
        }

        if(isNotRegistered) {
            let newData = JSON.parse(reader.get("paired_list"))
            let foo = [newData]
            foo.push(dataToSave)
            reader.set("paired_list", JSON.stringify(foo));
            reader.save(global.globalOption.propertiesLocation)
        }

        global.isFindingDeviceToPair = false;
        const index = global.pairingProcessList.indexOf(device)
        if (index > -1) {
            pairingProcessList.splice(index, 1)
        }
    }
}

function sendFindTaskNotification() {
    let data = {
        "type" : "pair|find",
        "device_name" : global.globalOption.deviceName,
        "device_id" : global.globalOption.identifierValue,
        "date" : new Date().getTime()
    }

    postRestApi(data)
}

function sendFindTargetDesignatedNotification(device) {
    let data = {
        "type" : "pair|find",
        "device_name" : global.globalOption.deviceName,
        "device_id" : global.globalOption.identifierValue,
        "send_device_name" : device.deviceName,
        "send_device_id" : device.deviceId,
        "date" : new Date().getTime()
    }

    postRestApi(data)
}

function requestData(device, dataType) {
    let data = {
        "type" : "pair|request_data",
        "device_name" : global.globalOption.deviceName,
        "device_id" : global.globalOption.identifierValue,
        "send_device_name" : device.deviceName,
        "send_device_id" : device.deviceId,
        "date" : new Date().getTime(),
        "request_data" : dataType
    }

    postRestApi(data)
}

function responseDataRequest(device, dataType, dataContent) {
    let data = {
        "type" : "pair|receive_data",
        "device_name" : global.globalOption.deviceName,
        "device_id" : global.globalOption.identifierValue,
        "send_device_name" : device.deviceName,
        "send_device_id" : device.deviceId,
        "date" : new Date().getTime(),
        "request_data" : dataType,
        "receive_data" : dataContent
    }

    postRestApi(data)
}

function requestAction(device, dataType, ...dataContent) {
    let string = ""
    if(dataContent.index > 1) {
        for(let str in dataContent) {
            string += str + "|"
        }
        string = string.substring(0, string.length - 1)
    } else if (dataContent.index === 1) string = dataContent[0]

    let data = {
        "type" : "pair|request_action",
        "device_name" : global.globalOption.deviceName,
        "device_id" : global.globalOption.identifierValue,
        "send_device_name" : device.deviceName,
        "send_device_id" : device.deviceId,
        "date" : new Date().getTime(),
        "request_action" : dataType,
    }

    if(dataContent.index > 0) data.action_args = string
    postRestApi(data)
}

module.exports = {
    //methods for pairing
    responseDeviceInfoToFinder,
    requestDeviceListWidely,
    requestPair,
    responsePairAcceptation,
    checkPairResultAndRegister,
    onReceiveDeviceInfo,

    //methods for actual use
    sendFindTaskNotification,
    sendFindTargetDesignatedNotification,
    requestData,
    responseDataRequest,
    requestAction
}