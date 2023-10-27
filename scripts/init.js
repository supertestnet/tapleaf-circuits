var $ = document.querySelector.bind(document);
var $$ = document.querySelectorAll.bind(document);
var url_params = new URLSearchParams(window.location.search);
var url_keys = url_params.keys();
var $_GET = {}
for (var key of url_keys) $_GET[key] = url_params.get(key);

// Common

var network = "testnet";
if ($_GET["network"] == "regtest") network = "regtest";
var arr = [];
var number_of_preimages_to_expect = null;
//the following line refers to the "second" number on line 2 of a bristol circuit file
//e.g. if the second line is 2 64 32 then the following line would be 64 and it means
//how many bits are in the first number passed to the function as input
var number_of_inputs = null;
var number_of_outputs = null;
var wire_settings = {}
var wire_hashes = [];
var operations_array = [];
var initial_commitment_preimages = [];
var initial_commitment_hashes = [];
var subsequent_commitment_preimages = [];
var subsequent_commitment_hashes = [];
var funding_address = null;
var funding_to_paul_tpubkey = null;
var funding_to_paul_tapleaf = null;
var funding_to_anywhere_else_tapleaf = null;
var funding_to_paul_cblock = null;
var funding_to_paul_script = null;
var funding_to_anywhere_else_script = null;
var funding_to_anywhere_else_cblock = null;
var bit_commitment_address = null;
var bit_commitment_tpubkey = null;
var bit_commitment_tapleaf = null;
var bit_commitment_cblock = null;
var bit_commitment_script = null;
var commitment_to_anywhere_else_tapleaf = null;
var commitment_to_anywhere_else_script = null;
var commitment_to_anywhere_else_cblock = null;
var anti_contradiction_address = null;
var anti_contradiction_tpubkey = null;
var anti_contradiction_cblock = null;
var anti_contradiction_tapleaf = null;
var anti_contradiction_script = null;
var challenge_address = null;
var challenge_tpubkey = null;
var challenge_tapleaf = null;
var challenge_cblock = null;
var challenge_script = null;
var privkey = getRand(32);
var pubkey = nobleSecp256k1.getPublicKey(privkey, true).substring(2);
var starter_address = tapscript.Address.p2tr.encode(pubkey, network);
var vickys_key = null;
var starter_txid = null;
var starter_vout = null;
var starter_amt = null;
var presigned_tx_sigs = {}
var earnings_txhex = null;
var preimages_to_reveal = [];
var wires = [];
var promise = null;
var challenge_scripts = [];

// Vicky

//the following line refers to the "first" number on line 2 of a bristol circuit file
//e.g. if the second line is 2 64 32 then the following line would be 2 and it means
//how many numbers are being passed to the function as input
var number_of_numbers_being_passed_as_input = null;
//the following line refers to the "third" number on line 2 of a bristol circuit file
//e.g. if the second line is 2 64 32 then the following line would be 32 and it means
//how many bits are in the second number passed to the function as input
var number_of_inputs_2 = null;
var copy_of_wire_settings = {}
var copy_of_operations_array = [];
var copy_of_initial_commitment_preimages = [];
var copy_of_initial_commitment_hashes = [];
var copy_of_subsequent_commitment_preimages = [];
var copy_of_subsequent_commitment_hashes = [];
var pauls_key = null;
var funding_scripts = null;
var funding_tpubkey = null;
var funding_block = null;
var preimages_from_paul = [];
var to_challenge_txhex = null;
var to_challenge_txid = null;
var to_challenge_vout = null;
var to_challenge_amt = null;
var program = null;
var pauls_promise = null;