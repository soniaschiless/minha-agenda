# Como colocar sua Agenda no ar

Este pacote tem 5 arquivos: `index.html`, `manifest.json`, `service-worker.js` e a pasta `icons/`.
Siga os passos abaixo na ordem. Leva uns 15-20 minutos na primeira vez.

## Parte 1 — Criar o banco de dados (Firebase, gratuito)

1. Acesse **console.firebase.google.com** e entre com sua conta Google.
2. Clique em **"Criar projeto"**, dê um nome (ex: "minha-agenda") e conclua a criação.
3. No menu lateral, vá em **Build → Authentication** → aba **Sign-in method** → habilite **"E-mail/senha"**.
4. No menu lateral, vá em **Build → Firestore Database** → **Criar banco de dados** → escolha o modo
   **produção** → selecione uma região (ex: `southamerica-east1` para o Brasil).
5. Ainda no Firestore, vá na aba **Regras** e substitua pelo conteúdo abaixo, depois clique em **Publicar**:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /agendas/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
   Isso garante que cada pessoa só acessa os próprios dados.
6. Volte para **Configurações do projeto** (ícone de engrenagem) → role até **"Seus apps"** → clique no
   ícone **`</>`** (Web) → dê um apelido ao app → **Registrar app**.
7. Copie o objeto `firebaseConfig` que aparece na tela (algo como abaixo):
   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "minha-agenda.firebaseapp.com",
     projectId: "minha-agenda",
     storageBucket: "minha-agenda.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```
8. Abra o arquivo `index.html` deste pacote, procure por `firebaseConfig` (perto do fim do arquivo) e
   substitua os valores de exemplo pelos que você copiou. Salve o arquivo.

## Parte 2 — Publicar no GitHub Pages (gratuito)

1. Crie uma conta em **github.com**, se ainda não tiver.
2. Crie um novo repositório (botão **"New"**), dê um nome (ex: `minha-agenda`), marque como **público**.
3. Nesse repositório, clique em **"Add file" → "Upload files"** e arraste os 4 itens deste pacote:
   `index.html`, `manifest.json`, `service-worker.js` e a pasta `icons` (com os dois arquivos PNG dentro).
4. Clique em **"Commit changes"** para salvar.
5. Vá em **Settings → Pages** (menu lateral do repositório).
6. Em **"Branch"**, selecione `main` e a pasta `/ (root)`, depois clique em **Save**.
7. Aguarde 1-2 minutos. O GitHub mostrará o link do seu app, algo como:
   `https://seu-usuario.github.io/minha-agenda/`

## Parte 3 — Usar o app

1. Abra o link no navegador do celular, tablet ou computador.
2. Na primeira vez, clique em **"Criar conta"**, informe um e-mail e senha (essa conta é só sua, fica no
   Firebase que você criou — use a mesma em todos os aparelhos para sincronizar).
3. Para instalar como app:
   - **Android (Chrome)**: menu (⋮) → "Adicionar à tela inicial" ou "Instalar app".
   - **iPhone/iPad (Safari)**: botão de compartilhar → "Adicionar à Tela de Início".
   - **Computador (Chrome/Edge)**: ícone de instalação na barra de endereço, ou menu → "Instalar Minha Agenda".
4. Para usar o Assistente por chat, clique no ícone de engrenagem (⚙) e cole sua chave de API da Anthropic
   (crie uma gratuitamente em **console.anthropic.com** → API Keys). Essa chave fica salva só nesse
   aparelho — se usar em outro aparelho, precisa colar de novo lá.

## Parte 4 — Ativar notificações reais (mesmo com o app fechado)

Essa parte é opcional e mais avançada — exige uma conta de faturamento no Firebase (o uso ficará dentro
da faixa gratuita generosa, mas o plano Blaze pede um cartão cadastrado) e alguns comandos de terminal.

1. **Ativar o plano Blaze**: no Console do Firebase, clique em "Fazer upgrade" (ícone de foguete, canto
   inferior esquerdo) → escolha o plano **Blaze (pague conforme o uso)** → cadastre uma forma de pagamento.
   Para o volume de uma agenda pessoal, o custo real tende a ficar em torno de zero.
2. **Gerar a chave VAPID**: Configurações do projeto (engrenagem) → aba **Cloud Messaging** → em
   "Web Push certificates", clique em **"Gerar par de chaves"**. Copie a chave gerada.
3. Abra o `index.html`, procure por `VAPID_KEY` e cole a chave copiada.
4. Abra o `service-worker.js`, procure pelo bloco `firebaseConfig` (perto do topo) e cole ali os
   **mesmos** valores que você já colocou no `index.html`.
