function removeDuplicates(arr) {
    var copy = JSON.parse(JSON.stringify(arr));
    return copy.filter((item, index) => copy.indexOf(item) === index);
}

var compareTapleaves = async (preimage, challenge_scripts) => {
    var scripts_this_preimage_is_referenced_in = [];
    var hash = await sha256(hexToBytes(preimage));
    challenge_scripts.forEach((script, index) => {
        script.forEach(element => {
            if (element == hash) scripts_this_preimage_is_referenced_in.push(index);
        });
    });
    return scripts_this_preimage_is_referenced_in;
}

var discardUnusedPreimages = async () => {
    var i; for (i = 0; i < preimages_from_paul.length; i++) {
        var preimage = preimages_from_paul[i];
        var tapleaves_it_is_in = await compareTapleaves(preimage, challenge_scripts);
        if (tapleaves_it_is_in.length) continue;
        preimages_from_paul.splice(i, 1);
        i = i - 1;
    }
}

var OP_NOT = async (input_preimage, expected_input_hash, input_value, output_preimage, expected_output_hash, output_value) => {
    var real_input_hash = await sha256(hexToBytes(input_preimage));
    if (real_input_hash != expected_input_hash) return `you cannot spend with this tapleaf`;
    var input_bit = input_value;
    input_bit = Number(!input_bit);
    var real_output_hash = await sha256(hexToBytes(output_preimage));
    if (real_output_hash != expected_output_hash) return `you cannot spend with this tapleaf`;
    var output_bit = output_value;
    if (input_bit != output_bit) return `you can spend with these preimages: ${input_preimage} as the input preimage and ${output_preimage} as the output preimage`;
    return `you cannot spend with this tapleaf`;
}

var OP_BOOLAND = async (first_input_preimage, first_expected_input_hash, first_input_value, second_input_preimage, second_expected_input_hash, second_input_value, output_preimage, expected_output_hash, output_value) => {
    var real_first_input_hash = await sha256(hexToBytes(first_input_preimage));
    if (real_first_input_hash != first_expected_input_hash) return `you cannot spend with this tapleaf`;
    var real_second_input_hash = await sha256(hexToBytes(second_input_preimage));
    if (real_second_input_hash != second_expected_input_hash) return `you cannot spend with this tapleaf`;
    var comparison_bit = Number(first_input_value && second_input_value);
    var real_output_hash = await sha256(hexToBytes(output_preimage));
    if (real_output_hash != expected_output_hash) return `you cannot spend with this tapleaf`;
    var output_bit = output_value;
    if (comparison_bit != output_bit) return `you can spend with these preimages: ${first_input_preimage} as the first input preimage, ${second_input_preimage} as the second, and ${output_preimage} as the output preimage`;
    return `you cannot spend with this tapleaf`;
}

var OP_XOR = async (first_input_preimage, first_expected_input_hash, first_input_value, second_input_preimage, second_expected_input_hash, second_input_value, output_preimage, expected_output_hash, output_value) => {
    var real_first_input_hash = await sha256(hexToBytes(first_input_preimage));
    if (real_first_input_hash != first_expected_input_hash) return `you cannot spend with this tapleaf`;
    var real_second_input_hash = await sha256(hexToBytes(second_input_preimage));
    if (real_second_input_hash != second_expected_input_hash) return `you cannot spend with this tapleaf`;
    var comparison_bit = Number(first_input_value ^ second_input_value);
    var real_output_hash = await sha256(hexToBytes(output_preimage));
    if (real_output_hash != expected_output_hash) return `you cannot spend with this tapleaf`;
    var output_bit = output_value;
    if (comparison_bit != output_bit) return `you can spend with these preimages: ${first_input_preimage} as the first input preimage, ${second_input_preimage} as the second, and ${output_preimage} as the output preimage`;
    return `you cannot spend with this tapleaf`;
}

var makeBristolArray = (arrprep) => {
    arr = arrprep.split(`\n`);
    arr.forEach((entry, index) => {
        arr[index] = arr[index].replace(/ +(?= )/g, "");
        if (entry.startsWith(" ")) arr[index] = arr[index].substring(1);
    });
    if (!arr[0]) arr.splice(0, 1);
    if (!arr[arr.length - 1]) arr.splice(arr.length - 1, 1);
    if (arr[3]) alert("Oops, you entered an invalid bristol circuit! Try again with the whole document, including the first three lines that define the number of gates, number of input bits, and number of output bits.");
    number_of_preimages_to_expect = arr[0].split(" ").filter(item => item)[1];
    number_of_preimages_to_expect = Number(number_of_preimages_to_expect);
    number_of_numbers_being_passed_as_input = arr[1].split(" ").filter(item => item)[0];
    number_of_numbers_being_passed_as_input = Number(number_of_numbers_being_passed_as_input);
    number_of_inputs = arr[1].split(" ").filter(item => item)[1];
    number_of_inputs = Number(number_of_inputs);
    if (arr[1].split(" ").filter(item => item)[2]) number_of_inputs_2 = arr[1].split(" ").filter(item => item)[2];
    if (number_of_inputs_2) number_of_inputs_2 = Number(number_of_inputs_2);
    number_of_outputs = arr[2].split(" ").filter(item => item)[1];
    number_of_outputs = Number(number_of_outputs);
    arr.splice(0, 4);
}

