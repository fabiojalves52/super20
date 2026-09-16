const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 16384 });
const paineis = new Map();
const avisos = new Map();
const estadosFinais = new Set(['concluido', 'erro', 'fila-cheia', 'desconectado', 'tempo-esgotado']);

app.use(express.static(__dirname, { dotfiles: 'deny', index: false }));
app.get('/api/videos', (req, res) => {
    const pasta = path.join(__dirname, 'videos');
    try {
        const files = fs.existsSync(pasta) ? fs.readdirSync(pasta, { withFileTypes: true }) : [];
        res.json(files.filter(file => file.isFile() && ['.mp4', '.webm', '.ogg'].includes(path.extname(file.name).toLowerCase())).map(file => file.name));
    } catch (error) {
        res.status(500).json([]);
    }
});
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/painel', (req, res) => res.sendFile(path.join(__dirname, 'painel.html')));
app.get('/avisos', (req, res) => res.sendFile(path.join(__dirname, 'avisos.html')));

function atualizarPaineis() {
    io.emit('paineis-status', {
        conectados: paineis.size,
        prontos: [...paineis.values()].filter(painel => painel.pronto).length
    });
}

function informarStatus(aviso, status) {
    const estados = [...aviso.destinos.values()];
    io.to(aviso.remetente).emit('aviso-atualizado', {
        id: aviso.id,
        status,
        total: estados.length,
        concluidos: estados.filter(estado => estado === 'concluido').length,
        erros: estados.filter(estado => estadosFinais.has(estado) && estado !== 'concluido').length
    });
    if (estados.every(estado => estadosFinais.has(estado))) {
        clearTimeout(aviso.expiracao);
        avisos.delete(aviso.id);
    }
}

io.on('connection', socket => {
    socket.on('registrar-painel', dados => {
        paineis.set(socket.id, { pronto: Boolean(dados && dados.iniciado && dados.voz) });
        atualizarPaineis();
    });
    socket.on('consultar-paineis', atualizarPaineis);
    socket.on('chamar-caixa', numero => {
        const caixa = Number(numero);
        if (Number.isInteger(caixa) && caixa >= 1 && caixa <= 5) io.emit('nova-chamada', caixa);
    });
    socket.on('enviar-aviso', (dados, confirmar) => {
        const responder = typeof confirmar === 'function' ? confirmar : () => {};
        const texto = typeof dados?.texto === 'string' ? dados.texto.trim() : '';
        if (texto.length < 3 || texto.length > 500) {
            responder({ ok: false, erro: 'Escreva uma mensagem entre 3 e 500 caracteres.' });
            return;
        }
        const destinos = [...paineis.entries()].filter(([, painel]) => painel.pronto).map(([id]) => id);
        if (!destinos.length) {
            responder({ ok: false, erro: 'Abra /painel na TV e clique para iniciar antes de enviar o aviso.' });
            return;
        }
        if (avisos.size >= 50) {
            responder({ ok: false, erro: 'Há muitos avisos aguardando. Espere uma leitura terminar.' });
            return;
        }
        if (socket.data.ultimoAviso && Date.now() - socket.data.ultimoAviso < 1500) {
            responder({ ok: false, erro: 'Aguarde um instante antes de enviar outro aviso.' });
            return;
        }
        socket.data.ultimoAviso = Date.now();
        const aviso = { id: randomUUID(), remetente: socket.id, destinos: new Map(destinos.map(id => [id, 'enviado'])) };
        aviso.expiracao = setTimeout(() => {
            for (const [id, estado] of aviso.destinos) {
                if (!estadosFinais.has(estado)) aviso.destinos.set(id, 'tempo-esgotado');
            }
            informarStatus(aviso, 'tempo-esgotado');
        }, 600000);
        aviso.expiracao.unref();
        avisos.set(aviso.id, aviso);
        responder({ ok: true, id: aviso.id, paineis: destinos.length });
        destinos.forEach(id => io.to(id).emit('novo-aviso', { id: aviso.id, texto }));
    });
    socket.on('aviso-status', dados => {
        const aviso = avisos.get(dados?.id);
        const status = dados?.status;
        if (!aviso || !aviso.destinos.has(socket.id)) return;
        if (estadosFinais.has(aviso.destinos.get(socket.id))) return;
        if (!['recebido', 'falando', 'concluido', 'interrompido', 'erro', 'fila-cheia'].includes(status)) return;
        aviso.destinos.set(socket.id, status);
        informarStatus(aviso, status);
    });
    socket.on('disconnect', () => {
        paineis.delete(socket.id);
        for (const aviso of avisos.values()) {
            if (aviso.destinos.has(socket.id) && !estadosFinais.has(aviso.destinos.get(socket.id))) {
                aviso.destinos.set(socket.id, 'desconectado');
                informarStatus(aviso, 'desconectado');
            }
        }
        atualizarPaineis();
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor Super 20 rodando na porta ${PORT}`));
