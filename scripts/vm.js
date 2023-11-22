var generateBitCommitments = async () => {
    var sum_of_all_input_sizes = circuit.input_sizes.reduce((ac, c) => ac + c, 0);
    var i; for (i = 0; i < sum_of_all_input_sizes; i++) {
        initial_commitment_preimages.push(circuit.wires[i].settings_preimages);
        initial_commitment_hashes.push(circuit.wires[i].settings_hashes);
    }

    circuit.gates.forEach((gate) => {
        gate.output_wires.forEach((wire_number) => {
            subsequent_commitment_preimages.push(circuit.wires[wire_number].settings_preimages);
            subsequent_commitment_hashes.push(circuit.wires[wire_number].settings_hashes);
        });
    });
}

var generateBitCommitmentAddress = (proverPubkey, verifierPubkey) => {
    var leaf1 = [
        "OP_10",
        "OP_CHECKSEQUENCEVERIFY",
        "OP_DROP",
        verifierPubkey,
        "OP_CHECKSIG"
    ];

    var leaf2 = [
        "OP_0",
        proverPubkey,
        "OP_CHECKSIGADD",
        verifierPubkey,
        "OP_CHECKSIGADD",
        "OP_2",
        "OP_EQUAL"
    ];

    var bit_commitment_template = `
        OP_SHA256
        INSERT_HASH_ZERO_HERE
        OP_EQUAL
        OP_SWAP
        OP_SHA256
        INSERT_HASH_ONE_HERE
        OP_EQUAL
        OP_BOOLOR
        OP_VERIFY
    `;

    var bit_commitment_script = ``;

    initial_commitment_hashes.forEach(hash_pair => {
        bit_commitment_script += bit_commitment_template.replace("INSERT_HASH_ZERO_HERE", hash_pair[0]).replace("INSERT_HASH_ONE_HERE", hash_pair[1]);
    });

    subsequent_commitment_hashes.forEach(hash_pair => {
        bit_commitment_script += bit_commitment_template.replace("INSERT_HASH_ZERO_HERE", hash_pair[0]).replace("INSERT_HASH_ONE_HERE", hash_pair[1]);
    });

    bit_commitment_script += `
       ${proverPubkey}
       OP_CHECKSIG
    `;

    // bit_commitment_script += `
    // OP_1
    // `;

    var bit_commitment_script_array = bit_commitment_script.replaceAll("\n\n", "\n").replaceAll(" ", "").split("\n");
    bit_commitment_script_array.splice(0, 1);
    bit_commitment_script_array.splice(bit_commitment_script_array.length - 1, 1);

    var leaf3 = bit_commitment_script_array;

    var scripts = [leaf1, leaf2, leaf3];
    var tree = scripts.map(s => tapscript.Tap.encodeScript(s));
    var selected_script = scripts[2];
    bit_commitment_script = selected_script;
    commitment_to_anywhere_else_script = scripts[1];
    bit_commitment_tapleaf = tapscript.Tap.encodeScript(bit_commitment_script);
    commitment_to_anywhere_else_tapleaf = tapscript.Tap.encodeScript(commitment_to_anywhere_else_script);
    var target = tapscript.Tap.encodeScript(selected_script);
    var pubkey = "ab".repeat(32);
    var [tpubkey, cblock] = tapscript.Tap.getPubKey(pubkey, { tree, target });
    bit_commitment_tpubkey = tpubkey;
    bit_commitment_cblock = cblock;
    var [tpubkey, alt_cblock] = tapscript.Tap.getPubKey(pubkey, { tree, commitment_to_anywhere_else_tapleaf });
    commitment_to_anywhere_else_cblock = alt_cblock;
    var bit_commitment_address = tapscript.Address.p2tr.fromPubKey(tpubkey, network);
    return bit_commitment_address;
}

