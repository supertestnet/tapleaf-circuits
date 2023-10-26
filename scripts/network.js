async function addressOnceHadMoney(address, network) {
    var nonjson = await getData("https://mutinynet.com/" + network + "api/address/" + address);
    var json = JSON.parse(nonjson);
    if (json["chain_stats"]["tx_count"] > 0 || json["mempool_stats"]["tx_count"] > 0) return true;
    return false;
}

async function loopTilAddressReceivesMoney(address, network) {
    var itReceivedMoney = false;
    async function isDataSetYet(data_i_seek) {
        return new Promise((resolve, reject) => {
            if (!data_i_seek) {
                setTimeout(async () => {
                    console.log("waiting for address to receive money...");
                    try {
                        itReceivedMoney = await addressOnceHadMoney(address, network);
                    } catch (e) { }
                    var msg = await isDataSetYet(itReceivedMoney);
                    resolve(msg);
                }, 2000);
            } else {
                resolve(data_i_seek);
            }
        });
    }

    async function getTimeoutData() {
        var data_i_seek = await isDataSetYet(itReceivedMoney);
        return data_i_seek;
    }

    let returnable = await getTimeoutData();
    return returnable;
}

async function addressReceivedMoneyInThisTx(address, network) {
    var txid;
    var vout;
    var amt;
    var nonjson = await getData("https://mutinynet.com/" + network + "api/address/" + address + "/txs");
    var json = JSON.parse(nonjson);
    json.forEach(tx => {
        tx["vout"].forEach(function (output, index) {
            if (output["scriptpubkey_address"] == address) {
                txid = tx["txid"];
                vout = index;
                amt = output["value"];
            }
        });
    });
    return [txid, vout, amt];
}

function getData(url) {
    return new Promise(async function (resolve, reject) {
        function inner_get(url) {
            var xhttp = new XMLHttpRequest();
            xhttp.open("GET", url, true);
            xhttp.send();
            return xhttp;
        }
        var data = inner_get(url);
        data.onerror = function (e) {
            resolve("error");
        }
        async function isResponseReady() {
            return new Promise(function (resolve2, reject) {
                if (!data.responseText || data.readyState != 4) {
                    setTimeout(async function () {
                        var msg = await isResponseReady();
                        resolve2(msg);
                    }, 1);
                } else {
                    resolve2(data.responseText);
                }
            });
        }
        var returnable = await isResponseReady();
        resolve(returnable);
    });
}

function pushBTCpmt(rawtx) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && (this.status > 199 && this.status < 300)) {
            var response = this.responseText;
            console.log("Your transaction was broadcasted, your txid is: " + response);
        }
    };
    xhttp.open("POST", "https://mutinynet.com/api/tx", true);
    xhttp.send(rawtx);
}

async function getBlockheight(network) {
    var data = await getData(`https://mutinynet.com/${network}api/blocks/tip/height`);
    return Number(data);
}