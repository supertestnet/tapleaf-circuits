programs["sha256"] = {
    initialize: () => {
        circuit.parseBristolString(circuit_bristol_sha256);
    },
    promise_prompt: (outputs, promise) => {
        var prompt = ``;

        prompt += `They promise to send you the preimage of this hash: ${promise} `;

        prompt += `They'll put up a bond to show they mean it, and if they break their promise, `;
        prompt += `you can prove they lied and take their money.`;

        return prompt;
    },
    promise_kept_prompt: (inputs, outputs, promise) => {
        var prompt = ``;
        prompt += `The prover kept his promise. `;

        prompt += `He promised to give you the preimage of this hash:\n\n${promise}\n\n`;

        var input_string = ``;
        var input_string_length = parseInt(inputs[0].slice(512 - 64, 512), 2);
        var char_size = 8;
        var i; for (i = 0; i < input_string_length; i += char_size) {
            var byte_binary = inputs[0].slice(i, i + char_size);
            if (byte_binary == "00000000") continue;
            input_string += String.fromCharCode(parseInt(byte_binary, 2));
        }
        prompt += `Bitvm checked whether the preimage "${input_string}" hashes to the promised hash and this was its result: true`;
        prompt += ` -- just as the prover promised. `;

        prompt += `Meaning not only do *you* know the prover kept his promise, your bitcoin transaction knows it too. `;
        prompt += `This completes the procedure; refresh your page to try again.`

        return prompt;
    }
};

