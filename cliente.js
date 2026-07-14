// Configuração do Socket.IO com reconexão automática
const socket = io({
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000
});

/**
 * Envia o comando de chamada para o servidor
 * @param {number} numero - O número do caixa (1 a 5)
 */
function chamar(numero) {
    // Se o socket estiver conectado ao servidor
    if (socket.connected) {
        console.log(`Solicitando chamada para o Caixa ${numero}`);
        socket.emit('chamar-caixa', numero);
    } else {
        // Se a conexão caiu (servidor dormindo), avisa e recarrega para acordar
