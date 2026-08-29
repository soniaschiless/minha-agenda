# Instalando a Minha Agenda com o Claude Code

Este guia é para usar o **Claude Code** (a ferramenta que roda no terminal do seu computador) para
automatizar a parte "mecânica" da instalação — comandos, edição de arquivos, deploy. Nos momentos de
login (Firebase, GitHub, Google), ele vai abrir o navegador e esperar você entrar — isso é proposital,
por segurança: nenhuma ferramenta de IA deve fazer login por você.

## Passo 0 — Instalar o Claude Code (só na primeira vez)

Se ainda não tem instalado:

1. Confirme os requisitos em **code.claude.com/docs/en/setup** (basicamente: Node.js instalado).
2. No terminal, rode:
   ```
   npm install -g @anthropic-ai/claude-code
   ```
3. Extraia o zip da Minha Agenda numa pasta no seu computador (ex: `~/minha-agenda`).
4. No terminal, entre nessa pasta e inicie o Claude Code:
   ```
   cd ~/minha-agenda
   claude
   ```
5. Na primeira vez, ele abre o navegador pedindo para você entrar com sua conta Claude/Anthropic — faça
   login normalmente e volte ao terminal.
6. Nas primeiras ações, ele vai perguntar "posso fazer isso?" antes de cada mudança — responda **Yes**
   para autorizar.

## Passo 1 — Firebase e Firestore

Cole isto no Claude Code:

> Preciso configurar um projeto Firebase para o app que está nesta pasta (agenda pessoal com Firestore e
> Authentication por e-mail/senha). Leia o arquivo COMO_INSTALAR.md, Parte 1, e me guie passo a passo.
> Quando chegar em criar o projeto no console do Firebase, ativar Authentication ou criar o Firestore,
> me avise para eu fazer manualmente no navegador — eu te aviso quando terminar cada etapa. Quando eu
> colar as chaves do firebaseConfig aqui no chat, edite o index.html no lugar certo.

Você vai precisar, manualmente, no navegador: criar o projeto em console.firebase.google.com, ativar o
método de login "E-mail/senha", criar o Firestore e colar as regras de segurança (o Claude Code pode te
mostrar o texto das regras para copiar). Depois, copie o bloco `firebaseConfig` da tela do Firebase e
cole na conversa com o Claude Code — ele edita o arquivo por você.

## Passo 2 — Publicar no GitHub Pages

Cole isto no Claude Code:

> Agora preciso publicar esta pasta no GitHub Pages. Se eu ainda não tiver o repositório criado, me
> ajude a criar um novo repositório no GitHub (posso fazer isso manualmente pelo site, ou você pode usar
> o comando `gh repo create` se eu já tiver o GitHub CLI autenticado). Depois, inicialize o git aqui,
> faça o commit de todos os arquivos e o push. Por fim, me diga exatamente quais opções marcar em
> Settings → Pages para publicar a partir da branch main.

Se você nunca usou o GitHub CLI (`gh`) autenticado neste computador, o Claude Code vai te pedir para
rodar `gh auth login` manualmente (abre o navegador para você entrar). Depois disso, ele consegue criar
o repositório e subir os arquivos sozinho.

## Passo 3 — Testar

Cole isto no Claude Code:

> Depois de publicado, me lembre de abrir o link do GitHub Pages, criar minha conta (e-mail/senha) no
> app, e confirmar que o Calendário, Tarefas e Finanças estão funcionando.

## Passo 4 — Notificações reais (opcional, mais avançado)

Só faça isso se quiser notificações mesmo com o app fechado. Cole isto no Claude Code:

> Quero ativar as notificações reais da Parte 4 do COMO_INSTALAR.md. Preciso primeiro fazer upgrade do
> projeto Firebase para o plano Blaze manualmente (com cartão cadastrado) — te aviso quando terminar.
> Depois, me ajude a instalar as dependências da pasta functions, rodar `firebase deploy --only
> functions`, e me diga onde colar a VAPID_KEY que vou gerar no console do Firebase.

## Passo 5 — Google Agenda (opcional)

Cole isto no Claude Code:

> Quero conectar a Google Agenda, seguindo a Parte 5 do COMO_INSTALAR.md. Vou criar o projeto e o Client
> ID OAuth manualmente no Google Cloud Console — te aviso quando tiver o Client ID em mãos para você
> colar no lugar certo do index.html.

## Resumo do que é seu e do que é do Claude Code

| Ação | Quem faz |
|---|---|
| Rodar comandos (`npm install`, `firebase deploy`, `git push`) | Claude Code |
| Editar arquivos e colar configurações | Claude Code |
| Login no Firebase, Google, GitHub | Você, no navegador |
| Cadastrar cartão (plano Blaze, se for usar notificações) | Você |
| Clicar "Autorizar" nas telas de consentimento do Google | Você |

Qualquer dúvida durante o processo com o Claude Code, você pode voltar aqui e me perguntar — inclusive
colando mensagens de erro que aparecerem no terminal.