var generateAntiContradictionAddress = (proverPubkey, verifierPubkey) => {
    var anti_contradiction_template = `
        OP_SHA256
        INSERT_HASH_ZERO_HERE
        OP_EQUALVERIFY
        OP_SHA256
        INSERT_HASH_ONE_HERE
        OP_EQUALVERIFY
        ${verifierPubkey}
        OP_CHECKSIG
    `;

    var anti_contradiction_scripts = [];

    initial_commitment_hashes.forEach(hash_pair => {
        var filled_in = anti_contradiction_template.replace("INSERT_HASH_ZERO_HERE", hash_pair[0]).replace("INSERT_HASH_ONE_HERE", hash_pair[1]);
        var leaf = filled_in.replaceAll("\n\n", "\n").replaceAll(" ", "").split("\n");
        leaf.splice(0, 1);
        leaf.splice(leaf.length - 1, 1);
        anti_contradiction_scripts.push(tapscript.Tap.encodeScript(leaf));
    });

    subsequent_commitment_hashes.forEach(hash_pair => {
        var filled_in = anti_contradiction_template.replace("INSERT_HASH_ZERO_HERE", hash_pair[0]).replace("INSERT_HASH_ONE_HERE", hash_pair[1]);
        var leaf = filled_in.replaceAll("\n\n", "\n").replaceAll(" ", "").split("\n");
        leaf.splice(0, 1);
        leaf.splice(leaf.length - 1, 1);
        anti_contradiction_scripts.push(tapscript.Tap.encodeScript(leaf));
    });

    var last_leaf = [
        "OP_10",
        "OP_CHECKSEQUENCEVERIFY",
        "OP_DROP",
        proverPubkey,
        "OP_CHECKSIG"
    ];

    anti_contradiction_scripts.push(tapscript.Tap.encodeScript(last_leaf));

    var target = anti_contradiction_scripts[0];
    var pubkey = "ab".repeat(32);
    var [tpubkey, cblock] = tapscript.Tap.getPubKey(pubkey, { anti_contradiction_scripts, target });
    anti_contradiction_tpubkey = tpubkey;
    anti_contradiction_cblock = cblock;
    var anti_contradiction_address = tapscript.Address.p2tr.fromPubKey(tpubkey, network);
    return anti_contradiction_address;
}

var makeTapleafGateFromCircuitGate = (gate, verifierPubkey) => {
    var script_template_1_input_1_output_gate = `
        OP_TOALTSTACK
        OP_SHA256
        #INSERT_INPUT_1_HASH_HERE#
        OP_EQUALVERIFY
        OP_#INSERT_INPUT_1_VALUE_HERE#
        #INSERT_OPERATION_HERE#
        OP_FROMALTSTACK
        OP_SHA256
        #INSERT_OUTPUT_1_HASH_HERE#
        OP_EQUALVERIFY
        OP_#INSERT_OUTPUT_1_VALUE_HERE#
        OP_NUMNOTEQUAL
        OP_VERIFY
        #INSERT_PUBLICKEY_HERE#
        OP_CHECKSIG
    `;

    var script_template_2_input_1_output_gate = `
        OP_TOALTSTACK
        OP_SHA256
        #INSERT_INPUT_1_HASH_HERE#
        OP_EQUALVERIFY
        OP_#INSERT_INPUT_1_VALUE_HERE#
        OP_SWAP
        OP_SHA256
        #INSERT_INPUT_2_HASH_HERE#
        OP_EQUALVERIFY
        OP_#INSERT_INPUT_2_VALUE_HERE#
        #INSERT_OPERATION_HERE#
        OP_FROMALTSTACK
        OP_SHA256
        #INSERT_OUTPUT_1_HASH_HERE#
        OP_EQUALVERIFY
        OP_#INSERT_OUTPUT_1_VALUE_HERE#
        OP_NUMNOTEQUAL
        OP_VERIFY
        #INSERT_PUBLICKEY_HERE#
        OP_CHECKSIG
    `;

    return {
        gate: gate,
        inputs: [],
        outputs: [],
        addInput: function (value, hash) {
            this.inputs.push({
                value: value,
                hash: hash,
                preimage: "",
            });
        },
        addOutput: function (value, hash) {
            this.outputs.push({
                value: value,
                hash: hash,
                preimage: "",
            });
        },
        tryAddingPreimage: async function (potential_preimage, potential_hash) {
            var i; for (i = 0; i < this.inputs.length; i++) {
                if (this.inputs[i].hash == potential_hash) {
                    this.inputs[i].preimage = potential_preimage;
                }
            }

            var i; for (i = 0; i < this.outputs.length; i++) {
                if (this.outputs[i].hash == potential_hash) {
                    this.outputs[i].preimage = potential_preimage;
                }
            }
        },
        isSpendable: function (checkPreimages = true) {
            if (checkPreimages) {
                var wires = [...this.inputs, ...this.outputs];
                var i; for (i = 0; i < wires.length; i++) {
                    if (wires[i].preimage.length == 0) return false;
                };
            }
            var evaluation = -1;
            eval_string = `evaluation = ${this.gate.name}( `;
            this.inputs.forEach((wire, index) => {
                eval_string += `${wire.value}`;
                if (index != this.inputs.length - 1) eval_string += ", ";
            });
            eval_string += " )";
            eval(eval_string);
            // TODO: adjust this for multiple outputs
            return (evaluation != this.outputs[0].value);
        },
        script: function () {
            if (gate.input_wires.length == 1 && gate.output_wires.length == 1) {
                var script_template = script_template_1_input_1_output_gate;
            } else if (gate.input_wires.length == 2 && gate.output_wires.length == 1) {
                var script_template = script_template_2_input_1_output_gate;
            }

            script_template = script_template.replace("#INSERT_PUBLICKEY_HERE#", verifierPubkey);
            script_template = script_template.replace("#INSERT_OPERATION_HERE#", this.gate.operation());

            this.inputs.forEach((input, index) => {
                script_template = script_template.replace(`#INSERT_INPUT_${index + 1}_VALUE_HERE#`, input.value);
                script_template = script_template.replace(`#INSERT_INPUT_${index + 1}_HASH_HERE#`, input.hash);
            });

            this.outputs.forEach((output, index) => {
                script_template = script_template.replace(`#INSERT_OUTPUT_${index + 1}_VALUE_HERE#`, output.value);
                script_template = script_template.replace(`#INSERT_OUTPUT_${index + 1}_HASH_HERE#`, output.hash);
            });

            script_array = script_template.replaceAll("\n\n", "\n").replaceAll(" ", "").split("\n");
            script_array.splice(0, 1);
            script_array.splice(script_array.length - 1, 1);

            return script_array;
        }
    };
}

