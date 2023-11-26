programs["adder_8bit"] = {
    initialize: () => {
        circuit.parseBristolString(circuit_bristol_adder_8bit);
    },
    promise_prompt: (outputs, promise) => {
        console.log( outputs[ 1 ], parseInt(outputs[1], 2) );
        var prompt = ``;
        prompt += `They promise to send you two numbers which add up to ${parseInt(outputs[1], 2)}. `;
        prompt += `They'll put up a bond to show they mean it, and if they break their promise, `;
        prompt += `you can prove they lied and take their money.`;
        return prompt;
    },
    promise_kept_prompt: (inputs, outputs, promise) => {
        var prompt = ``;
        prompt += `The prover kept his promise. `;

        prompt += `He promised to give you two numbers that add up to ${parseInt(outputs[1], 2)}. `;

        prompt += `The first number he gave you is ${parseInt(inputs[1], 2)} and the second is ${parseInt(inputs[2], 2)}.\n\n`
        prompt += `Bitvm checked whether they add up to ${parseInt(outputs[1], 2)} `;
        prompt += `and it determined the equation is: true`;
        prompt += ` -- just as the prover promised. `;

        prompt += `Meaning not only do *you* know the prover kept his promise, your bitcoin transaction knows it too. `;
        prompt += `This completes the procedure; refresh your page to try again.`

        return prompt;
    }
};