setOperationsArray = async () => {
    var index; for (index = 0; index < arr.length; index++) {
        var gate = arr[index].split(" ").filter(item => item);
        if (gate[gate.length - 1] == "INV") {
            if (!wire_settings[gate[2]]) {
                var input_preimage_0 = getRand(32);
                var input_preimage_1 = getRand(32);
                wire_settings[gate[2]] = [input_preimage_0, input_preimage_1];
            } else {
                var input_preimage_0 = wire_settings[gate[2]][0];
                var input_preimage_1 = wire_settings[gate[2]][1];
            }
            var output_preimage_0 = getRand(32);
            var output_preimage_1 = getRand(32);
            var input_hash_0 = await sha256(hexToBytes(input_preimage_0));
            var input_hash_1 = await sha256(hexToBytes(input_preimage_1));
            if (!wire_hashes[gate[2]]) wire_hashes[gate[2]] = [input_hash_0, input_hash_1];
            var output_hash_0 = await sha256(hexToBytes(output_preimage_0));
            var output_hash_1 = await sha256(hexToBytes(output_preimage_1));
            wire_settings[gate[3]] = [output_preimage_0, output_preimage_1];
            wire_hashes[gate[3]] = [output_hash_0, output_hash_1];
            operations_array.push(["INV", ["input_preimages", input_preimage_0, input_preimage_1], ["output_preimages", output_preimage_0, output_preimage_1], ["input_hashes", input_hash_0, input_hash_1], ["output_hashes", output_hash_0, output_hash_1], `var w_${gate[3]} = INV( wires[ ${gate[2]} ] )`]);
        }
        if (gate[gate.length - 1] == "AND") {
            if (!wire_settings[gate[2]]) {
                var first_input_preimage_0 = getRand(32);
                var first_input_preimage_1 = getRand(32);
                wire_settings[gate[2]] = [first_input_preimage_0, first_input_preimage_1];
            } else {
                var first_input_preimage_0 = wire_settings[gate[2]][0];
                var first_input_preimage_1 = wire_settings[gate[2]][1];
            }
            if (!wire_settings[gate[3]]) {
                var second_input_preimage_0 = getRand(32);
                var second_input_preimage_1 = getRand(32);
                wire_settings[gate[3]] = [second_input_preimage_0, second_input_preimage_1];
            } else {
                var second_input_preimage_0 = wire_settings[gate[3]][0];
                var second_input_preimage_1 = wire_settings[gate[3]][1];
            }
            var output_preimage_0 = getRand(32);
            var output_preimage_1 = getRand(32);
            var first_input_hash_0 = await sha256(hexToBytes(first_input_preimage_0));
            var first_input_hash_1 = await sha256(hexToBytes(first_input_preimage_1));
            if (!wire_hashes[gate[2]]) wire_hashes[gate[2]] = [first_input_hash_0, first_input_hash_1];
            var second_input_hash_0 = await sha256(hexToBytes(second_input_preimage_0));
            var second_input_hash_1 = await sha256(hexToBytes(second_input_preimage_1));
            if (!wire_hashes[gate[3]]) wire_hashes[gate[3]] = [second_input_hash_0, second_input_hash_1];
            var output_hash_0 = await sha256(hexToBytes(output_preimage_0));
            var output_hash_1 = await sha256(hexToBytes(output_preimage_1));
            wire_settings[gate[4]] = [output_preimage_0, output_preimage_1];
            wire_hashes[gate[4]] = [output_hash_0, output_hash_1];
            operations_array.push(["AND", ["first_input_preimages", first_input_preimage_0, first_input_preimage_1], ["second_input_preimages", second_input_preimage_0, second_input_preimage_1], ["output_preimages", output_preimage_0, output_preimage_1], ["first_input_hashes", first_input_hash_0, first_input_hash_1], ["second_input_hashes", second_input_hash_0, second_input_hash_1], ["output_hashes", output_hash_0, output_hash_1], `var w_${gate[4]} = AND( wires[ ${gate[2]} ], wires[ ${gate[3]} ] )`]);
        }
        if (gate[gate.length - 1] == "XOR") {
            if (!wire_settings[gate[2]]) {
                var first_input_preimage_0 = getRand(32);
                var first_input_preimage_1 = getRand(32);
                wire_settings[gate[2]] = [first_input_preimage_0, first_input_preimage_1];
            } else {
                var first_input_preimage_0 = wire_settings[gate[2]][0];
                var first_input_preimage_1 = wire_settings[gate[2]][1];
            }
            if (!wire_settings[gate[3]]) {
                var second_input_preimage_0 = getRand(32);
                var second_input_preimage_1 = getRand(32);
                wire_settings[gate[3]] = [second_input_preimage_0, second_input_preimage_1];
            } else {
                var second_input_preimage_0 = wire_settings[gate[3]][0];
                var second_input_preimage_1 = wire_settings[gate[3]][1];
            }
            var output_preimage_0 = getRand(32);
            var output_preimage_1 = getRand(32);
            var first_input_hash_0 = await sha256(hexToBytes(first_input_preimage_0));
            var first_input_hash_1 = await sha256(hexToBytes(first_input_preimage_1));
            if (!wire_hashes[gate[2]]) wire_hashes[gate[2]] = [first_input_hash_0, first_input_hash_1];
            var second_input_hash_0 = await sha256(hexToBytes(second_input_preimage_0));
            var second_input_hash_1 = await sha256(hexToBytes(second_input_preimage_1));
            if (!wire_hashes[gate[3]]) wire_hashes[gate[3]] = [second_input_hash_0, second_input_hash_1];
            var output_hash_0 = await sha256(hexToBytes(output_preimage_0));
            var output_hash_1 = await sha256(hexToBytes(output_preimage_1));
            wire_settings[gate[4]] = [output_preimage_0, output_preimage_1];
            wire_hashes[gate[4]] = [output_hash_0, output_hash_1];
            operations_array.push(["XOR", ["first_input_preimages", first_input_preimage_0, first_input_preimage_1], ["second_input_preimages", second_input_preimage_0, second_input_preimage_1], ["output_preimages", output_preimage_0, output_preimage_1], ["first_input_hashes", first_input_hash_0, first_input_hash_1], ["second_input_hashes", second_input_hash_0, second_input_hash_1], ["output_hashes", output_hash_0, output_hash_1], `var w_${gate[4]} = XOR( wires[ ${gate[2]} ], wires[ ${gate[3]} ] )`]);
        }
    }
}

