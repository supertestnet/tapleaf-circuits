$('.view_caveats').onclick = () => {
    if ($('.caveats').classList.contains("hidden")) $('.caveats').classList.remove("hidden");
    else $('.caveats').classList.add("hidden");
}
$('.view_zero_checker').onclick = () => {
    $('.zero_checker').classList.remove("hidden");
    $('.size_checker').classList.add("hidden");
    $('.shifter').classList.add("hidden");
    $('.addition').classList.add("hidden");
}
$('.view_size_checker').onclick = () => {
    $('.zero_checker').classList.add("hidden");
    $('.size_checker').classList.remove("hidden");
    $('.shifter').classList.add("hidden");
    $('.addition').classList.add("hidden");
}
$('.view_addition').onclick = () => {
    $('.zero_checker').classList.add("hidden");
    $('.size_checker').classList.add("hidden");
    $('.shifter').classList.add("hidden");
    $('.addition').classList.remove("hidden");
}
$('.view_shifter').onclick = () => {
    $('.zero_checker').classList.add("hidden");
    $('.size_checker').classList.add("hidden");
    $('.addition').classList.add("hidden");
    $('.shifter').classList.remove("hidden");
}
