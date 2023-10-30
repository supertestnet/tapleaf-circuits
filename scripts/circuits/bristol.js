var parseBristolString = (circuit_string) => {
    circuit = circuit_string.split(`\n`);
    circuit.forEach((entry, index) => {
        circuit[index] = circuit[index].replace(/ +(?= )/g, "");
        if (entry.startsWith(" ")) circuit[index] = circuit[index].substring(1);
    });
    if (!circuit[0]) circuit.splice(0, 1);
    if (!circuit[circuit.length - 1]) circuit.splice(circuit.length - 1, 1);
    if (circuit[3]) alert("Oops, you entered an invalid bristol circuit! Try again with the whole document, including the first three lines that define the number of gates, number of input bits, and number of output bits.");
    number_of_preimages_to_expect = circuit[0].split(" ").filter(item => item)[1];
    number_of_preimages_to_expect = Number(number_of_preimages_to_expect);
    number_of_numbers_being_passed_as_input = circuit[1].split(" ").filter(item => item)[0];
    number_of_numbers_being_passed_as_input = Number(number_of_numbers_being_passed_as_input);
    number_of_inputs = circuit[1].split(" ").filter(item => item)[1];
    number_of_inputs = Number(number_of_inputs);
    if (circuit[1].split(" ").filter(item => item)[2]) number_of_inputs_2 = circuit[1].split(" ").filter(item => item)[2];
    if (number_of_inputs_2) number_of_inputs_2 = Number(number_of_inputs_2);
    number_of_outputs = circuit[2].split(" ").filter(item => item)[1];
    number_of_outputs = Number(number_of_outputs);
    circuit.splice(0, 4);
}