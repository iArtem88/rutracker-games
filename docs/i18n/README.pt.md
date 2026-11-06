<h1 align="center">
  <img src="../media/logo.png" alt="" width="120"><br>
  RuTracker Games
</h1>

<p align="center">
  <a href="../../README.md">🇬🇧&nbsp;English</a> •
  <a href="README.uk.md">🇺🇦&nbsp;Українська</a> •
  <a href="README.ru.md">🇷🇺&nbsp;Русский</a> •
  <a href="README.de.md">🇩🇪&nbsp;Deutsch</a> •
  <a href="README.fr.md">🇫🇷&nbsp;Français</a> •
  <a href="README.es.md">🇪🇸&nbsp;Español</a> •
  <a href="README.it.md">🇮🇹&nbsp;Italiano</a> •
  <a href="README.pl.md">🇵🇱&nbsp;Polski</a> •
  <a href="README.pt.md">🇧🇷&nbsp;Português</a> •
  <a href="README.ja.md">🇯🇵&nbsp;日本語</a>
</p>

<h4 align="center">Capturas de tela e etiquetas úteis direto nas listas de jogos do RuTracker — sem precisar abrir tópico por tópico.</h4>

<p align="center">
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0--or--later-blue.svg" alt="Licença: GPL-3.0-or-later"></a>
  <a href="../../CHANGELOG.md"><img src="https://img.shields.io/badge/version-1.2.0-green.svg" alt="Versão 1.2.0"></a>
  <img src="https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4.svg" alt="Chrome, Manifest V3">
  <img src="https://img.shields.io/badge/UI-10%20languages-orange.svg" alt="10 idiomas">
  <a href="https://github.com/iArtem88/rutracker-games/actions/workflows/ci.yml"><img src="https://github.com/iArtem88/rutracker-games/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
</p>

<p align="center">
  <img src="../media/screenshot-switch.png" alt="A lista do Switch com capturas, etiquetas e a barra de filtros" width="900">
</p>

---

## Sumário

