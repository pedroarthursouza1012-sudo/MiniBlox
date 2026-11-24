const db = window.supabase.createClient(
    'https://zgpjxxbmqsvlenpovsrj.supabase.co',
    'sb_publishable_ivRzmEX7mWQpI-r5U6OqqQ_LAp2cLtW'
);

function traduzirErro(erro) {
    const msg = erro.message || '';
    if (msg.includes('nome_em_uso')) return 'Esse nome já está em uso!';
    if (msg.includes('credenciais_invalidas')) return 'Nome ou senha incorretos!';
    if (msg.includes('nome_invalido')) return 'O nome precisa ter de 3 a 25 caracteres!';
    if (msg.includes('senha_invalida')) return 'A senha precisa ter de 6 a 25 caracteres!';
    return 'Erro ao conectar com o servidor. Tente novamente.';
}