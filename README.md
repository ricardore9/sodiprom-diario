# 📘⚙️ Diário do Professor — Gestão Pedagógica & Educação Profissionalizante

O **Diário do Professor** é uma plataforma moderna, intuitiva e especializada para docentes e coordenadores da **Educação Profissionalizante, Ensino Técnico e Tecnológico**. O sistema integra em um único ambiente o controle de turmas, registro diário de aulas teóricas e práticas, elaboração de matrizes curriculares e o acompanhamento rigoroso de **Planejado vs. Executado**.

---

## 🔐 Acesso e Credenciais Iniciais

Por padrão de segurança, o sistema inclui uma camada de autenticação e bloqueio rápido de tela:

- **E-mail Padrão**: `professor@educacao.tec.br`
- **Senha Padrão**: `123456`
- **PIN de Desbloqueio Rápido**: `1234`

> [!TIP]
> Você pode alterar seu e-mail, senha, PIN e fazer upload da sua foto de perfil a qualquer momento acessando a aba **Perfil & Ajustes**.

---

## 🚀 Como Iniciar o Sistema

### Opção 1: Acesso Imediato com 2 Cliques (Recomendado)
- Dê um duplo clique no arquivo **`abrir_web.bat`**.
- O Diário do Professor abrirá imediatamente no seu navegador padrão (Chrome, Edge, Firefox, etc.).

### Opção 2: Servidor Local (Para PC, Celular ou Tablet)
- Dê um duplo clique no arquivo **`iniciar_servidor.bat`**.
- O servidor iniciará em `http://localhost:3000` e informará o endereço de IP para você abrir no smartphone ou tablet conectado na mesma rede Wi-Fi.

---

## 🌟 Funcionalidades e Diferenciais

### 1. 👤 Perfil do Professor & Segurança
- **Upload de Foto de Perfil**: Carregue sua foto a partir do computador. A imagem é comprimida e gravada diretamente no navegador em alta resolução.
- **Edição Completa de Dados**: Nome completo, e-mail institucional, matéria/área técnica principal (ex: *Informática*, *Eletrotécnica*, *Mecatrônica*, *Gestão*), titulação e instituição de ensino.
- **Segurança & Senha**:
  - Alteração de senha de acesso com confirmação.
  - PIN de 4 dígitos para desbloqueio rápido.
  - Chave liga/desliga para exigir senha ao iniciar.
  - **Botão "🔒 Bloquear"**: Bloqueio instantâneo da tela com um clique no topo da navegação, ideal para quando o professor sai do laboratório ou intervalo.
  - **Proteção contra Perda Acidental de Dados em Modais**: Telas de formulários e edição (turmas, planos, chamada e aulas) não se fecham ao clicar fora ou na tecla ESC, exigindo clique deliberado no botão 'X' ou nos comandos de ação/cancelamento.

### 2. 📊 Dashboard Pedagógico
- Indicadores em tempo real (KPIs): turmas ativas, aulas ministradas no mês, percentual médio de cumprimento das matrizes técnicas e carga horária executada.
- Alertas de turmas sem plano vinculado e planos com risco de atraso curricular.
- Visão sintética das turmas com barras de progresso duplo e linha do tempo de aulas recentes.

### 3. 🏫 Gestão de Turmas Técnicas
- Cadastro detalhado: habilitação técnica, turno, sala/laboratório, dias de aula, carga horária prevista e cor de identificação.
- Vínculo direto a planos de ensino técnico.
- **Lista de Alunos & Chamada**: Cadastro individual e **importação em massa** (basta colar a lista de nomes).

### 4. 📋 Planos de Ensino como Matrizes Curriculares Reutilizáveis
- **Conceito Pedagógico Moderno**: O plano de ensino funciona como uma **matriz curricular fixa de referência** (template), contendo a ementa, módulos, tópicos práticos, competências do CNCT e carga horária total.
- **Multiturmas**: O mesmo plano de ensino pode ser vinculado a **duas ou mais turmas simultaneamente** (ex: *Turma A - Vespertino* e *Turma B - Noturno* ministrando o mesmo programa de *Desenvolvimento de Sistemas*).
- **Visão Comparativa de Evolução**: No card de cada plano, o professor visualiza a régua comparativa em tempo real com todas as turmas vinculadas e suas respectivas taxas de conclusão independentes.
- **Modelos Técnicos Prontos**:
  - *TNC - Iniciantes — Informática (Treinamento de Novos Contratados)* (4 aulas/tópicos: Fundamentos e Postura Digital, Organização de Diretórios, Revisão Excel e Revisão Word)
  - *Informática e Rotinas Digitais para Aprendizes (Ciclo 6 Meses)* (24 aulas/tópicos: Fundamentos, Outlook, Word, PowerPoint, Excel Base, Excel Avançado e Integração)
  - *Desenvolvimento de Sistemas / TI*
  - *Eletrotécnica & Comandos Industriais*
  - *Administração & Logística*
  - *Mecânica & Manutenção*

### 5. ✍️ Diário de Aulas Dadas (Teoria & Prática)
- Registro rápido da aula com checklist integrado dos tópicos do plano que foram cumpridos.
- Ao salvar a aula, o sistema atualiza automaticamente o status dos tópicos para **Concluído apenas na turma específica** que teve a aula ministrada, sem interferir no andamento de outras turmas que compartilham a mesma matriz.
- Resumo de conteúdos desenvolvidos, recursos utilizados, tarefas e avaliações.
- **Chamada de Frequência**: Controle de presenças e faltas com botão para marcar todos como presentes com 1 clique.

