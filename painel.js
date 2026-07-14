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
 */
function atualizarPainel(numero) {
    // 1. Inicia animação de fade-out
    container.classList.add('fade-out');

    setTimeout(() => {
        // 2. Atualiza o texto
        display.innerText = `CAIXA ${numero}`;
        
        // 3. Toca o som de alerta (ding)
        tocarAlerta();

        // 4. Executa a voz com um atraso de 2 segundos (2000ms)
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
        audioDing.volume = 1;
        audioDing.currentTime = 0;
        audioDing.play().catch(e => console.error("Erro ao tocar áudio:", e));
    }
}

/**
 * Utiliza a API de síntese de voz do navegador
 */
function falar(texto) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Cancela falas anteriores

        const msg = new SpeechSynthesisUtterance();
        msg.text = texto;
        msg.lang = 'pt-BR';
        msg.volume = 1;   
        msg.rate = 0.9;   
        msg.pitch = 1;    
        
        window.speechSynthesis.speak(msg);
    }
}

// --- MANTÉM O SERVIDOR ACORDADO (ANTI-SONO) ---
// Este código fica fora de qualquer função para rodar apenas uma vez
setInterval(() => {
    console.log("Mantendo o servidor ativo...");
    fetch('/').then(() => console.log("Servidor respondeu!")).catch(() => {});
}, 600000); // 10 minutos
