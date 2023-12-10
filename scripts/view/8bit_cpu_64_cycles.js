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
        //inputs 0-34 are 0s, #35 (indexed from 0) is where the first bit of ram begins and where the program starts
        //and it's all ram til the end (bit #162 indexed from 0), so the program can take up to that much space --
        //though when I create inputs to these Assembly programs I usually put them in bytes 14 and 15 so I suppose
        //those bytes won't usually be revealed at this stage
        var starting_bits = "0".repeat( 35 ).split( "" );
        //note that there are 35 0s above because there are 35 bits in bits 0 to 34
        //I'm not currently doing anything with that info but maybe later I'll want
        //the prover to prove that the initial state of the vm is that it starts
        //from boot (not sure why he should have to do that though -- who cares if
        //he initiates the vm in state 5? Vicky will pass the same input bits as he
        //does regardless, so it should still operate correctly and give her the
        //agreed upon result -- oh but wait, if he starts it at step 1 of HLT with
        //the agreed upon result already in memory, the program will halt with the
        //right result in memory but the inputs to the program won't actually
        //compute that result -- so I need to ensure the computer starts at boot
        //so that's a TODO: ensure the computer starts at boot
        var program_binary = prompt( `Please enter your program binary. They look like this: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]` );
        var is_valid_json = isValidJson( program_binary );
        if ( !is_valid_json ) return alert( `You entered an invalid binary, please try again and ensure it has 163 bits in this format: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]` );
        program_binary = JSON.parse( program_binary );
        if ( program_binary.length != 163 ) return alert( `You entered a binary with the wrong number of bits, please try again and ensure it has 163 bits` );
        var assembly_bits_prep = program_binary.splice( 35 );
        var bytes_to_chop_off = prompt( `Enter any bytes of ram you want to keep hidden in this format: [13, 14, 15]\n\nFor context, there are 16 bytes of ram, labeled 0, 1, 2, 3, etc. up to 15. Your Assembly code can have up to 16 commands, where each one goes into one of these bytes of ram, and your code can also initialize a byte of ram to a number. Currently, this site is prepared to send the contents of *every byte of ram* to your counterparty, thus revealing your entire program to them, including any parts (such as numeric inputs) which you may want to keep hidden so you can get some money from Vicky by revealing them to her later as inputs that make the program produce some result. Therefore, if there are any bytes of ram you want to keep hidden, enter them in this format: [13, 14, 15]` );
        if ( bytes_to_chop_off[ 0 ] != "[" ) return alert( `You entered your bytes to keep hidden in an invalid format, please try again and ensure you use this format: [13, 14, 15]` );
        var is_valid_json = isValidJson( bytes_to_chop_off );
        if ( !is_valid_json ) return alert( `You entered your bytes to keep hidden in an invalid format, please try again and ensure you use this format: [13, 14, 15]` );
        bytes_to_chop_off = JSON.parse( bytes_to_chop_off );
        var bits_to_chop_off = [];
        bytes_to_chop_off.forEach( item => {var i; for ( i=0; i<8; i++ ) bits_to_chop_off.push( item * 8 + i );});
        var assembly_bits = {}
        assembly_bits_prep.forEach( ( item, index ) => {if ( !bits_to_chop_off.includes( index ) ) assembly_bits[ String( index ) ] = item;});
        var assembly_bits_to_send_vicky = [];
        Object.keys( assembly_bits ).forEach( item => assembly_bits_to_send_vicky.push( Number( item ) ) );
        console.log( "assembly_bits:", assembly_bits );
        var remaining_ram_bits = "0".repeat( 120 ).split( "" );
        var assembly_preimages = [];
        Object.keys( assembly_bits ).forEach( ( item ) => assembly_preimages.push( initial_commitment_preimages[ 35 + Number( item ) ][ assembly_bits[ item ] ] ));
        var output_bytes_to_reveal = prompt( `State which bytes you want to end up showing Vicky as output after your program runs. Keep in mind that you may only reveal one or more bytes of ram. Use this format: [5, 14, 15]` );
        console.log( output_bytes_to_reveal[ 0 ], output_bytes_to_reveal );
        if ( output_bytes_to_reveal[ 0 ] != "[" ) return alert( `You entered those bytes in an invalid format, please try again and ensure you use this format: [5, 14, 15]` );
        var is_valid_json = isValidJson( output_bytes_to_reveal );
        if ( !is_valid_json ) return alert( `You entered those bytes in an invalid format, please try again and ensure you use this format: [5, 14, 15]` );
        output_bytes_to_reveal = JSON.parse( output_bytes_to_reveal );
        var all_nums = true;
        output_bytes_to_reveal.forEach( item => {if ( isNaN( item ) || Number( item ) < 0 || Number( item ) > 15 ) all_nums = false;} );
        if ( !all_nums ) return alert( `You entered some invalid ram registers, only use the numbers 0 through 15. Try again` );
        var better_output_bytes = [];
        output_bytes_to_reveal.forEach( item => better_output_bytes.push( Number( item ) ) );
        output_bytes_to_reveal = better_output_bytes;
        var preimage_positions = [];
        output_bytes_to_reveal.forEach( item => {var i; for ( i=0; i<8; i++ ) preimage_positions.push( item * 8 + i );});
        console.log( "preimage positions:", preimage_positions );
        var incremented = [];
        preimage_positions.forEach( item => incremented.push( item + 35 ) );
        preimage_positions = incremented;
        console.log( "incremented preimage positions:", preimage_positions );
        // var intended_output_preimages = [0,0,0,1,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
        var intended_output_preimages_prep = prompt( `Enter the contents of the ram bytes you want to commit to as output after your program runs (that is, these bytes: ${output_bytes_to_reveal}). Use this format to commit, for example, to computing the following contents for bytes 0 and 1: {0: [1,1,1,1,0,0,0,0], 1: [0,0,0,0,0,0,0,0]}` );
        var intended_output_preimages = [];
        var i; for ( i=0; i<35; i++ ) intended_output_preimages.push( 0 );
        var nums = [];
        // var json = {0: [1,1,1,1,0,0,0,0], 1: [0,0,0,0,0,0,0,0]}
        var json = JSON.parse( intended_output_preimages_prep );
        Object.keys( json ).forEach( item => nums.push( Number( item ) ) );
        nums.sort();
        nums.forEach( item => intended_output_preimages.push( ...json[ String( item ) ] ) );
        var i; for ( i=0; i<128; i++ ) {if ( intended_output_preimages.length < 163 ) intended_output_preimages.push( 0 );}
        promise = intended_output_preimages_prep;
        var revealed_output_preimages = [];
        preimage_positions.forEach( ( item, index ) => {console.log( subsequent_commitment_preimages[subsequent_commitment_preimages.length - ( 163 - item )], item, intended_output_preimages[ item ], subsequent_commitment_preimages[subsequent_commitment_preimages.length - ( 163 - item )][ intended_output_preimages[ item ] ] );revealed_output_preimages.push( subsequent_commitment_preimages[subsequent_commitment_preimages.length - ( 163 - item )][ intended_output_preimages[ item ] ] );} );
        var message_to_vicky = {
            program: "8bit cpu with 64 cyles",
            preimage_positions,
            promise,
            pauls_key: pubkey,
            initial_commitment_hashes,
            subsequent_commitment_hashes,
            output_preimages: revealed_output_preimages,
            assembly: assembly_preimages,
            assembly_bits_included: assembly_bits_to_send_vicky,
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
        if ( !$('.cpu_8bit_64_cycles_bitcoin_address').value ) return alert( `You forgot to add a bitcoin address, try again` );
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
