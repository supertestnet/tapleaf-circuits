# Tapleaf circuits
A proof-of-concept implementation of BitVM for bristol circuits

# Overview

As outlined in the [BitVM whitepaper](https://bitvm.org/bitvm.pdf), Bitcoin can verify the correct execution of any boolean circuit and penalize its incorrect execution. This makes it functionally equivalent to a turing complete programming environment. This document outlines a protocol by which a prover, Paul, and a verifier, Vicky, agree on an arbitrary boolean circuit and then encode it inside tapleaves in a taproot address. Thereupon, they may fund the address in such a way that Paul is paid if he executes the script correctly but Vicky is paid if he does not.

The circuit we will evaluate in this example is a zero-checking function: it uses a sequence of NOT gates and AND gates to check if the inputs to the function are 64 null vectors (“zeros”). This circuit would be useful for checking if a string, such as a hash, begins with a certain number of leading zeros, e.g. to evaluate a proof of work in a bitcoin transaction, or to validate an SPV proof that a certain utxo existed at a certain blockheight. It is also intended as a template: any computable function can be written as a boolean logic circuit and verified by simply dropping it in where the zero-checking circuit currently sits.

The following is what the zero-checking circuit looks like in [bristol format](https://homes.esat.kuleuven.be/~nsmart/MPC/).

Note that this format is not very human readable. It's a blueprint for manufacturing microchips. The first line defines how many "wires" are needed in the circuit, the second defines how many "input" wires will contribute input bits to the function (in this case, there is 1 input to the function and it consists of 64 bits), and how many "output" wires will come out of the circuit (in this case, 1 wire will inform us whether all 64 input bits were 0s or not).

```
127 191
1 64 
1 1 

1 1 63 65 INV
1 1 60 64 INV
2 1 65 64 69 AND
1 1 62 67 INV
1 1 61 66 INV
2 1 67 66 68 AND
2 1 69 68 77 AND
1 1 51 71 INV
1 1 48 70 INV
2 1 71 70 75 AND
1 1 50 73 INV
1 1 49 72 INV
2 1 73 72 74 AND
2 1 75 74 76 AND
2 1 77 76 93 AND
1 1 59 79 INV
1 1 56 78 INV
2 1 79 78 83 AND
1 1 58 81 INV
1 1 57 80 INV
2 1 81 80 82 AND
2 1 83 82 91 AND
1 1 55 85 INV
1 1 52 84 INV
2 1 85 84 89 AND
1 1 54 87 INV
1 1 53 86 INV
2 1 87 86 88 AND
2 1 89 88 90 AND
2 1 91 90 92 AND
2 1 93 92 125 AND
1 1 15 95 INV
1 1 12 94 INV
2 1 95 94 99 AND
1 1 14 97 INV
1 1 13 96 INV
2 1 97 96 98 AND
2 1 99 98 107 AND
1 1 3 101 INV
1 1 0 100 INV
2 1 101 100 105 AND
1 1 2 103 INV
1 1 1 102 INV
2 1 103 102 104 AND
2 1 105 104 106 AND
2 1 107 106 123 AND
1 1 11 109 INV
1 1 8 108 INV
2 1 109 108 113 AND
1 1 10 111 INV
1 1 9 110 INV
2 1 111 110 112 AND
2 1 113 112 121 AND
1 1 7 115 INV
1 1 4 114 INV
2 1 115 114 119 AND
1 1 6 117 INV
1 1 5 116 INV
2 1 117 116 118 AND
2 1 119 118 120 AND
2 1 121 120 122 AND
2 1 123 122 124 AND
2 1 125 124 189 AND
1 1 47 127 INV
1 1 44 126 INV
2 1 127 126 131 AND
1 1 46 129 INV
1 1 45 128 INV
2 1 129 128 130 AND
2 1 131 130 139 AND
1 1 35 133 INV
1 1 32 132 INV
2 1 133 132 137 AND
1 1 34 135 INV
1 1 33 134 INV
2 1 135 134 136 AND
2 1 137 136 138 AND
2 1 139 138 155 AND
1 1 43 141 INV
1 1 40 140 INV
2 1 141 140 145 AND
1 1 42 143 INV
1 1 41 142 INV
2 1 143 142 144 AND
2 1 145 144 153 AND
1 1 39 147 INV
1 1 36 146 INV
2 1 147 146 151 AND
1 1 38 149 INV
1 1 37 148 INV
2 1 149 148 150 AND
2 1 151 150 152 AND
2 1 153 152 154 AND
2 1 155 154 187 AND
1 1 31 157 INV
1 1 28 156 INV
2 1 157 156 161 AND
1 1 30 159 INV
1 1 29 158 INV
2 1 159 158 160 AND
2 1 161 160 169 AND
1 1 19 163 INV
1 1 16 162 INV
2 1 163 162 167 AND
1 1 18 165 INV
1 1 17 164 INV
2 1 165 164 166 AND
2 1 167 166 168 AND
2 1 169 168 185 AND
1 1 27 171 INV
1 1 24 170 INV
2 1 171 170 175 AND
1 1 26 173 INV
1 1 25 172 INV
2 1 173 172 174 AND
2 1 175 174 183 AND
1 1 23 177 INV
1 1 20 176 INV
2 1 177 176 181 AND
1 1 22 179 INV
1 1 21 178 INV
2 1 179 178 180 AND
2 1 181 180 182 AND
2 1 183 182 184 AND
2 1 185 184 186 AND
2 1 187 186 188 AND
2 1 189 188 190 AND
```

If the above function outputs a 1 then every input bit was a 0, otherwise at least one of them was a 1. Remember: this is a very simple program, but still inherently useful. Moreover, any computable function can be written this way, though most useful functions are (arguably) much more complicated than the circuit above.

# Import dependencies

To convert, run, and validate a bristol circuit in a taproot address we need several dependencies.

```
var sha256 = s => {
    if ( typeof s == "string" ) s = new TextEncoder().encode( s );
    return crypto.subtle.digest( 'SHA-256', s ).then( hashBuffer => {
        var hashArray = Array.from( new Uint8Array( hashBuffer ) );
        var hashHex = hashArray
            .map( bytes => bytes.toString( 16 ).padStart( 2, '0' ) )
            .join( '' );
        return hashHex;
    });
}

function hexToBytes( hex ) {
    return Uint8Array.from( hex.match( /.{1,2}/g ).map( ( byte ) => parseInt( byte, 16 ) ) );
}

function bytesToHex( bytes ) {
    return bytes.reduce( ( str, byte ) => str + byte.toString( 16 ).padStart( 2, "0" ), "" );
}

var getRand = size => bytesToHex(crypto.getRandomValues(new Uint8Array(size)));

var AND = ( a, b ) => Number( a && b );
var XOR = ( a, b ) => Number( a ^ b );
var INV = ( a ) => Number( !a );

function removeDuplicates(arr) {
    var copy = JSON.parse( JSON.stringify( arr ) );
    return copy.filter((item,index) => copy.indexOf(item) === index);
}

var compareTapleaves = async ( preimage, challenge_scripts ) => {
    var scripts_this_preimage_is_referenced_in = [];
    var hash = await sha256( hexToBytes( preimage ) );
    challenge_scripts.forEach( ( script, index ) => {
        script.forEach( element => {
            if ( element == hash ) scripts_this_preimage_is_referenced_in.push( index );
        });
    });
    return scripts_this_preimage_is_referenced_in;
}

var discardUnusedPreimages = async () => {
    var i; for ( i=0; i<preimages_from_paul.length; i++ ) {
        var preimage = preimages_from_paul[ i ];
        var tapleaves_it_is_in = await compareTapleaves( preimage, challenge_scripts );
        if ( tapleaves_it_is_in.length ) continue;
        preimages_from_paul.splice( i, 1 );
        i = i - 1;
    }
}

var OP_NOT = async ( input_preimage, expected_input_hash, input_value, output_preimage, expected_output_hash, output_value ) => {
    var real_input_hash = await sha256( hexToBytes( input_preimage ) );
    if ( real_input_hash != expected_input_hash ) return `you cannot spend with this tapleaf`;
    var input_bit = input_value;
    input_bit = Number( !input_bit );
    var real_output_hash = await sha256( hexToBytes( output_preimage ) );
    if ( real_output_hash != expected_output_hash ) return `you cannot spend with this tapleaf`;
    var output_bit = output_value;
    if ( input_bit != output_bit ) return `you can spend with these preimages: ${input_preimage} as the input preimage and ${output_preimage} as the output preimage`;
    return `you cannot spend with this tapleaf`;
}

var OP_BOOLAND = async ( first_input_preimage, first_expected_input_hash, first_input_value, second_input_preimage, second_expected_input_hash, second_input_value, output_preimage, expected_output_hash, output_value ) => {
    var real_first_input_hash = await sha256( hexToBytes( first_input_preimage ) );
    if ( real_first_input_hash != first_expected_input_hash ) return `you cannot spend with this tapleaf`;
    var real_second_input_hash = await sha256( hexToBytes( second_input_preimage ) );
    if ( real_second_input_hash != second_expected_input_hash ) return `you cannot spend with this tapleaf`;
    var comparison_bit = Number( first_input_value && second_input_value );
    var real_output_hash = await sha256( hexToBytes( output_preimage ) );
    if ( real_output_hash != expected_output_hash ) return `you cannot spend with this tapleaf`;
    var output_bit = output_value;
    if ( comparison_bit != output_bit ) return `you can spend with these preimages: ${first_input_preimage} as the first input preimage, ${second_input_preimage} as the second, and ${output_preimage} as the output preimage`;
    return `you cannot spend with this tapleaf`;
}

var OP_XOR = async ( first_input_preimage, first_expected_input_hash, first_input_value, second_input_preimage, second_expected_input_hash, second_input_value, output_preimage, expected_output_hash, output_value ) => {
    var real_first_input_hash = await sha256( hexToBytes( first_input_preimage ) );
    if ( real_first_input_hash != first_expected_input_hash ) return `you cannot spend with this tapleaf`;
    var real_second_input_hash = await sha256( hexToBytes( second_input_preimage ) );
    if ( real_second_input_hash != second_expected_input_hash ) return `you cannot spend with this tapleaf`;
    var comparison_bit = Number( first_input_value ^ second_input_value );
    var real_output_hash = await sha256( hexToBytes( output_preimage ) );
    if ( real_output_hash != expected_output_hash ) return `you cannot spend with this tapleaf`;
    var output_bit = output_value;
    if ( comparison_bit != output_bit ) return `you can spend with these preimages: ${first_input_preimage} as the first input preimage, ${second_input_preimage} as the second, and ${output_preimage} as the output preimage`;
    return `you cannot spend with this tapleaf`;
}

var tapscript = document.createElement('script');
tapscript.src = "https://unpkg.com/@cmdcode/tapscript@1.4.0";
document.getElementsByTagName('head')[0].appendChild(tapscript);
```

# Import the circuit

Copy the circuit into a javascript string.

```
var arrprep = `
127 191
1 64 
1 1 

1 1 63 65 INV
1 1 60 64 INV
2 1 65 64 69 AND
1 1 62 67 INV
1 1 61 66 INV
2 1 67 66 68 AND
2 1 69 68 77 AND
1 1 51 71 INV
1 1 48 70 INV
2 1 71 70 75 AND
1 1 50 73 INV
1 1 49 72 INV
2 1 73 72 74 AND
2 1 75 74 76 AND
2 1 77 76 93 AND
1 1 59 79 INV
1 1 56 78 INV
2 1 79 78 83 AND
1 1 58 81 INV
1 1 57 80 INV
2 1 81 80 82 AND
2 1 83 82 91 AND
1 1 55 85 INV
1 1 52 84 INV
2 1 85 84 89 AND
1 1 54 87 INV
1 1 53 86 INV
2 1 87 86 88 AND
2 1 89 88 90 AND
2 1 91 90 92 AND
2 1 93 92 125 AND
1 1 15 95 INV
1 1 12 94 INV
2 1 95 94 99 AND
1 1 14 97 INV
1 1 13 96 INV
2 1 97 96 98 AND
2 1 99 98 107 AND
1 1 3 101 INV
1 1 0 100 INV
2 1 101 100 105 AND
1 1 2 103 INV
1 1 1 102 INV
2 1 103 102 104 AND
2 1 105 104 106 AND
2 1 107 106 123 AND
1 1 11 109 INV
1 1 8 108 INV
2 1 109 108 113 AND
1 1 10 111 INV
1 1 9 110 INV
2 1 111 110 112 AND
2 1 113 112 121 AND
1 1 7 115 INV
1 1 4 114 INV
2 1 115 114 119 AND
1 1 6 117 INV
1 1 5 116 INV
2 1 117 116 118 AND
2 1 119 118 120 AND
2 1 121 120 122 AND
2 1 123 122 124 AND
2 1 125 124 189 AND
1 1 47 127 INV
1 1 44 126 INV
2 1 127 126 131 AND
1 1 46 129 INV
1 1 45 128 INV
2 1 129 128 130 AND
2 1 131 130 139 AND
1 1 35 133 INV
1 1 32 132 INV
2 1 133 132 137 AND
1 1 34 135 INV
1 1 33 134 INV
2 1 135 134 136 AND
2 1 137 136 138 AND
2 1 139 138 155 AND
1 1 43 141 INV
1 1 40 140 INV
2 1 141 140 145 AND
1 1 42 143 INV
1 1 41 142 INV
2 1 143 142 144 AND
2 1 145 144 153 AND
1 1 39 147 INV
1 1 36 146 INV
2 1 147 146 151 AND
1 1 38 149 INV
1 1 37 148 INV
2 1 149 148 150 AND
2 1 151 150 152 AND
2 1 153 152 154 AND
2 1 155 154 187 AND
1 1 31 157 INV
1 1 28 156 INV
2 1 157 156 161 AND
1 1 30 159 INV
1 1 29 158 INV
2 1 159 158 160 AND
2 1 161 160 169 AND
1 1 19 163 INV
1 1 16 162 INV
2 1 163 162 167 AND
1 1 18 165 INV
1 1 17 164 INV
2 1 165 164 166 AND
2 1 167 166 168 AND
2 1 169 168 185 AND
1 1 27 171 INV
1 1 24 170 INV
2 1 171 170 175 AND
1 1 26 173 INV
1 1 25 172 INV
2 1 173 172 174 AND
2 1 175 174 183 AND
1 1 23 177 INV
1 1 20 176 INV
2 1 177 176 181 AND
1 1 22 179 INV
1 1 21 178 INV
2 1 179 178 180 AND
2 1 181 180 182 AND
2 1 183 182 184 AND
2 1 185 184 186 AND
2 1 187 186 188 AND
2 1 189 188 190 AND
`;
```

Run this code to convert each line into an array, define some needed variables using the first three lines, and then trim the circuit to just the logic gates.

```
var arr = arrprep.split( `\n`);
if ( !arr[ 0 ] ) arr.splice( 0, 1 );
if ( !arr[ arr.length - 1 ] ) arr.splice( arr.length - 1, 1 );
if ( arr[ 3 ] ) alert( "Oops, you entered an invalid bristol circuit! Try again with the whole document, including the first three lines that define the number of gates, number of input bits, and number of output bits." );
var number_of_preimages_to_expect = arr[ 0 ].split( " " ).filter( item => item )[ 1 ];
number_of_preimages_to_expect = Number( number_of_preimages_to_expect );
var number_of_inputs = arr[ 1 ].split( " " ).filter( item => item )[ 1 ];
number_of_inputs = Number( number_of_inputs );
var number_of_outputs = arr[ 2 ].split( " " ).filter( item => item )[ 1 ];
number_of_outputs = Number( number_of_outputs );
arr.splice( 0, 4 );
```

For each gate in the array, map two arrays to it: an array of input hashes and an array of output hashes.

```
var wire_settings = {}
var operations_array = [];
setOperationsArray = async () => {
    var index; for ( index=0; index<arr.length; index++ ) {
        var gate = arr[ index ].split( " " ).filter( item => item );
        if ( gate[ gate.length - 1 ] == "INV" ) {
            if ( !wire_settings[ gate[ 2 ] ] ) {
                var input_preimage_0 = getRand( 32 );
                var input_preimage_1 = getRand( 32 );
                wire_settings[ gate[ 2 ] ] = [input_preimage_0, input_preimage_1];
            } else {
                var input_preimage_0 = wire_settings[ gate[ 2 ] ][ 0 ];
                var input_preimage_1 = wire_settings[ gate[ 2 ] ][ 1 ];
            }
            var output_preimage_0 = getRand( 32 );
            var output_preimage_1 = getRand( 32 );
            var input_hash_0 = await sha256( hexToBytes( input_preimage_0 ) );
            var input_hash_1 = await sha256( hexToBytes( input_preimage_1 ) );
            var output_hash_0 = await sha256( hexToBytes( output_preimage_0 ) );
            var output_hash_1 = await sha256( hexToBytes( output_preimage_1 ) );
            wire_settings[ gate[ 3 ] ] = [output_preimage_0, output_preimage_1];
            operations_array.push( ["INV", ["input_preimages", input_preimage_0, input_preimage_1], ["output_preimages", output_preimage_0, output_preimage_1], ["input_hashes", input_hash_0, input_hash_1], ["output_hashes", output_hash_0, output_hash_1], `var w_${gate[ 3 ]} = INV( wires[ ${gate[ 2 ]} ] )`] );
        }
        if ( gate[ gate.length - 1 ] == "AND" ) {
            if ( !wire_settings[ gate[ 2 ] ] ) {
                var first_input_preimage_0 = getRand( 32 );
                var first_input_preimage_1 = getRand( 32 );
                wire_settings[ gate[ 2 ] ] = [first_input_preimage_0, first_input_preimage_1];
            } else {
                var first_input_preimage_0 = wire_settings[ gate[ 2 ] ][ 0 ];
                var first_input_preimage_1 = wire_settings[ gate[ 2 ] ][ 1 ];
            }
            if ( !wire_settings[ gate[ 3 ] ] ) {
                var second_input_preimage_0 = getRand( 32 );
                var second_input_preimage_1 = getRand( 32 );
                wire_settings[ gate[ 3 ] ] = [second_input_preimage_0, second_input_preimage_1];
            } else {
                var second_input_preimage_0 = wire_settings[ gate[ 3 ] ][ 0 ];
                var second_input_preimage_1 = wire_settings[ gate[ 3 ] ][ 1 ];
            }
            var output_preimage_0 = getRand( 32 );
            var output_preimage_1 = getRand( 32 );
            var first_input_hash_0 = await sha256( hexToBytes( first_input_preimage_0 ) );
            var first_input_hash_1 = await sha256( hexToBytes( first_input_preimage_1 ) );
            var second_input_hash_0 = await sha256( hexToBytes( second_input_preimage_0 ) );
            var second_input_hash_1 = await sha256( hexToBytes( second_input_preimage_1 ) );
            var output_hash_0 = await sha256( hexToBytes( output_preimage_0 ) );
            var output_hash_1 = await sha256( hexToBytes( output_preimage_1 ) );
            wire_settings[ gate[ 4 ] ] = [output_preimage_0, output_preimage_1];
            operations_array.push( ["AND", ["first_input_preimages", first_input_preimage_0, first_input_preimage_1], ["second_input_preimages", second_input_preimage_0, second_input_preimage_1], ["output_preimages", output_preimage_0, output_preimage_1], ["first_input_hashes", first_input_hash_0, first_input_hash_1], ["second_input_hashes", second_input_hash_0, second_input_hash_1], ["output_hashes", output_hash_0, output_hash_1], `var w_${gate[ 4 ]} = AND( wires[ ${gate[ 2 ]} ], wires[ ${gate[ 3 ]} ] )`] );
        }
        if ( gate[ gate.length - 1 ] == "XOR" ) {
            if ( !wire_settings[ gate[ 2 ] ] ) {
                var first_input_preimage_0 = getRand( 32 );
                var first_input_preimage_1 = getRand( 32 );
                wire_settings[ gate[ 2 ] ] = [first_input_preimage_0, first_input_preimage_1];
            } else {
                var first_input_preimage_0 = wire_settings[ gate[ 2 ] ][ 0 ];
                var first_input_preimage_1 = wire_settings[ gate[ 2 ] ][ 1 ];
            }
            if ( !wire_settings[ gate[ 3 ] ] ) {
                var second_input_preimage_0 = getRand( 32 );
                var second_input_preimage_1 = getRand( 32 );
                wire_settings[ gate[ 3 ] ] = [second_input_preimage_0, second_input_preimage_1];
            } else {
                var second_input_preimage_0 = wire_settings[ gate[ 3 ] ][ 0 ];
                var second_input_preimage_1 = wire_settings[ gate[ 3 ] ][ 1 ];
            }
            var output_preimage_0 = getRand( 32 );
            var output_preimage_1 = getRand( 32 );
            var first_input_hash_0 = await sha256( hexToBytes( first_input_preimage_0 ) );
            var first_input_hash_1 = await sha256( hexToBytes( first_input_preimage_1 ) );
            var second_input_hash_0 = await sha256( hexToBytes( second_input_preimage_0 ) );
            var second_input_hash_1 = await sha256( hexToBytes( second_input_preimage_1 ) );
            var output_hash_0 = await sha256( hexToBytes( output_preimage_0 ) );
            var output_hash_1 = await sha256( hexToBytes( output_preimage_1 ) );
            wire_settings[ gate[ 4 ] ] = [output_preimage_0, output_preimage_1];
            operations_array.push( ["XOR", ["first_input_preimages", first_input_preimage_0, first_input_preimage_1], ["second_input_preimages", second_input_preimage_0, second_input_preimage_1], ["output_preimages", output_preimage_0, output_preimage_1], ["first_input_hashes", first_input_hash_0, first_input_hash_1], ["second_input_hashes", second_input_hash_0, second_input_hash_1], ["output_hashes", output_hash_0, output_hash_1], `var w_${gate[ 4 ]} = XOR( wires[ ${gate[ 2 ]} ], wires[ ${gate[ 3 ]} ] )`] );
        }
    }
}
setOperationsArray();
```

Every logic gate now has a corresponding js line and the info Paul and Vicky need to make corresponding tapleaves. Paul and Vicky should be able to independently go through each entry in the operations_array and create 4 tapleaves for the INVs and 8 tapleaves for the ANDs. Then Paul can commit to revealing the 64 input bits. Paul must also reveal all subsequent output bits, and he can figure out which ones to reveal by running the javascript function.

For example, in the operations array, operation 0 says its javascript function is var w_65 = INV( w_63 ). w_63 should get set when Paul is committing to his input bits, so once that’s done he can just use javascript’s built-in eval() method to run eval( `INV( w_63 )` ) and learn what w_65 should be. (I find it works well if I only pass the part of the js function *after* the equal sign to the eval() method.) If eval() returns a 0, Paul can reveal the first output preimage; if a 1, Paul can reveal the second output preimage. In both cases, Paul needs to push the preimage he is revealing to an array called preimages_to_reveal, which he will share with Vicky. Then repeat til there are no more bits to reveal. This will all be done below in the section "Reveal the input and output bits."

# Generate the bit commitments

Paul will need to create these bit commitments privately.

```
var initial_commitment_preimages = [];
var initial_commitment_hashes = [];
var generateBitCommitments = async () => {
    var i; for ( i=0; i<64; i++ ) {
        initial_commitment_preimages.push( wire_settings[ String( i ) ] );
        var preimage_0 = wire_settings[ String( i ) ][ 0 ];
        var preimage_1 = wire_settings[ String( i ) ][ 1 ];
        var hash_0 = await sha256( hexToBytes( preimage_0 ) );
        var hash_1 = await sha256( hexToBytes( preimage_1 ) );
        initial_commitment_hashes.push( [ hash_0, hash_1 ] );
    }
}
generateBitCommitments();

var subsequent_commitment_preimages = [];
var subsequent_commitment_hashes = [];
operations_array.forEach( operation => {
    if ( operation[ 0 ] == "INV" ) subsequent_commitment_preimages.push( [ operation[ 2 ][ 1 ], operation[ 2 ][ 2 ] ] );
    if ( operation[ 0 ] == "INV" ) subsequent_commitment_hashes.push( [ operation[ 4 ][ 1 ], operation[ 4 ][ 2 ] ] );
    if ( operation[ 0 ] == "AND" ) subsequent_commitment_preimages.push( [ operation[ 3 ][ 1 ], operation[ 3 ][ 2 ] ] );
    if ( operation[ 0 ] == "AND" ) subsequent_commitment_hashes.push( [ operation[ 6 ][ 1 ], operation[ 6 ][ 2 ] ] );
    if ( operation[ 0 ] == "XOR" ) subsequent_commitment_preimages.push( [ operation[ 3 ][ 1 ], operation[ 3 ][ 2 ] ] );
    if ( operation[ 0 ] == "XOR" ) subsequent_commitment_hashes.push( [ operation[ 6 ][ 1 ], operation[ 6 ][ 2 ] ] );
});
```

Now Paul must share the commitment hashes with Vicky, namely, initial_commitment_hashes and subsequent_commitment_hashes.

# Generate the bit commitment address

Paul and Vicky should both do this independently, then compare the bitcoin addresses to make sure they are the same.

```
var leaf1 = [
    "OP_10",
    "OP_CHECKSEQUENCEVERIFY",
    //todo: change "ab".repeat( 32 ) to Vicky’s key
    "ab".repeat( 32 ),
    "OP_CHECKSIG"
];

var leaf2 = [
    "OP_0",
    //todo: change "ba".repeat( 32 ) to Paul’s key
    "ba".repeat( 32 ),
    "OP_CHECKSIGADD",
    //todo: change "ab".repeat( 32 ) to Vicky’s key
    "ab".repeat( 32 ),
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

initial_commitment_hashes.forEach( hash_pair => {
    bit_commitment_script += bit_commitment_template.replace( "INSERT_16_BYTE_HERE", hash_pair[ 0 ] ).replace( "INSERT_17_BYTE_HERE", hash_pair[ 1 ] );
});

subsequent_commitment_hashes.forEach( hash_pair => {
    bit_commitment_script += bit_commitment_template.replace( "INSERT_16_BYTE_HERE", hash_pair[ 0 ] ).replace( "INSERT_17_BYTE_HERE", hash_pair[ 1 ] );
});

//todo: restore the following lines and delete the final OP_1

//bit_commitment_script += `
//    <"Pauls_key">
//    OP_CHECKSIG
//`;

bit_commitment_script += `
    OP_1
`;

var bit_commitment_script_array = bit_commitment_script.replaceAll( "\n\n", "\n" ).replaceAll( " ", "" ).split( "\n" );
bit_commitment_script_array.splice( 0, 1 );
bit_commitment_script_array.splice( bit_commitment_script_array.length - 1, 1 );

var leaf3 = bit_commitment_script_array;

var scripts = [leaf1, leaf2, leaf3];
var tree = scripts.map( s => tapscript.Tap.encodeScript( s ) );
var selected_script = scripts[ 2 ];
var target = tapscript.Tap.encodeScript( selected_script );
var pubkey = "ab".repeat( 32 );
var [ tpubkey, cblock ] = tapscript.Tap.getPubKey(pubkey, { tree, target });
var bit_commitment_address = tapscript.Address.p2tr.fromPubKey( tpubkey, "regtest" );
```

# Generate the anti-contradiction address

Paul and Vicky should both do this independently, then compare the bitcoin addresses to make sure they are the same.

```
//todo: replace the last OP_1 with these two lines:
//<Vicky’s key>
//OP_CHECKSIG
var anti_contradiction_template = `
    OP_SHA256
    INSERT_16_BYTE_HERE
    OP_EQUALVERIFY
    OP_SHA256
    INSERT_17_BYTE_HERE
    OP_EQUALVERIFY
    OP_1
`;

var anti_contradiction_scripts = [];

initial_commitment_hashes.forEach( hash_pair => {
    var filled_in = anti_contradiction_template.replace( "INSERT_16_BYTE_HERE", hash_pair[ 0 ] ).replace( "INSERT_17_BYTE_HERE", hash_pair[ 1 ] );
    var leaf = filled_in.replaceAll( "\n\n", "\n" ).replaceAll( " ", "" ).split( "\n" );
    leaf.splice( 0, 1 );
    leaf.splice( leaf.length - 1, 1 );
    anti_contradiction_scripts.push( leaf );
});

subsequent_commitment_hashes.forEach( hash_pair => {
    var filled_in = anti_contradiction_template.replace( "INSERT_16_BYTE_HERE", hash_pair[ 0 ] ).replace( "INSERT_17_BYTE_HERE", hash_pair[ 1 ] );
    var leaf = filled_in.replaceAll( "\n\n", "\n" ).replaceAll( " ", "" ).split( "\n" );
    leaf.splice( 0, 1 );
    leaf.splice( leaf.length - 1, 1 );
    anti_contradiction_scripts.push( leaf );
});

var last_leaf = [
    "OP_10",
    "OP_CHECKSEQUENCEVERIFY",
    //todo: change "ba".repeat( 32 ) to Paul’s key
    "ba".repeat( 32 ),
    "OP_CHECKSIG"
];

anti_contradiction_scripts.push( last_leaf );

var tree = anti_contradiction_scripts.map( s => tapscript.Tap.encodeScript( s ) );
var selected_script = anti_contradiction_scripts[ 0 ];
var target = tapscript.Tap.encodeScript( selected_script );
var pubkey = "ab".repeat( 32 );
var [ tpubkey, cblock ] = tapscript.Tap.getPubKey(pubkey, { tree, target });
var anti_contradiction_address = tapscript.Address.p2tr.fromPubKey( tpubkey, "regtest" );
```

# Generate the challenge address

```
var templates = {}
//todo: replace the last OP_1 in each template with these two lines:
//<"Vickys_key">
//OP_CHECKSIG
templates[ "OP_NOT_00" ] = `
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
    OP_1
`;
templates[ "OP_NOT_01" ] = `
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
    OP_1
`;
templates[ "OP_NOT_10" ] = `
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
    OP_1
`;
templates[ "OP_NOT_11" ] = `
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
    OP_1
`;
templates[ "OP_BOOLAND_000" ] = `
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
    OP_1
`;
templates[ "OP_BOOLAND_001" ] = `
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
    OP_1
`;
templates[ "OP_BOOLAND_010" ] = `
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
    OP_1
`;
templates[ "OP_BOOLAND_011" ] = `
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
    OP_1
`;
templates[ "OP_BOOLAND_100" ] = `
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
    OP_1
`;
templates[ "OP_BOOLAND_101" ] = `
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
    OP_1
`;
templates[ "OP_BOOLAND_110" ] = `
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
    OP_1
`;
templates[ "OP_BOOLAND_111" ] = `
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
    OP_1
`;
templates[ "OP_XOR_000" ] = `
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
    OP_1
`;
templates[ "OP_XOR_001" ] = `
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
    OP_1
`;
templates[ "OP_XOR_010" ] = `
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
    OP_1
`;
templates[ "OP_XOR_011" ] = `
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
    OP_1
`;
templates[ "OP_XOR_100" ] = `
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
    OP_1
`;
templates[ "OP_XOR_101" ] = `
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
    OP_1
`;
templates[ "OP_XOR_110" ] = `
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
    OP_1
`;
templates[ "OP_XOR_111" ] = `
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
    OP_1
`;

var challenge_scripts = [];

var i; for ( i=0; i<operations_array.length; i++ ) {
    if ( operations_array[ i ][ 0 ] == "INV" ) {
        var input_hash_pair = [ operations_array[ i ][ 3 ][ 1 ], operations_array[ i ][ 3 ][ 2 ] ];
        var output_hash_pair = [ operations_array[ i ][ 4 ][ 1 ], operations_array[ i ][ 4 ][ 2 ] ];
        var filled_in_templates = [];
        filled_in_templates.push(
            templates[ "OP_NOT_00" ].replace( "INSERT_INPUT_HERE", input_hash_pair[ 0 ] ).replace( "INSERT_OUTPUT_HERE", output_hash_pair[ 0 ] ),
            templates[ "OP_NOT_01" ].replace( "INSERT_INPUT_HERE", input_hash_pair[ 0 ] ).replace( "INSERT_OUTPUT_HERE", output_hash_pair[ 1 ] ),
            templates[ "OP_NOT_10" ].replace( "INSERT_INPUT_HERE", input_hash_pair[ 1 ] ).replace( "INSERT_OUTPUT_HERE", output_hash_pair[ 0 ] ),
            templates[ "OP_NOT_11" ].replace( "INSERT_INPUT_HERE", input_hash_pair[ 1 ] ).replace( "INSERT_OUTPUT_HERE", output_hash_pair[ 1 ] )
        );
        filled_in_templates.forEach( template => {
            var leaf = template.replaceAll( "\n\n", "\n" ).replaceAll( " ", "" ).split( "\n" );
            leaf.splice( 0, 1 );
            leaf.splice( leaf.length - 1, 1 );
            challenge_scripts.push( leaf );
        });
    }
    if ( operations_array[ i ][ 0 ] == "AND" ) {
        var first_hash_pair = [ operations_array[ i ][ 4 ][ 1 ], operations_array[ i ][ 4 ][ 2 ] ];
        var second_hash_pair = [ operations_array[ i ][ 5 ][ 1 ], operations_array[ i ][ 5 ][ 2 ] ];
        var output_hash_pair = [ operations_array[ i ][ 6 ][ 1 ], operations_array[ i ][ 6 ][ 2 ] ];
        var filled_in_templates = [];
        filled_in_templates.push(
            templates[ "OP_BOOLAND_000" ].replace( "INSERT_FIRST_INPUT_HERE", first_hash_pair[ 0 ] ).replace( "INSERT_SECOND_INPUT_HERE", second_hash_pair[ 0 ] ).replace( "INSERT_OUTPUT_HERE", output_hash_pair[ 0 ] ),
            templates[ "OP_BOOLAND_001" ].replace( "INSERT_FIRST_INPUT_HERE", first_hash_pair[ 0 ] ).replace( "INSERT_SECOND_INPUT_HERE", second_hash_pair[ 0 ] ).replace( "INSERT_OUTPUT_HERE", output_hash_pair[ 1 ] ),
            templates[ "OP_BOOLAND_010" ].replace( "INSERT_FIRST_INPUT_HERE", first_hash_pair[ 0 ] ).replace( "INSERT_SECOND_INPUT_HERE", second_hash_pair[ 1 ] ).replace( "INSERT_OUTPUT_HERE", output_hash_pair[ 0 ] ),
            templates[ "OP_BOOLAND_011" ].replace( "INSERT_FIRST_INPUT_HERE", first_hash_pair[ 0 ] ).replace( "INSERT_SECOND_INPUT_HERE", second_hash_pair[ 1 ] ).replace( "INSERT_OUTPUT_HERE", output_hash_pair[ 1 ] ),
            templates[ "OP_BOOLAND_100" ].replace( "INSERT_FIRST_INPUT_HERE", first_hash_pair[ 1 ] ).replace( "INSERT_SECOND_INPUT_HERE", second_hash_pair[ 0 ] ).replace( "INSERT_OUTPUT_HERE", output_hash_pair[ 0 ] ),
            templates[ "OP_BOOLAND_101" ].replace( "INSERT_FIRST_INPUT_HERE", first_hash_pair[ 1 ] ).replace( "INSERT_SECOND_INPUT_HERE", second_hash_pair[ 0 ] ).replace( "INSERT_OUTPUT_HERE", output_hash_pair[ 1 ] ),
            templates[ "OP_BOOLAND_110" ].replace( "INSERT_FIRST_INPUT_HERE", first_hash_pair[ 1 ] ).replace( "INSERT_SECOND_INPUT_HERE", second_hash_pair[ 1 ] ).replace( "INSERT_OUTPUT_HERE", output_hash_pair[ 0 ] ),
            templates[ "OP_BOOLAND_111" ].replace( "INSERT_FIRST_INPUT_HERE", first_hash_pair[ 1 ] ).replace( "INSERT_SECOND_INPUT_HERE", second_hash_pair[ 1 ] ).replace( "INSERT_OUTPUT_HERE", output_hash_pair[ 1 ] ),
        );
        filled_in_templates.forEach( template => {
            var leaf = template.replaceAll( "\n\n", "\n" ).replaceAll( " ", "" ).split( "\n" );
            leaf.splice( 0, 1 );
            leaf.splice( leaf.length - 1, 1 );
            challenge_scripts.push( leaf );
        });
    }
    if ( operations_array[ i ][ 0 ] == "XOR" ) {
        var first_hash_pair = [ operations_array[ i ][ 4 ][ 1 ], operations_array[ i ][ 4 ][ 2 ] ];
        var second_hash_pair = [ operations_array[ i ][ 5 ][ 1 ], operations_array[ i ][ 5 ][ 2 ] ];
        var output_hash_pair = [ operations_array[ i ][ 6 ][ 1 ], operations_array[ i ][ 6 ][ 2 ] ];
        var filled_in_templates = [];
        filled_in_templates.push(
            templates[ "OP_XOR_000" ].replace( "INSERT_FIRST_INPUT_HERE", first_hash_pair[ 0 ] ).replace( "INSERT_SECOND_INPUT_HERE", second_hash_pair[ 0 ] ).replace( "INSERT_OUTPUT_HERE", output_hash_pair[ 0 ] ),
            templates[ "OP_XOR_001" ].replace( "INSERT_FIRST_INPUT_HERE", first_hash_pair[ 0 ] ).replace( "INSERT_SECOND_INPUT_HERE", second_hash_pair[ 0 ] ).replace( "INSERT_OUTPUT_HERE", output_hash_pair[ 1 ] ),
            templates[ "OP_XOR_010" ].replace( "INSERT_FIRST_INPUT_HERE", first_hash_pair[ 0 ] ).replace( "INSERT_SECOND_INPUT_HERE", second_hash_pair[ 1 ] ).replace( "INSERT_OUTPUT_HERE", output_hash_pair[ 0 ] ),
            templates[ "OP_XOR_011" ].replace( "INSERT_FIRST_INPUT_HERE", first_hash_pair[ 0 ] ).replace( "INSERT_SECOND_INPUT_HERE", second_hash_pair[ 1 ] ).replace( "INSERT_OUTPUT_HERE", output_hash_pair[ 1 ] ),
            templates[ "OP_XOR_100" ].replace( "INSERT_FIRST_INPUT_HERE", first_hash_pair[ 1 ] ).replace( "INSERT_SECOND_INPUT_HERE", second_hash_pair[ 0 ] ).replace( "INSERT_OUTPUT_HERE", output_hash_pair[ 0 ] ),
            templates[ "OP_XOR_101" ].replace( "INSERT_FIRST_INPUT_HERE", first_hash_pair[ 1 ] ).replace( "INSERT_SECOND_INPUT_HERE", second_hash_pair[ 0 ] ).replace( "INSERT_OUTPUT_HERE", output_hash_pair[ 1 ] ),
            templates[ "OP_XOR_110" ].replace( "INSERT_FIRST_INPUT_HERE", first_hash_pair[ 1 ] ).replace( "INSERT_SECOND_INPUT_HERE", second_hash_pair[ 1 ] ).replace( "INSERT_OUTPUT_HERE", output_hash_pair[ 0 ] ),
            templates[ "OP_XOR_111" ].replace( "INSERT_FIRST_INPUT_HERE", first_hash_pair[ 1 ] ).replace( "INSERT_SECOND_INPUT_HERE", second_hash_pair[ 1 ] ).replace( "INSERT_OUTPUT_HERE", output_hash_pair[ 1 ] ),
        );
        filled_in_templates.forEach( template => {
            var leaf = template.replaceAll( "\n\n", "\n" ).replaceAll( " ", "" ).split( "\n" );
            leaf.splice( 0, 1 );
            leaf.splice( leaf.length - 1, 1 );
            challenge_scripts.push( leaf );
        });
    }
}

var last_leaf = [
    "OP_10",
    "OP_CHECKSEQUENCEVERIFY",
    //todo: change "ba".repeat( 32 ) to Paul’s key
    "ba".repeat( 32 ),
    "OP_CHECKSIG"
];

challenge_scripts.push( last_leaf );

var tree = challenge_scripts.map( s => tapscript.Tap.encodeScript( s ) );
var selected_script = challenge_scripts[ challenge_scripts.length - 1 ];
var target = tapscript.Tap.encodeScript( selected_script );
var pubkey = "ab".repeat( 32 );
var [ tpubkey, cblock ] = tapscript.Tap.getPubKey(pubkey, { tree, target });
var challenge_address = tapscript.Address.p2tr.fromPubKey( tpubkey, "regtest" );
```

# Reveal the input and output bits

At this point, Paul should reveal his 64 input bits. Previously, he shared an array called "initial_commitment_hashes" with Vicky, but in that array he only committed to a hash representing 1 and a hash representing 0 -- he did not say which bits are actually 1s and which ones are 0s. Now he will do that by revealing the "1" preimage or the "0" preimage for each bit. In many circuits, Paul would do this by taking information from elsewhere; for example, if someone wanted Paul to reveal a blockhash at a certain height, he might wait til that blockheight arrives, then grab the blockhash, then use it to determine the input bits for his program. In the case of supplying 64 “0” bits, Paul just reveals all the preimages that correspond to 0.

```
var preimages_to_reveal = [];
var wires = [];

initial_commitment_preimages.forEach( ( preimage_pair, index ) => {
    wires.push( 0 );
    preimages_to_reveal.push( preimage_pair[ 0 ] );
});

var i; for ( i=0; i<operations_array.length; i++ ) {
    var fn_to_run = operations_array[ i ][ operations_array[ i ].length - 1 ].split( "= " )[ 1 ];
    var preimage_to_reveal = eval( fn_to_run );
    wires.push( preimage_to_reveal );
    preimage_to_reveal = Number( preimage_to_reveal ) + 1;
    if ( operations_array[ i ][ 0 ] == "INV" ) preimages_to_reveal.push( operations_array[ i ][ 2 ][ preimage_to_reveal ] );
    if ( operations_array[ i ][ 0 ] == "AND" ) preimages_to_reveal.push( operations_array[ i ][ 3 ][ preimage_to_reveal ] );
    if ( operations_array[ i ][ 0 ] == "XOR" ) preimages_to_reveal.push( operations_array[ i ][ 3 ][ preimage_to_reveal ] );
}
```

# Verification

Before doing the funding address I want to jump ahead: how will Vicky verify the information Paul gives her? What should she do if he gives her *no* information, or *random* information? Ordinarily, after the funding address is funded, Paul will do some computation to identify what data he needs to pass into the boolean circuit he and Vicky agreed on in order to produce the result intended by their contract. This “input” data will be in the form of ones and zeros, and, as the code above demonstrates, Paul uses this data to create his “preimages_to_reveal” array.

Paul should reveal that array to Vicky and Vicky should remove duplicate preimages:

```
var preimages_from_paul = preimages_to_reveal;
preimages_from_paul = removeDuplicates( preimages_from_paul );
```

Then Vicky should take each revealed preimage and match it up with the tapleaves that use its hash. There is a function that does that up under dependencies, it is called compareTapleaves(), and the function I’m about to tell you about will run it. If any preimage has a hash that is not in *any* tapleaf, Vicky should discard it. There is a function for *that* up under dependencies too, it is called discardUnusedPreimages(), and this is where you should use it.

```
discardUnusedPreimages();
```

Vicky *expects* a certain number of preimages from Paul. If, after discarding unused preimages, she has *less than* the right number of preimages, she should move Paul’s money to the bit commitment address to force Paul to give her the preimages she needs.

```
if ( preimages_from_paul.length < number_of_preimages_to_expect ) alert( "oh no! Go put your counterparty’s money in the bit commitment address!" );
```

Once she has all the preimages she needs, she should make a mapping of each preimage to the tapleaves it is referenced in.

```
var preimages_and_their_tapleaves = [];
preimages_from_paul.forEach( async preimage => {
    var tapleaves_it_is_in = await compareTapleaves( preimage, challenge_scripts );
    preimages_and_their_tapleaves.push( tapleaves_it_is_in );
});
```

Next Vicky needs several things. One is what kind of operation is used in that tapleaf. She can get this by expanding upon the operations_array:

```
expanded_array = [];
operations_array.forEach( item => {
    if ( item[ 0 ] == "INV" ) expanded_array.push( ["OP_NOT"],["OP_NOT"],["OP_NOT"],["OP_NOT"] );
    if ( item[ 0 ] == "AND" ) expanded_array.push( ["OP_BOOLAND"],["OP_BOOLAND"],["OP_BOOLAND"],["OP_BOOLAND"], ["OP_BOOLAND"],["OP_BOOLAND"],["OP_BOOLAND"],["OP_BOOLAND"] );
    if ( item[ 0 ] == "XOR" ) expanded_array.push( ["OP_XOR"],["OP_XOR"],["OP_XOR"],["OP_XOR"], ["OP_XOR"],["OP_XOR"],["OP_XOR"],["OP_XOR"] );
});
expanded_array.push( "multisig" );
```

Now, for each script in the script array, she can look up its corresponding operation in the expanded array.

Next, Vicky needs to run through each tapleaf in the preimages_and_their_tapleaves array and, for every index in it, she should add an entry to its corresponding operations_array referencing the preimages that are used in that tapleaf.

```
preimages_and_their_tapleaves.forEach( ( preimage, index ) => {
    preimage.forEach( num => {
        expanded_array[ num ].push( preimages_from_paul[ index ] );
    });
});
```

Vicky can’t run an OP_NOT without it having 2 preimages and she can’t run an OP_BOOLAND or an OP_XOR without it having 3 preimages. But she should not discard the un-runnable ones because that would throw off the indexing that makes these operations match their tapleaf counterparts in the challenge_scripts array. What she *should* do is put the preimages in the right order in the ones she *might* be able to run:

```
expanded_array.forEach( async ( item, operation_index ) => {
    if ( item[ 0 ] == "OP_NOT" && item.length == 3 ) {
        var hash_order = [];
        challenge_scripts[ operation_index ].forEach( element => {
            if ( element.length == 64 ) hash_order.push( element );
        });
        if ( operation_index == 3 ) console.log( "hash_order:", hash_order )
        var preimages_in_order = [];
        var index; for ( index=0; index<expanded_array[ operation_index ].length; index++ ) {
            var preimage = expanded_array[ operation_index ][ index ];
            if ( !index ) continue;
            var hash = await sha256( hexToBytes( preimage ) );
            hash_order.forEach( ( ordered_hash, hash_index ) => {
                if ( ordered_hash == hash ) preimages_in_order[ hash_index ] = preimage;
            });
        }
        expanded_array[ operation_index ] = ["OP_NOT", ...preimages_in_order];
        if ( operation_index == 3 ) console.log( "preimages in order:", preimages_in_order );
    }
    if ( item[ 0 ] == "OP_BOOLAND" && item.length == 4 ) {
        var hash_order = [];
        var operation_index = 1;
        challenge_scripts[ operation_index ].forEach( element => {
            if ( element.length == 64 ) hash_order.push( element );
        });
        var preimages_in_order = [];
        var index; for ( index=0; index<expanded_array[ operation_index ].length; index++ ) {
            var preimage = expanded_array[ operation_index ][ index ];
            if ( !index ) return;
            var hash = await sha256( hexToBytes( preimage ) );
            hash_order.forEach( ( ordered_hash, hash_index ) => {
                if ( ordered_hash == hash ) preimages_in_order[ hash_index ] = preimage;
            });
        }
        expanded_array[ operation_index ] = ["OP_BOOLAND", ...preimages_in_order];
    }
    if ( item[ 0 ] == "OP_XOR" && item.length == 4 ) {
        var hash_order = [];
        var operation_index = 1;
        challenge_scripts[ operation_index ].forEach( element => {
            if ( element.length == 64 ) hash_order.push( element );
        });
        var preimages_in_order = [];
        var index; for ( index=0; index<expanded_array[ operation_index ].length; index++ ) {
            var preimage = expanded_array[ operation_index ][ index ];
            if ( !index ) return;
            var hash = await sha256( hexToBytes( preimage ) );
            hash_order.forEach( ( ordered_hash, hash_index ) => {
                if ( ordered_hash == hash ) preimages_in_order[ hash_index ] = preimage;
            });
        }
        expanded_array[ operation_index ] = ["OP_XOR", ...preimages_in_order];
    }
});
```

Vicky can now check if Paul’s preimages allow her to spend Paul’s money using any of the tapleaves they are referenced in. To facilitate that, it seemed wise to me to make a javascript variant of each tapleaf that can take in Paul’s preimages as input and see if the corresponding tapleaf can be spent.

Under dependencies there are functions called OP_NOT and OP_BOOLAND which are javascript variants of the OP_NOT and OP_BOOLAND functions I wrote in bitcoin script. If Vicky runs all of the OP_NOTs and OP_BOOLANDs that she has the preimages to, the functions will tell her if she can use Paul’s preimages to spend Paul’s money using the corresponding tapleaf.

```
expanded_array.forEach( async ( item, index ) => {
    if ( item[ 0 ] == "OP_NOT" && item.length == 3 ) {
        var i_can_spend = await OP_NOT( item[ 1 ], challenge_scripts[ index ][ 2 ], Number( challenge_scripts[ index ][ 4 ].substring( challenge_scripts[ index ][ 4 ].length - 1 ) ), item[ 2 ], challenge_scripts[ index ][ 8 ], Number( challenge_scripts[ index ][ 10 ].substring( challenge_scripts[ index ][ 10 ].length - 1 ) ) );
        if ( i_can_spend.startsWith( "you can spend" ) ) {alert( i_can_spend + ` -- oh yeah and the index of the tapleaf I can spend with is ${index}` );} else {console.log( `I have the preimages for tapleaf ${index}, which was an OP_NOT tapleaf, but I cannot spend with it, meaning its calculations were done correctly` );}
    }
    if ( item[ 0 ] == "OP_BOOLAND" && item.length == 4 ) {
        var i_can_spend = await OP_BOOLAND( item[ 1 ], challenge_scripts[ index ][ 2 ], Number( challenge_scripts[ index ][ 4 ].substring( challenge_scripts[ index ][ 4 ].length - 1 ) ), item[ 2 ], challenge_scripts[ index ][ 7 ], Number( challenge_scripts[ index ][ 9 ].substring( challenge_scripts[ index ][ 9 ].length - 1 ) ), item[ 3 ], challenge_scripts[ index ][ 13 ], Number( challenge_scripts[ index ][ 15 ].substring( challenge_scripts[ index ][ 15 ].length - 1 ) ) );
        if ( i_can_spend.startsWith( "you can spend" ) ) {alert( i_can_spend + ` -- oh yeah and the index of the tapleaf I can spend with is ${index}` );} else {console.log( `I have the preimages for tapleaf ${index}, which was an OP_BOOLAND tapleaf, but I cannot spend with it, meaning its calculations were done correctly` );}
    }
    if ( item[ 0 ] == "OP_XOR" && item.length == 4 ) {
        var i_can_spend = await OP_XOR( item[ 1 ], challenge_scripts[ index ][ 2 ], Number( challenge_scripts[ index ][ 4 ].substring( challenge_scripts[ index ][ 4 ].length - 1 ) ), item[ 2 ], challenge_scripts[ index ][ 7 ], Number( challenge_scripts[ index ][ 9 ].substring( challenge_scripts[ index ][ 9 ].length - 1 ) ), item[ 3 ], challenge_scripts[ index ][ 13 ], Number( challenge_scripts[ index ][ 15 ].substring( challenge_scripts[ index ][ 15 ].length - 1 ) ) );
        if ( i_can_spend.startsWith( "you can spend" ) ) {alert( i_can_spend + ` -- oh yeah and the index of the tapleaf I can spend with is ${index}` );} else {console.log( `I have the preimages for tapleaf ${index}, which was an OP_XOR tapleaf, but I cannot spend with it, meaning its calculations were done correctly` );}
    }
});
```

Vicky may want to identify the input and output bits for a given circuit. In the current circuit, all of the input bits are arguments to the OP_NOT functions, so she can get them like this:

```
var wires = [];
var logInputs = async () => {
    //var input_prep = ``;
    var j; for ( j=0; j<initial_commitment_hashes.length; j++ ) {
        var index = j;
        var input = initial_commitment_hashes[ index ];
        //input_prep += `Input #${index + 1} is `;
        var i; for ( i=0; i<preimages_from_paul.length; i++ ) {
            var preimage = preimages_from_paul[ i ];
            var hash = await sha256( hexToBytes( preimage ) );
            if ( hash == input[ 0 ] ) {
                wires[ i ] = 0;
                //input_prep += `0 because the preimage to ${input[ 0 ]} was revealed (its preimage is ${preimage})\n\n`;
                break;
            }
            if ( hash == input[ 1 ] ) {
                wires[ i ] = 1;
                //input_prep += `1 because the preimage to ${input[ 1 ]} was revealed (its preimage is ${preimage})\n\n`;
                break;
            }
        }
    }
    //console.log( input_prep );
}
logInputs();
```

Vicky can construct the boolean circuit in javascript and plug these inputs into it to get a 0 or a 1 as an output. Here is a js version of the circuit:

```
//var js_version = ``;
var index; for ( index=0; index<arr.length; index++ ) {
    var gate = arr[ index ].split( " " ).filter( item => item );
    if ( gate[ gate.length - 1 ] == "INV" ) {
        wires[ gate[ 3 ] ] = eval( `INV( wires[ ${gate[ 2 ]} ] )` );
        //js_version += `wires[ ${gate[ 3 ]} ] = INV( wires[ ${gate[ 2 ]} ] )\n`;
    }
    if ( gate[ gate.length - 1 ] == "AND" ) {
        wires[ gate[ 4 ] ] = eval( `AND( wires[ ${gate[ 2 ]} ], wires[ ${gate[ 3 ]} ] )` );
        //js_version += `wires[ ${gate[ 4 ]} ] = AND( wires[ ${gate[ 2 ]} ], wires[ ${gate[ 3 ]} ] )\n`;
    }
    if ( gate[ gate.length - 1 ] == "XOR" ) {
        wires[ gate[ 4 ] ] = eval( `XOR( wires[ ${gate[ 2 ]} ], wires[ ${gate[ 3 ]} ] )` );
        //js_version += `wires[ ${gate[ 4 ]} ] = AND( wires[ ${gate[ 2 ]} ], wires[ ${gate[ 3 ]} ] )\n`;
    }
}
```

TODO: Since I know what inputs Paul gave and whether or not they are all zeros I should probably tell Vicky something like “Here is what Paul presented to you: 000…000. Based on the value returned by the last gate, which is a 1, not only do *you* know it is entirely composed of 0s, but your bitcoin transaction knows too.” BTW in the zero-equal circuit, the wire on the last line contains the output bit. But the wire on the last line is not always the wire with the highest number (e.g. in the sha256 circuit the highest wire is 135840 but the wire on the last line is 135712), and I suspect the output bits are always the last n wires with the highest numbers, where n is equal to the number of output bits defined in the first three lines of each bristol circuit. I should use these info to programmatically look up the output of these functions and ensure they are correct.

# Funding address

The only thing we need now is to have Vicky and Paul both send some sats to a “funding address” with two spending paths. (1) After 10 blocks, if Vicky hasn’t challenged Paul, he should be able to unilaterally take the sats. (2) Otherwise, a 2 of 2 multisig path should let them cosign a bunch of transactions so that Vicky may challenge Paul by moving the money to the bit commitment address (if necessary) and/or to the anti-contradiction address (if necessary) and/or to the challenge address. Once in those addresses, Vicky may take the money if Paul contradicts himself, fails a challenge, or doesn’t reveal his bit commitments, otherwise Paul may take the money after 10 blocks. (Also note that Vicky and Paul should cosign two transactions from the bit commitment address, one that moves the funds from the bit commitment address into the challenge address, and another that moves the funds from the bit commitment address into the anti-contradiction address, that way Vicky may still challenge Paul if, after forcing him to reveal his inputs, he reveals a false input or contradicts himself.) 

In this example, Vicky will contribute 1000 sats and Paul will contribute 10000. Thus, if Paul doesn't reveal inputs that satisfy the circuit, he will pay a penalty of 10000 sats, but if he does, he will earn a payment of 1000 sats.

Here is the first tapleaf:

```
<10>
OP_CHECKSEQUENCEVERIFY
<"Pauls_key">
OP_CHECKSIG
```

And the second:

```
<0>
<"Pauls_key">
OP_CHECKSIGADD
<"Vickys_key">
OP_CHECKSIGADD
<2>
OP_EQUAL
```

TODO: actually create and test the funding address.

# Execution

Now the protocol is ready: Paul and Vicky fund the funding address, 1000 sats from Vicky to pay Paul for the computation, and 10000 sats from Paul in case he does not perform the computation correctly. Next, Paul reveals his preimages to Vicky. If he does not, she puts his money into the bit commitment address to *force* him to, or she will get 10000 sats from him if he *still* doesn't. Assuming Paul reveals the preimages, Vicky checks that the corresponding bits, when passed as input to the bristol circuit, produce a valid path that results in the expected value. If they do, great! After 10 blocks, Paul can take back his 10000 sats *and* Vicky's 1000 sat payment. But if Paul's input bits do not produce a valid result, Vicky can use either the anti-contradiction address or the challenge address to take Paul's 10000 sats.

# Conclusion

We executed a zero-checking function using a bristol circuit. We used bitcoin to verify the correct execution of that circuit or penalize its incorrect execution. Bitcoin is therefore functionally equivalent to a turing complete programming environment: just use a turing machine to create any computable function, and use bitcoin to verify/penalize its correct/incorrect execution.

This method brings *any computable function* to bitcoin. It can be expanded upon to do SPV proofs of the existence of a utxo at a given blockheight, allowing for covenants. It can also allow a central party to do computations for a group, where any lies or incorrect computations result in the loss of a bond. This should allow for sidechains and rollups to be built out directly on bitcoin.

I look forward to a future of additional experimentation on these lines. Bitcoin has scripting super powers now. Let's use them to their fullest potential.
