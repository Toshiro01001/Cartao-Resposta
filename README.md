# Cartão Resposta

![Lista de questões do Cartão Resposta](docs/tela.webp)

Fiz este site para estudar para concurso público, junto com a Alice. Ele junta em um só lugar o que a gente precisa: aulas que explicam o mesmo conteúdo de quatro jeitos, questões com comentário, simulados corrigidos com as regras do edital e treino de redação. Tudo fica guardado no próprio aparelho, sem login e sem cobrança. Também é uma amostra do que a Mil e Uma Linhas! sabe fazer.

O sistema inteiro cabe em um único arquivo, `index.html`. Não precisa de servidor, instalação nem login, e funciona no computador e no celular. Depois da primeira visita, abre também sem internet.

## Como usar

1. Abra o site e escolha, no topo, quem está estudando.
2. Se o perfil tiver mais de um concurso, escolha o concurso ao lado do nome.
3. Siga o plano do Início, estude pelas Aulas e pratique em Questões. As bolinhas do cartão-resposta mostram o que já foi feito: azul é acerto, vermelha é erro e vazia é o que falta.
4. Faça um simulado por semana e revise os erros que o sistema trouxer de volta.
5. Em Desempenho, copie o código de progresso de vez em quando para não perder nada e para levar o estudo a outro aparelho.

## Concursos atendidos

| Perfil | Concurso e cargo | Banca | Prova | Aulas | Questões | Discursivas |
|---|---|---|---|---:|---:|---:|
| Rodrigo | Câmara de Cuiabá: Analista Legislativo, Tecnologia da Informação | Instituto Selecon | 13/12/2026 | 53 | 371 | 4 |
| Rodrigo | PJC-MT: Investigador e Escrivão | A definir (UFMT em 2022) | Sem edital aberto | 56 | 369 | 2 |
| Alice | Câmara de Cuiabá: Analista Legislativo | Instituto Selecon | 13/12/2026 | 59 | 381 | 4 |
| Alice | CGU: Auditor Federal de Finanças e Controle, Auditoria | Cebraspe | 13/12/2026 | 33 | 267 | 4 |
| Alice | ALMT: Analista Legislativo | A definir (FGV em 2013) | Sem edital aberto | 43 | 289 | 0 |

No total são 127 aulas, 918 questões e 14 discursivas. As contagens por concurso se sobrepõem porque matérias como Português e Direito Administrativo são compartilhadas.

> A objetiva da CGU e a prova de Analista da Câmara acontecem na mesma manhã de 13/12/2026, então só é possível fazer uma delas. O sistema mantém as duas trilhas, com a Câmara como prioridade.

## Funcionalidades

### Início
- Cartão-resposta com uma bolinha por questão: azul para acerto, vermelha para erro e vazia para o que falta.
- Contagem regressiva, próximos prazos e plano de estudos.
- Atalho para continuar a aula atual e para revisar os erros do dia.

### Aulas
Toda aula ensina o mesmo conteúdo de quatro formas, e dá para trocar a qualquer momento:

| Nível | Para que serve |
|---|---|
| Simples | Explicação do zero, com comparações do dia a dia |
| Didático | Passo a passo, com exemplo resolvido e teste rápido |
| Concurseiro | Revisão rápida, com tabelas e marca-texto |
| Especializado | Texto técnico, com lei, nuances e exceções |

Há dois formatos de aula:
- **Em módulos (27 aulas):** sequência com progresso, botão de concluir, questões no fechamento e links para leitura gratuita.
- **Curta (100 aulas):** página única, nos mesmos quatro níveis.

### Questões
- Filtros por disciplina, aula, dificuldade e situação, além de busca no enunciado.
- Comentário e fonte em cada questão.
- Favoritas, alternativas riscadas e revisão espaçada dos erros, com retorno em 1, 3, 7 e 15 dias.
- Formatos de múltipla escolha e de Certo ou Errado.

### Simulados
- Relógio com pausa, cartão-resposta navegável e prioridade para questões ainda não respondidas.
- Nota por área e por disciplina, com a lista dos erros comentados.

| Concurso | Prova completa | Pontuação |
|---|---|---|
| Câmara de Cuiabá | 70 questões | Básicos e Gerais valem 1; Específicos valem 1,75. Mínimo de 40 pontos, sem zerar área |
| CGU | 170 itens | P1 e P2 valem 1; P3 vale 2. Cada erro desconta o mesmo valor. Mínimos: P1 8, P2 12, P3 54 e soma 78 |
| PJC-MT | 60 questões | 1 ponto cada, conforme o edital de 2022 |
| ALMT | 70 questões | Básicos com peso 1 e Específicos com peso 2, conforme o edital de 2013 |

### Discursivas
Editor com contagem estimada de linhas, espelho de correção, autoavaliação e resposta-modelo.

### Desempenho
Acerto por disciplina, questões por dia, comparação entre os perfis e cópia do progresso.

### Editais e provas
Links para editais, provas anteriores, situação dos concursos e leis para leitura.

## Onde o progresso fica salvo

O progresso fica guardado no próprio navegador (no `localStorage`, um espaço que cada site tem para salvar dados no aparelho), separado por perfil. Não há conta nem sincronização automática.

