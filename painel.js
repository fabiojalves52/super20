const socket = io();
const display = document.getElementById('caixa-numero');
const container = document.querySelector('.texto-chamada');
const audioDing = document.getElementById('audio-ding');

// Escuta por novas chamadas vindas do servidor
socket.on('nova-chamada', (numero) => {
    atualizarPainel(numero);
});

/**
 * Atualiza o visual do painel com animação e som
 * @param {number} numero - O número do caixa chamado
 */
function atualizarPainel(numero) {
    // 1. Inicia animação de fade-out
    container.classList.add('fade-out');

    setTimeout(() => {
        // 2. Atualiza o texto
        display.innerText = `CAIXA ${numero}`;
        
        // 3. Toca o som de alerta (ding)
        tocarAlerta();

        // 4. Executa a voz com um atraso de 2 segundos (2000 milissegundos)
        // Isso garante que o "ding" termine antes da voz começar
        setTimeout(() => {
            falar(`Caixa ${numero}`);
        }, 2000); 

        // 5. Finaliza animação com fade-in
        container.classList.remove('fade-out');
    }, 500);
}
/**
 * Toca o arquivo de áudio ding.mp3
 */
function tocarAlerta() {
    if (audioDing) {
        audioDing.currentTime = 0;
        audioDing.play().catch(e => console.error("Erro ao tocar áudio:", e));
    }
}

/**
 * Utiliza a API de síntese de voz do navegador
 * @param {string} texto - O texto a ser falado
 */
/**
 * Utiliza a API de síntese de voz do navegador
 * @param {string} texto - O texto a ser falado
 */
function falar(texto) {
    if ('speechSynthesis' in window) {
        // Cancela qualquer fala anterior para não embolar
        window.speechSynthesis.cancel();

        const msg = new SpeechSynthesisUtterance();
        msg.text = texto;
        msg.lang = 'pt-BR';
        
        // --- ALTERAÇÕES PARA VOLUME E CLAREZA ---
        msg.volume = 1;   // Força o volume no máximo (0 a 1)
        msg.rate = 0.9;   // Fala um pouco mais devagar para ser mais nítido
        msg.pitch = 1;    // Tom de voz normal
        
        window.speechSynthesis.speak(msg);
    }
}
