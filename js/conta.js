const personagemEl = document.getElementById('personagem');
const nomeEl = document.getElementById('nomeUsuario');
const btnSair = document.getElementById('btnSair');

// Sem login, volta para a página inicial (lá aparece o cadastro)
if (localStorage.getItem('situacao') !== 'cadastrado') {
    window.location.href = 'index.html';
}

// Mesmas tabelas de cores do vestiario.js
const CORES_CABELO = {
    cabelo1: 'rgb(139, 57, 57)',
    cabelo2: 'rgb(255, 223, 45)',
    cabelo3: 'rgb(255, 201, 101)',
    cabelo4: 'rgb(37, 37, 37)',
    cabelo5: 'rgb(191, 197, 202)'
};

const PELES = {
    pele1: 'rgb(240, 177, 140)',
    pele2: 'rgb(204, 110, 73)',
    pele3: 'rgb(255, 157, 118)',
    pele4: 'rgb(255, 203, 183)',
    pele5: 'rgb(143, 78, 53)'
};

const CALCAS = {
    azul: 'rgb(51, 31, 99)',
    bege: '#d4b089',
    preta: 'rgb(51, 48, 48)'
};

const PERSONAGEM_PADRAO = {
    cabelo: 'cabeloM',
    corCabelo: 'cabelo4',
    pele: 'pele1',
    camisa: 'corInicial',
    calca: 'azul'
};

function carregarPersonagem() {
    try {
        const salvo = JSON.parse(localStorage.getItem('personagem'));
        return { ...PERSONAGEM_PADRAO, ...(salvo || {}) };
    } catch (erro) {
        console.error('Erro ao carregar personagem:', erro);
        return { ...PERSONAGEM_PADRAO };
    }
}

function aplicarPersonagem(p) {
    personagemEl.classList.remove('masculino', 'feminino');
    personagemEl.classList.add(p.cabelo === 'cabeloM' ? 'masculino' : 'feminino');

    personagemEl.style.setProperty('--cabelo', CORES_CABELO[p.corCabelo] || CORES_CABELO.cabelo4);
    personagemEl.style.setProperty('--pele', PELES[p.pele] || PELES.pele1);
    personagemEl.style.setProperty('--calca', CALCAS[p.calca] || CALCAS.azul);
    personagemEl.style.setProperty('--camisa', `var(--${p.camisa})`);
}

// Nome (textContent evita injetar HTML)
nomeEl.textContent = localStorage.getItem('nome') || 'Jogador';

aplicarPersonagem(carregarPersonagem());

// Logout
btnSair.addEventListener('click', () => {
    if (!confirm('Tem certeza que deseja sair da conta?')) return;

    localStorage.removeItem('nome');
    localStorage.removeItem('situacao');
    localStorage.removeItem('personagem');
    localStorage.removeItem('genero');
    sessionStorage.removeItem('senha');

    window.location.href = 'index.html';
});