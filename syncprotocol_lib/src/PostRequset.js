const {encode, encodeMac} = require("./AESCrypto");

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
        let isFirstFetch = data.type === "pair|request_device_list"

        if(global.globalOption.authWithHMac) {
            let hashKey = isFirstFetch ? global.globalOption.pairingKey : data.send_device_id
            encodeMac(JSON.stringify(data), global.globalOption.encryptionPassword, hashKey).then((encoded) => {
                if(encoded != null) {
                    let newData = {};
                    newData.encrypted = true
                    newData.encryptedData = encoded
                    newData.isFirstFetch = isFirstFetch
                    head.data = newData;
                    xhr.send(JSON.stringify(head))
                }
            })
        } else {
            encode(JSON.stringify(data), global.globalOption.encryptionPassword).then((encoded) => {
                if(encoded != null) {
                    let newData = {};
                    newData.encrypted = true
                    newData.encryptedData = encoded
                    newData.isFirstFetch = isFirstFetch
                    head.data = newData;
                    xhr.send(JSON.stringify(head))
                }
            })
        }
    } else {
        head.data.encrypted = false
        xhr.send(JSON.stringify(head))
    }
}

module.exports = {
    postRestApi
}