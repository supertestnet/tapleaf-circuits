async function handleBrokenPromise(tapleafGate) {
    var selected_script = tapleafGate.script();
    var target = tapscript.Tap.encodeScript(selected_script);
    var pubkey = "ab".repeat(32);
    var [tpubkey, cblock] = tapscript.Tap.getPubKey(pubkey, { tree: challenge_scripts, target });

    //the order they should go in is: output first, so it can be moved to the altstack;
    //then input 1, as it is processed first; then input 2, as it is processed next. And so on.
    var preimages = [];
    tapleafGate.inputs.reverse().forEach((input) => {
        preimages.push(input.preimage);
    });
    tapleafGate.outputs.forEach((output) => {
        preimages.push(output.preimage);
    });
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

    //todo: actually give Vicky a transaction to broadcast here
    if (preimages_from_paul.length < circuit.wires.length) return alert("oh no! Go put your counterparty’s money in the bit commitment address!");
    //todo: also give Vicky a transaction to broadcast if Paul doesn't do his bit commitments in time
    //todo: also make the circuits reusable so that Vicky and Paul don't force close in every transaction

    // Note: since we don't do bisection yet, we only check for the output gates
    var output_tapleaf_gates = [];
    var sum_of_all_output_sizes = circuit.output_sizes.reduce((ac, c) => ac + c, 0);
    var minimum_output_wire_number = circuit.wires.length - sum_of_all_output_sizes;
    var i; for (i = 0; i < tapleaf_gates.length; i++) {
        console.log( 0 );
        if ( program == "8bit cpu with 64 cyles" ) {
            console.log( 1 );
            output_tapleaf_gates = [];
            var container = [];
            var i; for ( i=0; i<tapleaf_gates.length; i++ ) {
                var item = tapleaf_gates[ i ];
                if ( item && tapleaf_gates[i].gate.output_wires[ 0 ] >= minimum_output_wire_number && !container.includes( JSON.stringify( [item[ "gate" ][ "name" ], item[ "gate" ][ "input_wires" ], item[ "gate" ][ "output_wires" ] ] ) ) ) {
                    container.push( JSON.stringify( [item[ "gate" ][ "name" ], item[ "gate" ][ "input_wires" ], item[ "gate" ][ "output_wires" ] ] ) );
                    output_tapleaf_gates.push(tapleaf_gates[i]);
                }
            }
            console.log( 2, output_tapleaf_gates );
        } else {
            if (tapleaf_gates[i].gate.output_wires.reduce((ac, c) => ac || c >= minimum_output_wire_number, false)) {
                output_tapleaf_gates.push(tapleaf_gates[i]);
            }
        }
    }
    console.log( 3, "doing preimage stuff", output_tapleaf_gates.length, output_tapleaf_gates );

    for (const preimage of preimages_from_paul) {
        var hash = await sha256(hexToBytes(preimage));
        var i; for (i = 0; i < output_tapleaf_gates.length; i++) {
            if ( json[ "program" ] == "8bit cpu with 64 cyles" && !expected_preimage_positions.includes( i ) ) continue;
            output_tapleaf_gates[i].tryAddingPreimage(preimage, hash);
        };
    };
    console.log( 4, "done with preimage stuff, doing tapleaf stuff" );
    var values = [];
    output_tapleaf_gates.forEach( item => values.push( item.outputs.value ) );
    console.log( "outputs:", values );

    var i; for (i = 0; i < output_tapleaf_gates.length; i++) {
        if ( json[ "program" ] == "8bit cpu with 64 cyles" && !expected_preimage_positions.includes( i ) ) continue;
        if (output_tapleaf_gates[i].isSpendable()) {
            return await handleBrokenPromise(output_tapleaf_gates[i]);
        }
    };
    console.log( 5 );

    // If we get here, paul has kept his promise!

    var r = await circuit.runAndGetInputAndOutputs();
    console.log( 6, r.inputs, r.outputs );
    var prompt = programs[program].promise_kept_prompt(r.inputs, r.outputs, pauls_promise);
    console.log( 7 );
    alert(prompt);
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
    programs[program].initialize();
    await circuit.setWiresPreimagesAndHashes();
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
    var sum_of_all_output_sizes = circuit.output_sizes.reduce((ac, c) => ac + c, 0);
    var preimages_expected = sum_of_all_output_sizes;
    if ( program == "8bit cpu with 64 cyles" ) {
        if ( !( "preimage_positions" in json ) ) return alert( `Your counterparty did not send you good data about the preimages you ought to expect in the output. Aborting.` );
        preimages_expected = json[ "preimage_positions" ].length;
        expected_preimage_positions = json[ "preimage_positions" ];
    }
    var outputs = [];
    var unchanging_output_start_wire;
    var preimage_positions = [];
    var k; for (k = 0; k < circuit.output_sizes.length; k++) {
        var output_value = ``;
        var output_start_wire = circuit.wires.length;
        var j; for (j = circuit.output_sizes.length - 1; j >= k; j--) {
            output_start_wire -= circuit.output_sizes[j];
        }
        if ( unchanging_output_start_wire === undefined ) unchanging_output_start_wire = output_start_wire;
        var i; for (i = output_start_wire; i < output_start_wire + circuit.output_sizes[k]; i++) {
            circuit.wires[i].settings_hashes.every((expected_hash, index) => {
                var j; for (j = 0; j < questionable_hashes.length; j++) {
                    if (expected_hash == questionable_hashes[j]) {
                        preimages_found = preimages_found + 1;
                        output_value += String(index);
                        preimage_positions.push( i - unchanging_output_start_wire );
                        return;
                    }
                }
                return true;
            });
        }
        outputs.push(output_value);
    }
    if (preimages_found != preimages_expected) {
        alert(`The prover sent you bad info. Aborting. Number of preimages you expected: ${preimages_expected} Number of preimages you got: ${preimages_found}`);
        window.location.reload();
        return;
    }
    console.log( "expected_preimage_positions:", expected_preimage_positions, "preimage_positions:", preimage_positions );
    if ( expected_preimage_positions && JSON.stringify( preimage_positions ) != JSON.stringify( expected_preimage_positions ) )
        return alert( `The prover sent you bad info about the preimage positions. Aborting` );
    questionable_preimages.forEach(item => preimages_from_paul.push(item));
    var message = `Someone wants to run a program with you called "${program}."`;
    message += " " + programs[program].promise_prompt(outputs, pauls_promise);
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

function getFile(input) {
    if ('files' in input && input.files.length > 0) {
        handleContent(input.files[0]);
    }
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
