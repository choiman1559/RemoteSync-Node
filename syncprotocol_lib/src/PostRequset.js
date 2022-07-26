const {encode} = require("./AESCrypto");

function postRestApi(data) {
    const FCM_API = "https://fcm.googleapis.com/fcm/send";
    const serverKey = global.globalOption.serverKey
    const contentType = "application/json";

    const xhr = new XMLHttpRequest();
    xhr.open("POST", FCM_API)

    xhr.setRequestHeader("Authorization", serverKey)
    xhr.setRequestHeader("Content-Type", contentType)

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && global.globalOption.printDebugLog) {
            console.log(xhr.status + " "  + xhr.responseText)
        }
    };

    let head = {
        "to": "/topics/" + global.globalOption.pairingKey,
        "priority": "high",
        "data": data
    }

    if (global.globalOption.encryptionEnabled && global.globalOption.encryptionPassword !== "") {
        let newData = {};
        newData.encrypted = true
        newData.encryptedData = encode(JSON.stringify(data.data), global.globalOption.encryptionPassword)
        head.data = newData;
    } else {
        head.data.encrypted = false
    }

    xhr.send(JSON.stringify(head))
}

module.exports = {
    postRestApi
}