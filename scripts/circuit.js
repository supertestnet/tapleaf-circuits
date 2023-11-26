circuit = {
    init: function () {
        this.gates = [];
        this.wires = [];
        this.input_sizes = [];
        this.output_sizes = [];
    },
    setWiresPreimagesAndHashes: async function () {
        var isVerifier = initial_commitment_hashes.length > 0 && subsequent_commitment_hashes.length > 0;

        var map_wire_to_commitment_index = [];
        if (isVerifier) {
            this.gates.forEach((gate) => {
                gate.output_wires.forEach((wire_number) => map_wire_to_commitment_index.push(wire_number));
            });
        }

        var sum_of_all_input_sizes = this.input_sizes.reduce((ac, c) => ac + c, 0);
        for (const gate of this.gates) {
            var setPreimagesAndHashes = async (wire_number) => {
                if (!this.wires[wire_number].settings_preimages.length) {
                    var preimage_0 = getRand(32);
                    var preimage_1 = getRand(32);
                    this.wires[wire_number].settings_preimages = [preimage_0, preimage_1];
                } else {
                    var preimage_0 = this.wires[wire_number].settings_preimages[0];
                    var preimage_1 = this.wires[wire_number].settings_preimages[1];
                }

                if (!this.wires[wire_number].settings_hashes.length) {
                    if (!isVerifier) {
                        var hash_0 = await sha256(hexToBytes(preimage_0));
                        var hash_1 = await sha256(hexToBytes(preimage_1));
                    } else {
                        var hash_0 = wire_number < sum_of_all_input_sizes ? initial_commitment_hashes[wire_number][0] : subsequent_commitment_hashes[map_wire_to_commitment_index.indexOf(wire_number)][0];
                        var hash_1 = wire_number < sum_of_all_input_sizes ? initial_commitment_hashes[wire_number][1] : subsequent_commitment_hashes[map_wire_to_commitment_index.indexOf(wire_number)][1];
                    }
                    this.wires[wire_number].settings_hashes = [hash_0, hash_1];
                }
            };

            for (const w of gate.input_wires)
                await setPreimagesAndHashes(w);

            for (const w of gate.output_wires)
                await setPreimagesAndHashes(w);
        }
    },
    runAndGetInputAndOutputs: async function () {
        var wire_number; for (wire_number = 0; wire_number < initial_commitment_hashes.length; wire_number++) {
            for (const preimage of preimages_from_paul) {
                var hash = await sha256(hexToBytes(preimage));
                if (hash == initial_commitment_hashes[wire_number][0]) {
                    this.wires[wire_number].setting = 0;
                    break;
                }
                else if (hash == initial_commitment_hashes[wire_number][1]) {
                    this.wires[wire_number].setting = 1;
                    break;
                }
            }
        }

        this.gates.forEach((gate) => {
            eval(gate.eval_string());
        })

        var inputs = [];
        var outputs = [];
        var output_value = ``;

        var i; for (i = 0; i < this.input_sizes.length; i++) {
            var input_value = ``;
            var input_start_wire = 0;
            var j; for (j = 0; j < i; j++) {
                input_start_wire += this.input_sizes[j];
            }
            var k; for (k = 0; k < this.input_sizes[i]; k++) {
                input_value += String(this.wires[input_start_wire + k].setting);
            }
            inputs.push(input_value);
        }

        var i; for (i = 0; i < this.output_sizes.length; i++) {
            var output_value = ``;
            var output_start_wire = this.wires.length;
            var j; for (j = this.output_sizes.length - 1; j >= i; j--) {
                output_start_wire -= this.output_sizes[j];
            }
            var k; for (k = 0; k < this.output_sizes[i]; k++) {
                output_value += String(this.wires[output_start_wire + k].setting);
            }
            outputs.push(output_value);
        }

        return { inputs, outputs };
    }
};