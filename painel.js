const socket = io();
const videoPlayer = document.getElementById('video-player');
const idleContent = document.getElementById('idle-content');
const chamadaContent = document.getElementById('chamada-content');
const displayCaixa = document.getElementById('caixa-numero');
const avisoContent = document.getElementById('aviso-content');
const audioDing = document.getElementById('audio-ding');
const overlay = document.getElementById('overlay-inicio');
const transicao = document.getElementById('transicao-mascote');
const imagemMascote = document.getElementById('imagem-mascote');
const config = Object.assign({ esperaInicialMs: 5000, esperaAposChamadaMs: 10000, duracaoTransicaoMs: 3000, transicaoMascote: true }, window.PAINEL_CONFIG || {});

let videoList = [];
let currentVideoIndex = 0;
let videosCarregados;
let iniciado = false;
let estado = 'inicio';
let ciclo = 0;
let tentativaVideo = 0;
let idleTimer, transitionTimer, speechTimer, playbackTimer, voiceTimer;
let avisoAtual = null;
const filaAvisos = [];
const videosComErro = new Set();

function tempo(valor, padrao) {
    return Number.isFinite(Number(valor)) && Number(valor) >= 0 ? Number(valor) : padrao;
}
function registrarPainel() {
    socket.emit('registrar-painel', { iniciado, voz: 'speechSynthesis' in window });
}
socket.on('connect', registrarPainel);

async function carregarVideos() {
    try {
        const res = await fetch('/api/videos');
        if (!res.ok) throw new Error('Não foi possível listar os vídeos.');
        const files = await res.json();
        videoList = Array.isArray(files) ? files.filter(file => typeof file === 'string') : [];
        if (videoList.length) {
            videoPlayer.src = `/videos/${encodeURIComponent(videoList[0])}`;
            videoPlayer.load();
        }
    } catch (error) {
        videoList = [];
        console.warn('Lista de vídeos indisponível:', error.message);
    }
}
function limparTemporizadores() {
    [idleTimer, transitionTimer, speechTimer, playbackTimer, voiceTimer].forEach(clearTimeout);
}
function ocultarTransicao() { transicao.classList.remove('ativa'); }
function pausarVideo() {
    tentativaVideo += 1;
    document.body.classList.remove('video-active');
    videoPlayer.pause();
    videoPlayer.style.display = 'none';
    ocultarTransicao();
    avisoContent.classList.remove('falando');
}
function mostrarEspera() {
    estado = 'espera';
    pausarVideo();
    chamadaContent.style.display = 'none';
    avisoContent.style.display = 'none';
    idleContent.style.display = 'block';
}
function agendarRetorno(atraso) {
    const cicloAgendado = ciclo;
    idleTimer = setTimeout(() => {
        if (cicloAgendado !== ciclo) return;
        mostrarEspera();
        if (filaAvisos.length) falarProximoAviso();
        else mostrarVideo(cicloAgendado);
    }, atraso);
}
function iniciarSistema() {
    if (iniciado) return;
    iniciado = true;
    overlay.classList.add('encerrado');
    mostrarEspera();
    // Habilita o elemento de áudio a partir do clique na própria TV.
    if (audioDing) {
        audioDing.volume = 0;
        audioDing.play().then(() => {
            audioDing.volume = 1;
            if (estado !== 'chamada') {
                audioDing.pause();
                audioDing.currentTime = 0;
            }
        }).catch(() => { audioDing.volume = 1; });
    }
    videosCarregados = carregarVideos();
    registrarPainel();
    agendarRetorno(tempo(config.esperaInicialMs, 5000));
}

async function mostrarVideo(cicloEsperado) {
    await videosCarregados;
    if (!iniciado || cicloEsperado !== ciclo || !videoList.length) return;
    if (['video', 'transicao', 'aviso', 'chamada'].includes(estado)) return;
    videosComErro.clear();
    const duracao = tempo(config.duracaoTransicaoMs, 3000);
    const usarTransicao = config.transicaoMascote && duracao > 0 && imagemMascote.complete && imagemMascote.naturalWidth > 0;
    if (!usarTransicao) {
        estado = 'video';
        reproduzirVideo(cicloEsperado);
        return;
    }
    estado = 'transicao';
    transicao.style.setProperty('--duracao-voo', `${duracao}ms`);
    ocultarTransicao();
    void transicao.offsetWidth;
    // Exibe o primeiro quadro por baixo do voo sem consumir o começo do vídeo.
    document.body.classList.add('video-active');
    videoPlayer.style.display = 'block';
    transicao.classList.add('ativa');
    transitionTimer = setTimeout(() => {
        if (cicloEsperado !== ciclo || estado !== 'transicao') return;
        estado = 'video';
        ocultarTransicao();
        reproduzirVideo(cicloEsperado);
    }, duracao);
}
function reproduzirVideo(cicloEsperado) {
    if (cicloEsperado !== ciclo || estado !== 'video' || !videoList.length) return;
    const tentativa = ++tentativaVideo;
    document.body.classList.add('video-active');
    videoPlayer.style.display = 'block';
    clearTimeout(playbackTimer);
    playbackTimer = setTimeout(() => tratarErroVideo(cicloEsperado, tentativa), 8000);
    videoPlayer.play().catch(error => {
        if (error.name !== 'AbortError') tratarErroVideo(cicloEsperado, tentativa);
    });
}
function proximoVideo() {
    if (estado !== 'video' || !videoList.length) return;
    currentVideoIndex = (currentVideoIndex + 1) % videoList.length;
    videoPlayer.src = `/videos/${encodeURIComponent(videoList[currentVideoIndex])}`;
    reproduzirVideo(ciclo);
}
function tratarErroVideo(cicloEsperado, tentativa = tentativaVideo) {
    if (cicloEsperado !== ciclo || tentativa !== tentativaVideo || estado !== 'video') return;
    clearTimeout(playbackTimer);
    videosComErro.add(currentVideoIndex);
    if (videosComErro.size >= videoList.length) {
        mostrarEspera();
        return;
    }
    do { currentVideoIndex = (currentVideoIndex + 1) % videoList.length; }
    while (videosComErro.has(currentVideoIndex));
    videoPlayer.src = `/videos/${encodeURIComponent(videoList[currentVideoIndex])}`;
    reproduzirVideo(cicloEsperado);
}
videoPlayer.addEventListener('ended', proximoVideo);
videoPlayer.addEventListener('playing', () => clearTimeout(playbackTimer));
videoPlayer.addEventListener('error', () => tratarErroVideo(ciclo));

