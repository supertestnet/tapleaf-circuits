circuit.parseBristolString = function (bristol_string) {
    this.init();
    bristol_string_lines = bristol_string.split(`\n`);
    bristol_string_lines.forEach((entry, index) => {
        bristol_string_lines[index] = bristol_string_lines[index].replace(/ +(?= )/g, "");
        if (entry.startsWith(" ")) bristol_string_lines[index] = bristol_string_lines[index].substring(1);
    });
    if (!bristol_string_lines[0]) bristol_string_lines.splice(0, 1);
    if (!bristol_string_lines[bristol_string_lines.length - 1]) bristol_string_lines.splice(bristol_string_lines.length - 1, 1);
    if (bristol_string_lines[3]) alert("Oops, you entered an invalid bristol circuit! Try again with the whole document, including the first three lines that define the number of gates, number of input bits, and number of output bits.");

    var gates_and_wires_info_array = bristol_string_lines[0].split(" ").filter(item => item);
    var inputs_info_array = bristol_string_lines[1].split(" ").filter(item => item);
    number_of_numbers_being_passed_as_input = Number(inputs_info_array[0]);
    var i = 0; for (i = 1; i <= number_of_numbers_being_passed_as_input; i++) {
        this.input_sizes.push(Number(inputs_info_array[i]));
    }

    var outputs_info_array = bristol_string_lines[2].split(" ").filter(item => item);
    number_of_numbers_as_output = Number(outputs_info_array[0]);
    var i = 0; for (i = 1; i <= number_of_numbers_as_output; i++) {
        this.output_sizes.push(Number(outputs_info_array[i]));
    }

    bristol_string_lines.splice(0, 4);
    bristol_string_lines.forEach((gate_string) => {
        gate_array = gate_string.split(" ").filter(item => item);
        gate = {
            name: gate_array[gate_array.length - 1],
            input_wires: [],
            output_wires: [],
            operation: function () {
                var gate_to_operation_map = {
                    "INV": "OP_NOT",
                    "OR": "OP_BOOLOR",
                    "AND": "OP_BOOLAND",
                    "XOR": "OP_NUMNOTEQUAL"
                };
                return gate_to_operation_map[this.name];
            },
            eval_string: function () {
                eval_string = `circuit.wires[ ${this.output_wires[0]} ].setting = ${this.name}( `;
                this.input_wires.forEach((wire, index) => {
                    eval_string += `circuit.wires[ ${wire} ].setting`;
                    if (index != this.input_wires.length - 1) eval_string += ", ";
                });
                eval_string += " )";
                return eval_string
            }
        };

        if (gate.name == "INV") {
            gate.input_wires.push(Number(gate_array[2]));
            gate.output_wires.push(Number(gate_array[3]));
        } else if (["OR", "AND", "XOR"].indexOf(gate.name) > -1) {
            gate.input_wires.push(Number(gate_array[2]), Number(gate_array[3]));
            gate.output_wires.push(Number(gate_array[4]));
        }

        gate.input_wires.forEach((wire_number) => {
            this.wires[wire_number] = {
                setting: null,
                settings_preimages: [],
                settings_hashes: [],
            };
        });

        gate.output_wires.forEach((wire_number) => {
            this.wires[wire_number] = {
                setting: null,
                settings_preimages: [],
                settings_hashes: [],
            };
        });

        this.gates.push(gate);
    });

    var expected_gates_count = gates_and_wires_info_array[0];
    var expected_wires_count = gates_and_wires_info_array[1];
    if ((expected_gates_count != this.gates.length) || (expected_wires_count != this.wires.length)) {
        alert("Invalid bristol circuit :( it doesn't have the expected wires or gates!");
        this.init();
    }
}

var OR = (a, b) => Number(a || b);
var AND = (a, b) => Number(a && b);
var XOR = (a, b) => Number(a ^ b);
var INV = (a) => Number(!a);