- Cada aparelho e cada navegador guardam o próprio progresso.
- Limpar os dados do navegador apaga tudo.
- Em **Desempenho**, copie o código de progresso ou baixe o arquivo, e cole ou abra no outro aparelho. As respostas mais recentes são mantidas.

## Publicação no GitHub Pages

1. Crie um repositório e envie `index.html`, `sw.js`, `compartilhar.png` e `README.md` para a raiz.
2. Abra **Settings > Pages**.
3. Em **Build and deployment**, escolha **Deploy from a branch**, a branch `main` e a pasta `/ (root)`.
4. Salve e aguarde o link aparecer na mesma página.

Para atualizar, substitua o `index.html`. O progresso salvo no navegador continua, desde que o endereço do site não mude.

## Tecnologia

- HTML, CSS e JavaScript puros, sem framework e sem etapa de build no repositório.
- Todo o conteúdo fica embutido no `index.html`, com cerca de 2 MB.
- As fontes vêm do Google Fonts sem bloquear a abertura, com fontes do sistema como alternativa.
- `sw.js` é um service worker (um pequeno programa que o navegador roda ao lado do site) e guarda uma cópia do site para uso sem internet. Com internet, a página sempre vem da rede, então uma versão nova aparece na primeira visita.
- `tests/` traz os testes automatizados, feitos com Playwright e fora do que o site carrega.
- Tema claro e escuro, layout adaptado ao celular e navegação por âncoras na URL.

## Limites do conteúdo

- **Questões inéditas:** foram escritas no estilo de cada banca e não saíram de provas reais. Use também as provas anteriores indicadas no site.
- **Feito com inteligência artificial:** aulas e questões podem conter erros, principalmente em leis alteradas há pouco tempo. Em caso de dúvida, confie no texto oficial da lei e no edital.
- **Revisão:** os conteúdos da Câmara e da CGU passaram por revisão independente de gabaritos. As aulas exclusivas de PJC-MT e ALMT ainda não passaram.
- **Legislação municipal e estadual:** parte foi lida em cópias não oficiais ou incompletas. Leia os textos vigentes antes da prova.
- **PJC-MT e ALMT:** não têm edital aberto. O conteúdo segue editais antigos e pode mudar. Na PJC-MT, o Estatuto e a Legislação Penal Especial ainda têm lacunas. Na ALMT, os Conhecimentos Específicos são uma aproximação.
- **Atualização:** o site não acompanha retificações sozinho. Confira sempre as páginas oficiais dos concursos.

Este é um projeto pessoal de estudo, sem vínculo com as bancas, os órgãos ou os cursos preparatórios mencionados.

## Para quem avalia contratar

O Cartão-Resposta é um sistema em uso de verdade: duas pessoas estudam nele para provas marcadas, com o progresso guardado nos próprios aparelhos. Ele é uma amostra de como eu construo e mantenho software sem interromper quem depende dele.

### O que o sistema demonstra

- **Regra de negócio real:** cada simulado segue a pontuação do seu edital, com pesos, desconto por erro e mínimos por área, em cinco trilhas de concurso.
- **Conteúdo grande sem servidor:** 127 aulas, 918 questões e 14 discursivas, com busca, filtros e revisão espaçada, tudo rodando no navegador.
- **Dados que sobrevivem a atualizações:** um teste de regressão compara, byte a byte, o progresso gerado pela versão de referência e pela versão atual.
- **Acessibilidade tratada como requisito:** uso pelo teclado, foco que não se perde ao redesenhar a tela, estados anunciados ao leitor de tela e auditoria com axe-core.
- **Celular de verdade:** o percurso automatizado roda em 1366 x 800, no tamanho do iPhone 13 e em 320 px, sem rolagem lateral, conferindo todas as aulas e questões na tela menor.
- **Uso sem internet sem prender versões antigas:** o service worker usa a rede primeiro e só recorre à cópia guardada quando ela falha.

### Como funciona

1. `index.html` traz a interface e o banco de conteúdo embutido. Uma única função desenha a tela conforme a âncora da URL, como `#questoes` ou `#simulado-ativo`.
2. O progresso de cada perfil é um objeto JSON salvo no `localStorage`. O código de progresso é esse mesmo JSON, o que permite levá-lo a outro aparelho, onde as respostas mais recentes prevalecem.
3. A nota do simulado é calculada no próprio navegador, com as regras de cada edital.
4. `sw.js` entrega a página pela rede e guarda uma cópia, usada quando não há conexão.

### Tecnologias

- HTML, CSS e JavaScript puros, sem framework, sem dependências e sem etapa de build.
- `localStorage`, Cache Storage e Service Worker, além de ARIA para leitores de tela.
- GitHub Pages para a publicação.
- Playwright e Chromium nos testes, com axe-core na auditoria de acessibilidade. Nada disso é carregado pelo site.

### Rodar os testes

Com Node.js e Playwright instalados, na raiz do repositório:

```
node tests/regressao.js
node tests/percurso.js --completo
node tests/correcoes.js
node tests/offline.js
```

Desenvolvi este projeto e usei o Claude, da Anthropic, como ferramenta durante o desenvolvimento.
