$('.view_caveats').onclick = () => {
    if ($('.caveats').classList.contains("hidden")) $('.caveats').classList.remove("hidden");
    else $('.caveats').classList.add("hidden");
}
$('.view_zero_checker').onclick = () => {
    $('.zero_checker').classList.remove("hidden");
    $('.size_checker').classList.add("hidden");
    $('.shifter').classList.add("hidden");
    $('.addition').classList.add("hidden");
    $('.adder_8bit').classList.add("hidden");
    $('.sha256').classList.add("hidden");
    $('.cpu_8bit_64_cycles').classList.add("hidden");
}
$('.view_size_checker').onclick = () => {
    $('.zero_checker').classList.add("hidden");
    $('.size_checker').classList.remove("hidden");
    $('.shifter').classList.add("hidden");
    $('.addition').classList.add("hidden");
    $('.adder_8bit').classList.add("hidden");
    $('.sha256').classList.add("hidden");
    $('.cpu_8bit_64_cycles').classList.add("hidden");
}
$('.view_addition').onclick = () => {
    $('.zero_checker').classList.add("hidden");
    $('.size_checker').classList.add("hidden");
    $('.shifter').classList.add("hidden");
    $('.addition').classList.remove("hidden");
    $('.adder_8bit').classList.add("hidden");
    $('.sha256').classList.add("hidden");
    $('.cpu_8bit_64_cycles').classList.add("hidden");
}
$('.view_shifter').onclick = () => {
    $('.zero_checker').classList.add("hidden");
    $('.size_checker').classList.add("hidden");
    $('.addition').classList.add("hidden");
    $('.adder_8bit').classList.add("hidden");
    $('.shifter').classList.remove("hidden");
    $('.sha256').classList.add("hidden");
    $('.cpu_8bit_64_cycles').classList.add("hidden");
}
$('.view_sha256').onclick = () => {
    $('.zero_checker').classList.add("hidden");
    $('.size_checker').classList.add("hidden");
    $('.addition').classList.add("hidden");
    $('.adder_8bit').classList.add("hidden");
    $('.shifter').classList.add("hidden");
    $('.sha256').classList.remove("hidden");
    $('.cpu_8bit_64_cycles').classList.add("hidden");
}
$('.view_adder_8bit').onclick = () => {
    $('.zero_checker').classList.add("hidden");
    $('.size_checker').classList.add("hidden");
    $('.addition').classList.add("hidden");
    $('.adder_8bit').classList.remove("hidden");
    $('.shifter').classList.add("hidden");
    $('.sha256').classList.add("hidden");
    $('.cpu_8bit_64_cycles').classList.add("hidden");
}
$('.view_cpu_8bit_64_cycles').onclick = () => {
    $('.zero_checker').classList.add("hidden");
    $('.size_checker').classList.add("hidden");
    $('.addition').classList.add("hidden");
    $('.adder_8bit').classList.add("hidden");
    $('.shifter').classList.add("hidden");
    $('.sha256').classList.add("hidden");
    $('.cpu_8bit_64_cycles').classList.remove("hidden");
}