5. **Instalar as ferramentas**: se ainda não tiver, instale o [Node.js](https://nodejs.org) (versão LTS).
   Depois, em um terminal, rode:
   ```
   npm install -g firebase-tools
   ```
6. Na pasta deste projeto (onde estão `index.html`, `functions/`, `firebase.json`), rode:
   ```
   firebase login
   firebase use --add
   ```
   Escolha o projeto que você criou na Parte 1 e confirme o alias como `default`.
7. Instale as dependências da função e publique:
   ```
   cd functions
   npm install
   cd ..
   firebase deploy --only functions
   ```
   Isso publica uma função que roda a cada 5 minutos, verificando compromissos e tarefas de todo mundo
   que usa o app.
8. Suba as versões atualizadas de `index.html` e `service-worker.js` para o GitHub (Parte 2, passo 3).
9. No app, abra **Configurações (⚙) → Ativar notificações neste aparelho** e permita quando o navegador
   perguntar. Repita esse passo em cada aparelho onde quiser receber avisos.

### Como funciona o aviso
- **Compromissos**: chega 30 minutos antes do horário marcado.
- **Tarefas**: chega às 8h da manhã (horário de Brasília) no dia do vencimento, se ainda não estiver concluída.
- Pode levar até ~15 minutos de atraso, já que a verificação roda a cada 5 minutos com uma margem de segurança.

### Limitações importantes
- **iPhone/iPad**: notificações push só funcionam a partir do iOS 16.4, e só depois de adicionar o app à
  Tela de Início (Safari → Compartilhar → "Adicionar à Tela de Início"). Direto pelo navegador, sem
  instalar, não funciona.
- Cada aparelho precisa ativar as notificações separadamente (é um botão por aparelho, não por conta).
- Se quiser mudar o horário de aviso das tarefas ou a antecedência dos compromissos, os valores estão
  no topo do arquivo `functions/index.js` (`APPOINTMENT_LEAD_MINUTES` e `TASK_REMINDER_HOUR`) — depois
  de editar, repita o `firebase deploy --only functions`.

## Parte 5 — Conectar a Google Agenda (opcional)

1. Acesse **console.cloud.google.com** e crie um novo projeto (ou use um existente).
2. No menu, vá em **APIs e serviços → Biblioteca**, procure por **"Google Calendar API"** e clique em **Ativar**.
3. Vá em **APIs e serviços → Tela de consentimento OAuth**:
   - Tipo de usuário: **Externo**.
   - Preencha nome do app, e-mail de suporte e e-mail de contato do desenvolvedor (podem ser os seus).
   - Em "Escopos", não precisa adicionar nada manualmente aqui.
   - Em "Usuários de teste" (se o app ficar em modo de teste), adicione o seu próprio e-mail do Google —
     assim você consegue usar mesmo sem publicar o app para o público.
4. Vá em **APIs e serviços → Credenciais → Criar credenciais → ID do cliente OAuth**:
   - Tipo de aplicativo: **Aplicativo da Web**.
   - Em "Origens JavaScript autorizadas", adicione a URL do seu app no GitHub Pages, por exemplo:
     `https://seu-usuario.github.io`
   - Clique em **Criar** e copie o **Client ID** gerado (algo como `123456-abc.apps.googleusercontent.com`).
5. Abra o `index.html`, procure por `GOOGLE_CLIENT_ID` e cole o Client ID copiado.
6. Suba o arquivo atualizado para o GitHub (Parte 2, passo 3).
7. No app, abra **Configurações (⚙) → Conectar Google Agenda**, faça login com sua conta Google e autorize
   o acesso à agenda.
8. Use **"Importar eventos futuros"** para trazer o que já existe na sua Google Agenda (próximos 60 dias).
   Compromissos criados depois disso no app já são enviados automaticamente para lá, e edições/exclusões
   também refletem nos dois lados.

### Limitações importantes
- A autorização expira depois de um tempo (cerca de 1 hora); o app tenta renovar sozinho ao abrir, mas se
  isso falhar, basta clicar em "Reconectar" em Configurações.
- Enquanto o app estiver em "modo de teste" no Google Cloud (comum para uso pessoal), só e-mails cadastrados
  como "usuários de teste" no passo 3 conseguem conectar — o que já é suficiente para uso individual.
- Essa conexão é separada de qualquer integração do Google feita dentro do Claude — é um acesso específico
  deste app, para a sua conta pessoal do Google.

## Sobre a aba Finanças

Controle de receitas, despesas e cartão de crédito, com painel visual (gráfico de categorias e barras de
uso do cartão), categorias editáveis e compras parceladas. Não precisa de nenhuma configuração extra — os
dados ficam salvos na mesma nuvem (Firebase) já configurada na Parte 1. Duas simplificações importantes:
- O "mês" de cada lançamento é sempre o mês da data escolhida (calendário civil), não a data de fechamento
  da fatura do cartão — então a "Fatura do cartão" é a soma das compras no cartão dentro daquele mês, não
  necessariamente a fatura exata que fecha naquela data.
- Compras parceladas dividem o valor igualmente entre as parcelas, uma por mês, a partir da data escolhida
  (não é possível ainda editar o parcelamento depois de criado — é preciso excluir e cadastrar de novo).

## Sobre custos

- Firebase: o plano gratuito (Spark) cobre uso pessoal tranquilamente (milhares de leituras/gravações
  por dia de graça). Se ativar a Parte 4 (notificações), o plano precisa ser o Blaze, mas o custo real
  para uma função rodando a cada 5 minutos e um único usuário deve ficar em torno de R$0.
- GitHub Pages: gratuito para repositórios públicos.
- API da Anthropic: cobrança por uso (bem barata para esse volume de mensagens). Você pode definir um
  limite de gastos mensal no console da Anthropic para ficar tranquila.

## Atualizações futuras

Sempre que eu (ou você) alterar o `index.html`, é só repetir o passo "Upload files" no GitHub substituindo
o arquivo antigo — o link continua o mesmo.
