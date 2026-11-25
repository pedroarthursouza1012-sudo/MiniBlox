(() => {
    'use strict';

    const JOGOS_VALIDOS = new Set([
        'miniblox_run',
        'antigravity',
        '8ball',
        'knife_hit',
        'zombie_rush',
        'futblox',
        'vergus',
        'punch_blox'
    ]);

    const enviosEmAndamento = new Set();
    const ultimoEnvioPorJogo = new Map();
    const JANELA_DEDUP_MS = 2500;

    async function enviarPontuacao(jogoId, pontuacaoFinal) {
        try {
            if (typeof db === 'undefined' || !db || !db.rpc) {
                console.warn('[MiniBlox Pontuação] Cliente Supabase (db) não carregado nesta página.');
                return { ok: false, motivo: 'cliente_nao_carregado' };
            }

            const jogo = String(jogoId || '').trim().toLowerCase();
            if (!JOGOS_VALIDOS.has(jogo)) {
                console.warn('[MiniBlox Pontuação] Identificador de jogo inválido:', jogoId);
                return { ok: false, motivo: 'jogo_invalido' };
            }

            const pontos = Math.floor(Number(pontuacaoFinal));
            if (!Number.isFinite(pontos) || pontos < 0) {
                console.warn('[MiniBlox Pontuação] Pontuação inválida ignorada:', pontuacaoFinal);
                return { ok: false, motivo: 'pontuacao_invalida' };
            }

            if (enviosEmAndamento.has(jogo)) {
                return { ok: false, motivo: 'envio_em_andamento' };
            }

            const agora = Date.now();
            const ultimo = ultimoEnvioPorJogo.get(jogo);
            if (ultimo && ultimo.pontos === pontos && (agora - ultimo.ts) < JANELA_DEDUP_MS) {
                return { ok: false, motivo: 'envio_duplicado' };
            }

            const situacao = localStorage.getItem('situacao');
            const nome = localStorage.getItem('nome');
            const senha = sessionStorage.getItem('senha');

            if (situacao !== 'cadastrado' || !nome) {
                console.info('[MiniBlox Pontuação] Usuário não está logado no MiniBlox.');
                return { ok: false, motivo: 'nao_autenticado' };
            }

            if (!senha) {
                console.warn('[MiniBlox Pontuação] Sessão sem senha no sessionStorage (ex.: aba recarregada ou nova aba). Entre novamente na conta para registrar pontos.');
                return { ok: false, motivo: 'sessao_expirada' };
            }

            enviosEmAndamento.add(jogo);

            const { data, error } = await db.rpc('registrar_pontuacao', {
                p_nome: nome,
                p_senha: senha,
                p_jogo: jogo,
                p_pontuacao: pontos
            });

            if (error) {
                console.error('[MiniBlox Pontuação] Erro ao registrar no Supabase:', error);
                return { ok: false, motivo: 'erro_rpc', error };
            }

            ultimoEnvioPorJogo.set(jogo, { pontos, ts: Date.now() });
            console.info('[MiniBlox Pontuação] Pontuação registrada:', data);
            return { ok: true, data };
        } catch (err) {
            console.error('[MiniBlox Pontuação] Falha inesperada ao enviar pontuação:', err);
            return { ok: false, motivo: 'excecao', error: err };
        } finally {
            const jogoLimpo = String(jogoId || '').trim().toLowerCase();
            enviosEmAndamento.delete(jogoLimpo);
        }
    }

    window.enviarPontuacao = enviarPontuacao;
})();