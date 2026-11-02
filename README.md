# Cartão Resposta

Plataforma de estudos para concursos públicos, com aulas em quatro níveis de ensino, banco de questões comentadas, simulados pontuados pelas regras dos editais e treino de discursiva.

O sistema inteiro cabe em um único arquivo, `index.html`. Não precisa de servidor, instalação nem login, e funciona no computador e no celular.

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

## Como usar

1. Abra o site e escolha o perfil no topo.
2. Selecione o concurso, quando houver mais de um.
3. Siga o plano do Início, estude pelas Aulas e pratique em Questões.
4. Faça um simulado por semana e revise os erros que o sistema trouxer de volta.

## Onde o progresso fica salvo

O progresso fica no `localStorage` do navegador, separado por perfil. Não há conta nem sincronização automática.

- Cada aparelho e cada navegador guardam o próprio progresso.
- Limpar os dados do navegador apaga tudo.
- Em **Desempenho**, copie o código de progresso ou baixe o arquivo, e cole ou abra no outro aparelho. As respostas mais recentes são mantidas.

## Publicação no GitHub Pages

1. Crie um repositório e envie `index.html` e `README.md` para a raiz.
2. Abra **Settings > Pages**.
3. Em **Build and deployment**, escolha **Deploy from a branch**, a branch `main` e a pasta `/ (root)`.
4. Salve e aguarde o link aparecer na mesma página.

Para atualizar, substitua o `index.html`. O progresso salvo no navegador continua, desde que o endereço do site não mude.

## Tecnologia

- HTML, CSS e JavaScript puros, sem framework e sem etapa de build no repositório.
- Todo o conteúdo fica embutido no `index.html`, com cerca de 2 MB.
- As fontes vêm do Google Fonts, com fontes do sistema como alternativa.
- Tema claro e escuro, layout adaptado ao celular e navegação por âncoras na URL.

## Limites do conteúdo

- **Questões inéditas:** foram escritas no estilo de cada banca e não saíram de provas reais. Use também as provas anteriores indicadas no site.
- **Feito com inteligência artificial:** aulas e questões podem conter erros, principalmente em leis alteradas há pouco tempo. Em caso de dúvida, confie no texto oficial da lei e no edital.
- **Revisão:** os conteúdos da Câmara e da CGU passaram por revisão independente de gabaritos. As aulas exclusivas de PJC-MT e ALMT ainda não passaram.
- **Legislação municipal e estadual:** parte foi lida em cópias não oficiais ou incompletas. Leia os textos vigentes antes da prova.
- **PJC-MT e ALMT:** não têm edital aberto. O conteúdo segue editais antigos e pode mudar. Na PJC-MT, o Estatuto e a Legislação Penal Especial ainda têm lacunas. Na ALMT, os Conhecimentos Específicos são uma aproximação.
- **Atualização:** o site não acompanha retificações sozinho. Confira sempre as páginas oficiais dos concursos.

Este é um projeto pessoal de estudo, sem vínculo com as bancas, os órgãos ou os cursos preparatórios mencionados.
