var parseBristolString = (circuit_string) => {
    circuit_splited = circuit_string.split(`\n`);
    circuit_splited.forEach((entry, index) => {
        circuit_splited[index] = circuit_splited[index].replace(/ +(?= )/g, "");
        if (entry.startsWith(" ")) circuit_splited[index] = circuit_splited[index].substring(1);
    });
    if (!circuit_splited[0]) circuit_splited.splice(0, 1);
    if (!circuit_splited[circuit_splited.length - 1]) circuit_splited.splice(circuit_splited.length - 1, 1);
    if (circuit_splited[3]) alert("Oops, you entered an invalid bristol circuit_splited! Try again with the whole document, including the first three lines that define the number of gates, number of input bits, and number of output bits.");
    number_of_preimages_to_expect = circuit_splited[0].split(" ").filter(item => item)[1];
    number_of_preimages_to_expect = Number(number_of_preimages_to_expect);
    number_of_numbers_being_passed_as_input = circuit_splited[1].split(" ").filter(item => item)[0];
    number_of_numbers_being_passed_as_input = Number(number_of_numbers_being_passed_as_input);
    number_of_inputs = circuit_splited[1].split(" ").filter(item => item)[1];
    number_of_inputs = Number(number_of_inputs);
    if (circuit_splited[1].split(" ").filter(item => item)[2]) number_of_inputs_2 = circuit_splited[1].split(" ").filter(item => item)[2];
    if (number_of_inputs_2) number_of_inputs_2 = Number(number_of_inputs_2);
    number_of_outputs = circuit_splited[2].split(" ").filter(item => item)[1];
    number_of_outputs = Number(number_of_outputs);
    circuit_splited.splice(0, 4);
    circuit_splited.forEach((gate_string) => {
        gate_array = gate_string.split(" ").filter(item => item);
        gate = {
            name: gate_array[gate_array.length - 1],
            input_wires: [],
            output_wires: [],
            eval_string: function () {
                eval_string = `wires[ ${this.output_wires[0]} ] = ${this.name}( `;
                this.input_wires.forEach((wire, index) => {
                    eval_string += `wires[ ${wire} ]`;
                    if (index != this.input_wires.length - 1) eval_string += ", ";
                });
                eval_string += " )";
                return eval_string
            }
        };

        if (gate.name == "INV") {
            gate.input_wires.push(gate_array[2]);
            gate.output_wires.push(gate_array[3]);
        } else if (["AND", "XOR"].indexOf(gate.name) > -1) {
            gate.input_wires.push(gate_array[2], gate_array[3]);
            gate.output_wires.push(gate_array[4]);
        }

        circuit.push(gate);
    });
}