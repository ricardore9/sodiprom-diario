# ☁️ Guia Completo: Banco de Dados na Nuvem (Firebase) + GitHub Pages

Este guia ensina como conectar o **Diário do Professor** a um banco de dados real na nuvem do **Google Firebase Firestore** e hospedar o sistema gratuitamente no **GitHub Pages**.

Dessa forma, você poderá acessar o sistema pelo computador da escola, pelo seu notebook de casa ou pelo celular/tablet, com **sincronização em tempo real de turmas, aulas e planos de ensino**, mantendo o sistema 100% funcional mesmo se ficar sem internet (arquitetura *Offline-First*).

---

## 💎 Vantagens Desta Solução

1. **Custo Zero (100% Grátis)**:
   - **GitHub Pages**: Hospedagem web ilimitada e gratuita.
   - **Google Firebase (Plano Spark)**: Oferece gratuitamente **50.000 leituras/dia**, **20.000 gravações/dia** e **1 GB de armazenamento**, o que é centenas de vezes maior que o uso diário de um docente.
2. **Sincronização em Tempo Real**:
   - Registrou a aula no celular dentro de sala? Ela já aparece instantaneamente na tela do computador do laboratório.
3. **Resiliente & Offline**:
   - Se a internet da escola oscilar ou cair, você continua registrando normalmente no navegador. Os dados ficam protegidos no dispositivo e sobem para a nuvem assim que a conexão for restabelecida.

---

## 🚀 Passo 1: Criar o Projeto no Google Firebase (2 minutos)