setOperationsArrayVerifier = async () => {
    var index; for (index = 0; index < arr.length; index++) {
        var gate = arr[index].split(" ").filter(item => item);
        if (gate[gate.length - 1] == "INV") {
            if (!wire_settings[gate[2]]) {
                var input_preimage_0 = getRand(32);
                var input_preimage_1 = getRand(32);
                wire_settings[gate[2]] = [input_preimage_0, input_preimage_1];
            } else {
                var input_preimage_0 = wire_settings[gate[2]][0];
                var input_preimage_1 = wire_settings[gate[2]][1];
            }
            var output_preimage_0 = copy_of_wire_settings[gate[3]][0];
            var output_preimage_1 = copy_of_wire_settings[gate[3]][1];
            var copy_of_input_hash_0 = await sha256(hexToBytes(copy_of_wire_settings[gate[2]][0]));
            var copy_of_input_hash_1 = await sha256(hexToBytes(copy_of_wire_settings[gate[2]][1]));
            var hash_info = findHashesInCopy(copy_of_input_hash_0, copy_of_input_hash_1);
            var index_of_input_hashes = hash_info[0];
            var array_to_use = hash_info[1] == "sub" ? subsequent_commitment_hashes : initial_commitment_hashes;
            var input_hash_0 = array_to_use[index_of_input_hashes][0];
            var input_hash_1 = array_to_use[index_of_input_hashes][1];
            if (!wire_hashes[gate[2]]) wire_hashes[gate[2]] = [input_hash_0, input_hash_1];
            var hash_info_test = JSON.parse(JSON.stringify(hash_info));
            //Vicky should be able to view the output hashes in her own copies of operations_array and
            //subsequent_commitment_hashes that she creates. Then she can grab the "right" hashes from
            //the corresponding indices of the "real" subsequent_commitment_hashes she gets from Paul
            var copy_of_output_hash_0 = await sha256(hexToBytes(output_preimage_0));
            var copy_of_output_hash_1 = await sha256(hexToBytes(output_preimage_1));
            var hash_info = findHashesInCopy(copy_of_output_hash_0, copy_of_output_hash_1);
            var index_of_output_hashes = hash_info[0];
            var array_to_use = hash_info[1] == "sub" ? subsequent_commitment_hashes : initial_commitment_hashes;
            var real_output_hash_0 = array_to_use[index_of_output_hashes][0];
            var real_output_hash_1 = array_to_use[index_of_output_hashes][1];
            wire_settings[gate[3]] = [output_preimage_0, output_preimage_1];
            wire_hashes[gate[3]] = [real_output_hash_0, real_output_hash_1];
            operations_array.push(["INV", ["input_preimages", input_preimage_0, input_preimage_1], ["output_preimages", output_preimage_0, output_preimage_1], ["input_hashes", input_hash_0, input_hash_1], ["output_hashes", real_output_hash_0, real_output_hash_1], `var w_${gate[3]} = INV( wires[ ${gate[2]} ] )`]);
        }
        if (gate[gate.length - 1] == "AND") {
            if (!wire_settings[gate[2]]) {
                var first_input_preimage_0 = getRand(32);
                var first_input_preimage_1 = getRand(32);
                wire_settings[gate[2]] = [first_input_preimage_0, first_input_preimage_1];
            } else {
                var first_input_preimage_0 = wire_settings[gate[2]][0];
                var first_input_preimage_1 = wire_settings[gate[2]][1];
            }
            if (!wire_settings[gate[3]]) {
                var second_input_preimage_0 = getRand(32);
                var second_input_preimage_1 = getRand(32);
                wire_settings[gate[3]] = [second_input_preimage_0, second_input_preimage_1];
            } else {
                var second_input_preimage_0 = wire_settings[gate[3]][0];
                var second_input_preimage_1 = wire_settings[gate[3]][1];
            }
            var output_preimage_0 = copy_of_wire_settings[gate[4]][0];
            var output_preimage_1 = copy_of_wire_settings[gate[4]][1];
            var copy_of_first_input_hash_0 = await sha256(hexToBytes(copy_of_wire_settings[gate[2]][0]));
            var copy_of_first_input_hash_1 = await sha256(hexToBytes(copy_of_wire_settings[gate[2]][1]));
            var hash_info = findHashesInCopy(copy_of_first_input_hash_0, copy_of_first_input_hash_1);
            var index_of_first_input_hashes = hash_info[0];
            var array_to_use = hash_info[1] == "sub" ? subsequent_commitment_hashes : initial_commitment_hashes;
            var first_input_hash_0 = array_to_use[index_of_first_input_hashes][0];
            var first_input_hash_1 = array_to_use[index_of_first_input_hashes][1];
            if (!wire_hashes[gate[2]]) wire_hashes[gate[2]] = [first_input_hash_0, first_input_hash_1];
            var copy_of_second_input_hash_0 = await sha256(hexToBytes(copy_of_wire_settings[gate[3]][0]));
            var copy_of_second_input_hash_1 = await sha256(hexToBytes(copy_of_wire_settings[gate[3]][1]));
            var hash_info = findHashesInCopy(copy_of_second_input_hash_0, copy_of_second_input_hash_1);
            var index_of_second_input_hashes = hash_info[0];
            var array_to_use = hash_info[1] == "sub" ? subsequent_commitment_hashes : initial_commitment_hashes;
            var second_input_hash_0 = array_to_use[index_of_second_input_hashes][0];
            var second_input_hash_1 = array_to_use[index_of_second_input_hashes][1];
            if (!wire_hashes[gate[3]]) wire_hashes[gate[3]] = [second_input_hash_0, second_input_hash_1];
            var copy_of_output_hash_0 = await sha256(hexToBytes(output_preimage_0));
            var copy_of_output_hash_1 = await sha256(hexToBytes(output_preimage_1));
            var hash_info = findHashesInCopy(copy_of_output_hash_0, copy_of_output_hash_1);
            var index_of_output_hashes = hash_info[0];
            var array_to_use = hash_info[1] == "sub" ? subsequent_commitment_hashes : initial_commitment_hashes;
            var real_output_hash_0 = array_to_use[index_of_output_hashes][0];
            var real_output_hash_1 = array_to_use[index_of_output_hashes][1];
            wire_settings[gate[4]] = [output_preimage_0, output_preimage_1];
            wire_hashes[gate[4]] = [real_output_hash_0, real_output_hash_1];
            operations_array.push(["AND", ["first_input_preimages", first_input_preimage_0, first_input_preimage_1], ["second_input_preimages", second_input_preimage_0, second_input_preimage_1], ["output_preimages", output_preimage_0, output_preimage_1], ["first_input_hashes", first_input_hash_0, first_input_hash_1], ["second_input_hashes", second_input_hash_0, second_input_hash_1], ["output_hashes", real_output_hash_0, real_output_hash_1], `var w_${gate[4]} = AND( wires[ ${gate[2]} ], wires[ ${gate[3]} ] )`]);
        }
        if (gate[gate.length - 1] == "XOR") {
            if (!wire_settings[gate[2]]) {
                var first_input_preimage_0 = getRand(32);
                var first_input_preimage_1 = getRand(32);
                wire_settings[gate[2]] = [first_input_preimage_0, first_input_preimage_1];
            } else {
                var first_input_preimage_0 = wire_settings[gate[2]][0];
                var first_input_preimage_1 = wire_settings[gate[2]][1];
            }
            if (!wire_settings[gate[3]]) {
                var second_input_preimage_0 = getRand(32);
                var second_input_preimage_1 = getRand(32);
                wire_settings[gate[3]] = [second_input_preimage_0, second_input_preimage_1];
            } else {
                var second_input_preimage_0 = wire_settings[gate[3]][0];
                var second_input_preimage_1 = wire_settings[gate[3]][1];
            }
            var output_preimage_0 = copy_of_wire_settings[gate[4]][0];
            var output_preimage_1 = copy_of_wire_settings[gate[4]][1];
            var copy_of_first_input_hash_0 = await sha256(hexToBytes(copy_of_wire_settings[gate[2]][0]));
            var copy_of_first_input_hash_1 = await sha256(hexToBytes(copy_of_wire_settings[gate[2]][1]));
            var hash_info = findHashesInCopy(copy_of_first_input_hash_0, copy_of_first_input_hash_1);
            var index_of_first_input_hashes = hash_info[0];
            var array_to_use = hash_info[1] == "sub" ? subsequent_commitment_hashes : initial_commitment_hashes;
            var first_input_hash_0 = array_to_use[index_of_first_input_hashes][0];
            var first_input_hash_1 = array_to_use[index_of_first_input_hashes][1];
            if (!wire_hashes[gate[2]]) wire_hashes[gate[2]] = [first_input_hash_0, first_input_hash_1];
            var copy_of_second_input_hash_0 = await sha256(hexToBytes(copy_of_wire_settings[gate[3]][0]));
            var copy_of_second_input_hash_1 = await sha256(hexToBytes(copy_of_wire_settings[gate[3]][1]));
            var hash_info = findHashesInCopy(copy_of_second_input_hash_0, copy_of_second_input_hash_1);
            var index_of_second_input_hashes = hash_info[0];
            var array_to_use = hash_info[1] == "sub" ? subsequent_commitment_hashes : initial_commitment_hashes;
            var second_input_hash_0 = array_to_use[index_of_second_input_hashes][0];
            var second_input_hash_1 = array_to_use[index_of_second_input_hashes][1];
            if (!wire_hashes[gate[3]]) wire_hashes[gate[3]] = [second_input_hash_0, second_input_hash_1];
            var copy_of_output_hash_0 = await sha256(hexToBytes(output_preimage_0));
            var copy_of_output_hash_1 = await sha256(hexToBytes(output_preimage_1));
            var hash_info = findHashesInCopy(copy_of_output_hash_0, copy_of_output_hash_1);
            var index_of_output_hashes = hash_info[0];
            var array_to_use = hash_info[1] == "sub" ? subsequent_commitment_hashes : initial_commitment_hashes;
            var real_output_hash_0 = array_to_use[index_of_output_hashes][0];
            var real_output_hash_1 = array_to_use[index_of_output_hashes][1];
            wire_settings[gate[4]] = [output_preimage_0, output_preimage_1];
            wire_hashes[gate[4]] = [real_output_hash_0, real_output_hash_1];
            operations_array.push(["XOR", ["first_input_preimages", first_input_preimage_0, first_input_preimage_1], ["second_input_preimages", second_input_preimage_0, second_input_preimage_1], ["output_preimages", output_preimage_0, output_preimage_1], ["first_input_hashes", first_input_hash_0, first_input_hash_1], ["second_input_hashes", second_input_hash_0, second_input_hash_1], ["output_hashes", real_output_hash_0, real_output_hash_1], `var w_${gate[4]} = XOR( wires[ ${gate[2]} ], wires[ ${gate[3]} ] )`]);
        }
    }
}

