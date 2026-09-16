const socket = io({
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000
});

const indicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');

socket.on('connect', () => {
    if(indicator) {
        indicator.classList.remove('bg-danger');
        indicator.classList.add('bg-success');
    }
    if(statusText) statusText.innerText = "online";
});

socket.on('disconnect', () => {
    if(indicator) {
        indicator.classList.remove('bg-success');
        indicator.classList.add('bg-danger');
    }
    if(statusText) statusText.innerText = "offline";
});

function chamar(numero) {
    if (socket.connected) {
        socket.emit('chamar-caixa', numero);
    } else {
        location.reload(); 
    }
}
