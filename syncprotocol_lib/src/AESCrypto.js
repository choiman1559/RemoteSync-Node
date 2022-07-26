//TODO: implements fully encode and decode procedure

function encode(value, TOKEN_KEY) {
    return compress(encrypt(value, TOKEN_KEY))
}

function decode(value, TOKEN_KEY) {
    return decrypt(decompress(value), TOKEN_KEY)
}

function encrypt(value, TOKEN_KEY) {
    const iv = require('crypto').randomBytes(16);
    const data = new Buffer(value).toString('binary');

    let key = new Buffer(parseAESToken(TOKEN_KEY), "hex");
    const cipher = require('crypto').createCipheriv('aes-256-cbc', key, iv);
    const nodes = process.version.match(/^v(\d+)\.(\d+)/);
    let encrypted;

    if( nodes[1] === '0' && parseInt(nodes[2]) < 10) {
        encrypted = cipher.update(data, 'binary') + cipher.final('binary');
    } else {
        encrypted =  cipher.update(data, 'utf8', 'binary') +  cipher.final('binary');
    }

    return new Buffer(iv, 'binary').toString('hex') + new Buffer(encrypted, 'binary').toString('hex');
}

function decrypt(value, TOKEN_KEY) {

}

function compress(string) {
    const charList = string.split(''),
        uintArray = [];
    for (let i = 0; i < charList.length; i++) {
        uintArray.push(charList[i].charCodeAt(0));
    }
    const bytes = new Uint8Array(uintArray);
    return pako.deflate(bytes)
}

function decompress(string) {
    const bytes = pako.inflate(string)
    return ""
}

function parseAESToken(string) {
    if (string.length === 32) return string;
    string += "D~L*e/`/Q*a&h~e0jy$zU!sg?}X`CU*I";
    return string.substring(0, 32);
}

module.exports = {
    encode, decode
}