var copyOfSetOperationsArray = async () => {
    var index; for (index = 0; index < arr.length; index++) {
        var gate = arr[index].split(" ").filter(item => item);
        if (gate[gate.length - 1] == "INV") {
            if (!copy_of_wire_settings[gate[2]]) {
                var input_preimage_0 = getRand(32);
                var input_preimage_1 = getRand(32);
                copy_of_wire_settings[gate[2]] = [input_preimage_0, input_preimage_1];
            } else {
                var input_preimage_0 = copy_of_wire_settings[gate[2]][0];
                var input_preimage_1 = copy_of_wire_settings[gate[2]][1];
            }
            var output_preimage_0 = getRand(32);
            var output_preimage_1 = getRand(32);
            var input_hash_0 = await sha256(hexToBytes(input_preimage_0));
            var input_hash_1 = await sha256(hexToBytes(input_preimage_1));
            if (!copy_of_initial_commitment_hashes[gate[2]]) copy_of_initial_commitment_hashes[gate[2]] = [input_hash_0, input_hash_1];
            var output_hash_0 = await sha256(hexToBytes(output_preimage_0));
            var output_hash_1 = await sha256(hexToBytes(output_preimage_1));
            copy_of_wire_settings[gate[3]] = [output_preimage_0, output_preimage_1];
            copy_of_operations_array.push(["INV", ["input_preimages", input_preimage_0, input_preimage_1], ["output_preimages", output_preimage_0, output_preimage_1], ["input_hashes", input_hash_0, input_hash_1], ["output_hashes", output_hash_0, output_hash_1], `var w_${gate[3]} = INV( wires[ ${gate[2]} ] )`]);
        }
        if (gate[gate.length - 1] == "AND") {
            if (!copy_of_wire_settings[gate[2]]) {
                var first_input_preimage_0 = getRand(32);
                var first_input_preimage_1 = getRand(32);
                copy_of_wire_settings[gate[2]] = [first_input_preimage_0, first_input_preimage_1];
            } else {
                var first_input_preimage_0 = copy_of_wire_settings[gate[2]][0];
                var first_input_preimage_1 = copy_of_wire_settings[gate[2]][1];
            }
            if (!copy_of_wire_settings[gate[3]]) {
                var second_input_preimage_0 = getRand(32);
                var second_input_preimage_1 = getRand(32);
                copy_of_wire_settings[gate[3]] = [second_input_preimage_0, second_input_preimage_1];
            } else {
                var second_input_preimage_0 = copy_of_wire_settings[gate[3]][0];
                var second_input_preimage_1 = copy_of_wire_settings[gate[3]][1];
            }
            var output_preimage_0 = getRand(32);
            var output_preimage_1 = getRand(32);
            var first_input_hash_0 = await sha256(hexToBytes(first_input_preimage_0));
            var first_input_hash_1 = await sha256(hexToBytes(first_input_preimage_1));
            if (!copy_of_initial_commitment_hashes[gate[2]]) copy_of_initial_commitment_hashes[gate[2]] = [first_input_hash_0, first_input_hash_1];
            var second_input_hash_0 = await sha256(hexToBytes(second_input_preimage_0));
            var second_input_hash_1 = await sha256(hexToBytes(second_input_preimage_1));
            if (!copy_of_initial_commitment_hashes[gate[3]]) copy_of_initial_commitment_hashes[gate[3]] = [second_input_hash_0, second_input_hash_1];
            var output_hash_0 = await sha256(hexToBytes(output_preimage_0));
            var output_hash_1 = await sha256(hexToBytes(output_preimage_1));
            copy_of_wire_settings[gate[4]] = [output_preimage_0, output_preimage_1];
            copy_of_operations_array.push(["AND", ["first_input_preimages", first_input_preimage_0, first_input_preimage_1], ["second_input_preimages", second_input_preimage_0, second_input_preimage_1], ["output_preimages", output_preimage_0, output_preimage_1], ["first_input_hashes", first_input_hash_0, first_input_hash_1], ["second_input_hashes", second_input_hash_0, second_input_hash_1], ["output_hashes", output_hash_0, output_hash_1], `var w_${gate[4]} = AND( wires[ ${gate[2]} ], wires[ ${gate[3]} ] )`]);
        }
        if (gate[gate.length - 1] == "XOR") {
            if (!copy_of_wire_settings[gate[2]]) {
                var first_input_preimage_0 = getRand(32);
                var first_input_preimage_1 = getRand(32);
                copy_of_wire_settings[gate[2]] = [first_input_preimage_0, first_input_preimage_1];
            } else {
                var first_input_preimage_0 = copy_of_wire_settings[gate[2]][0];
                var first_input_preimage_1 = copy_of_wire_settings[gate[2]][1];
            }
            if (!copy_of_wire_settings[gate[3]]) {
                var second_input_preimage_0 = getRand(32);
                var second_input_preimage_1 = getRand(32);
                copy_of_wire_settings[gate[3]] = [second_input_preimage_0, second_input_preimage_1];
            } else {
                var second_input_preimage_0 = copy_of_wire_settings[gate[3]][0];
                var second_input_preimage_1 = copy_of_wire_settings[gate[3]][1];
            }
            var output_preimage_0 = getRand(32);
            var output_preimage_1 = getRand(32);
            var first_input_hash_0 = await sha256(hexToBytes(first_input_preimage_0));
            var first_input_hash_1 = await sha256(hexToBytes(first_input_preimage_1));
            if (!copy_of_initial_commitment_hashes[gate[2]]) copy_of_initial_commitment_hashes[gate[2]] = [first_input_hash_0, first_input_hash_1];
            var second_input_hash_0 = await sha256(hexToBytes(second_input_preimage_0));
            var second_input_hash_1 = await sha256(hexToBytes(second_input_preimage_1));
            if (!copy_of_initial_commitment_hashes[gate[3]]) copy_of_initial_commitment_hashes[gate[3]] = [second_input_hash_0, second_input_hash_1];
            var output_hash_0 = await sha256(hexToBytes(output_preimage_0));
            var output_hash_1 = await sha256(hexToBytes(output_preimage_1));
            copy_of_wire_settings[gate[4]] = [output_preimage_0, output_preimage_1];
            copy_of_operations_array.push(["XOR", ["first_input_preimages", first_input_preimage_0, first_input_preimage_1], ["second_input_preimages", second_input_preimage_0, second_input_preimage_1], ["output_preimages", output_preimage_0, output_preimage_1], ["first_input_hashes", first_input_hash_0, first_input_hash_1], ["second_input_hashes", second_input_hash_0, second_input_hash_1], ["output_hashes", output_hash_0, output_hash_1], `var w_${gate[4]} = XOR( wires[ ${gate[2]} ], wires[ ${gate[3]} ] )`]);
        }
    }
}

