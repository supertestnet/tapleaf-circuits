programs["size checker"] = {
    initialize: () => {
        circuit.parseBristolString(circuit_bristol_size_checker);
    },
    promise_prompt: (outputs, promise) => {
        var prompt = ``;

        var partial_promise = promise[1].toLowerCase();
        if (partial_promise == "not bigger") partial_promise = "equal to or less";
        prompt += `They promise to send you two numbers, the first of which is ${partial_promise} than the second. `;

        prompt += `They'll put up a bond to show they mean it, and if they break their promise, `;
        prompt += `you can prove they lied and take their money.`;

        return prompt;
    },
    promise_kept_prompt: (inputs, outputs, promise) => {
        var prompt = ``;
        prompt += `The prover kept his promise. `;

        var partial_promise = promise[1].toLowerCase();
        if (partial_promise == "not bigger") partial_promise = "equal to or less";
        prompt += `He promised to give you two numbers, the first of which is ${partial_promise} than the second. `;

        prompt += `These are the two numbers he sent you:\n\n${parseInt(reverseString(inputs[0]), 2)} and ${parseInt(reverseString(inputs[1]), 2)}\n\n`;
        prompt += `Bitvm checked whether the first is ${partial_promise} than the second and this was its result: true`;
        prompt += ` -- so it determined the first is ${partial_promise} than the second. `;

        prompt += `Meaning not only do *you* know the prover kept his promise, your bitcoin transaction knows it too. `;
        prompt += `This completes the procedure; refresh your page to try again.`

        return prompt;
    }
};

