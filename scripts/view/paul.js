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

$('.view_caveats').onclick = () => {
    if ($('.caveats').classList.contains("hidden")) $('.caveats').classList.remove("hidden");
    else $('.caveats').classList.add("hidden");
}
$('.view_zero_checker').onclick = () => {
    $('.zero_checker').classList.remove("hidden");
    $('.size_checker').classList.add("hidden");
    $('.addition').classList.add("hidden");
}
$('.view_size_checker').onclick = () => {
    $('.zero_checker').classList.add("hidden");
    $('.size_checker').classList.remove("hidden");
    $('.addition').classList.add("hidden");
}
$('.view_addition').onclick = () => {
    $('.zero_checker').classList.add("hidden");
    $('.size_checker').classList.add("hidden");
    $('.addition').classList.remove("hidden");
}