var generateBitCommitments = async () => {
    var i; for (i = 0; i < 64; i++) {
        initial_commitment_preimages.push(wire_settings[String(i)]);
        var preimage_0 = wire_settings[String(i)][0];
        var preimage_1 = wire_settings[String(i)][1];
        var hash_0 = await sha256(hexToBytes(preimage_0));
        var hash_1 = await sha256(hexToBytes(preimage_1));
        initial_commitment_hashes.push([hash_0, hash_1]);
    }
}

function saveData(data, fileName) {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    var blob = new Blob([data], { type: "octet/stream" }),
        url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
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
        INSERT_16_BYTE_HERE
        OP_EQUAL
        OP_SWAP
        OP_SHA256
        INSERT_17_BYTE_HERE
        OP_EQUAL
        OP_BOOLOR
        OP_VERIFY
    `;

    var bit_commitment_script = ``;

    initial_commitment_hashes.forEach(hash_pair => {
        bit_commitment_script += bit_commitment_template.replace("INSERT_16_BYTE_HERE", hash_pair[0]).replace("INSERT_17_BYTE_HERE", hash_pair[1]);
    });

    subsequent_commitment_hashes.forEach(hash_pair => {
        bit_commitment_script += bit_commitment_template.replace("INSERT_16_BYTE_HERE", hash_pair[0]).replace("INSERT_17_BYTE_HERE", hash_pair[1]);
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
        INSERT_16_BYTE_HERE
        OP_EQUALVERIFY
        OP_SHA256
        INSERT_17_BYTE_HERE
        OP_EQUALVERIFY
        ${verifierPubkey}
        OP_CHECKSIG
    `;

    var anti_contradiction_scripts = [];

    initial_commitment_hashes.forEach(hash_pair => {
        var filled_in = anti_contradiction_template.replace("INSERT_16_BYTE_HERE", hash_pair[0]).replace("INSERT_17_BYTE_HERE", hash_pair[1]);
        var leaf = filled_in.replaceAll("\n\n", "\n").replaceAll(" ", "").split("\n");
        leaf.splice(0, 1);
        leaf.splice(leaf.length - 1, 1);
        anti_contradiction_scripts.push(leaf);
    });

    subsequent_commitment_hashes.forEach(hash_pair => {
        var filled_in = anti_contradiction_template.replace("INSERT_16_BYTE_HERE", hash_pair[0]).replace("INSERT_17_BYTE_HERE", hash_pair[1]);
        var leaf = filled_in.replaceAll("\n\n", "\n").replaceAll(" ", "").split("\n");
        leaf.splice(0, 1);
        leaf.splice(leaf.length - 1, 1);
        anti_contradiction_scripts.push(leaf);
    });

    var last_leaf = [
        "OP_10",
        "OP_CHECKSEQUENCEVERIFY",
        "OP_DROP",
        proverPubkey,
        "OP_CHECKSIG"
    ];

    anti_contradiction_scripts.push(last_leaf);

    var tree = anti_contradiction_scripts.map(s => tapscript.Tap.encodeScript(s));
    var selected_script = anti_contradiction_scripts[0];
    anti_contradiction_script = selected_script;
    anti_contradiction_tapleaf = tapscript.Tap.encodeScript(anti_contradiction_script);
    var target = tapscript.Tap.encodeScript(selected_script);
    var pubkey = "ab".repeat(32);
    var [tpubkey, cblock] = tapscript.Tap.getPubKey(pubkey, { tree, target });
    anti_contradiction_tpubkey = tpubkey;
    anti_contradiction_cblock = cblock;
    var anti_contradiction_address = tapscript.Address.p2tr.fromPubKey(tpubkey, network);
    return anti_contradiction_address;
}