function informarAviso(aviso, status) { socket.emit('aviso-status', { id: aviso.id, status }); }
function vozPortugues() {
    const vozes = window.speechSynthesis.getVoices();
    return vozes.find(voz => voz.lang.replace('_', '-').toLowerCase() === 'pt-br') || vozes.find(voz => /^pt/i.test(voz.lang));
}
function falarProximoAviso() {
    if (!iniciado || estado === 'chamada' || avisoAtual || !filaAvisos.length) return;
    ciclo += 1;
    const cicloAviso = ciclo;
    limparTemporizadores();
    pausarVideo();
    if (audioDing) audioDing.pause();
    estado = 'aviso';
    avisoAtual = filaAvisos.shift();
    const aviso = avisoAtual;
    idleContent.style.display = 'none';
    chamadaContent.style.display = 'none';
    avisoContent.style.display = 'block';
    let encerrado = false;
    const encerrar = status => {
        if (encerrado || cicloAviso !== ciclo || avisoAtual !== aviso) return;
        encerrado = true;
        clearTimeout(voiceTimer);
        avisoContent.classList.remove('falando');
        informarAviso(aviso, status);
        avisoAtual = null;
        if (status === 'erro' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
        agendarRetorno(filaAvisos.length ? 500 : 1500);
    };
    if (!('speechSynthesis' in window)) { encerrar('erro'); return; }
    window.speechSynthesis.cancel();
    const fala = new SpeechSynthesisUtterance(aviso.texto);
    fala.lang = 'pt-BR';
    fala.volume = 1;
    const voz = vozPortugues();
    if (voz) fala.voice = voz;
    fala.onstart = () => {
        if (cicloAviso === ciclo && avisoAtual === aviso) {
            avisoContent.classList.add('falando');
            informarAviso(aviso, 'falando');
        }
    };
    fala.onend = () => encerrar('concluido');
    fala.onerror = () => encerrar('erro');
    voiceTimer = setTimeout(() => encerrar('erro'), 120000);
    try { window.speechSynthesis.speak(fala); } catch (error) { encerrar('erro'); }
}
socket.on('novo-aviso', aviso => {
    if (!aviso || typeof aviso.id !== 'string' || typeof aviso.texto !== 'string' || aviso.texto.length > 500) return;
    if (!iniciado) { informarAviso(aviso, 'erro'); return; }
    if (filaAvisos.length >= 5) { informarAviso(aviso, 'fila-cheia'); return; }
    if (avisoAtual?.id === aviso.id || filaAvisos.some(item => item.id === aviso.id)) return;
    filaAvisos.push(aviso);
    informarAviso(aviso, 'recebido');
    if (estado !== 'chamada' && estado !== 'aviso') falarProximoAviso();
});

socket.on('nova-chamada', numero => {
    const caixa = Number(numero);
    if (!Number.isInteger(caixa) || caixa < 1 || caixa > 5) return;
    ciclo += 1;
    const cicloChamada = ciclo;
    limparTemporizadores();
    if (avisoAtual) {
        filaAvisos.unshift(avisoAtual);
        informarAviso(avisoAtual, 'interrompido');
        avisoAtual = null;
    }
    pausarVideo();
    estado = 'chamada';
    idleContent.style.display = 'none';
    avisoContent.style.display = 'none';
    chamadaContent.style.display = 'block';
    displayCaixa.innerText = `CAIXA ${caixa}`;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (!iniciado) return;
    if (audioDing) {
        audioDing.volume = 1;
        audioDing.currentTime = 0;
        audioDing.play().catch(() => console.warn('Áudio indisponível neste navegador.'));
    }
    speechTimer = setTimeout(() => {
        if (cicloChamada !== ciclo || !('speechSynthesis' in window)) return;
        const fala = new SpeechSynthesisUtterance(`Caixa ${caixa}`);
        fala.lang = 'pt-BR';
        fala.volume = 1;
        const voz = vozPortugues();
        if (voz) fala.voice = voz;
        window.speechSynthesis.speak(fala);
    }, 2000);
    agendarRetorno(tempo(config.esperaAposChamadaMs, 10000));
});

setInterval(() => fetch('/').catch(() => {}), 600000);