- [O que a extensão faz](#o-que-a-extensão-faz)
- [Seções suportadas](#seções-suportadas)
- [Instalação](#instalação)
- [Como usar](#como-usar)
- [As etiquetas em detalhes](#as-etiquetas-em-detalhes)
- [Suas próprias etiquetas e palavras](#suas-próprias-etiquetas-e-palavras)
- [Privacidade](#privacidade)
- [Sem sobrecarregar o site](#sem-sobrecarregar-o-site)
- [Perguntas frequentes](#perguntas-frequentes)
- [Como contribuir](#como-contribuir)
- [Desenvolvimento](#desenvolvimento)
- [Licença](#licença)

## O que a extensão faz

Direto na lista de lançamentos, entre o título e o autor:

- **Capturas de tela** do spoiler «Скриншоты» do lançamento: as mesmas miniaturas do tópico. As que têm uma lupa abrem em tamanho real no visualizador da própria extensão, na mesma página e sem os anúncios do serviço de hospedagem: ← → ou a faixa de miniaturas embaixo passam de uma para outra, Esc fecha. Sem lupa, um clique abre a página do serviço de hospedagem. Aparece uma fileira, e «mais N» mostra o resto.
- **No tópico do lançamento**, os spoilers com capturas se abrem sozinhos (dá para desativar nas configurações), e as capturas abrem no mesmo visualizador.
- **Etiquetas tiradas da descrição do lançamento:**
  - <img src="https://img.shields.io/badge/-Dublagem%20em%20russo-d32f2f" alt="Dublagem em russo"> — dublagem no seu idioma, com detalhes entre parênteses: automática, amadora, parcial, mod;
  - <img src="https://img.shields.io/badge/-Texto%20em%20russo%20(sem%20dublagem)-2e7d32" alt="Texto em russo (sem dublagem)"> — o jogo está no seu idioma e simplesmente não tem dublagem;
  - <img src="https://img.shields.io/badge/-Texto%20em%20russo%20(Dublagem%20em%20inglês)-fbc02d" alt="Texto em russo (Dublagem em inglês)"> — textos e legendas no seu idioma, dublagem em outro;
  - <img src="https://img.shields.io/badge/-Precisa%20de%20overclock:%204IFIR-6a1b9a" alt="Precisa de overclock: 4IFIR"> — se o Switch precisa de overclock e se o overclock do próprio Kefir dá conta;
  - <img src="https://img.shields.io/badge/-Firmware%205.05+-00695c" alt="Firmware 5.05+"> — o firmware do PS4 / PS5 em que o jogo roda;
  - <img src="https://img.shields.io/badge/-8%20GB%20de%20RAM%20·%20GTX%201060-455a64" alt="8 GB de RAM · GTX 1060"> — a RAM e a placa de vídeo mínimas do PC;
  - <img src="https://img.shields.io/badge/-Roda%20no%20Steam%20Deck-8e24aa" alt="Roda no Steam Deck"> — pelos requisitos do sistema, o jogo deve rodar no Steam Deck; já <img src="https://img.shields.io/badge/-Steam%20Deck:%20verificado-1976d2" alt="Steam Deck: verificado"> é a classificação oficial da Valve (ative nas configurações).
- **Uma barra de filtros** acima da lista: «Dublagem nos meus idiomas», «Nos meus idiomas», «Roda no meu Switch», «Roda no meu firmware», «A RAM do meu PC basta», «Roda no Steam Deck» e as suas próprias etiquetas.
- **Seus idiomas.** As etiquetas de dublagem e de texto aparecem para os idiomas marcados em «Meus idiomas»: inglês, ucraniano, russo, alemão, francês, espanhol, italiano, polonês, português e japonês. Russo, ucraniano e o idioma da interface já vêm marcados. A interface da extensão também está disponível nesses 10 idiomas.
- **Suas etiquetas**, por palavras ou por uma expressão regular, e **suas próprias palavras** para a etiqueta de overclock do Switch.

## Seções suportadas

A extensão funciona nas listas, nos resultados de busca e nos tópicos dos lançamentos das seções de jogos do RuTracker:

| Seção | O que mostra |
|---|---|
| Jogos para consoles » Switch | capturas, idiomas, overclock (Kefir / 4IFIR) |
| Jogos para consoles » PS4, PS5 | capturas, idiomas, firmware necessário |
| Outros consoles (PS1–PS3, PSP, Vita, Xbox, Wii, DS, Dreamcast…) | capturas, idiomas |
| Jogos para Windows | capturas, idiomas, RAM e placa de vídeo mínimas, Steam Deck |
| Jogos para Mac, jogos para Linux | capturas, idiomas |
| Jogos para dispositivos móveis (Android, Oculus Quest, Symbian, Windows Mobile) | capturas, idiomas |
| Complementos: mods e traduções para jogos de Windows, Train Simulator, simuladores de voo | capturas, idiomas |

Filmes, música e o resto ficam de fora de propósito: é melhor que sejam extensões separadas, para que cada uma continue simples.

<p align="center">
  <img src="../media/screenshot-ps4.png" alt="A lista do PS4: idiomas e firmware" width="440">
  <img src="../media/screenshot-windows.png" alt="Jogos para Windows: requisitos, coletâneas e Steam Deck" width="440">
</p>

## Instalação

- **Chrome, Edge, Brave, Opera, Yandex Browser:** baixe o `rutracker-games-…-chrome.zip` em [Releases](https://github.com/iArtem88/rutracker-games/releases) e descompacte. Abra `chrome://extensions`, ative o «Modo do desenvolvedor» e clique em «Carregar sem compactação».

## Como usar

Não há nada para configurar: abra uma seção de jogos, por exemplo a de [Switch](https://rutracker.org/forum/viewforum.php?f=1605), e tudo já funciona.

- **O botão da extensão** na barra de ferramentas do navegador liga e desliga a extensão e as etiquetas, e define o tamanho das miniaturas.
- **Todas as configurações** («Suas etiquetas e todas as configurações» nessa janela, ou «⚙ Configurações» na barra de filtros): seus idiomas, seu Switch, o firmware do seu PS, a RAM do seu PC, Steam Deck, suas etiquetas e palavras, o cache.
- **Passe o mouse sobre uma etiqueta** para ver a linha do lançamento em que ela se baseia.
- **Aparência:** a aba com esse nome define a cor do texto, do fundo e da borda de cada etiqueta, inclusive das suas. As mudanças aparecem na hora, também nas abas do RuTracker já abertas.

<p align="center">
  <img src="../media/screenshot-settings.png" alt="Configurações" width="440">
  <img src="../media/screenshot-appearance.png" alt="A aba Aparência" width="440">
</p>

## As etiquetas em detalhes

### Dublagem

Por exemplo, «Dublagem em russo» ou «Dublagem em ucraniano». Vem da linha «Озвучка:» ou «Язык озвучки:» («русская, английская», «ENG+RUS»); se ela não existir, da descrição («опциональная русская озвучка…», «Russian Voice Mod») e do título («RUS (Voice Mod.)», «RUS sound»). Frases como «русской озвучки не будет» não geram etiqueta.

### Texto

Por exemplo, «Texto em russo». Aparece quando o idioma consta na linha «Язык интерфейса», mas não há dublagem nele:

- verde, «(sem dublagem)» — o jogo não tem dublagem e está todo no seu idioma;
- amarela, «(Dublagem em inglês)» — textos e legendas no seu idioma, dublagem no idioma entre parênteses;
- só com contorno, sem parênteses — o lançamento não diz se há dublagem.

### Filtros de idioma

«Nos meus idiomas» e «Dublagem nos meus idiomas» são uma só escolha: ao ativar um, o outro se desativa; ao clicar nele de novo, tudo aparece. Os outros filtros se somam a ele.

| Lançamento | Todos (nada ativado) | Nos meus idiomas | Dublagem nos meus idiomas |
|---|:-:|:-:|:-:|
| Dublagem em russo | ✅ | ✅ | ✅ |
| Texto em russo (sem dublagem) | ✅ | ✅ | ✅ |
| Texto em russo (Dublagem em inglês) | ✅ | ✅ | ❌ |
| «Texto em russo» — o lançamento não diz nada sobre a dublagem | ✅ | ✅ | ❌ |
| Nada em russo | ✅ | ❌ | ❌ |

### Overclock do Switch

A extensão verifica se o uploader pede overclock no console e quais frequências ele indica, e compara tudo com o que o overclock do próprio Kefir alcança:

| Revisão | CPU | GPU | RAM |
|---|---|---|---|
| Mariko (V2, Lite, OLED) | 1963 MHz | 1267 MHz | 2131 MHz |
| Erista (V1) | 1785 MHz | 921 MHz | 1862 MHz |

A etiqueta tem duas partes:

- **«Overclock recomendado» ou «Precisa de overclock»** — conforme o uploader escreve: «лучше», «рекомендуется», «желательно» ou «обязательно», «нужен», «требуется». Quando aparecem os dois («стоит обязательно разогнать»), vale «Precisa de overclock».
- **Kefir ou 4IFIR («Чифир»)** — quanto overclock se pede. É 4IFIR quando o uploader o cita pelo nome (mas não em «работает и без Чифира»), indica frequências acima dos limites do Kefir ou pede o overclock «максимальный» (exceto em «максимальный разгон Кефира»). Nos outros casos, é Kefir.

| O uploader escreve | Etiqueta |
|---|---|
| «Лучше всего использовать разгон консоли» | Overclock recomendado: Kefir |
| «Лучше всего максимально разогнать консоль» | Overclock recomendado: 4IFIR |
| «Обязательно нужен разгон» | Precisa de overclock: Kefir |
| «Обязательно нужен разгон, CPU 2397 МГц» | Precisa de overclock: 4IFIR |

«Precisa de overclock» aparece preenchida; «Overclock recomendado», só com contorno. Informe a revisão e o overclock do seu console nas configurações: um lançamento que pede mais do que o seu ganha ⚠, e o filtro «Roda no meu Switch» o esconde.

De onde vêm os limites: do código-fonte do próprio Kefir. O `kefir.kip` dele eleva as frequências até CPU 2193 / GPU 1267 / RAM 2131 MHz no Mariko, e o sys-clk dele mantém a CPU nos valores seguros de 1963 (Mariko) e 1785 (Erista), a menos que `allow_unsafe_freq` seja ativado manualmente.

### Firmware do PS4 / PS5

Vem da linha «Минимальная версия прошивки». Backports são levados em conta («8.50 + BACKPORT [5.05…]» significa que roda a partir do 5.05), assim como um limite superior («работает только до 11.60»). Informe seu firmware nas configurações, e os lançamentos que não rodam nele ganham ⚠.

### PC: RAM e placa de vídeo

A RAM mínima e a primeira placa de vídeo dos requisitos do sistema; o tooltip mostra todos eles: SO, CPU, placa de vídeo. Informe a RAM do seu PC nas configurações, e os lançamentos que pedem mais ganham ⚠.

**Coletâneas.** Quando um lançamento reúne vários jogos, cada um no seu próprio spoiler e com seus próprios requisitos (antologias), a etiqueta mostra a faixa e a placa mais exigente, por exemplo «1–6 GB de RAM · até GTX 780», e o tooltip lista todos os jogos. Os filtros e a estimativa para o Steam Deck se baseiam no jogo mais pesado.

### Steam Deck

Há duas classificações:

- **Pelos requisitos do sistema** (ativada por padrão): a etiqueta roxa «Roda no Steam Deck». Em gráficos, o Steam Deck equivale mais ou menos a uma GTX 1050 Ti, mas roda em 800p, então dá conta de requisitos mínimos até cerca de uma GTX 1060 / RX 580 e 16 GB de RAM. O processador e a compatibilidade com o Proton não são levados em conta.
- **A classificação oficial da Valve** (desativada por padrão; ao ativá-la, o navegador pede acesso ao site da Steam): «verificado» (funciona por completo), «jogável» (pode precisar de ajustes), «não suportado». O jogo é identificado pelo link da Steam ou do SteamDB no lançamento ou, na falta dele, pelo título exato na Steam. Quando existe, a classificação da Valve prevalece. Ela vale para a versão da Steam: a build do lançamento pode ser diferente. Coletâneas não recebem essa classificação.

## Suas próprias etiquetas e palavras

**Suas etiquetas.** Nas configurações, adicione palavras como `DLC|дополнения` ou `кооператив`, ou uma expressão regular entre barras, como `/(лучше|рекомендуется|желательно).*разгон/`. Os lançamentos cujo título ou descrição corresponderem ganham a sua etiqueta, na cor que você escolher, e você pode colocá-la na barra de filtros. A extensão já vem com alguns exemplos, desativados.

<p align="center">
  <img src="../media/screenshot-badges.png" alt="Suas etiquetas nas configurações" width="520">
</p>

**Suas palavras para o overclock do Switch.** Nas configurações do Switch, «Palavras próprias para as etiquetas» mostra as palavras em que a etiqueta de overclock se baseia — sobre overclock, «recomendado», «obrigatório», «não precisa», «máximo», os nomes do 4IFIR e do Kefir — e permite adicionar as suas. Elas se somam às embutidas e passam a valer na hora, inclusive para os lançamentos já carregados.

<p align="center">
  <img src="../media/screenshot-words.png" alt="Palavras próprias para a etiqueta de overclock do Switch" width="520">
</p>

## Privacidade

- Sem anúncios, sem analytics, sem contas, sem servidores próprios.
- A extensão só acessa as páginas do próprio RuTracker, como se você mesmo abrisse o tópico, e carrega as imagens dos mesmos serviços de hospedagem que o tópico usa. A única exceção é a classificação da Valve para o Steam Deck: se você ativá-la, a extensão consulta na Steam o id do jogo e a classificação dele (sem seus cookies nem seus dados). Nas imagens do fastpic que o serviço só entrega pela própria página, o visualizador abre essa página sem mostrá-la, sem os scripts e os anúncios dela, e pega ali o link da imagem, como se você mesmo clicasse na miniatura. Nas imagens do ImgBB e do PostImages, ela lê o endereço da imagem completa na página dela no serviço de hospedagem (sem seus cookies).
- As configurações e o cache das descrições dos lançamentos ficam no seu navegador.
- O código é aberto, e qualquer pessoa pode conferi-lo. Mais detalhes em [PRIVACY.md](../../PRIVACY.md).

## Sem sobrecarregar o site

- A extensão carrega só os lançamentos até onde você rolar a página, no máximo 2 requisições por vez e com pausas entre elas.
- Quando o site está sobrecarregado ou limita as requisições (429, 5xx, 403 do Cloudflare), ela dá um tempo e depois continua.
- A descrição de um lançamento é carregada uma vez e guardada por um mês; ela só é carregada de novo quando o lançamento é atualizado (quando o título ou o tamanho dele muda na lista). As atualizações da extensão não apagam o cache: ele guarda a própria descrição, que é simplesmente lida de novo.
- Um filtro ativo verifica a página inteira de uma vez. Para carregar só o que você rolar, desative «O filtro verifica a página inteira de uma vez» nas configurações.

## Perguntas frequentes

**Aparecem quadrados cinza no lugar das capturas.** A imagem vem de um serviço de hospedagem de imagens (fastpic, imageban…) que está lento ou bloqueado na sua rede. Esses espaços reservados somem depois de 20 segundos.

**Falta uma etiqueta, ou aparece uma que não deveria.** As descrições dos lançamentos são escritas por pessoas, cada uma do seu jeito. Passe o mouse sobre a etiqueta para ver em que ela se baseia. Se estiver errada, [abra uma issue](https://github.com/iArtem88/rutracker-games/issues) com o link do lançamento, e a gente corrige a análise. No caso do overclock do Switch, você também pode adicionar suas próprias palavras na hora.

**Por que não tem filmes?** A extensão é sobre jogos. Outros conteúdos merecem uma extensão própria: assim cada uma continua simples.

**É oficial?** Não. É um projeto independente, sem vínculo com o RuTracker.

## Como contribuir

Encontrou um bug ou quer que mais uma seção seja suportada? Veja o [CONTRIBUTING.md](../../CONTRIBUTING.md) (em russo): uma seção nova é um único arquivo pequeno, e issues são bem-vindas em qualquer idioma.

## Desenvolvimento

```sh
npm install        # só para os testes e o build; nada disso vai para a extensão
npm test           # os testes de análise, num Chromium de verdade
npm run test:e2e   # a extensão inteira no Google Chrome contra um RuTracker simulado, cerca de um minuto
npm run build      # dist/rutracker-games-<version>-chrome.zip e …-firefox.zip
```

A extensão em si é JavaScript puro, sem etapa de build: carregue a pasta `src/` sem compactação para testar suas mudanças.

## Licença

Copyright © 2026 [iArtem88](https://github.com/iArtem88).

O RuTracker Games é software livre, distribuído sob a [GNU General Public License v3.0](../../LICENSE) ou (a seu critério) qualquer versão posterior: você pode usá-lo, modificá-lo e compartilhá-lo, e qualquer cópia ou versão modificada também deve continuar aberta sob a GPL.

Esta é uma extensão não oficial, sem vínculo com o RuTracker.
