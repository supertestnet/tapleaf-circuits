function getFile(input) {
    if ('files' in input && input.files.length > 0) {
        handleContent(input.files[0]);
    }
}

async function handleBrokenPromise(i_can_spend, failed_operation, selected_script) {
    var tree = challenge_scripts.map(s => tapscript.Tap.encodeScript(s));
    var target = tapscript.Tap.encodeScript(selected_script);
    var pubkey = "ab".repeat(32);
    var [tpubkey, cblock] = tapscript.Tap.getPubKey(pubkey, { tree, target });
    var split_string = i_can_spend.split(" ");
    //the order they should go in is: output first, so it can be moved to the altstack;
    //then input 1, as it is processed first; then input 2, as it is processed next. And so on.
    var preimages = [];
    if (failed_operation == "OP_NOT") {
        preimages = [split_string[6], split_string[12]];
    } else if (failed_operation == "OP_BOOLAND") {
        preimages = [split_string[12], split_string[6], split_string[17]];
    } else if (failed_operation == "OP_XOR") {
        preimages = [split_string[12], split_string[6], split_string[17]]
    }
    var destino = $('.vickys_bitcoin_address').value;
    if (!destino) destino = prompt(`Paul broke his promise so you can take his money. Please enter a bitcoin address where you want it to go`);
    var txdata = tapscript.Tx.create({
        vin: [{
            txid: to_challenge_txid,
            vout: to_challenge_vout,
            prevout: {
                value: to_challenge_amt,
                scriptPubKey: ['OP_1', tpubkey]
            },
        }],
        vout: [{
            value: to_challenge_amt - 500,
            scriptPubKey: tapscript.Address.toScriptPubKey(destino),
        }]
    });
    var sig = tapscript.Signer.taproot.sign(privkey, txdata, 0, { extension: target });
    txdata.vin[0].witness = [sig, ...preimages, selected_script, cblock];
    var txhex = tapscript.Tx.encode(txdata).hex;
    pushBTCpmt(to_challenge_txhex, "");
    setTimeout(() => { pushBTCpmt(txhex, "") }, 3000);
    $('.wait_for_sigs_div').innerHTML = `<h1>You're in luck!</h1><p>Whoa, Paul broke his promise! That means you got to take his money. Cool! BTW your transaction doing so has already been broadcasted. At any moment, your money should show up in the address you designated.</p>`;
}

