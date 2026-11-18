const cadastro = document.querySelector(".cadastro");
const submitBtn = document.getElementById("submitBtn");
const nomeInput = document.getElementById("nome");
const screen = document.querySelector(".screen");
const form = document.querySelector("form");

function verificarCadastro() {
    if (localStorage.getItem("situacao") === "cadastrado") {
        cadastro.style.opacity = "0";
        cadastro.style.pointerEvents = "none";

        screen.style.filter = "blur(0px) brightness(1)";
        screen.style.pointerEvents = "auto";
    } else {
        screen.style.filter = "blur(15px) brightness(.7)";
        screen.style.pointerEvents = "none";
    }
}

form.addEventListener("submit", (event) => {
    event.preventDefault();

    const nome = nomeInput.value.trim();

    const generoSelecionado = document.querySelector(
        'input[name="genero"]:checked'
    );

    if (!generoSelecionado) return;

    const genero = generoSelecionado.value;

    localStorage.setItem("nome", nome);
    
    if (genero === "man") {
        localStorage.setItem("genero", "masculino");
    } else if (genero === "woman") {
        localStorage.setItem("genero", "feminino");
    } else {
        localStorage.setItem("genero", "naoBinario");
    }

    localStorage.setItem("situacao", "cadastrado");

    screen.style.filter = "blur(0px) brightness(1)";
    screen.style.pointerEvents = "auto";

    cadastro.style.opacity = "0";
    cadastro.style.pointerEvents = "none";
});

verificarCadastro();
