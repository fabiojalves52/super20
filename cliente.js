const socket = io();

/**
 * Envia o comando de chamada para o servidor
 * @param {number} numero - O número do caixa (1 a 5)
 */
function chamar(numero) {
    console.log(`Solicitando chamada para o Caixa ${numero}`);
    socket.emit('chamar-caixa', numero);
}