async function handleResult(json) {
    var starter_txid = json["starter_info"]["starter_txid"];
    var starter_vout = json["starter_info"]["starter_vout"];
    var starter_amt = json["starter_info"]["starter_amt"];
    var funding_to_challenge_txdata = tapscript.Tx.create({
        vin: [{
            txid: starter_txid,
            vout: starter_vout,
            prevout: {
                value: starter_amt,
                scriptPubKey: tapscript.Address.toScriptPubKey(funding_address)
            },
        }],
        vout: [{
            value: starter_amt - 500,
            scriptPubKey: tapscript.Address.toScriptPubKey(challenge_address),
        }],
    });
    var tree = funding_scripts.map(s => tapscript.Tap.encodeScript(s));
    var selected_script = funding_scripts[1];
    var target = tapscript.Tap.encodeScript(selected_script);
    var pubkey = "ab".repeat(32);
    var [tpubkey, cblock] = tapscript.Tap.getPubKey(pubkey, { tree, target });
    var his_sig = json["signatures"]["funding_to_challenge_sig"];
    var sighash = tapscript.Signer.taproot.hash(funding_to_challenge_txdata, 0, { extension: target });
    var his_key = pauls_key;
    var his_funding_to_challenge_sig_is_good = await nobleSecp256k1.schnorr.verify(his_sig, sighash, his_key);
    console.log("his funding to challenge sig is good, right?", his_funding_to_challenge_sig_is_good);
    if (!his_funding_to_challenge_sig_is_good) {
        alert(`Paul sent you a bad sig so you must not pay him for any work he does. Aborting and restarting the page.`);
        window.location.reload();
        return;
    }
    //todo: validate Paul's other signatures
    var funding_to_challenge_sig = tapscript.Signer.taproot.sign(privkey, funding_to_challenge_txdata, 0, { extension: target });
    var sigs = [his_sig, funding_to_challenge_sig];
    sigs.reverse();
    funding_to_challenge_txdata.vin[0].witness = [...sigs, selected_script, cblock];
    to_challenge_txhex = tapscript.Tx.encode(funding_to_challenge_txdata).hex;
    to_challenge_txid = tapscript.Tx.util.getTxid(to_challenge_txhex);
    to_challenge_vout = 0;
    to_challenge_amt = starter_amt - 500;
    json["preimages_to_reveal"].forEach(item => preimages_from_paul.push(item));
    preimages_from_paul = removeDuplicates(preimages_from_paul);
    discardUnusedPreimages();
    //todo: actually give Vicky a transaction to broadcast here
    if (preimages_from_paul.length < number_of_preimages_to_expect) return alert("oh no! Go put your counterparty’s money in the bit commitment address!");
    //todo: also give Vicky a transaction to broadcast if Paul doesn't do his bit commitments in time
    //todo: also make the circuits reusable so that Vicky and Paul don't force close in every transaction
    var preimages_and_their_tapleaves = [];
    var i; for (i = 0; i < preimages_from_paul.length; i++) {
        var preimage = preimages_from_paul[i];
        var tapleaves_it_is_in = await compareTapleaves(preimage, challenge_scripts);
        preimages_and_their_tapleaves.push(tapleaves_it_is_in);
    }
    expanded_array = [];
    operations_array.forEach(operation => {
        if (operation.gate.name == "INV") expanded_array.push(["OP_NOT"], ["OP_NOT"], ["OP_NOT"], ["OP_NOT"]);
        if (operation.gate.name == "AND") expanded_array.push(["OP_BOOLAND"], ["OP_BOOLAND"], ["OP_BOOLAND"], ["OP_BOOLAND"], ["OP_BOOLAND"], ["OP_BOOLAND"], ["OP_BOOLAND"], ["OP_BOOLAND"]);
        if (operation.gate.name == "XOR") expanded_array.push(["OP_XOR"], ["OP_XOR"], ["OP_XOR"], ["OP_XOR"], ["OP_XOR"], ["OP_XOR"], ["OP_XOR"], ["OP_XOR"]);
    });
    expanded_array.push("multisig");
    preimages_and_their_tapleaves.forEach((preimage, index) => {
        preimage.forEach(num => {
            expanded_array[num].push(preimages_from_paul[index]);
        });
    });
    var operation_index; for (operation_index = 0; operation_index < expanded_array.length; operation_index++) {
        var item = expanded_array[operation_index];
        if (item[0] == "OP_NOT" && item.length == 3) {
            var hash_order = [];
            challenge_scripts[operation_index].forEach(element => {
                if (element.length == 64) hash_order.push(element);
            });
            if (operation_index == 3) console.log("hash_order:", hash_order)
            var preimages_in_order = [];
            var index; for (index = 0; index < expanded_array[operation_index].length; index++) {
                var preimage = expanded_array[operation_index][index];
                if (index) {
                    var hash = await sha256(hexToBytes(preimage));
                    hash_order.forEach((ordered_hash, hash_index) => {
                        if (ordered_hash == hash) preimages_in_order[hash_index] = preimage;
                    });
                }
            }
            expanded_array[operation_index] = ["OP_NOT", ...preimages_in_order];
            if (operation_index == 3) console.log("preimages in order:", preimages_in_order);
        }
        if (item[0] == "OP_BOOLAND" && item.length == 4) {
            var hash_order = [];
            challenge_scripts[operation_index].forEach(element => {
                if (element.length == 64) hash_order.push(element);
            });
            var preimages_in_order = [];
            var index; for (index = 0; index < expanded_array[operation_index].length; index++) {
                var preimage = expanded_array[operation_index][index];
                if (index) {
                    var hash = await sha256(hexToBytes(preimage));
                    hash_order.forEach((ordered_hash, hash_index) => {
                        if (ordered_hash == hash) preimages_in_order[hash_index] = preimage;
                    });
                }
            }
            expanded_array[operation_index] = ["OP_BOOLAND", ...preimages_in_order];
        }
        if (item[0] == "OP_XOR" && item.length == 4) {
            var hash_order = [];
            challenge_scripts[operation_index].forEach(element => {
                if (element.length == 64) hash_order.push(element);
            });
            var preimages_in_order = [];
            var index; for (index = 0; index < expanded_array[operation_index].length; index++) {
                var preimage = expanded_array[operation_index][index];
                if (index) {
                    var hash = await sha256(hexToBytes(preimage));
                    hash_order.forEach((ordered_hash, hash_index) => {
                        if (ordered_hash == hash) preimages_in_order[hash_index] = preimage;
                    });
                }
            }
            expanded_array[operation_index] = ["OP_XOR", ...preimages_in_order];
        }
    }
    var index; for (index = 0; index < expanded_array.length; index++) {
        var item = expanded_array[index];
        if (item[0] == "OP_NOT" && item.length == 3) {
            var i_can_spend = await OP_NOT(item[1], challenge_scripts[index][2], Number(challenge_scripts[index][4].substring(challenge_scripts[index][4].length - 1)), item[2], challenge_scripts[index][8], Number(challenge_scripts[index][10].substring(challenge_scripts[index][10].length - 1)));
            if (i_can_spend.startsWith("you can spend")) {
                return await handleBrokenPromise(i_can_spend, item[0], challenge_scripts[index]);
            }
        }
        if (item[0] == "OP_BOOLAND" && item.length == 4) {
            var i_can_spend = await OP_BOOLAND(item[1], challenge_scripts[index][2], Number(challenge_scripts[index][4].substring(challenge_scripts[index][4].length - 1)), item[2], challenge_scripts[index][7], Number(challenge_scripts[index][9].substring(challenge_scripts[index][9].length - 1)), item[3], challenge_scripts[index][13], Number(challenge_scripts[index][15].substring(challenge_scripts[index][15].length - 1)));
            if (i_can_spend.startsWith("you can spend")) {
                return await handleBrokenPromise(i_can_spend, item[0], challenge_scripts[index]);
            }
        }
        if (item[0] == "OP_XOR" && item.length == 4) {
            var i_can_spend = await OP_XOR(item[1], challenge_scripts[index][2], Number(challenge_scripts[index][4].substring(challenge_scripts[index][4].length - 1)), item[2], challenge_scripts[index][7], Number(challenge_scripts[index][9].substring(challenge_scripts[index][9].length - 1)), item[3], challenge_scripts[index][13], Number(challenge_scripts[index][15].substring(challenge_scripts[index][15].length - 1)));
            if (i_can_spend.startsWith("you can spend")) {
                return await handleBrokenPromise(i_can_spend, item[0], challenge_scripts[index]);
            }
        }
    }
    var r = await getInputsAndOutputFromRevealedPreimages();
    var input_1 = r.input_1;
    var input_2 = r.input_2
    var output = r.output;
    console.log("inputs and outputs:", input_1, input_2, output);

    if (program == "zero checker") {
        var is_or_is_not = "is";
        if (!Number(output)) is_or_is_not = "is not";
        alert(`The prover kept his promise. He promised ${pauls_promise.toLowerCase()}. This is what he sent you:\n\n${input_1}\n\nBitvm checked whether that string consists of all zeros and this was its result: ${!!Number(output)} -- so it determined the string ${is_or_is_not} all zeros. Meaning not only do *you* know the prover kept his promise, your bitcoin transaction knows it too. This completes the procedure; refresh your page to try again.`);
    }
    if (program == "size checker") {
        var partial_promise = pauls_promise[1].toLowerCase();
        if (partial_promise == "not bigger") partial_promise = "equal to or less";
        alert(`The prover kept his promise. He promised to give you two numbers, the first of which is ${partial_promise} than the second. These are the two numbers he sent you:\n\n${parseInt(reverseString(input_1), 2)} and ${parseInt(reverseString(input_2), 2)}\n\nBitvm checked whether the first is ${partial_promise} than the second and this was its result: true -- so it determined the first is ${partial_promise} than the second. Meaning not only do *you* know the prover kept his promise, your bitcoin transaction knows it too. This completes the procedure; refresh your page to try again.`);
    }
    if (program == "addition") {
        var do_or_dont = "";
        console.log(input_1, input_2, output, parseInt(input_1, 2), parseInt(input_2, 2), parseInt(output, 2), parseInt(input_1, 2) + parseInt(input_2, 2), parseInt(input_1, 2) + parseInt(input_2, 2) == parseInt(output, 2));
        if (parseInt(input_1, 2) + parseInt(input_2, 2) != parseInt(output, 2)) do_or_dont = "don't ";
        alert(`The prover kept his promise. He promised to give you two numbers that ${do_or_dont}add up to ${parseInt(output, 2)}. The first number he gave you is ${parseInt(input_1, 2)} and the second is ${parseInt(input_2, 2)}.\n\nBitvm checked whether they add up to ${parseInt(output, 2)} and it determined the equation is: ${parseInt(input_1, 2) + parseInt(input_2, 2) == parseInt(output, 2)} -- just as the prover promised. Meaning not only do *you* know the prover kept his promise, your bitcoin transaction knows it too. This completes the procedure; refresh your page to try again.`);
    }
}