1. Acesse o console oficial: **[console.firebase.google.com](https://console.firebase.google.com/)**.
2. Faça login com sua conta Google (Gmail).
3. Clique em **"Adicionar projeto"** (ou *"Criar um projeto"*).
4. No campo nome do projeto, digite algo como: `meu-diario-docente` e clique em **Continuar**.
5. Na tela do *Google Analytics*, você pode desmarcar a opção para agilizar a criação e clicar em **Criar projeto**.
6. Aguarde alguns segundos e clique em **Continuar**.

---

## 🗄️ Passo 2: Criar o Banco de Dados Cloud Firestore

1. No menu lateral esquerdo do Firebase Console, clique em **Criação** (Build) e depois em **Cloud Firestore**.
2. Clique no botão azul **Criar banco de dados**.
3. **Localização**: Deixe a opção padrão ou selecione `southamerica-east1` (São Paulo) ou `us-central1`. Clique em **Avançar**.
4. **Regras de segurança**:
   - Escolha **Iniciar no modo de teste** (permite que seu sistema leia e grave dados imediatamente).
   - Clique em **Ativar** (ou *Criar*).

> [!TIP]
> **Dica sobre as Regras do Firestore:**
> O modo de teste padrão do Firebase vem configurado para permitir acesso durante 30 dias. Para garantir que seu sistema funcione sem interrupções para sempre, acesse a aba **Regras** (Rules) do Firestore e certifique-se de que esteja assim:
> ```javascript
> rules_version = '2';
> service cloud.firestore {
>   match /databases/{database}/documents {
>     match /{document=**} {
>       allow read, write: if true;
>     }
>   }
> }
> ```
> Depois clique no botão **Publicar**.

---

## 🔑 Passo 3: Obter as Chaves de Conexão do Firebase

1. Na barra lateral esquerda do Firebase Console, clique no ícone de engrenagem ⚙️ ao lado de **Visão geral do projeto** e escolha **Configurações do projeto**.
2. Role a página para baixo até a seção **Seus aplicativos**.
3. Clique no ícone da Web **`</>`** para registrar um aplicativo Web.
4. Digite um apelido para o app (por exemplo: `Diario Web`).
5. *Não precisa marcar a opção de Firebase Hosting* (pois usaremos o GitHub Pages).
6. Clique no botão **Registrar app**.
7. O Firebase vai exibir na tela um bloco de código JavaScript com a constante `firebaseConfig`. O conteúdo será parecido com este:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB1234567890abcdefghijklmnopqrst",
  authDomain: "meu-diario-docente.firebaseapp.com",
  projectId: "meu-diario-docente",
  storageBucket: "meu-diario-docente.appspot.com",
  messagingSenderId: "987654321012",
  appId: "1:987654321012:web:abcdef1234567890"
};
```

8. **Copie todo esse bloco** (ou apenas o que está entre as chaves `{ ... }`).

---

## 📲 Passo 4: Conectar no Diário do Professor

1. Abra o seu sistema no navegador (seja localmente pelo `abrir_web.bat` ou pelo link do GitHub Pages).
2. No menu superior, clique na aba **⚙️ Perfil & Ajustes**.
3. Localize o cartão **Sincronização em Nuvem (Firebase)**.
4. Cole o código que você copiou no campo de texto **Configuração do Firebase**.
5. Clique no botão azul **🔗 Conectar à Nuvem**.
6. Pronto! Em 2 segundos o sistema validará a conexão e o indicador no canto superior direito passará a exibir:
   - 🟢 **Nuvem: meu-diario-docente** (com ponto verde pulsando)
7. **Primeira sincronização**:
   - Se você já tem turmas cadastradas no computador, clique no botão **⬆️ Enviar Dados** para enviar suas turmas, planos e aulas atuais para a nuvem.
   - Ao abrir em um segundo dispositivo (ex: celular), basta colar a mesma configuração e clicar em **⬇️ Baixar da Nuvem** (ou o sistema baixará automaticamente na primeira inicialização).

---

## 🌐 Passo 5: Como Publicar no GitHub Pages (Hospedagem Web Grátis)

Com o banco configurado, você pode colocar o sistema no ar para acessá-lo de qualquer lugar via internet:

### Opção A: Pelo Navegador (Sem instalar nada)
1. Acesse o **[github.com](https://github.com/)** e crie uma conta gratuita caso não tenha.
2. Crie um novo repositório público com o nome que preferir (ex: `diario-do-professor`).
3. Na página inicial do repositório vazio, clique em **"uploading an existing file"** (enviar arquivos existentes).
4. Arraste e solte todos os arquivos da pasta do projeto:
   - `index.html`
   - `style.css`
   - `app.js`
   - `README.md`
   - `GUIA_FIREBASE.md`
5. Clique em **Commit changes** (Salvar alterações).
6. No menu do repositório, clique em **Settings** (Configurações) > menu lateral **Pages**.
7. Na seção **Build and deployment**:
   - **Source**: Deploy from a branch
   - **Branch**: Escolha `main` (ou `master`) e a pasta `/(root)`.
   - Clique em **Save**.
8. Aguarde 1 a 2 minutos e recarregue a página. O GitHub exibirá o link público do seu sistema:
   `https://seu-usuario.github.io/diario-do-professor/`

---

## ❓ Perguntas Frequentes

### 1. Se a internet da escola cair, o que acontece?
O sistema continua funcionando 100%! Você poderá lançar aulas, cadastrar turmas e acompanhar os planos sem nenhum travamento. Os dados ficam salvos com segurança no navegador (`localStorage`) e sobem automaticamente para a nuvem assim que a internet voltar.

### 2. Posso usar no celular como se fosse um aplicativo?
Sim! Ao abrir o link do GitHub Pages no celular (pelo Google Chrome no Android ou Safari no iPhone), toque no menu de opções do navegador e selecione **"Adicionar à tela de início"**. Um ícone será criado no seu celular como se fosse um aplicativo nativo.

### 3. Como conectar um novo computador ou celular?
Basta abrir o link do seu sistema no novo aparelho, ir em **⚙️ Perfil & Ajustes**, colar o mesmo código do Firebase e clicar em **Conectar**. Seus dados aparecerão na hora!

### 4. Posso fazer backup em arquivo físico?
Sim! O botão **💾 Fazer Backup (JSON)** na aba de configurações continua funcionando a qualquer momento para que você guarde cópias em pendrives ou computadores pessoais se desejar.