if ($('.adder_8bit_program')) {
    $('.choose_adder_8bit').onclick = async () => {
        $('.adder_8bit_program').classList.remove("hidden");
        $('.home').classList.add("hidden");
        programs["adder_8bit"].initialize();
        await circuit.setWiresPreimagesAndHashes();
        generateBitCommitments();
    }
    $('.adder_8bit_step_one_done').onclick = () => {
        $('.adder_8bit_step_one').classList.add("hidden");
        $('.adder_8bit_step_two').classList.remove("hidden");
        vickys_key = $('.adder_8bit_program .vickys_key').value;
    }
    $('.submit_sum_num_8bit').onclick = () => {
        promise = Number($('.sum_num_8bit').value);
        var final_carry = String( Number( promise > 255 ) );
        var binary = promise.toString(2).padStart(8, "0");
        binary = final_carry + binary;
        bin_array = binary.split("");
        console.log( "bin_array:", bin_array );
        bin_array.forEach((item, index) => bin_array[index] = Number(item));
        var output_preimages = [];
        var i; for (i = circuit.wires.length - circuit.output_sizes[0] - circuit.output_sizes[1]; i < circuit.wires.length; i++) {
            var preimage = circuit.wires[i].settings_preimages[bin_array[(i - circuit.wires.length) + circuit.output_sizes[0] + circuit.output_sizes[1]]];
            // console.log( i, ( i - circuit.wires.length ) + circuit.output_sizes[0], preimage );
            output_preimages.push(preimage);
        }
        var message_to_vicky = {
            program: "adder_8bit",
            promise,
            pauls_key: pubkey,
            initial_commitment_hashes,
            subsequent_commitment_hashes,
            output_preimages
        }
        saveDataToFile(JSON.stringify(message_to_vicky), "promise_file.txt");
    }
    $('.adder_8bit_step_two_done').onclick = () => {
        $('.adder_8bit_step_one').classList.add("hidden");
        $('.adder_8bit_step_two').classList.add("hidden");
        $('.adder_8bit_step_three').classList.remove("hidden");
        promise = $('.sum_num_8bit').value;
        $('.adder_8bit_program .step_six_promise_to_vicky').innerText = promise.toLowerCase();
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
        $('.adder_8bit_program .address_validation').innerHTML = html;
    }
    $('.adder_8bit_step_three_reset').onclick = () => {
        alert(`Something must have gone wrong so it is not safe to continue. The page will reset.`);
        window.location.reload();
    }
    $('.adder_8bit_step_three_done').onclick = async () => {
        $('.adder_8bit_step_one').classList.add("hidden");
        $('.adder_8bit_step_two').classList.add("hidden");
        $('.adder_8bit_step_three').classList.add("hidden");
        $('.adder_8bit_step_four').classList.remove("hidden");
        $('.adder_8bit_program .funding_address_in_step_four').innerText = starter_address;
        console.log("starter address:", starter_address);
        $('.adder_8bit_program .asking_for_txid').innerHTML = `If you are looking for testnet coins, try this faucet: <a href="https://faucet.mutinynet.com/" target="_blank">https://faucet.mutinynet.com</a>`;
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
        $('.adder_8bit_step_four').classList.add("hidden");
        $('.adder_8bit_step_five').classList.remove("hidden");
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
        var destino = $('.adder_8bit_bitcoin_address').value;
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
        $('.adder_8bit_program .starter_txhex').innerText = starter_txhex;
        setTimeout(() => { pushBTCpmt(starter_txhex, ""); }, 2000);
        $('.adder_8bit_step_five_done').click();
        presigned_tx_sigs = {
            funding_to_bit_commitment_sig: funding_to_bit_commitment_sig.hex,
            funding_to_anti_contradiction_sig: funding_to_anti_contradiction_sig.hex,
            funding_to_challenge_sig: funding_to_challenge_sig.hex,
            commitment_to_anti_contradiction_sig: commitment_to_anti_contradiction_sig.hex,
            commitment_to_challenge_sig: commitment_to_challenge_sig.hex,
        }
    }
    $('.adder_8bit_step_five_done').onclick = async () => {
        $('.adder_8bit_step_five').classList.add("hidden");
        $('.adder_8bit_step_six').classList.remove("hidden");
    }
    $('.adder_8bit_step_six_done').onclick = async () => {
        var prev_carry = Number($('.adder_8bit_prev_carry').value);
        var num1 = Number($('.adder_8bit_num_1').value);
        var binary = num1.toString(2).padStart(8, "0");
        bin_array_1 = binary.split("")
        bin_array_1.forEach((item, index) => bin_array_1[index] = Number(item));
        var num2 = Number($('.adder_8bit_num_2').value);
        var binary = num2.toString(2).padStart(8, "0");
        bin_array_2 = binary.split("")
        bin_array_2.forEach((item, index) => bin_array_2[index] = Number(item));
        console.log("num1:", bin_array_1.join(""), "num2:", bin_array_2.join(""));
        initial_commitment_preimages.forEach((preimage_pair, index) => {
            if (index == 0) {
                circuit.wires[index].setting = prev_carry;
                preimages_to_reveal.push(preimage_pair[prev_carry]);
            } else if (index < 8 + 1) {
                circuit.wires[index].setting = bin_array_1[index - 1];
                preimages_to_reveal.push(preimage_pair[bin_array_1[index - 1]]);
            } else {
                circuit.wires[index].setting = bin_array_2[index - (8 + 1)];
                preimages_to_reveal.push(preimage_pair[bin_array_2[index - (8 + 1)]]);
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
        $('.adder_8bit_step_six').innerHTML = `<p>After 10 blocks (so in block <span class="current_blockheight">${blockheight + 11}</span>) <a href="https://mutinynet.com/tx/push" target="_blank">go here</a> and broadcast this tx to collect your money if you sent the right data to Vicky (otherwise, expect Vicky to take your money):</p><p>${earnings_txhex}</p><p>While you wait, you can view the current blockheight here: <a href="https://mutinynet.com" target="_blank">https://mutinynet.com</a> (mutinynet is a bitcoin testnet where blocks arrive about every 30 seconds).</p>`;
    }
    $('.adder_8bit_program .vickys_key').value = "";
    $('.adder_8bit_program .sum_num_8bit').value = "";
    $('.adder_8bit_program .final_carry').value = "";
    $('.adder_8bit_program .adder_8bit_prev_carry').value = "";
    $('.adder_8bit_program .adder_8bit_num_1').value = "";
    $('.adder_8bit_program .adder_8bit_num_2').value = "";
}