async function handlePromise(json) {
    console.log(json);
    program = json["program"];
    initial_commitment_hashes = json["initial_commitment_hashes"];
    pauls_key = json["pauls_key"];
    subsequent_commitment_hashes = json["subsequent_commitment_hashes"];
    pauls_promise = json["promise"];
    var pubkey = window.vickys_key;
    bit_commitment_address = generateBitCommitmentAddress(pauls_key, pubkey);
    anti_contradiction_address = generateAntiContradictionAddress(pauls_key, pubkey);
    funding_address = generateFundingAddress(pauls_key, pubkey);
    if (program == "zero checker") {
        parseBristolString(circuit_bristol_zero_checker);
    }
    if (program == "size checker") {
        parseBristolString(circuit_bristol_size_checker);
    }
    if (program == "addition") {
        parseBristolString(circuit_bristol_addition);
    }
    mapWireNumberToCommitmentIndex();
    await setOperationsArray(true);
    //Vicky needs to take json[ "output_preimages" ] and add it to
    //preimages_from_paul, but only if she sees that it actually corresponds
    //to the hashes in the last n wires, n being the number of output wires
    //she expects
    var questionable_preimages = json["output_preimages"];
    questionable_preimages = removeDuplicates(questionable_preimages);
    var questionable_hashes = [];
    var i; for (i = 0; i < questionable_preimages.length; i++) {
        var hash = await sha256(hexToBytes(questionable_preimages[i]));
        questionable_hashes.push(hash);
    }
    var preimages_found = 0;
    var output = ``;
    if (wire_hashes.length != number_of_preimages_to_expect) {
        alert(`The program they sent you is invalid. Aborting and starting over.`);
        window.location.reload();
        return;
    }
    var i; for (i = number_of_preimages_to_expect - number_of_outputs; i < number_of_preimages_to_expect; i++) {
        wire_hashes[i].every((expected_hash, index) => {
            var j; for (j = 0; j < questionable_hashes.length; j++) {
                if (expected_hash == questionable_hashes[j]) {
                    preimages_found = preimages_found + 1;
                    output += String(index);
                    return;
                }
            }
            return true;
        });
    }
    if (preimages_found != number_of_outputs) {
        alert(`The prover sent you bad info. Aborting. Number of preimages you expected: ${number_of_outputs} Number of preimages you got: ${preimages_found}`);
        window.location.reload();
        return;
    }
    questionable_preimages.forEach(item => preimages_from_paul.push(item));
    var message = `Someone wants to run a program with you called "${program}."`;
    if (program == "zero checker") {
        var is_or_is_not = "is";
        if (!Number(output)) is_or_is_not = "is not";
        message += ` They promise to send you a string which ${is_or_is_not} just a bunch of zeros. They'll put up a bond to show they mean it, and if they break their promise, you can prove they lied and take their money.`
    }
    if (program == "size checker") {
        var partial_promise = pauls_promise[1].toLowerCase();
        if (partial_promise == "not bigger") partial_promise = "equal to or less";
        message += ` They promise to send you two numbers, the first of which is ${partial_promise} than the second. They'll put up a bond to show they mean it, and if they break their promise, you can prove they lied and take their money.`
    }
    if (program == "addition") {
        message += ` They promise to send you two numbers which add up to ${parseInt(output, 2)}. They'll put up a bond to show they mean it, and if they break their promise, you can prove they lied and take their money.`
    }
    message += ` Do you want to try it?`;
    var conf = confirm(message);
    if (!conf) {
        window.location.reload();
        return;
    }
    challenge_address = generateChallengeAddress(pauls_key, pubkey);
    var html = `
            <p>Funding address: ${funding_address}</p>
            <p>Bit commitment address: ${bit_commitment_address}</p>
            <p>Anti contradiction address: ${anti_contradiction_address}</p>
            <p>Challenge address: ${challenge_address}</p>
        `;
    $('.address_validation').innerHTML = html;
    $('.address_verification_div').classList.remove("hidden");
    $('#uploader_div').classList.add("hidden");
    document.getElementsByClassName("box")[0].classList.add("is-success");
}

