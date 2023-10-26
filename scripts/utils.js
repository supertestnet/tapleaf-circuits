var sha256 = s => {
    if (typeof s == "string") s = new TextEncoder().encode(s);
    return crypto.subtle.digest('SHA-256', s).then(hashBuffer => {
        var hashArray = Array.from(new Uint8Array(hashBuffer));
        var hashHex = hashArray
            .map(bytes => bytes.toString(16).padStart(2, '0'))
            .join('');
        return hashHex;
    });
}

function hexToBytes(hex) {
    return Uint8Array.from(hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
}

function bytesToHex(bytes) {
    return bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");
}

var getRand = size => bytesToHex(crypto.getRandomValues(new Uint8Array(size)));

var AND = (a, b) => Number(a && b);
var XOR = (a, b) => Number(a ^ b);
var INV = (a) => Number(!a);

var reverseString = s => s.match(/.{1}/g).reverse().join('');

var waitSomeSeconds = num => {
    var num = num.toString() + "000";
    num = Number(num);
    return new Promise(resolve => setTimeout(resolve, num));
}

function isValidJson(content) {
    try {
        var json = JSON.parse(content);
    } catch (e) {
        return false;
    }
    return true;
}

function readFileContent(file) {
    var reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.onload = event => resolve(event.target.result);
        reader.onerror = error => reject(error);
        reader.readAsText(file);
    })
}