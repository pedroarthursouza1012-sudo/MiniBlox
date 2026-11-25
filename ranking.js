(() => {
    'use strict';

    const MODALIDADES = {
        pontuacao_geral: {
            titulo: 'Ranking Geral 🏆',
            subtitulo: 'Soma das pontuações máximas de todos os jogos do MiniBlox.'
        },
        miniblox_run: {
            titulo: 'MiniBlox Run 🏃',
            subtitulo: 'Maiores pontuações na corrida de 3 pistas.'
        },
        antigravity: {
            titulo: 'Antigravity ⇅',
            subtitulo: 'Maiores pontuações invertendo a gravidade.'
        },
        '8ball': {
            titulo: '8ball (SinucaBlox) 🎱',
            subtitulo: 'Melhores pontuações nas mesas de sinuca 8-Ball.'
        },
        knife_hit: {
            titulo: 'Knife Hit 🔪',
            subtitulo: 'Maiores pontuações nos duelos de arremesso de facas.'
        },
        zombie_rush: {
            titulo: 'Zombie Rush 🧟',
            subtitulo: 'Maiores pontuações sobrevivendo às hordas de zumbis.'
        },
        futblox: {
            titulo: 'Futblox ⚽',
            subtitulo: 'Maiores pontuações nos duelos de futebol 2D.'
        },
        vergus: {
            titulo: 'Vergus ⚡',
            subtitulo: 'Maiores pontuações nos labirintos da campanha e modo infinito.'
        },
        punch_blox: {
            titulo: 'Punch Blox 🥊',
            subtitulo: 'Maiores pontuações nos combates da arena.'
        }
    };

    const tituloEl = document.getElementById('tituloModalidade');
    const subtituloEl = document.getElementById('subtituloModalidade');
    const filtrosWrap = document.getElementById('filtrosModalidade');
    const btnAtualizar = document.getElementById('btnAtualizar');
    const btnTentarNovamente = document.getElementById('btnTentarNovamente');

    const meuStatusEl = document.getElementById('meuStatus');
    const meuStatusNomeEl = document.getElementById('meuStatusNome');
    const meuStatusPosEl = document.getElementById('meuStatusPos');
    const meuStatusPtsEl = document.getElementById('meuStatusPts');

    const estadoCarregando = document.getElementById('estadoCarregando');
    const estadoErro = document.getElementById('estadoErro');
    const mensagemErro = document.getElementById('mensagemErro');
    const estadoVazio = document.getElementById('estadoVazio');
    const tabelaWrap = document.getElementById('tabelaWrap');
    const rankingTbody = document.getElementById('rankingTbody');

    const totalJogadoresLabel = document.getElementById('totalJogadoresLabel');
    const ultimaAtualizacaoLabel = document.getElementById('ultimaAtualizacaoLabel');

    let modalidadeAtual = 'pontuacao_geral';
    let requisicaoId = 0;

    function formatarNumero(valor) {
        return Number(valor || 0).toLocaleString('pt-BR');
    }

    function obterMedalha(posicao) {
        if (posicao === 1) return '🥇 1º';
        if (posicao === 2) return '🥈 2º';
        if (posicao === 3) return '🥉 3º';
        return `${posicao}º`;
    }

    function mostrarEstado(estado) {
        estadoCarregando.classList.toggle('hidden', estado !== 'carregando');
        estadoErro.classList.toggle('hidden', estado !== 'erro');
        estadoVazio.classList.toggle('hidden', estado !== 'vazio');
        tabelaWrap.classList.toggle('hidden', estado !== 'dados');
    }

    function atualizarCabecalhoModalidade(mod) {
        const info = MODALIDADES[mod] || MODALIDADES.pontuacao_geral;
        tituloEl.textContent = info.titulo;
        subtituloEl.textContent = info.subtitulo;

        const botoes = filtrosWrap.querySelectorAll('.filtro-btn');
        botoes.forEach((btn) => {
            const ativo = btn.dataset.mod === mod;
            btn.classList.toggle('ativo', ativo);
            btn.setAttribute('aria-selected', String(ativo));
        });
    }

    function renderizarMeuStatus(jogadorAtual) {
        if (!jogadorAtual) {
            meuStatusEl.classList.add('hidden');
            return;
        }

        meuStatusEl.classList.remove('hidden');
        meuStatusNomeEl.textContent = jogadorAtual.nome || 'Jogador';
        meuStatusPtsEl.textContent = `${formatarNumero(jogadorAtual.pontuacao)} pts`;

        if (jogadorAtual.posicao) {
            meuStatusPosEl.textContent = `#${jogadorAtual.posicao}º lugar`;
        } else {
            meuStatusPosEl.textContent = 'Sem pontuação nesta modalidade';
        }
    }

    function renderizarTabela(lista) {
        rankingTbody.innerHTML = '';

        lista.forEach((item) => {
            const tr = document.createElement('tr');
            const pos = Number(item.posicao);

            if (pos === 1) tr.classList.add('top-1');
            else if (pos === 2) tr.classList.add('top-2');
            else if (pos === 3) tr.classList.add('top-3');

            if (item.is_atual) {
                tr.classList.add('minha-linha');
            }

            // Posição
            const tdPos = document.createElement('td');
            const badge = document.createElement('span');
            badge.className = 'pos-badge';
            badge.textContent = obterMedalha(pos);
            tdPos.appendChild(badge);

            // Nome (textContent protege contra XSS)
            const tdNome = document.createElement('td');
            const spanNome = document.createElement('span');
            spanNome.textContent = item.nome || 'Jogador';
            tdNome.appendChild(spanNome);

            if (item.is_atual) {
                const tagVoce = document.createElement('span');
                tagVoce.className = 'voce-tag';
                tagVoce.textContent = 'VOCÊ';
                tdNome.appendChild(tagVoce);
            }

            // Pontuação
            const tdPts = document.createElement('td');
            tdPts.className = 'celula-pts';
            tdPts.textContent = `${formatarNumero(item.pontuacao)} pts`;

            tr.appendChild(tdPos);
            tr.appendChild(tdNome);
            tr.appendChild(tdPts);
            rankingTbody.appendChild(tr);
        });
    }

    async function carregarRanking(mod = modalidadeAtual) {
        const idAtual = ++requisicaoId;
        modalidadeAtual = MODALIDADES[mod] ? mod : 'pontuacao_geral';

        atualizarCabecalhoModalidade(modalidadeAtual);
        mostrarEstado('carregando');
        btnAtualizar.disabled = true;

        try {
            if (typeof db === 'undefined' || !db || !db.rpc) {
                throw new Error('Cliente Supabase não encontrado.');
            }

            const nomeAtual = localStorage.getItem('nome') || null;
            const { data, error } = await db.rpc('obter_ranking', {
                p_modalidade: modalidadeAtual,
                p_limite: 50,
                p_nome_atual: nomeAtual
            });

            // Descarta resposta antiga caso o usuário tenha clicado em outra aba rapidamente
            if (idAtual !== requisicaoId) return;

            if (error) {
                throw error;
            }

            const lista = Array.isArray(data?.ranking) ? data.ranking : [];
            const total = Number(data?.total_jogadores || 0);

            renderizarMeuStatus(data?.jogador_atual || null);
            totalJogadoresLabel.textContent = `${total} ${total === 1 ? 'jogador ranqueado' : 'jogadores ranqueados'}`;

            const agora = new Date();
            ultimaAtualizacaoLabel.textContent = `Atualizado às ${agora.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })}`;

            if (lista.length === 0) {
                mostrarEstado('vazio');
                return;
            }

            renderizarTabela(lista);
            mostrarEstado('dados');
        } catch (err) {
            if (idAtual !== requisicaoId) return;
            console.error('Erro ao carregar ranking:', err);
            mensagemErro.textContent = 'Não foi possível carregar o ranking no Supabase. Verifique sua conexão e tente novamente.';
            mostrarEstado('erro');
        } finally {
            if (idAtual === requisicaoId) {
                btnAtualizar.disabled = false;
            }
        }
    }

    // Troca de modalidade sem recarregar a página
    filtrosWrap.addEventListener('click', (event) => {
        const btn = event.target.closest('.filtro-btn');
        if (!btn) return;
        const mod = btn.dataset.mod;
        if (!mod || mod === modalidadeAtual) return;
        carregarRanking(mod);
    });

    btnAtualizar.addEventListener('click', () => {
        carregarRanking(modalidadeAtual);
    });

    btnTentarNovamente.addEventListener('click', () => {
        carregarRanking(modalidadeAtual);
    });

    carregarRanking(modalidadeAtual);
})();