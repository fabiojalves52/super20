const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir arquivos estáticos diretamente da raiz do projeto
app.use(express.static(__dirname));

// Rota principal para os atendentes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota para o painel de visualização
app.get('/painel', (req, res) => {
    res.sendFile(path.join(__dirname, 'painel.html'));
});

// Comunicação via Socket.IO
io.on('connection', (socket) => {
    console.log('Um usuário conectou');

    socket.on('chamar-caixa', (numeroCaixa) => {
        console.log(`Chamando Caixa ${numeroCaixa}`);
        io.emit('nova-chamada', numeroCaixa);
    });

    socket.on('disconnect', () => {
        console.log('Um usuário desconectou');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
