const cadastro = document.querySelector(".cadastro");
const nomeInput = document.getElementById("nome");
const screen = document.querySelector(".screen");
const form = document.querySelector("form");
const senhaInput = document.getElementById("password");
const confirmarInput = document.getElementById("passwordConfirm");
let modoCadastro = true;
const tituloAuth = document.getElementById("tituloAuth");
const campoNome = document.getElementById("campoNome");
const campoConfirmar = document.getElementById("campoConfirmar");
const submitBtn = document.getElementById("submitBtn");
const alternarAuth = document.getElementById("alternarAuth");

function abrirPlataforma() {
    cadastro.style.opacity = "0";
    cadastro.style.pointerEvents = "none";

    screen.style.filter = "blur(0px) brightness(1)";
    screen.style.pointerEvents = "auto";
}

function abrirCadastro() {
    cadastro.style.opacity = "1";
    cadastro.style.pointerEvents = "auto";

    screen.style.filter = "blur(15px) brightness(.7)";
    screen.style.pointerEvents = "none";
}

function verificarCadastro() {
    if (localStorage.getItem("situacao") === "cadastrado") {
        abrirPlataforma();
    } else {
        abrirCadastro();
    }
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nome = nomeInput.value.trim();
    const senha = senhaInput.value;
    const confirmarSenha = confirmarInput.value;

    if (nome.length < 3) {
        alert("O nome precisa ter pelo menos 3 caracteres!");
        return;
    }

    if (modoCadastro && senha !== confirmarSenha) {
        alert("As senhas não coincidem!");
        return;
    }

    submitBtn.disabled = true;

    try {
        const resposta = await db.rpc(
            modoCadastro ? 'cadastrar_usuario' : 'login_usuario',
            { p_nome: nome, p_senha: senha }
        );

        if (resposta.error) {
            console.error(resposta.error);
            alert(traduzirErro(resposta.error));
            return;
        }

        const usuario = resposta.data;

        localStorage.setItem("nome", usuario.nome);
        localStorage.setItem("situacao", "cadastrado");
        localStorage.setItem("personagem", JSON.stringify(usuario.personagem));
        sessionStorage.setItem("senha", senha); // necessária para salvar o personagem

        form.reset();
        abrirPlataforma();
    } finally {
        submitBtn.disabled = false;
    }
});

verificarCadastro();

alternarAuth.addEventListener("click", (event) => {
    if (event.target.closest("#alternarBtn")) {
        event.preventDefault();

        modoCadastro = !modoCadastro;

        atualizarFormulario();
    }
});

function atualizarFormulario() {
    form.reset();

    tituloAuth.textContent = modoCadastro
        ? "Cadastrar-se 📄"
        : "Entrar 👤";

    campoNome.style.display = "block";
    campoConfirmar.style.display = modoCadastro ? "block" : "none";

    nomeInput.required = true;
    confirmarInput.required = modoCadastro;

    submitBtn.textContent = modoCadastro
        ? "Cadastrar"
        : "Entrar";

    alternarAuth.innerHTML = modoCadastro
        ? 'Já tem uma conta? <a href="#" id="alternarBtn">Entrar</a>'
        : 'Não tem uma conta? <a href="#" id="alternarBtn">Cadastrar-se</a>';
}