var generateChallengeAddress = (proverPubkey, verifierPubkey) => {
    tapleaf_gates = [];
    challenge_scripts = [];

    circuit.gates.forEach((gate) => {

        var generateAllPossibleSettings = function (array, length, settings = []) {
            if (length == 0) {
                return array.push(settings);
            }
            generateAllPossibleSettings(array, length - 1, settings.concat(0));
            generateAllPossibleSettings(array, length - 1, settings.concat(1));
        }

        allPossibleInputSettings = [];
        generateAllPossibleSettings(allPossibleInputSettings, gate.input_wires.length);

        allPossibleOutputSettings = [];
        generateAllPossibleSettings(allPossibleOutputSettings, gate.output_wires.length);

        allPossibleInputSettings.forEach((possible_inputs) => {
            allPossibleOutputSettings.forEach((possible_outputs) => {

                var tapleafGate = makeTapleafGateFromCircuitGate(gate, verifierPubkey);

                gate.input_wires.forEach((wire_number, index) => {
                    var possible_setting = possible_inputs[index];
                    var hash_pair = circuit.wires[wire_number].settings_hashes;
                    tapleafGate.addInput(possible_setting, hash_pair[possible_setting]);
                });

                gate.output_wires.forEach((wire_number, index) => {
                    var possible_setting = possible_outputs[index];
                    var hash_pair = circuit.wires[wire_number].settings_hashes;
                    tapleafGate.addOutput(possible_setting, hash_pair[possible_setting]);
                });

                if (tapleafGate.isSpendable(false)) {
                    tapleaf_gates.push(tapleafGate);
                    challenge_scripts.push(tapscript.Tap.encodeScript(tapleafGate.script()));
                }
            });
        });
    });

    var last_leaf = [
        "OP_10",
        "OP_CHECKSEQUENCEVERIFY",
        "OP_DROP",
        proverPubkey,
        "OP_CHECKSIG"
    ];

    challenge_scripts.push(tapscript.Tap.encodeScript(last_leaf));

    var target = challenge_scripts[challenge_scripts.length - 1];
    var pubkey = "ab".repeat(32);
    var [tpubkey, cblock] = tapscript.Tap.getPubKey(pubkey, { challenge_scripts, target });
    challenge_tpubkey = tpubkey;
    challenge_cblock = cblock;
    var challenge_address = tapscript.Address.p2tr.fromPubKey(tpubkey, network);
    return challenge_address;
}

var generateFundingAddress = (proverPubkey, verifierPubkey) => {
    funding_scripts = [];

    var first_leaf = [
        "OP_10",
        "OP_CHECKSEQUENCEVERIFY",
        "OP_DROP",
        proverPubkey,
        "OP_CHECKSIG"
    ];

    funding_scripts.push(first_leaf);

    var second_leaf = [
        "OP_0",
        proverPubkey,
        "OP_CHECKSIGADD",
        verifierPubkey,
        "OP_CHECKSIGADD",
        "OP_2",
        "OP_EQUAL"
    ];

    funding_scripts.push(second_leaf);

    var tree = funding_scripts.map(s => tapscript.Tap.encodeScript(s));
    var selected_script = funding_scripts[0];
    funding_to_anywhere_else_script = funding_scripts[1];
    funding_to_paul_script = selected_script;
    funding_script = selected_script;
    funding_to_paul_tapleaf = tapscript.Tap.encodeScript(funding_to_paul_script);
    funding_to_anywhere_else_tapleaf = tapscript.Tap.encodeScript(funding_to_anywhere_else_script);
    var target = tapscript.Tap.encodeScript(selected_script);
    var pubkey = "ab".repeat(32);
    var [tpubkey, cblock] = tapscript.Tap.getPubKey(pubkey, { tree, target });
    funding_to_paul_tpubkey = tpubkey;
    funding_to_paul_cblock = cblock;
    funding_tpubkey = tpubkey;
    funding_cblock = cblock;
    var [tpubkey, alt_cblock] = tapscript.Tap.getPubKey(pubkey, { tree, funding_to_anywhere_else_tapleaf });
    funding_to_anywhere_else_cblock = alt_cblock;
    var funding_address = tapscript.Address.p2tr.fromPubKey(tpubkey, network);
    return funding_address;
}