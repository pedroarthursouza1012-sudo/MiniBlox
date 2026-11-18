const personagem = document.querySelector('.personagem');
const genero = localStorage.getItem("genero");
// Seletores
const cabeloSelect = document.querySelector('#cabeloSelect');
const corCabeloSelect = document.querySelector('#corCabeloSelect');
const peleSelect = document.querySelector('#peleSelect');
const camisaSelect = document.querySelector('#camisaSelect');
const calcaSelect = document.querySelector('#calcaSelect');
const salvarBtn = document.querySelector('#salvarPersonagem');
let personagemSalvo = null;

try {
    personagemSalvo = JSON.parse(
        localStorage.getItem('personagem')
    );
} catch (erro) {
    console.error("Erro ao carregar personagem:", erro);
}


if (personagemSalvo) {

    cabeloSelect.value = personagemSalvo.cabelo;
    corCabeloSelect.value = personagemSalvo.corCabelo;
    peleSelect.value = personagemSalvo.pele;
    camisaSelect.value = personagemSalvo.camisa;
    calcaSelect.value = personagemSalvo.calca;

} else {

    cabeloSelect.value = "cabeloM";
    corCabeloSelect.value = "cabelo4";
    peleSelect.value = "pele1";
    calcaSelect.value = "azul";

    if (genero === "masculino") {
        camisaSelect.value = "corInicial";

    } else if (genero === "feminino") {
        cabeloSelect.value = "cabeloF";
        camisaSelect.value = "roxa";

    } else {
        camisaSelect.value = "corInicial";
    }
}



cabeloSelect.addEventListener('change', () => {

    personagem.classList.remove('masculino', 'feminino');

    if (cabeloSelect.value === 'cabeloM') {
        personagem.classList.add('masculino');
    } 

    else {
        personagem.classList.add('feminino');
    }

});

corCabeloSelect.addEventListener('change', () => {

    const cores = {
        cabelo1: 'rgb(139, 57, 57)',
        cabelo2: 'rgb(255, 223, 45)',
        cabelo3: 'rgb(255, 201, 101)',
        cabelo4: 'rgb(37, 37, 37)',
        cabelo5: 'rgb(191, 197, 202)'
    };

    personagem.style.setProperty(
        '--cabelo',
        cores[corCabeloSelect.value]
    );

});

peleSelect.addEventListener('change', () => {

    const peles = {
        pele1: 'rgb(240, 177, 140)',
        pele2: 'rgb(204, 110, 73)',
        pele3: 'rgb(255, 157, 118)',
        pele4: 'rgb(255, 203, 183)',
        pele5: 'rgb(143, 78, 53)'
    };

    personagem.style.setProperty(
        '--pele',
        peles[peleSelect.value]
    );

});

camisaSelect.addEventListener('change', () => {

    personagem.style.setProperty(
        '--camisa',
        `var(--${camisaSelect.value})`
    );

});

calcaSelect.addEventListener('change', () => {

    const calcas = {
        azul: 'rgb(51, 31, 99)',
        bege: '#d4b089',
        preta: 'rgb(51, 48, 48)'
    };

    personagem.style.setProperty(
        '--calca',
        calcas[calcaSelect.value]
    );

});

[
    cabeloSelect,
    corCabeloSelect,
    peleSelect,
    camisaSelect,
    calcaSelect
].forEach(select => {
    select.dispatchEvent(new Event('change'));
});

salvarBtn.addEventListener('click', () => {

    const personagemSalvo = {

        cabelo: cabeloSelect.value,

        corCabelo: corCabeloSelect.value,

        pele: peleSelect.value,

        camisa: camisaSelect.value,

        calca: calcaSelect.value

    };

    localStorage.setItem(
        'personagem',
        JSON.stringify(personagemSalvo)
    );

    alert('Personagem salvo com sucesso!');
    window.location.href = "index.html";
});

