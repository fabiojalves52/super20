const socket = io();
const display = document.getElementById('caixa-numero');
const container = document.querySelector('.texto-chamada');
const audioDing = document.getElementById('audio-ding');

socket.on('nova-chamada', (numero) => {
    console.log("Nova chamada recebida para o Caixa:", numero);
    atualizarPainel(numero);
});

function atualizarPainel(numero) {
    if (!container) return;
    
    // Inicia animação
    container.classList.add('fade-out');

    setTimeout(() => {
        // Atualiza o texto
        if (display) display.innerText = `CAIXA ${numero}`;
        
        // Tenta tocar o som (Ding)
        try {
            tocarAlerta();
        } catch (e) {
            console.error("Erro ao tocar som:", e);
        }

        // Tenta falar (Voz) - Espera 2 segundos
        setTimeout(() => {
            try {
                falar(`Caixa ${numero}`);
            } catch (e) {
                console.error("Erro na voz:", e);
            }
        }, 2000); 

        // Finaliza animação
        container.classList.remove('fade-out');
    }, 500);
}

function tocarAlerta() {
    if (audioDing) {
        audioDing.volume = 1.0;
        audioDing.currentTime = 0;
        // O play() retorna uma promessa, precisamos tratar o erro de autoplay
        audioDing.play().catch(error => {
            console.log("O navegador bloqueou o som automático. Clique na tela uma vez!");
        });
    }
}

function falar(texto) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance();
        msg.text = texto;
        msg.lang = 'pt-BR';
        msg.volume = 1.0;
        msg.rate = 0.9;
        window.speechSynthesis.speak(msg);
    }
}

// ANTI-SONO
setInterval(() => {
    fetch('/').catch(() => {});
}, 600000);

// LEMBRETE: Clique na tela ao carregar a página!
document.addEventListener('click', () => {
    console.log("Áudio autorizado pelo usuário!");
}, { once: true });