function handleContent(file) {
    readFileContent(file).then(async content => {
        var json = JSON.parse(content);
        if ("msg_type" in json && json["msg_type"] == "results") {
            await handleResult(json);
        } else if ("promise" in json) {
            await handlePromise(json);
        }
    }).catch(error => console.log(error));
}

function handleUploader() {

    // feature detection for drag&drop upload
    var isAdvancedUpload = function () {
        var div = document.createElement('div');
        return (('draggable' in div) || ('ondragstart' in div && 'ondrop' in div)) && 'FormData' in window && 'FileReader' in window;
    }();

    // applying the effect for every form
    var forms = document.querySelectorAll('.box');
    Array.prototype.forEach.call(forms, function (form) {
        var input = form.querySelector('input[type="file"]'),
            label = form.querySelector('label'),
            errorMsg = form.querySelector('.box__error span'),
            restart = form.querySelectorAll('.box__restart'),
            droppedFiles = false,
            showFiles = function (files) {
                label.textContent = files.length > 1 ? ('').replace('{count}', files.length) : files[0].name;
            },
            triggerFormSubmit = function () {
                var event = document.createEvent('HTMLEvents');
                //event.initEvent( 'submit', true, false );
                //form.dispatchEvent( event );
            };

        // letting the server side to know we are going to make an Ajax request
        var ajaxFlag = document.createElement('input');
        ajaxFlag.setAttribute('type', 'hidden');
        ajaxFlag.setAttribute('name', 'ajax');
        ajaxFlag.setAttribute('value', 1);
        form.appendChild(ajaxFlag);

        // automatically submit the form on file select
        input.addEventListener('change', function (e) {
            showFiles(e.target.files);

            triggerFormSubmit();

        });

        // drag&drop files if the feature is available
        if (isAdvancedUpload) {
            form.classList.add('has-advanced-upload'); // letting the CSS part to know drag&drop is supported by the browser

            ['drag', 'dragstart', 'dragend', 'dragover', 'dragenter', 'dragleave', 'drop'].forEach(function (event) {
                form.addEventListener(event, function (e) {
                    // preventing the unwanted behaviours
                    e.preventDefault();
                    e.stopPropagation();
                });
            });
            ['dragover', 'dragenter'].forEach(function (event) {
                form.addEventListener(event, function () {
                    form.classList.add('is-dragover');
                });
            });
            ['dragleave', 'dragend', 'drop'].forEach(function (event) {
                form.addEventListener(event, function () {
                    form.classList.remove('is-dragover');
                });
            });
            form.addEventListener('drop', function (e) {
                droppedFiles = e.dataTransfer.files; // the files that were dropped
                showFiles(droppedFiles);
                setTimeout(function () {
                    form.classList.remove('is-uploading');
                    form.classList.add('is-success');
                }, 300);
                handleContent(droppedFiles[0]);
                //getFile( document.getElementById( "file" ) );
                triggerFormSubmit();
            });
        }

        // if the form was submitted
        form.addEventListener('submit', function (e) {
            // preventing the duplicate submissions if the current one is in progress
            if (form.classList.contains('is-uploading')) return false;

            form.classList.add('is-uploading');
            form.classList.remove('is-error');

            if (isAdvancedUpload) // ajax file upload for modern browsers
            {
                e.preventDefault();
                setTimeout(function () {
                    form.classList.remove('is-uploading');
                    form.classList.add('is-success');
                }, 300);
            }
            else // fallback Ajax solution upload for older browsers
            {
                var iframeName = 'uploadiframe' + new Date().getTime(),
                    iframe = document.createElement('iframe');

                $iframe = $('<iframe name="' + iframeName + '" style="display: none;"></iframe>');

                iframe.setAttribute('name', iframeName);
                iframe.style.display = 'none';

                document.body.appendChild(iframe);
                form.setAttribute('target', iframeName);

                iframe.addEventListener('load', function () {
                    //var data = JSON.parse( iframe.contentDocument.body.innerHTML );
                    setTimeout(function () {
                        form.classList.remove('is-uploading');
                        form.classList.add('is-success');
                    }, 300);
                    //form.classList.remove( 'is-uploading' )
                    //form.classList.add( data.success == true ? 'is-success' : 'is-error' )
                    form.removeAttribute('target');
                    //if( !data.success ) errorMsg.textContent = data.error;
                    iframe.parentNode.removeChild(iframe);
                });
            }
        });

        // restart the form if has a state of error/success
        Array.prototype.forEach.call(restart, function (entry) {
            entry.addEventListener('click', function (e) {
                e.preventDefault();
                form.classList.remove('is-error', 'is-success');
                input.click();
            });
        });

        // Firefox focus bug fix for file input
        input.addEventListener('focus', function () { input.classList.add('has-focus'); });
        input.addEventListener('blur', function () { input.classList.remove('has-focus'); });

    });
}

function modalVanish() {
    document.getElementById("black-bg").style.display = "none";
    document.getElementById("modal").style.display = "none";
}

function initVicky() {
    var privkey = getRand(32);
    var pubkey = nobleSecp256k1.getPublicKey(privkey, true).substring(2);
    window.vickys_key = pubkey;
    $('.vicky_key').innerText = pubkey;
}

$('.address_verification_reset').onclick = () => {
    alert(`Something must have gone wrong so it is not safe to continue. The page will reset.`);
    window.location.reload();
}
$('.address_verification_done').onclick = async () => {
    $('.address_verification_div').classList.add("hidden");
    $('.wait_for_sigs_div').classList.remove("hidden");
}