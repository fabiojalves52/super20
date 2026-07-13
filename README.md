# Painel de Chamada em Tempo Real

Este é um sistema completo de painel de chamada para atendimento, desenvolvido com Node.js, Express e Socket.IO.

## Estrutura do Projeto

- `server.js`: Servidor Node.js com Express e Socket.IO.
- `index.html`: Tela de controle para os atendentes (chamada dos caixas).
- `painel.html`: Tela do painel que exibe a chamada em tela cheia.
- `style.css`: Estilização moderna e responsiva.
- `cliente.js`: Lógica de envio de chamadas.
- `painel.js`: Lógica de recepção, animação, som e voz.
- `ding.mp3`: Som de notificação.

## Requisitos

- Node.js instalado (versão 14 ou superior recomendada).

## Como Instalar e Executar

1. **Instalar o Node.js**
   Caso não tenha o Node.js, baixe e instale em: [nodejs.org](https://nodejs.org/)

2. **Instalar as dependências**
   Abra o terminal na pasta do projeto e execute:
   ```bash
   npm install
   ```

3. **Iniciar o servidor**
   No terminal, execute:
   ```bash
   npm start
   ```

4. **Acessar o sistema**
   - **Tela dos Atendentes:** Abra no navegador [http://localhost:3000](http://localhost:3000)
   - **Painel de Chamada:** Abra no navegador [http://localhost:3000/painel](http://localhost:3000/painel) (Recomendado usar em tela cheia - F11).

## Funcionamento

- O sistema suporta 5 caixas fixos.
- Ao clicar em um botão na tela de atendente, o painel atualiza instantaneamente.
- O painel exibe o número do caixa, toca um som (ding) e utiliza a voz do sistema para anunciar o caixa.
- Não há armazenamento de histórico; apenas a última chamada é exibida.

## Tecnologias Utilizadas

- **Backend:** Node.js, Express
- **Tempo Real:** Socket.IO
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Voz:** Web Speech API (SpeechSynthesis)
