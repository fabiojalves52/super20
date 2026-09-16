# Painel Super 20 - versão 2.4.0

Versão completa baseada no ZIP Sempre 10 v2.3 enviado, com a identidade Super 20, voo do mascote e uma terceira tela de avisos de voz.

## As três telas

| Uso | Caminho local | Caminho no endereço da loja |
| --- | --- | --- |
| Botões dos caixas 1 a 5 | http://localhost:3000/ | / |
| TV dos clientes | http://localhost:3000/painel | /painel |
| Enviar avisos de voz | http://localhost:3000/avisos | /avisos |

Quando esta versão for publicada no serviço existente, a nova tela será https://super20-nqte.onrender.com/avisos. A preparação deste ZIP não altera o serviço que já está online.

## Instalação

1. Extraia o ZIP em uma pasta.
2. Mantenha ou copie os vídeos da loja para a pasta `videos`. O ZIP original enviado não continha vídeos. Formatos reconhecidos: `.mp4`, `.webm` e `.ogg`; a reprodução depende dos formatos aceitos pelo navegador da TV.
3. Na pasta do projeto, execute `npm ci` e depois `npm start`.
4. No navegador do equipamento conectado à TV, abra `/painel` e clique para iniciar.
5. Nos caixas, abra `/`. Para anunciar uma mensagem, abra `/avisos` no mesmo servidor.
6. Ajuste o volume do equipamento/TV e faça um aviso curto de teste.

Se os dispositivos estiverem na mesma rede local, use o endereço IP do computador que executa o servidor, por exemplo `http://IP-DO-COMPUTADOR:3000/painel`. `localhost` só aponta para o próprio aparelho.

## Atualização no Render/GitHub

- Substitua o código e os recursos visuais do projeto Super 20 pelos arquivos deste ZIP.
- Preserve os vídeos que já utiliza na pasta `videos`.
- O comando de instalação é `npm ci` e o de início é `npm start`.
- O servidor utiliza a porta da variável `PORT` fornecida pela hospedagem, ou 3000 localmente.
- Após publicar, recarregue as três telas para carregar a versão nova.
- A versão da Sempre 10 deve continuar em seu próprio projeto/serviço; o arquivo preparado aqui é a cópia para a Super 20.

## Comportamento dos vídeos e chamadas

- Ao iniciar a TV: 5 segundos de espera, voo de 3 segundos e começo dos vídeos.
- Após cada chamada de caixa: 10 segundos de exibição da chamada, voo de 3 segundos e retorno aos vídeos.
- O mascote entra voando, flutua brevemente e sai para revelar o vídeo.
- A animação acontece na entrada/retorno à programação, sem interromper a sequência entre um vídeo e o seguinte.
- Uma chamada interrompe imediatamente o vídeo, o voo ou um aviso de voz.
- Os cinco botões, o som de chamada e a leitura do número do caixa permanecem.
- Os vídeos continuam sem som, como no sistema enviado. A chamada e os avisos têm áudio.
- Sem vídeos disponíveis, a tela mantém a espera e os caixas/avisos continuam funcionando.

## Avisos de voz

1. Abra `/avisos` e confira se há uma TV pronta.
2. Digite entre 3 e 500 caracteres.
3. Se desejar, use **Ouvir neste aparelho** para conferir a mensagem antes do envio. A voz desse aparelho pode ser diferente da voz instalada na TV.
4. Clique em **Enviar para a TV**.
5. A TV pausa o vídeo e mostra o mascote com megafone. O texto digitado não é mostrado na TV.
6. Durante a leitura, o mascote flutua e ondas animadas saem do megafone. A animação acompanha o início/fim da fala; não há sincronização da boca por palavra.
7. Ao concluir, a TV volta à programação com a transição do mascote.

Se houver várias TVs prontas no mesmo servidor, todas recebem o aviso. Mensagens consecutivas ficam em fila. Se um caixa interromper a leitura, o aviso retorna à fila e recomeça depois da chamada. A tela de envio acompanha recebimento, leitura, conclusão e eventuais falhas. O histórico fica apenas na aba aberta, sem banco de dados.

A voz utiliza o sintetizador de fala do navegador do aparelho conectado à TV, priorizando português do Brasil. Não há contratação de serviço de voz ou chave de API. É preciso que esse navegador tenha suporte à síntese de fala e uma voz disponível. Se a TV usa navegador sem esse recurso, abra o painel em um computador ligado à TV. O sistema não gera um arquivo MP3 para download: ele fala o texto diretamente no aparelho que exibe `/painel`.

## Tempos configuráveis

Edite `config-painel.js`. Os valores estão em milissegundos:

- `esperaInicialMs: 5000`
- `esperaAposChamadaMs: 10000`
- `duracaoTransicaoMs: 3000`
- `transicaoMascote: true`

Use `transicaoMascote: false` para desativar apenas o voo antes dos vídeos.

## Arquivos visuais

- `logo.png`: logo Super 20 enviada pelo usuário, preservada.
- `assets/mascote-super20.png`: arte do mascote exportada do PDF enviado.
- `assets/mascote-megafone.png`: nova pose com megafone preparada a partir do mascote de referência.
- `assets/bootstrap.min.css`: mesma versão de estilos do painel original, incluída localmente para evitar depender de um CDN.
- `ding.mp3`: áudio original preservado.

## Verificação realizada

Testes automatizados em navegador Chromium verificaram chamadas, tempo de espera, transição, início e sequência de vídeos, envio dos avisos, prioridade dos caixas, retorno dos avisos à fila, ausência do texto digitado na TV, avisos de erro, limite de texto, desconexão e pasta de vídeos vazia. A tela de avisos também foi verificada em tamanho de celular.

A síntese de voz foi simulada nos testes automatizados para validar o texto recebido e os eventos de início/fim/falha. O som real e a voz do equipamento da loja precisam ser conferidos nele. Não foi feita publicação no Render.
