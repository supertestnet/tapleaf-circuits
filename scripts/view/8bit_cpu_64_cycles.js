programs["8bit cpu with 64 cyles"] = {
    initialize: () => {
        circuit.parseBristolString(circuit_bristol_8bit_cpu_64_cycles);
    },
    promise_prompt: (outputs, promise) => {
        var prompt = ``;

        prompt += `They promise to send you a result which halt the computer on step 1. `;
        prompt += `They'll put up a bond to show they mean it, `;
        prompt += `and if they break their promise, you can prove they lied and take their money.`;

        return prompt;
    },
    promise_kept_prompt: (inputs, outputs, promise) => {
        var prompt = ``;
        prompt += `The prover kept his promise. He promised ${promise.toLowerCase()}. `;
        prompt += `This is what he sent you:\n\n${inputs[0]}\n\n`;
        prompt += `Bitvm checked whether those inputs cause the computer to halt on its first step and this was its result: true`
        prompt += ` -- so it determined the string did cause the computer to halt on its first step. `;
        prompt += `Meaning not only do *you* know the prover kept his promise, your bitcoin transaction knows it too. `;
        prompt += `This completes the procedure; refresh your page to try again.`

        return prompt;
    }
};

if ($('.cpu_8bit_64_cycles_program')) {
    $('.choose_cpu_8bit_64_cycles').onclick = async () => {
        $('.cpu_8bit_64_cycles_program').classList.remove("hidden");
        $('.home').classList.add("hidden");
        programs["8bit cpu with 64 cyles"].initialize();
        await circuit.setWiresPreimagesAndHashes();
        generateBitCommitments();
    }
    $('.cpu_8bit_64_cycles_step_one_done').onclick = () => {
        $('.cpu_8bit_64_cycles_step_one').classList.add("hidden");
        $('.cpu_8bit_64_cycles_step_two').classList.remove("hidden");
        vickys_key = $('.cpu_8bit_64_cycles_program .vickys_key').value;
    }
    $('.submit_cpu_promise').onclick = () => {
        promise = $('.cpu_promise').value;
        var output_preimages = [subsequent_commitment_preimages[subsequent_commitment_preimages.length - 163][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 162][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 161][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 160][1], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 159][1], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 158][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 157][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 156][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 155][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 154][1], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 153][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 152][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 151][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 150][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 149][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 148][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 147][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 146][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 145][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 144][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 143][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 142][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 141][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 140][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 139][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 138][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 137][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 136][1], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 135][1], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 134][1], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 133][1], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 132][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 131][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 130][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 129][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 128][1], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 127][1], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 126][1], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 125][1], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 124][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 123][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 122][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 121][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 120][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 119][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 118][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 117][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 116][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 115][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 114][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 113][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 112][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 111][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 110][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 109][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 108][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 107][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 106][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 105][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 104][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 103][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 102][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 101][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 100][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 99][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 98][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 97][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 96][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 95][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 94][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 93][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 92][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 91][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 90][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 89][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 88][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 87][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 86][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 85][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 84][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 83][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 82][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 81][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 80][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 79][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 78][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 77][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 76][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 75][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 74][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 73][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 72][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 71][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 70][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 69][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 68][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 67][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 66][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 65][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 64][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 63][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 62][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 61][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 60][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 59][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 58][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 57][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 56][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 55][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 54][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 53][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 52][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 51][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 50][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 49][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 48][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 47][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 46][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 45][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 44][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 43][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 42][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 41][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 40][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 39][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 38][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 37][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 36][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 35][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 34][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 33][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 32][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 31][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 30][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 29][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 28][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 27][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 26][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 25][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 24][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 23][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 22][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 21][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 20][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 19][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 18][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 17][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 16][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 15][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 14][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 13][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 12][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 11][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 10][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 9][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 8][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 7][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 6][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 5][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 4][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 3][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 2][0], subsequent_commitment_preimages[subsequent_commitment_preimages.length - 1][0]];
        var message_to_vicky = {
            program: "8bit cpu with 64 cyles",
            promise,
            pauls_key: pubkey,
            initial_commitment_hashes,
            subsequent_commitment_hashes,
            output_preimages
        }
        saveDataToFile(JSON.stringify(message_to_vicky), "promise_file.txt");
    }
    $('.cpu_8bit_64_cycles_step_two_done').onclick = () => {
        $('.cpu_8bit_64_cycles_step_one').classList.add("hidden");
        $('.cpu_8bit_64_cycles_step_two').classList.add("hidden");
        $('.cpu_8bit_64_cycles_step_three').classList.remove("hidden");
        promise = $('.cpu_promise').value;
        $('.cpu_8bit_64_cycles_program .step_six_promise_to_vicky').innerText = promise.toLowerCase();
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
        $('.cpu_8bit_64_cycles_program .address_validation').innerHTML = html;
    }
    $('.cpu_8bit_64_cycles_step_three_reset').onclick = () => {
        alert(`Something must have gone wrong so it is not safe to continue. The page will reset.`);
        window.location.reload();
    }
    $('.cpu_8bit_64_cycles_step_three_done').onclick = async () => {
        $('.cpu_8bit_64_cycles_step_one').classList.add("hidden");
        $('.cpu_8bit_64_cycles_step_two').classList.add("hidden");
        $('.cpu_8bit_64_cycles_step_three').classList.add("hidden");
        $('.cpu_8bit_64_cycles_step_four').classList.remove("hidden");
        $('.cpu_8bit_64_cycles_program .funding_address_in_step_four').innerText = starter_address;
        console.log("starter address:", starter_address);
        $('.cpu_8bit_64_cycles_program .asking_for_txid').innerHTML = `If you are looking for testnet coins, try this faucet: <a href="https://faucet.mutinynet.com/" target="_blank">https://faucet.mutinynet.com</a>`;
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
        $('.cpu_8bit_64_cycles_step_four').classList.add("hidden");
        $('.cpu_8bit_64_cycles_step_five').classList.remove("hidden");
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
        var destino = $('.cpu_8bit_64_cycles_bitcoin_address').value;
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
        $('.cpu_8bit_64_cycles_program .starter_txhex').innerText = starter_txhex;
        setTimeout(() => { pushBTCpmt(starter_txhex, ""); }, 2000);
        $('.cpu_8bit_64_cycles_step_five_done').click();
        presigned_tx_sigs = {
            funding_to_bit_commitment_sig: funding_to_bit_commitment_sig.hex,
            funding_to_anti_contradiction_sig: funding_to_anti_contradiction_sig.hex,
            funding_to_challenge_sig: funding_to_challenge_sig.hex,
            commitment_to_anti_contradiction_sig: commitment_to_anti_contradiction_sig.hex,
            commitment_to_challenge_sig: commitment_to_challenge_sig.hex,
        }
    }
    $('.cpu_8bit_64_cycles_step_five_done').onclick = async () => {
        $('.cpu_8bit_64_cycles_step_five').classList.add("hidden");
        $('.cpu_8bit_64_cycles_step_six').classList.remove("hidden");
    }
    $('.cpu_8bit_64_cycles_step_six_done').onclick = async () => {
        try {
            var input_prep = $( '.cpu_8bit_64_cycles_paste_program' ).value;
            if ( input_prep.length == 127 ) input_prep = input_prep.padStart( 163, "0" );
            if ( input_prep.length == 163 ) input_prep = JSON.stringify( input_prep.split( "" ) );
            var input = JSON.parse( input_prep );
            if ( typeof input[ 0 ] == "string" ) {
                var new_input = [];
                input.forEach( item => new_input.push( Number( item ) ) );
                input = new_input;
            }
        } catch ( e ) {
            var example_prep = "01001110001011110111010001100000001111110100111001110000011001000000000000000000000000000000000000000000000000000000000000110010".padStart( 163, "0" ).split( "" );
            var example = [];
            example_prep.forEach( item => example.push( Number( item ) ) );
            return alert( `Error, your binary was invalid! Ensure it looks similar to this, with exactly 163 elements:\n\n${JSON.stringify( example )}` );
        }
        var stringarr = input;
        initial_commitment_preimages.forEach((preimage_pair, index) => {
            circuit.wires[index].setting = stringarr[index];
            preimages_to_reveal.push(preimage_pair[stringarr[index]]);
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
        $('.cpu_8bit_64_cycles_step_six').innerHTML = `<p>After 10 blocks (so in block <span class="current_blockheight">${blockheight + 11}</span>) <a href="https://mutinynet.com/tx/push" target="_blank">go here</a> and broadcast this tx to collect your money if you sent the right data to Vicky (otherwise, expect Vicky to take your money):</p><p>${earnings_txhex}</p><p>While you wait, you can view the current blockheight here: <a href="https://mutinynet.com" target="_blank">https://mutinynet.com</a> (mutinynet is a bitcoin testnet where blocks arrive about every 30 seconds).</p>`;
    }
    $('.cpu_8bit_64_cycles_program .vickys_key').value = "";
    $('.cpu_8bit_64_cycles_paste_program').value = "";
}
