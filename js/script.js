    const cadastro = document.querySelector(".cadastro");
    const submitBtn = document.getElementById("submitBtn")
    let nome = document.getElementById("nome");
    let genero = document.querySelector('input[name="genero"]:checked')?.value;
    const screen = document.querySelector(".screen")
    const form = document.querySelector("form");


    function verificarCadastro(){

        if(localStorage.getItem("situacao")==="cadastrado"){
            cadastro.style.opacity = '0';
            cadastro.style.pointerEvents = "none";
            screen.style.filter = "blur(0px) brightness(1)";
            screen.style.pointerEvents = "auto"; 
        }
        return;
    }

    function cadastrar(){

        if(localStorage.getItem("situacao")==="cadastrado") return;

        screen.style.filter = "blur(15px) brightness(.5)"
        screen.style.pointerEvents = 'none'
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();

            screen.style.filter = "blur(0px) brightness(1)"
            screen.style.pointerEvents = 'auto'
            cadastro.style.opacity = '0'
            cadastro.style.pointerEvents = "none"
            localStorage.setItem("situacao","cadastrado")
    });

    verificarCadastro()
    cadastrar()