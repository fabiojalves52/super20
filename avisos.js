const socket = io();
const form = document.getElementById('form-aviso');
const texto = document.getElementById('texto-aviso');
const enviar = document.getElementById('enviar-aviso');
const previa = document.getElementById('ouvir-previa');
const retorno = document.getElementById('retorno');
const contador = document.getElementById('contador');
const conexao = document.getElementById('conexao-texto');
const ponto = document.getElementById('ponto-conexao');
const lista = document.getElementById('lista-avisos');
const registros = new Map();
const atualizacoesAntecipadas = new Map();
let paineisProntos = 0;
let enviando = false;
let ouvindo = false;

function atualizarBotao() { enviar.disabled = !socket.connected || !paineisProntos || enviando || texto.value.trim().length < 3; }
function mostrarRetorno(mensagem, erro = false) { retorno.textContent = mensagem; retorno.classList.toggle('erro', erro); }
socket.on('connect', () => {
    conexao.textContent = 'Verificando a conexão com a TV...';
    socket.emit('consultar-paineis');
    atualizarBotao();
});
socket.on('disconnect', () => {
    paineisProntos = 0;
    conexao.textContent = 'Sem conexão. Reconectando...';
    ponto.className = 'offline';
    atualizarBotao();
});
socket.on('paineis-status', dados => {
    paineisProntos = dados.prontos;
    ponto.className = dados.prontos ? 'pronto' : '';
    conexao.textContent = dados.prontos ? `${dados.prontos} ${dados.prontos === 1 ? 'TV pronta para receber avisos' : 'TVs prontas para receber avisos'}` : 'Abra o painel na TV e clique para iniciar.';
    atualizarBotao();
});
texto.addEventListener('input', () => { contador.textContent = `${texto.value.length} / 500`; atualizarBotao(); });
texto.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !enviar.disabled) form.requestSubmit();
});

function pararPrevia() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    ouvindo = false;
    previa.textContent = 'Ouvir neste aparelho';
}
previa.addEventListener('click', () => {
    if (ouvindo) { pararPrevia(); return; }
    const mensagem = texto.value.trim();
    if (!mensagem) { texto.focus(); return; }
    if (!('speechSynthesis' in window)) { mostrarRetorno('Este aparelho não oferece prévia de voz. O envio para a TV continua disponível.', true); return; }
    const fala = new SpeechSynthesisUtterance(mensagem);
    fala.lang = 'pt-BR';
    const vozes = window.speechSynthesis.getVoices();
    const voz = vozes.find(item => item.lang.replace('_', '-').toLowerCase() === 'pt-br');
    if (voz) fala.voice = voz;
    fala.onend = () => { ouvindo = false; previa.textContent = 'Ouvir neste aparelho'; };
    fala.onerror = () => { ouvindo = false; previa.textContent = 'Ouvir neste aparelho'; mostrarRetorno('Não foi possível ouvir a prévia neste aparelho.', true); };
    ouvindo = true;
    previa.textContent = 'Parar prévia';
    window.speechSynthesis.speak(fala);
});

function adicionarRegistro(id, mensagem, paineis) {
    document.getElementById('historico-vazio').hidden = true;
    const item = document.createElement('li');
    const cabecalho = document.createElement('div');
    cabecalho.className = 'aviso-cabecalho';
    const hora = document.createElement('time');
    hora.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const status = document.createElement('span');
    status.className = 'status-aviso';
    status.textContent = `Enviado para ${paineis} ${paineis === 1 ? 'TV' : 'TVs'}. Aguardando leitura.`;
    const conteudo = document.createElement('p');
    conteudo.className = 'aviso-conteudo';
    conteudo.textContent = mensagem;
    cabecalho.append(hora, status);
    item.append(cabecalho, conteudo);
    lista.prepend(item);
    registros.set(id, { item, status });
    if (registros.size > 20) {
        const primeiro = registros.keys().next().value;
        registros.get(primeiro).item.remove();
        registros.delete(primeiro);
    }
    if (atualizacoesAntecipadas.has(id)) {
        atualizarRegistro(atualizacoesAntecipadas.get(id));
        atualizacoesAntecipadas.delete(id);
    }
}
function atualizarRegistro(dados) {
    const registro = registros.get(dados.id);
    if (!registro) {
        if (atualizacoesAntecipadas.size < 50) atualizacoesAntecipadas.set(dados.id, dados);
        return;
    }
    const mensagens = {
        recebido: 'Recebido pela TV. Aguardando leitura.',
        falando: 'Falando na TV...',
        concluido: 'Leitura concluída.',
        interrompido: 'Pausado para chamada de caixa. Será lido novamente.',
        erro: 'A TV não conseguiu reproduzir a voz. Confira o áudio do navegador.',
        'fila-cheia': 'A fila da TV está cheia. Aguarde antes de reenviar.',
        desconectado: 'A TV desconectou. Conclusão não confirmada.',
        'tempo-esgotado': 'A TV não confirmou a conclusão deste aviso.'
    };
    registro.status.textContent = dados.total > 1 && dados.concluidos + dados.erros === dados.total
        ? `${dados.concluidos} de ${dados.total} TVs concluíram a leitura${dados.erros ? `; ${dados.erros} sem conclusão` : ''}.`
        : (mensagens[dados.status] || 'Aguardando leitura.');
}
socket.on('aviso-atualizado', atualizarRegistro);
form.addEventListener('submit', event => {
    event.preventDefault();
    if (enviando) return;
    const mensagem = texto.value.trim();
    if (!socket.connected || !paineisProntos) { mostrarRetorno('Inicie o painel na TV antes de enviar.', true); return; }
    if (mensagem.length < 3 || mensagem.length > 500) { mostrarRetorno('Escreva de 3 a 500 caracteres.', true); return; }
    pararPrevia();
    enviando = true;
    atualizarBotao();
    mostrarRetorno('Enviando...');
    socket.timeout(5000).emit('enviar-aviso', { texto: mensagem }, (erro, resposta) => {
        enviando = false;
        atualizarBotao();
        if (erro) { mostrarRetorno('Não recebemos a confirmação. Confira a TV antes de reenviar para evitar repetição.', true); return; }
        if (!resposta?.ok) { mostrarRetorno(resposta?.erro || 'Não foi possível enviar.', true); return; }
        adicionarRegistro(resposta.id, mensagem, resposta.paineis);
        mostrarRetorno('Aviso enviado. Acompanhe a leitura abaixo.');
    });
});