var generateChallengeAddress = (proverPubkey, verifierPubkey) => {
    var templates = {}
    templates["OP_NOT_00"] = `
        OP_TOALTSTACK
        OP_SHA256
        INSERT_INPUT_HERE
        OP_EQUALVERIFY
        OP_0
        OP_NOT
        OP_FROMALTSTACK
        OP_SHA256
        INSERT_OUTPUT_HERE
        OP_EQUALVERIFY
        OP_0
        OP_NUMNOTEQUAL
        OP_VERIFY
        ${verifierPubkey}
        OP_CHECKSIG
    `;
    templates["OP_NOT_01"] = `
        OP_TOALTSTACK
        OP_SHA256
        INSERT_INPUT_HERE
        OP_EQUALVERIFY
        OP_0
        OP_NOT
        OP_FROMALTSTACK
        OP_SHA256
        INSERT_OUTPUT_HERE
        OP_EQUALVERIFY
        OP_1
        OP_NUMNOTEQUAL
        OP_VERIFY
        ${verifierPubkey}
        OP_CHECKSIG
    `;
    templates["OP_NOT_10"] = `
        OP_TOALTSTACK
        OP_SHA256
        INSERT_INPUT_HERE
        OP_EQUALVERIFY
        OP_1
        OP_NOT
        OP_FROMALTSTACK
        OP_SHA256
        INSERT_OUTPUT_HERE
        OP_EQUALVERIFY
        OP_0
        OP_NUMNOTEQUAL
        OP_VERIFY
        ${verifierPubkey}
        OP_CHECKSIG
    `;
    templates["OP_NOT_11"] = `
        OP_TOALTSTACK
        OP_SHA256
        INSERT_INPUT_HERE
        OP_EQUALVERIFY
        OP_1
        OP_NOT
        OP_FROMALTSTACK
        OP_SHA256
        INSERT_OUTPUT_HERE
        OP_EQUALVERIFY
        OP_1
        OP_NUMNOTEQUAL
        OP_VERIFY
        ${verifierPubkey}
        OP_CHECKSIG
    `;
    templates["OP_BOOLAND_000"] = `
        OP_TOALTSTACK
        OP_SHA256
        INSERT_FIRST_INPUT_HERE
        OP_EQUALVERIFY
        OP_0
        OP_SWAP
        OP_SHA256
        INSERT_SECOND_INPUT_HERE
        OP_EQUALVERIFY
        OP_0
        OP_BOOLAND
        OP_FROMALTSTACK
        OP_SHA256
        INSERT_OUTPUT_HERE
        OP_EQUALVERIFY
        OP_0
        OP_NUMNOTEQUAL
        OP_VERIFY
        ${verifierPubkey}
        OP_CHECKSIG
    `;
    templates["OP_BOOLAND_001"] = `
        OP_TOALTSTACK
        OP_SHA256
        INSERT_FIRST_INPUT_HERE
        OP_EQUALVERIFY
        OP_0
        OP_SWAP
        OP_SHA256
        INSERT_SECOND_INPUT_HERE
        OP_EQUALVERIFY
        OP_0
        OP_BOOLAND
        OP_FROMALTSTACK
        OP_SHA256
        INSERT_OUTPUT_HERE
        OP_EQUALVERIFY
        OP_1
        OP_NUMNOTEQUAL
        OP_VERIFY
        ${verifierPubkey}
        OP_CHECKSIG
    `;
    templates["OP_BOOLAND_010"] = `
        OP_TOALTSTACK
        OP_SHA256
        INSERT_FIRST_INPUT_HERE
        OP_EQUALVERIFY
        OP_0
        OP_SWAP
        OP_SHA256
        INSERT_SECOND_INPUT_HERE
        OP_EQUALVERIFY
        OP_1
        OP_BOOLAND
        OP_FROMALTSTACK
        OP_SHA256
        INSERT_OUTPUT_HERE
        OP_EQUALVERIFY
        OP_0
        OP_NUMNOTEQUAL
        OP_VERIFY
        ${verifierPubkey}
        OP_CHECKSIG
    `;
    templates["OP_BOOLAND_011"] = `
        OP_TOALTSTACK
        OP_SHA256
        INSERT_FIRST_INPUT_HERE
        OP_EQUALVERIFY
        OP_0
        OP_SWAP
        OP_SHA256
        INSERT_SECOND_INPUT_HERE
        OP_EQUALVERIFY
        OP_1
        OP_BOOLAND
        OP_FROMALTSTACK
        OP_SHA256
        INSERT_OUTPUT_HERE
        OP_EQUALVERIFY
        OP_1
        OP_NUMNOTEQUAL
        OP_VERIFY
        ${verifierPubkey}
        OP_CHECKSIG
    `;
    templates["OP_BOOLAND_100"] = `
        OP_TOALTSTACK
        OP_SHA256
        INSERT_FIRST_INPUT_HERE
        OP_EQUALVERIFY
        OP_1
        OP_SWAP
        OP_SHA256
        INSERT_SECOND_INPUT_HERE
        OP_EQUALVERIFY
        OP_0
        OP_BOOLAND
        OP_FROMALTSTACK
        OP_SHA256
        INSERT_OUTPUT_HERE
        OP_EQUALVERIFY
        OP_0
        OP_NUMNOTEQUAL
        OP_VERIFY
        ${verifierPubkey}
        OP_CHECKSIG
    `;
    templates["OP_BOOLAND_101"] = `
        OP_TOALTSTACK
        OP_SHA256
        INSERT_FIRST_INPUT_HERE
        OP_EQUALVERIFY
        OP_1
        OP_SWAP
        OP_SHA256
        INSERT_SECOND_INPUT_HERE
        OP_EQUALVERIFY
        OP_0
        OP_BOOLAND
        OP_FROMALTSTACK
        OP_SHA256
        INSERT_OUTPUT_HERE
        OP_EQUALVERIFY
        OP_1
        OP_NUMNOTEQUAL
        OP_VERIFY
        ${verifierPubkey}
        OP_CHECKSIG
    `;
    templates["OP_BOOLAND_110"] = `
        OP_TOALTSTACK
        OP_SHA256
        INSERT_FIRST_INPUT_HERE
        OP_EQUALVERIFY
        OP_1
        OP_SWAP
        OP_SHA256
        INSERT_SECOND_INPUT_HERE
        OP_EQUALVERIFY
        OP_1
        OP_BOOLAND
        OP_FROMALTSTACK
        OP_SHA256
        INSERT_OUTPUT_HERE
        OP_EQUALVERIFY
        OP_0
        OP_NUMNOTEQUAL
        OP_VERIFY
        ${verifierPubkey}
        OP_CHECKSIG
    `;
    templates["OP_BOOLAND_111"] = `
        OP_TOALTSTACK
        OP_SHA256
        INSERT_FIRST_INPUT_HERE
        OP_EQUALVERIFY
        OP_1
        OP_SWAP
        OP_SHA256
        INSERT_SECOND_INPUT_HERE
        OP_EQUALVERIFY
        OP_1
        OP_BOOLAND
        OP_FROMALTSTACK
        OP_SHA256
        INSERT_OUTPUT_HERE
        OP_EQUALVERIFY
        OP_1
        OP_NUMNOTEQUAL
        OP_VERIFY
        ${verifierPubkey}
        OP_CHECKSIG
    `;
    templates["OP_XOR_000"] = `
        OP_TOALTSTACK
        OP_SHA256
        INSERT_FIRST_INPUT_HERE
        OP_EQUALVERIFY
        OP_0
        OP_SWAP
        OP_SHA256
        INSERT_SECOND_INPUT_HERE
        OP_EQUALVERIFY
        OP_0
        OP_NUMNOTEQUAL
        OP_FROMALTSTACK
        OP_SHA256
        INSERT_OUTPUT_HERE
        OP_EQUALVERIFY
        OP_0
        OP_NUMNOTEQUAL
        OP_VERIFY
        ${verifierPubkey}
        OP_CHECKSIG
    `;
    templates["OP_XOR_001"] = `
        OP_TOALTSTACK
        OP_SHA256
        INSERT_FIRST_INPUT_HERE
        OP_EQUALVERIFY
        OP_0
        OP_SWAP
        OP_SHA256
        INSERT_SECOND_INPUT_HERE
        OP_EQUALVERIFY
        OP_0
        OP_NUMNOTEQUAL
        OP_FROMALTSTACK
        OP_SHA256
        INSERT_OUTPUT_HERE
        OP_EQUALVERIFY
        OP_1
        OP_NUMNOTEQUAL
        OP_VERIFY
        ${verifierPubkey}
        OP_CHECKSIG
    `;
    templates["OP_XOR_010"] = `
        OP_TOALTSTACK
        OP_SHA256
        INSERT_FIRST_INPUT_HERE
        OP_EQUALVERIFY
        OP_0
        OP_SWAP
        OP_SHA256
        INSERT_SECOND_INPUT_HERE
        OP_EQUALVERIFY
        OP_1
        OP_NUMNOTEQUAL
        OP_FROMALTSTACK
        OP_SHA256
        INSERT_OUTPUT_HERE
        OP_EQUALVERIFY
        OP_0
        OP_NUMNOTEQUAL
        OP_VERIFY
        ${verifierPubkey}
        OP_CHECKSIG
    `;
    templates["OP_XOR_011"] = `
        OP_TOALTSTACK
        OP_SHA256
        INSERT_FIRST_INPUT_HERE
        OP_EQUALVERIFY
        OP_0
        OP_SWAP
        OP_SHA256
        INSERT_SECOND_INPUT_HERE
        OP_EQUALVERIFY
        OP_1
        OP_NUMNOTEQUAL
        OP_FROMALTSTACK
        OP_SHA256
        INSERT_OUTPUT_HERE
        OP_EQUALVERIFY
        OP_1
        OP_NUMNOTEQUAL
        OP_VERIFY
        ${verifierPubkey}
        OP_CHECKSIG
    `;
    templates["OP_XOR_100"] = `
        OP_TOALTSTACK
        OP_SHA256
        INSERT_FIRST_INPUT_HERE
        OP_EQUALVERIFY
        OP_1
        OP_SWAP
        OP_SHA256
        INSERT_SECOND_INPUT_HERE
        OP_EQUALVERIFY
        OP_0
        OP_NUMNOTEQUAL
        OP_FROMALTSTACK
        OP_SHA256
        INSERT_OUTPUT_HERE
        OP_EQUALVERIFY
        OP_0
        OP_NUMNOTEQUAL
        OP_VERIFY
        ${verifierPubkey}
        OP_CHECKSIG
    `;
    templates["OP_XOR_101"] = `
        OP_TOALTSTACK
        OP_SHA256
        INSERT_FIRST_INPUT_HERE
        OP_EQUALVERIFY
        OP_1
        OP_SWAP
        OP_SHA256
        INSERT_SECOND_INPUT_HERE
        OP_EQUALVERIFY
        OP_0
        OP_NUMNOTEQUAL
        OP_FROMALTSTACK
        OP_SHA256
        INSERT_OUTPUT_HERE
        OP_EQUALVERIFY
        OP_1
        OP_NUMNOTEQUAL
        OP_VERIFY
        ${verifierPubkey}
        OP_CHECKSIG
    `;
    templates["OP_XOR_110"] = `
        OP_TOALTSTACK
        OP_SHA256
        INSERT_FIRST_INPUT_HERE
        OP_EQUALVERIFY
        OP_1
        OP_SWAP
        OP_SHA256
        INSERT_SECOND_INPUT_HERE
        OP_EQUALVERIFY
        OP_1
        OP_NUMNOTEQUAL
        OP_FROMALTSTACK
        OP_SHA256
        INSERT_OUTPUT_HERE
        OP_EQUALVERIFY
        OP_0
        OP_NUMNOTEQUAL
        OP_VERIFY
        ${verifierPubkey}
        OP_CHECKSIG
    `;
    templates["OP_XOR_111"] = `
        OP_TOALTSTACK
        OP_SHA256
        INSERT_FIRST_INPUT_HERE
        OP_EQUALVERIFY
        OP_1
        OP_SWAP
        OP_SHA256
        INSERT_SECOND_INPUT_HERE
        OP_EQUALVERIFY
        OP_1
        OP_NUMNOTEQUAL
        OP_FROMALTSTACK
        OP_SHA256
        INSERT_OUTPUT_HERE
        OP_EQUALVERIFY
        OP_1
        OP_NUMNOTEQUAL
        OP_VERIFY
        ${verifierPubkey}
        OP_CHECKSIG
    `;

    challenge_scripts = [];

    var i; for (i = 0; i < operations_array.length; i++) {
        if (operations_array[i][0] == "INV") {
            var input_hash_pair = [operations_array[i][3][1], operations_array[i][3][2]];
            var output_hash_pair = [operations_array[i][4][1], operations_array[i][4][2]];
            var filled_in_templates = [];
            filled_in_templates.push(
                templates["OP_NOT_00"].replace("INSERT_INPUT_HERE", input_hash_pair[0]).replace("INSERT_OUTPUT_HERE", output_hash_pair[0]),
                templates["OP_NOT_01"].replace("INSERT_INPUT_HERE", input_hash_pair[0]).replace("INSERT_OUTPUT_HERE", output_hash_pair[1]),
                templates["OP_NOT_10"].replace("INSERT_INPUT_HERE", input_hash_pair[1]).replace("INSERT_OUTPUT_HERE", output_hash_pair[0]),
                templates["OP_NOT_11"].replace("INSERT_INPUT_HERE", input_hash_pair[1]).replace("INSERT_OUTPUT_HERE", output_hash_pair[1])
            );
            filled_in_templates.forEach(template => {
                var leaf = template.replaceAll("\n\n", "\n").replaceAll(" ", "").split("\n");
                leaf.splice(0, 1);
                leaf.splice(leaf.length - 1, 1);
                challenge_scripts.push(leaf);
            });
        }
        if (operations_array[i][0] == "AND") {
            var first_hash_pair = [operations_array[i][4][1], operations_array[i][4][2]];
            var second_hash_pair = [operations_array[i][5][1], operations_array[i][5][2]];
            var output_hash_pair = [operations_array[i][6][1], operations_array[i][6][2]];
            var filled_in_templates = [];
            filled_in_templates.push(
                templates["OP_BOOLAND_000"].replace("INSERT_FIRST_INPUT_HERE", first_hash_pair[0]).replace("INSERT_SECOND_INPUT_HERE", second_hash_pair[0]).replace("INSERT_OUTPUT_HERE", output_hash_pair[0]),
                templates["OP_BOOLAND_001"].replace("INSERT_FIRST_INPUT_HERE", first_hash_pair[0]).replace("INSERT_SECOND_INPUT_HERE", second_hash_pair[0]).replace("INSERT_OUTPUT_HERE", output_hash_pair[1]),
                templates["OP_BOOLAND_010"].replace("INSERT_FIRST_INPUT_HERE", first_hash_pair[0]).replace("INSERT_SECOND_INPUT_HERE", second_hash_pair[1]).replace("INSERT_OUTPUT_HERE", output_hash_pair[0]),
                templates["OP_BOOLAND_011"].replace("INSERT_FIRST_INPUT_HERE", first_hash_pair[0]).replace("INSERT_SECOND_INPUT_HERE", second_hash_pair[1]).replace("INSERT_OUTPUT_HERE", output_hash_pair[1]),
                templates["OP_BOOLAND_100"].replace("INSERT_FIRST_INPUT_HERE", first_hash_pair[1]).replace("INSERT_SECOND_INPUT_HERE", second_hash_pair[0]).replace("INSERT_OUTPUT_HERE", output_hash_pair[0]),
                templates["OP_BOOLAND_101"].replace("INSERT_FIRST_INPUT_HERE", first_hash_pair[1]).replace("INSERT_SECOND_INPUT_HERE", second_hash_pair[0]).replace("INSERT_OUTPUT_HERE", output_hash_pair[1]),
                templates["OP_BOOLAND_110"].replace("INSERT_FIRST_INPUT_HERE", first_hash_pair[1]).replace("INSERT_SECOND_INPUT_HERE", second_hash_pair[1]).replace("INSERT_OUTPUT_HERE", output_hash_pair[0]),
                templates["OP_BOOLAND_111"].replace("INSERT_FIRST_INPUT_HERE", first_hash_pair[1]).replace("INSERT_SECOND_INPUT_HERE", second_hash_pair[1]).replace("INSERT_OUTPUT_HERE", output_hash_pair[1]),
            );
            filled_in_templates.forEach(template => {
                var leaf = template.replaceAll("\n\n", "\n").replaceAll(" ", "").split("\n");
                leaf.splice(0, 1);
                leaf.splice(leaf.length - 1, 1);
                challenge_scripts.push(leaf);
            });
        }
        if (operations_array[i][0] == "XOR") {
            var first_hash_pair = [operations_array[i][4][1], operations_array[i][4][2]];
            var second_hash_pair = [operations_array[i][5][1], operations_array[i][5][2]];
            var output_hash_pair = [operations_array[i][6][1], operations_array[i][6][2]];
            var filled_in_templates = [];
            filled_in_templates.push(
                templates["OP_XOR_000"].replace("INSERT_FIRST_INPUT_HERE", first_hash_pair[0]).replace("INSERT_SECOND_INPUT_HERE", second_hash_pair[0]).replace("INSERT_OUTPUT_HERE", output_hash_pair[0]),
                templates["OP_XOR_001"].replace("INSERT_FIRST_INPUT_HERE", first_hash_pair[0]).replace("INSERT_SECOND_INPUT_HERE", second_hash_pair[0]).replace("INSERT_OUTPUT_HERE", output_hash_pair[1]),
                templates["OP_XOR_010"].replace("INSERT_FIRST_INPUT_HERE", first_hash_pair[0]).replace("INSERT_SECOND_INPUT_HERE", second_hash_pair[1]).replace("INSERT_OUTPUT_HERE", output_hash_pair[0]),
                templates["OP_XOR_011"].replace("INSERT_FIRST_INPUT_HERE", first_hash_pair[0]).replace("INSERT_SECOND_INPUT_HERE", second_hash_pair[1]).replace("INSERT_OUTPUT_HERE", output_hash_pair[1]),
                templates["OP_XOR_100"].replace("INSERT_FIRST_INPUT_HERE", first_hash_pair[1]).replace("INSERT_SECOND_INPUT_HERE", second_hash_pair[0]).replace("INSERT_OUTPUT_HERE", output_hash_pair[0]),
                templates["OP_XOR_101"].replace("INSERT_FIRST_INPUT_HERE", first_hash_pair[1]).replace("INSERT_SECOND_INPUT_HERE", second_hash_pair[0]).replace("INSERT_OUTPUT_HERE", output_hash_pair[1]),
                templates["OP_XOR_110"].replace("INSERT_FIRST_INPUT_HERE", first_hash_pair[1]).replace("INSERT_SECOND_INPUT_HERE", second_hash_pair[1]).replace("INSERT_OUTPUT_HERE", output_hash_pair[0]),
                templates["OP_XOR_111"].replace("INSERT_FIRST_INPUT_HERE", first_hash_pair[1]).replace("INSERT_SECOND_INPUT_HERE", second_hash_pair[1]).replace("INSERT_OUTPUT_HERE", output_hash_pair[1]),
            );
            filled_in_templates.forEach(template => {
                var leaf = template.replaceAll("\n\n", "\n").replaceAll(" ", "").split("\n");
                leaf.splice(0, 1);
                leaf.splice(leaf.length - 1, 1);
                challenge_scripts.push(leaf);
            });
        }
    }

    var last_leaf = [
        "OP_10",
        "OP_CHECKSEQUENCEVERIFY",
        "OP_DROP",
        proverPubkey,
        "OP_CHECKSIG"
    ];

    challenge_scripts.push(last_leaf);

    var tree = challenge_scripts.map(s => tapscript.Tap.encodeScript(s));
    var selected_script = challenge_scripts[challenge_scripts.length - 1];
    challenge_script = selected_script;
    challenge_tapleaf = tapscript.Tap.encodeScript(challenge_script);
    var target = tapscript.Tap.encodeScript(selected_script);
    var pubkey = "ab".repeat(32);
    var [tpubkey, cblock] = tapscript.Tap.getPubKey(pubkey, { tree, target });
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

var getInputsAndOutputFromRevealedPreimages = async () => {
    //var input_prep = ``;
    var j; for (j = 0; j < initial_commitment_hashes.length; j++) {
        var index = j;
        var input = initial_commitment_hashes[index];
        //input_prep += `Input #${index + 1} is `;
        var i; for (i = 0; i < preimages_from_paul.length; i++) {
            var preimage = preimages_from_paul[i];
            var hash = await sha256(hexToBytes(preimage));
            if (hash == input[0]) {
                wires[index] = 0;
                //input_prep += `0 because the preimage to ${input[ 0 ]} was revealed (its preimage is ${preimage})\n\n`;
                break;
            }
            if (hash == input[1]) {
                wires[index] = 1;
                //input_prep += `1 because the preimage to ${input[ 1 ]} was revealed (its preimage is ${preimage})\n\n`;
                break;
            }
        }
    }
    //console.log( input_prep );

    var index; for (index = 0; index < arr.length; index++) {
        var gate = arr[index].split(" ").filter(item => item);
        if (gate[gate.length - 1] == "INV") {
            wires[gate[3]] = eval(`INV( wires[ ${gate[2]} ] )`);
            //js_version += `wires[ ${gate[ 3 ]} ] = INV( wires[ ${gate[ 2 ]} ] )\n`;
        }
        if (gate[gate.length - 1] == "AND") {
            wires[gate[4]] = eval(`AND( wires[ ${gate[2]} ], wires[ ${gate[3]} ] )`);
            //js_version += `wires[ ${gate[ 4 ]} ] = AND( wires[ ${gate[ 2 ]} ], wires[ ${gate[ 3 ]} ] )\n`;
        }
        if (gate[gate.length - 1] == "XOR") {
            wires[gate[4]] = eval(`XOR( wires[ ${gate[2]} ], wires[ ${gate[3]} ] )`);
            //js_version += `wires[ ${gate[ 4 ]} ] = AND( wires[ ${gate[ 2 ]} ], wires[ ${gate[ 3 ]} ] )\n`;
        }
    }
    var input_1 = ``;
    var input_2 = ``;
    var output = ``;
    var i; for (i = 0; i < number_of_inputs; i++) {
        input_1 += String(wires[i]);
    }
    if (number_of_inputs_2) {
        var i; for (i = 0; i < number_of_inputs_2; i++) {
            input_2 += String(wires[i + number_of_inputs]);
        }
    }
    var i; for (i = number_of_preimages_to_expect - number_of_outputs; i < number_of_preimages_to_expect; i++) {
        output += String(wires[i]);
    }

    return {input_1, input_2, output};
}

var findHashesInCopy = (hash1, hash2) => {
    var i; for (i = 0; i < copy_of_subsequent_commitment_hashes.length; i++) {
        if (copy_of_subsequent_commitment_hashes[i].includes(hash1) && copy_of_subsequent_commitment_hashes[i].includes(hash2)) return [i, "sub"];
    }
    var i; for (i = 0; i < copy_of_initial_commitment_hashes.length; i++) {
        if (copy_of_initial_commitment_hashes[i] && copy_of_initial_commitment_hashes[i].includes(hash1) && copy_of_initial_commitment_hashes[i].includes(hash2)) return [i, "init"];
    }
}