### 6. 🎯 Gestão do Plano: Evolução Independente por Turma (Planejado vs. Executado)
- **Acompanhamento Focado na Turma**: A tela de acompanhamento agora seleciona diretamente a **Turma Técnica** como entidade ativa de controle da evolução pedagógica.
- **Seletor Rápido de Turmas Irmãs**: Banner contextual com botões para alternar instantaneamente entre turmas que utilizam a mesma matriz e comparar o percentual de cobertura de cada uma.
- **Ciclo de Vida do Tópico por Turma**:
  - ⏳ **Pendente**: Conteúdo ainda não ministrado para este grupo.
  - 🔄 **Em Andamento**: Conteúdo iniciado em aula, aguardando fechamento prático ou entrega.
  - ✅ **Concluído**: Competência técnica completamente desenvolvida e avaliada.
  - ⚠️ **Revisão / Reforço Técnico**: Marcador pedagógico de necessidade de retomada, permitindo registrar anotações específicas de adaptação pedagógica para aquela turma.
- **Adaptações Curriculares Individualizadas**: Botão de anotação rápida (📝) para documentar ajustes de ritmo, reposições, intervenções pedagógicas ou particularidades de laboratório de cada turma.
- **Cálculo de Ritmo Dinâmico**: Indicador de ritmo (*No Prazo*, *Atrasado*, *Adiantado*) calculado com base nas aulas dadas e tópicos concluídos da turma selecionada.

### 7. 📄 Relatórios Oficiais & Impressão A4
- **📘 Plano de Ensino Completo (Matriz Curricular)**:
  - Documento oficial da habilitação técnica formatado em folha A4 e pronto para impressão ou exportação em PDF.
  - Contém cabeçalho institucional, ementa, objetivos formativos, competências profissionais alinhadas ao Catálogo Nacional de Cursos Técnicos (CNCT), metodologias e recursos de laboratório, detalhamento módulo a módulo com carga horária de cada tópico, critérios de avaliação contínua/somativa e bibliografia técnica recomendada.
  - **Campos de Assinatura Opcionais**: Na barra de ferramentas de impressão, o professor conta com uma caixa de seleção rápida (*"Incluir campos de assinatura no rodapé"*). Ao desmarcar, os blocos de assinatura (Docente, Coordenação e Direção) são completamente removidos da impressão sem deixar espaços em branco ou avisos na folha impressa, com a preferência sendo salva automaticamente no navegador.
  - **Atalhos de Acesso Rápido**:
    - Botão **"🖨️ Imprimir Plano Completo"** no card de cada plano na aba *Planos de Ensino*.
    - Botão no rodapé do modal de edição da matriz.
    - Seletor dedicado na aba *Relatórios & Documentos*.
- **📋 Diário de Classe Oficial**: Documento formal formatado no padrão institucional com cabeçalho de Educação Profissional, tabela cronológica completa, presenças e campos de assinatura formal.
- **🎯 Relatório de Cumprimento do Plano por Turma**: Documento oficial para coordenação pedagógica e supervisão escolar comprovando a execução detalhada do plano para a turma selecionada, incluindo percentual de cumprimento, status de cada tópico, carga horária executada, observações de adaptação e parecer descritivo do professor.
- **Exportação para Excel (CSV)**: Download da planilha de aulas com 1 clique.
- Impressão otimizada via `@media print` com regras de quebra de página inteligente (`page-break-inside: avoid;`).

### 8. 💾 Backup & Preservação dos Dados
- Armazenamento automático e local via `LocalStorage`.
- Download de backup `.json` e restauração de dados para portabilidade entre computadores.

### 9. ☁️ Banco de Dados na Nuvem (Firebase) & Hospedagem no GitHub Pages
- **Arquitetura Híbrida (*Offline-First*)**: Funciona tanto 100% offline (no navegador via `localStorage`) quanto sincronizado em tempo real na nuvem através do **Google Firebase Firestore**.
- **Compatível com GitHub Pages**: Hospede o frontend gratuitamente no GitHub Pages sem precisar de qualquer servidor Node ou backend próprio.
- **Sincronização Bidirecional em Tempo Real**: Ao registrar uma aula ou nota no celular, os dados refletem instantaneamente no computador da escola e vice-versa.
- **Indicador Visual na Navbar**:
  - 🟢 **Nuvem Conectada**: Conectado ao Firebase com sincronização em tempo real ativa.
  - 🔄 **Sincronizando**: Enviando ou recebendo atualizações da nuvem.
  - 🟡 **Modo Local**: Salvando com segurança na memória do dispositivo.
- **Guia Passo a Passo**: Consulte o arquivo [`GUIA_FIREBASE.md`](GUIA_FIREBASE.md) para o tutorial completo de 5 minutos sobre como criar a conta grátis no Firebase e ativar o GitHub Pages.

---

## 📁 Estrutura de Arquivos

```
controle-aulas/
├── index.html              # Shell HTML5 semântico com login, status de nuvem e perfil
├── style.css               # Design System profissionalizante, temas e layout A4
├── app.js                  # Controlador completo, autenticação, Firebase sync e módulos
├── GUIA_FIREBASE.md        # Guia passo a passo para configurar Firestore e GitHub Pages
├── servidor.js             # Servidor HTTP estático nativo em Node.js
├── abrir_web.bat           # Executável Windows (abertura imediata com 2 cliques)
├── iniciar_servidor.bat    # Executável para inicialização do servidor local
└── README.md               # Manual de instruções do sistema
```