if ($('.size_checker_program')) {
    $('.choose_size_checker').onclick = async () => {
        $('.size_checker_program').classList.remove("hidden");
        $('.home').classList.add("hidden");
        programs["size checker"].initialize();
        await circuit.setWiresPreimagesAndHashes();
        generateBitCommitments();
    }
    $('.size_checker_step_one_done').onclick = () => {
        $('.size_checker_step_one').classList.add("hidden");
        $('.size_checker_step_two').classList.remove("hidden");
        vickys_key = $('.size_checker_program .vickys_key').value;
    }
    $('.submit_std_num').onclick = () => {
        var std_num = Number($('.std_num').value);
        var binary = std_num.toString(2);
        if (binary.length % 2) binary = "0" + binary;
        var padding = "0".repeat(32);
        binary = padding + binary;
        binary = binary.substring(binary.length - 32);
        binary = reverseString(binary);
        bin_array = binary.split("");
        bin_array.forEach((item, index) => bin_array[index] = Number(item));
        promise = [std_num, $('.big_or_not').value];
        var output_preimages = [];
        //reveal the preimage for "false" (0) if the first number is "bigger"
        //because the function returns true if the first number is "less
        //than or equal to" the second number, which is the same thing as
        //returning false if the first number is "bigger"
        var setting = $('.big_or_not').value.toLowerCase() == "bigger" ? 0 : 1;
        var preimage = circuit.wires[circuit.wires.length - circuit.output_sizes[0]].settings_preimages[setting];
        output_preimages.push(preimage);
        var message_to_vicky = {
            program: "size checker",
            promise,
            pauls_key: pubkey,
            initial_commitment_hashes,
            subsequent_commitment_hashes,
            output_preimages
        }
        saveDataToFile(JSON.stringify(message_to_vicky), "promise_file.txt");
    }
    $('.size_checker_step_two_done').onclick = () => {
        $('.size_checker_step_one').classList.add("hidden");
        $('.size_checker_step_two').classList.add("hidden");
        $('.size_checker_step_three').classList.remove("hidden");
        var std_num = Number($('.std_num').value);
        promise = [std_num, $('.big_or_not').value];
        var partial_promise = promise[1].toLowerCase();
        if (partial_promise == "not bigger") partial_promise = "equal to or less";
        $('.size_checker_program .step_six_promise_to_vicky').innerText = promise[1].toLowerCase();
        $('.size_checker_program .step_six_second_promise_to_vicky').innerText = promise[0];
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
        $('.size_checker_program .address_validation').innerHTML = html;
    }
    $('.size_checker_step_three_reset').onclick = () => {
        alert(`Something must have gone wrong so it is not safe to continue. The page will reset.`);
        window.location.reload();
    }
    $('.size_checker_step_three_done').onclick = async () => {
        $('.size_checker_step_one').classList.add("hidden");
        $('.size_checker_step_two').classList.add("hidden");
        $('.size_checker_step_three').classList.add("hidden");
        $('.size_checker_step_four').classList.remove("hidden");
        $('.size_checker_program .funding_address_in_step_four').innerText = starter_address;
        console.log("starter address:", starter_address);
        $('.size_checker_program .asking_for_txid').innerHTML = `If you are looking for testnet coins, try this faucet: <a href="https://faucet.mutinynet.com/" target="_blank">https://faucet.mutinynet.com</a>`;
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
        $('.size_checker_step_four').classList.add("hidden");
        $('.size_checker_step_five').classList.remove("hidden");
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
        var destino = $('.size_checker_bitcoin_address').value;
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
        $('.size_checker_program .starter_txhex').innerText = starter_txhex;
        setTimeout(() => { pushBTCpmt(starter_txhex, ""); }, 2000);
        $('.size_checker_step_five_done').click();
        presigned_tx_sigs = {
            funding_to_bit_commitment_sig: funding_to_bit_commitment_sig.hex,
            funding_to_anti_contradiction_sig: funding_to_anti_contradiction_sig.hex,
            funding_to_challenge_sig: funding_to_challenge_sig.hex,
            commitment_to_anti_contradiction_sig: commitment_to_anti_contradiction_sig.hex,
            commitment_to_challenge_sig: commitment_to_challenge_sig.hex,
        }
    }
    $('.size_checker_step_five_done').onclick = async () => {
        $('.size_checker_step_five').classList.add("hidden");
        $('.size_checker_step_six').classList.remove("hidden");
    }
    $('.size_checker_step_six_done').onclick = async () => {
        //the function returns true if the first number (the standard
        //number) is less than or equal to the second number
        //i.e. it returns false if the first number is
        //bigger than the second number
        var standard_number = Number($('.std_num').value);
        var number_of_comparison = Number($('.number_of_comparison').value);
        var binary = standard_number.toString(2);
        if (binary.length % 2) binary = "0" + binary;
        var padding = "0".repeat(32);
        binary = padding + binary;
        binary = binary.substring(binary.length - 32);
        binary = reverseString(binary);
        bin_array_1 = binary.split("");
        bin_array_1.forEach((item, index) => bin_array_1[index] = Number(item));
        var binary = number_of_comparison.toString(2);
        if (binary.length % 2) binary = "0" + binary;
        var padding = "0".repeat(32);
        binary = padding + binary;
        binary = binary.substring(binary.length - 32);
        binary = reverseString(binary);
        bin_array_2 = binary.split("");
        bin_array_2.forEach((item, index) => bin_array_2[index] = Number(item));
        console.log("standard number:", bin_array_1.join(""), "number of comparison:", bin_array_2.join(""));
        console.log("remember, the function returns true if the second number is bigger than the first number");
        initial_commitment_preimages.forEach((preimage_pair, index) => {
            if (index < 32) {
                circuit.wires[index].setting = bin_array_1[index];
                preimages_to_reveal.push(preimage_pair[bin_array_1[index]]);
            } else {
                circuit.wires[index].setting = bin_array_2[index - 32];
                preimages_to_reveal.push(preimage_pair[bin_array_2[index - 32]]);
            }
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
        $('.size_checker_step_six').innerHTML = `<p>After 10 blocks (so in block <span class="current_blockheight">${blockheight + 11}</span>) <a href="https://mutinynet.com/tx/push" target="_blank">go here</a> and broadcast this tx to collect your money if you sent the right data to Vicky (otherwise, expect Vicky to take your money):</p><p>${earnings_txhex}</p><p>While you wait, you can view the current blockheight here: <a href="https://mutinynet.com" target="_blank">https://mutinynet.com</a> (mutinynet is a bitcoin testnet where blocks arrive about every 30 seconds).</p>`;
    }
    $('.size_checker_program .vickys_key').value = "";
    $('.size_checker_program .std_num').value = "";
    $('.size_checker_program .number_of_comparison').value = ""
}