if ($('.sha256_program')) {
    $('.choose_sha256').onclick = async () => {
        $('.choose_sha256').value = "Starting...";
        $('.choose_sha256').disabled = true;
        programs["sha256"].initialize();
        await circuit.setWiresPreimagesAndHashes();
        generateBitCommitments();
        $('.sha256_program').classList.remove("hidden");
        $('.home').classList.add("hidden");
    }
    $('.sha256_step_one_done').onclick = () => {
        $('.sha256_step_one').classList.add("hidden");
        $('.sha256_step_two').classList.remove("hidden");
        vickys_key = $('.sha256_program .vickys_key').value;
    }
    $('.submit_final_hash').onclick = () => {
        var promise = $('.final_hash').value;
        var binary = hexToBytes(promise).reduce(
            (binary, byte) => {
                return binary + byte.toString(2).padStart(8, "0")
            }, ""
        );
        bin_array = binary.split("")
        bin_array.forEach((item, index) => bin_array[index] = Number(item));
        var output_preimages = [];
        var i; for (i = circuit.wires.length - circuit.output_sizes[0]; i < circuit.wires.length; i++) {
            var preimage = circuit.wires[i].settings_preimages[bin_array[(i - circuit.wires.length) + circuit.output_sizes[0]]];
            output_preimages.push(preimage);
        }
        var message_to_vicky = {
            program: "sha256",
            promise,
            pauls_key: pubkey,
            initial_commitment_hashes,
            subsequent_commitment_hashes,
            output_preimages
        }
        console.log(message_to_vicky);
        saveDataToFile(JSON.stringify(message_to_vicky), "promise_file.txt");
    }
    $('.sha256_step_two_done').onclick = () => {
        $('.sha256_step_one').classList.add("hidden");
        $('.sha256_step_two').classList.add("hidden");
        $('.sha256_step_three').classList.remove("hidden");
        var promise = $('.final_hash').value;
        $('.sha256_program .step_six_promise_to_vicky').innerText = promise;
        bit_commitment_address = generateBitCommitmentAddress(pubkey, vickys_key);
        anti_contradiction_address = generateAntiContradictionAddress(pubkey, vickys_key);
        challenge_address = generateChallengeAddress(pubkey, vickys_key);
        funding_address = generateFundingAddress(pubkey, vickys_key);
        var html = `
                        <p>Funding address: ${funding_address}</p>
                        <p>Bit commitment address: ${bit_commitment_address}</p>
                        <p>Anti contradiction address: ${anti_contradiction_address}</p>
                        <p>Challenge address: ${challenge_address}</p>
                    `;
        $('.sha256_program .address_validation').innerHTML = html;
    }
    $('.sha256_step_three_reset').onclick = () => {
        alert(`Something must have gone wrong so it is not safe to continue. The page will reset.`);
        window.location.reload();
    }
    $('.sha256_step_three_done').onclick = async () => {
        $('.sha256_step_one').classList.add("hidden");
        $('.sha256_step_two').classList.add("hidden");
        $('.sha256_step_three').classList.add("hidden");
        $('.sha256_step_four').classList.remove("hidden");
        $('.sha256_program .funding_address_in_step_four').innerText = starter_address;
        console.log("starter address:", starter_address);
        $('.sha256_program .asking_for_txid').innerHTML = `If you are looking for testnet coins, try this faucet: <a href="https://faucet.mutinynet.com/" target="_blank">https://faucet.mutinynet.com</a>`;
        await waitSomeSeconds(3);
        if ($_GET["network"] == "regtest") {
            var txid = prompt(`What was the txid?`);
            var vout = prompt(`And the vout?`);
            vout = Number(vout);
        } else {
            await loopTilAddressReceivesMoney(starter_address, "");
            await waitSomeSeconds(2);
            var txinfo = await addressReceivedMoneyInThisTx(starter_address, "");
            var txid = txinfo[0];
            var vout = txinfo[1];
        }
        $('.sha256_step_four').classList.add("hidden");
        $('.sha256_step_five').classList.remove("hidden");
        var amt = 10_000;
        var starter_txdata = tapscript.Tx.create({
            vin: [{
                txid: txid,
                vout: vout,
                prevout: {
                    value: amt,
                    scriptPubKey: ['OP_1', pubkey]
                },
            }],
            vout: [{
                value: amt - 500,
                scriptPubKey: tapscript.Address.toScriptPubKey(funding_address),
            }]
        });

        var starter_sig = tapscript.Signer.taproot.sign(privkey, starter_txdata, 0);
        starter_txdata.vin[0].witness = [starter_sig];
        await tapscript.Signer.taproot.verify(starter_txdata, 0, { throws: true });
        var starter_txhex = tapscript.Tx.encode(starter_txdata).hex;
        starter_txid = tapscript.Tx.util.getTxid(starter_txhex);
        starter_vout = 0;
        starter_amt = 9_500;
        var destino = $('.sha256_bitcoin_address').value;
        if (!destino) destino = prompt(`Please enter a bitcoin address where you want your earnings to go`);
        var earnings_txdata = tapscript.Tx.create({
            vin: [{
                txid: starter_txid,
                vout: starter_vout,
                sequence: 10,
                prevout: {
                    value: starter_amt,
                    scriptPubKey: tapscript.Address.toScriptPubKey(funding_address)
                },
            }],
            vout: [{
                value: starter_amt - 500,
                scriptPubKey: tapscript.Address.toScriptPubKey(destino),
            }],
        });
        var earnings_sig = tapscript.Signer.taproot.sign(privkey, earnings_txdata, 0, { extension: funding_to_paul_tapleaf });
        earnings_txdata.vin[0].witness = [earnings_sig, funding_to_paul_script, funding_to_paul_cblock];
        await tapscript.Signer.taproot.verify(earnings_txdata, 0, { pubkey, throws: true });
        earnings_txhex = tapscript.Tx.encode(earnings_txdata).hex;
        //presign (1) a tx from the funding address to the bit commitment
        //address (2) a tx from the bit commitment address to the anti-contradiction
        //address (3) a tx from the bit commitment address to the challenge address
        //(4) a tx from the funding address to the anti-contradiction address (5)
        //a tx from the funding address to the challenge address
        //todo: Paul shouldn't put his money in the funding address til he has
        //validated sigs from Vicky letting him move his money *out of* the bit
        //commitment addresses and into the challenge address. Otherwise Vicky
        //might put his money *in* the bit commitment address but never let him
        //take it out.
        var funding_to_bit_commitment_txdata = tapscript.Tx.create({
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
                scriptPubKey: tapscript.Address.toScriptPubKey(bit_commitment_address),
            }],
        });
        var funding_to_bit_commitment_sig = tapscript.Signer.taproot.sign(privkey, funding_to_bit_commitment_txdata, 0, { extension: funding_to_anywhere_else_tapleaf });
        var funding_to_anti_contradiction_txdata = tapscript.Tx.create({
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
                scriptPubKey: tapscript.Address.toScriptPubKey(anti_contradiction_address),
            }],
        });
        var funding_to_anti_contradiction_sig = tapscript.Signer.taproot.sign(privkey, funding_to_anti_contradiction_txdata, 0, { extension: funding_to_anywhere_else_tapleaf });
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
        var funding_to_challenge_sig = tapscript.Signer.taproot.sign(privkey, funding_to_challenge_txdata, 0, { extension: funding_to_anywhere_else_tapleaf });
        var to_commitment_txhex = tapscript.Tx.encode(funding_to_bit_commitment_txdata).hex;
        var to_commitment_txid = tapscript.Tx.util.getTxid(to_commitment_txhex);
        var to_commitment_vout = 0;
        var to_commitment_amt = 9_000;
        var commitment_to_anti_contradiction_txdata = tapscript.Tx.create({
            vin: [{
                txid: to_commitment_txid,
                vout: to_commitment_vout,
                prevout: {
                    value: to_commitment_amt,
                    scriptPubKey: tapscript.Address.toScriptPubKey(bit_commitment_address)
                },
            }],
            vout: [{
                value: to_commitment_amt - 3000,
                scriptPubKey: tapscript.Address.toScriptPubKey(anti_contradiction_address),
            }],
        });
        var commitment_to_anti_contradiction_sig = tapscript.Signer.taproot.sign(privkey, commitment_to_anti_contradiction_txdata, 0, { extension: commitment_to_anywhere_else_tapleaf });
        var commitment_to_challenge_txdata = tapscript.Tx.create({
            vin: [{
                txid: to_commitment_txid,
                vout: to_commitment_vout,
                prevout: {
                    value: to_commitment_amt,
                    scriptPubKey: tapscript.Address.toScriptPubKey(bit_commitment_address)
                },
            }],
            vout: [{
                value: to_commitment_amt - 3000,
                scriptPubKey: tapscript.Address.toScriptPubKey(challenge_address),
            }],
        });
        var commitment_to_challenge_sig = tapscript.Signer.taproot.sign(privkey, commitment_to_challenge_txdata, 0, { extension: commitment_to_anywhere_else_tapleaf });
        console.log("starter txhex:", starter_txhex, "earnings_txhex:", earnings_txhex);
        //get the txid, vout, and amount left over from the starter tx and send them
        //to Vicky, then send the money into the funding address, then do the
        //computation and send Vicky the preimages and the signatures and the txid/
        //vout/amount of the tx from the starter address to the funding address
        //todo: prover shouldn't send his money anywhere til he gets paid to do so
        //by Vicky -- e.g. in an atomic swap where she gives him 5000 sats if he
        //puts his money in the funding address -- but she shouldn't do that til
        //she has the ability to move his money from the funding address to all of
        //these other addresses, so she should validate his signatures before doing
        //that swap. She should also independently construct all the txs above so
        //she has an independent copy of the sighashes to compare each sig against
        $('.sha256_program .starter_txhex').innerText = starter_txhex;
        setTimeout(() => { pushBTCpmt(starter_txhex, ""); }, 2000);
        $('.sha256_step_five_done').click();
        presigned_tx_sigs = {
            funding_to_bit_commitment_sig: funding_to_bit_commitment_sig.hex,
            funding_to_anti_contradiction_sig: funding_to_anti_contradiction_sig.hex,
            funding_to_challenge_sig: funding_to_challenge_sig.hex,
            commitment_to_anti_contradiction_sig: commitment_to_anti_contradiction_sig.hex,
            commitment_to_challenge_sig: commitment_to_challenge_sig.hex,
        }
    }
    $('.sha256_step_five_done').onclick = async () => {
        $('.sha256_step_five').classList.add("hidden");
        $('.sha256_step_six').classList.remove("hidden");
    }
    $('.sha256_step_six_done').onclick = async () => {
        var preimage = $('.preimage').value;
        var binary = preimage.split("").reduce(
            (binary, byte) => {
                byte_binary = byte.charCodeAt(0).toString(2).padStart(8, "0");
                return binary + byte_binary
            }, ""
        );
        binary = binary + "1" + binary.length.toString(2).padStart(512 - binary.length - 1, "0");
        bin_array = binary.split("");
        bin_array.forEach((item, index) => bin_array[index] = Number(item));
        initial_commitment_preimages.forEach((preimage_pair, index) => {
            circuit.wires[index].setting = bin_array[index];
            preimages_to_reveal.push(preimage_pair[bin_array[index]]);
        });

        circuit.gates.forEach((gate) => {
            eval(gate.eval_string());
            gate.output_wires.forEach((wire_number) => {
                var setting = circuit.wires[wire_number].setting;
                preimages_to_reveal.push(circuit.wires[wire_number].settings_preimages[setting]);
            });
        });

        var message_to_vicky = {
            msg_type: "results",
            starter_info: {
                starter_txid,
                starter_vout,
                starter_amt,
            },
            preimages_to_reveal,
            signatures: presigned_tx_sigs,
        }
        alert(`You are about to be prompted to download a file called results_file.txt. Do so and send it to Vicky.`);
        var blockheight = await getBlockheight("");
        saveDataToFile(JSON.stringify(message_to_vicky), "results_file.txt");
        $('.sha256_step_six').innerHTML = `<p>After 10 blocks (so in block <span class="current_blockheight">${blockheight + 11}</span>) <a href="https://mutinynet.com/tx/push" target="_blank">go here</a> and broadcast this tx to collect your money if you sent the right data to Vicky (otherwise, expect Vicky to take your money):</p><p>${earnings_txhex}</p><p>While you wait, you can view the current blockheight here: <a href="https://mutinynet.com" target="_blank">https://mutinynet.com</a> (mutinynet is a bitcoin testnet where blocks arrive about every 30 seconds).</p>`;
    }
    $('.sha256_program .vickys_key').value = "";
    $('.sha256_program .final_hash').value = "";
    $('.sha256_program .preimage').value = ""
}