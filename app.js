/**
 * ==========================================================================
 * Diário do Professor — Gestão Pedagógica & Educação Profissionalizante
 * Aplicação autônoma, completa e de alta performance.
 * ==========================================================================
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. MODELOS DE DADOS, ENUMS E FORMATADORES
  // ==========================================================================

  const StatusTopico = {
    PENDENTE: 'pendente',
    EM_ANDAMENTO: 'em_andamento',
    CONCLUIDO: 'concluido',
    REVISAO: 'revisao'
  };

  const StatusTurma = {
    ATIVA: 'ativa',
    CONCLUIDA: 'concluida',
    ARQUIVADA: 'arquivada'
  };

  function gerarId(prefixo = 'id') {
    return `${prefixo}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  function formatarData(dataIso) {
    if (!dataIso) return '-';
    const partes = String(dataIso).split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    const data = new Date(dataIso);
    return isNaN(data.getTime()) ? dataIso : data.toLocaleDateString('pt-BR');
  }

  function dataHojeIso() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  function criarNovaTurma(dados = {}) {
    return {
      id: dados.id || gerarId('turma'),
      nome: dados.nome || '',
      disciplina: dados.disciplina || '',
      anoLetivo: dados.anoLetivo || new Date().getFullYear().toString(),
      periodo: dados.periodo || 'Matutino',
      sala: dados.sala || '',
      diasSemana: dados.diasSemana || ['Segunda-feira'],
      cargaHorariaTotal: Number(dados.cargaHorariaTotal) || 80,
      cor: dados.cor || '#0284c7',
      status: dados.status || StatusTurma.ATIVA,
      planoId: dados.planoId || null,
      progressoTopicos: dados.progressoTopicos || {},
      alunos: dados.alunos || [],
      createdAt: dados.createdAt || new Date().toISOString()
    };
  }

  function criarNovoTopico(dados = {}) {
    return {
      id: dados.id || gerarId('topico'),
      ordem: Number(dados.ordem) || 1,
      titulo: dados.titulo || '',
      objetivosEspecificos: dados.objetivosEspecificos || '',
      conteudoProgramatico: dados.conteudoProgramatico || '',
      metodologiaSugerida: dados.metodologiaSugerida || 'Aula expositiva dialogada e prática em laboratório',
      recursosDidaticos: dados.recursosDidaticos || 'Computadores, IDE de desenvolvimento, projetor',
      aulasEstimadas: Number(dados.aulasEstimadas) || 2,
      status: dados.status || StatusTopico.PENDENTE,
      observacoesAjuste: dados.observacoesAjuste || ''
    };
  }

  function criarNovoModulo(dados = {}) {
    return {
      id: dados.id || gerarId('modulo'),
      ordem: Number(dados.ordem) || 1,
      titulo: dados.titulo || 'Módulo 1: Fundamentos Técnicos',
      topicos: (dados.topicos || []).map(t => criarNovoTopico(t))
    };
  }

  function criarNovoPlano(dados = {}) {
    return {
      id: dados.id || gerarId('plano'),
      titulo: dados.titulo || '',
      disciplina: dados.disciplina || '',
      nivelEnsino: dados.nivelEnsino || 'Curso Técnico',
      anoSemestre: dados.anoSemestre || `${new Date().getFullYear()}.1`,
      ementa: dados.ementa || '',
      objetivoGeral: dados.objetivoGeral || '',
      competenciasBNCC: dados.competenciasBNCC || '',
      metodologia: dados.metodologia || '',
      recursos: dados.recursos || '',
      criteriosAvaliacao: dados.criteriosAvaliacao || '',
      bibliografia: dados.bibliografia || '',
      cargaHorariaTotalEstimada: Number(dados.cargaHorariaTotalEstimada) || 80,
      modulos: (dados.modulos || []).map(m => criarNovoModulo(m)),
      createdAt: dados.createdAt || new Date().toISOString(),
      updatedAt: dados.updatedAt || new Date().toISOString()
    };
  }

  function criarNovaAulaDada(dados = {}) {
    return {
      id: dados.id || gerarId('aula'),
      turmaId: dados.turmaId || '',
      planoId: dados.planoId || null,
      data: dados.data || dataHojeIso(),
      duracaoAulas: Number(dados.duracaoAulas) || 2,
      topicosIds: dados.topicosIds || [],
      conteudoMinistrado: dados.conteudoMinistrado || '',
      metodologiaUtilizada: dados.metodologiaUtilizada || '',
      recursosUtilizados: dados.recursosUtilizados || '',
      observacoesTurma: dados.observacoesTurma || '',
      tarefasCasa: dados.tarefasCasa || '',
      avaliacaoRealizada: dados.avaliacaoRealizada || '',
      frequencia: dados.frequencia || {
        registrada: false,
        totalAlunos: 0,
        presencas: [],
        ausencias: []
      },
      createdAt: dados.createdAt || new Date().toISOString()
    };
  }

  // ==========================================================================
  // 2. STORE, PERSISTÊNCIA LOCAL E PERFIL DO PROFESSOR
  // ==========================================================================

  const CHAVE_STORAGE = 'diario_professor_dados_v2';
  const CHAVE_STORAGE_ANTIGA = 'eduplan_dados_v1';

  let estado = {
    professor: {
      nome: 'Prof. Carlos Eduardo',
      email: 'professor@educacao.tec.br',
      materia: 'Desenvolvimento de Sistemas & TI',
      titulacao: 'Especialista em Engenharia de Software',
      fotoUrl: '',
      escola: 'Instituto Técnico de Educação Profissional',
      anoLetivoPadrao: '2026',
      tema: 'light',
      senha: '123456',
      pin: '1234',
      exigirSenha: true,
      exibirAssinaturasPlano: true
    },
    turmas: [],
    planos: [],
    aulas: []
  };

  const CHAVE_SESSAO = 'diario_professor_sessao_ativa';
  let sessao = {
    autenticado: false
  };

  const ouvintes = [];

  function subscreverMudancas(fn) {
    ouvintes.push(fn);
    return () => {
      const idx = ouvintes.indexOf(fn);
      if (idx !== -1) ouvintes.splice(idx, 1);
    };
  }

  function notificarMudancas() {
    ouvintes.forEach(fn => {
      try { fn(estado); } catch (e) { console.error(e); }
    });
  }

  function salvarNoStorage() {
    try {
      localStorage.setItem(CHAVE_STORAGE, JSON.stringify(estado));
      notificarMudancas();
      atualizarChipNavbar();
    } catch (erro) {
      console.error('Erro ao salvar dados no localStorage:', erro);
    }
  }

  function inicializarStore() {
    try {
      let salvos = localStorage.getItem(CHAVE_STORAGE);
      if (!salvos) {
        // Tenta migrar dados da versão anterior se existirem
        const dadosAntigos = localStorage.getItem(CHAVE_STORAGE_ANTIGA);
        if (dadosAntigos) {
          salvos = dadosAntigos;
        }
      }

      if (salvos) {
        const parsed = JSON.parse(salvos);
        const configOrig = parsed.config || {};
        const profOrig = parsed.professor || {};

        estado = {
          professor: {
            ...estado.professor,
            nome: profOrig.nome || configOrig.nomeProfessor || estado.professor.nome,
            email: profOrig.email || estado.professor.email,
            materia: profOrig.materia || estado.professor.materia,
            titulacao: profOrig.titulacao || estado.professor.titulacao,
            fotoUrl: profOrig.fotoUrl || '',
            escola: profOrig.escola || configOrig.escola || estado.professor.escola,
            anoLetivoPadrao: profOrig.anoLetivoPadrao || configOrig.anoLetivoPadrao || '2026',
            tema: profOrig.tema || configOrig.tema || 'light',
            senha: profOrig.senha || '123456',
            pin: profOrig.pin || '1234',
            exigirSenha: profOrig.exigirSenha !== undefined ? profOrig.exigirSenha : true,
            exibirAssinaturasPlano: profOrig.exibirAssinaturasPlano !== undefined ? profOrig.exibirAssinaturasPlano : true
          },
          turmas: (parsed.turmas || []).map(t => criarNovaTurma(t)),
          planos: parsed.planos || [],
          aulas: parsed.aulas || []
        };
        sincronizarProgressoTurmas();

        // Sincroniza a flag de assinatura global
        if (estado.professor.exibirAssinaturasPlano !== undefined) {
          exibirAssinaturasPlano = Boolean(estado.professor.exibirAssinaturasPlano);
        }

        // Garante que o plano de Informática para Aprendizes esteja disponível mesmo para dados legados
        if (!estado.planos.some(p => p.id === 'plano_informatica_aprendizes_2026' || (p.titulo && p.titulo.includes('Informática e Rotinas Digitais')))) {
          estado.planos.push(obterPlanoInformaticaAprendizes());
          salvarNoStorage();
        }

        // Garante que o plano TNC - Iniciantes esteja disponível mesmo para dados legados
        if (!estado.planos.some(p => p.id === 'plano_tnc_iniciantes_2026' || (p.titulo && (p.titulo.includes('TNC - Iniciantes') || p.titulo.includes('Informática TNC'))))) {
          estado.planos.push(obterPlanoTNCIniciantes());
          salvarNoStorage();
        }
      } else {
        carregarDadosDemonstracao();
      }
    } catch (e) {
      console.warn('Erro ao carregar dados, inicializando padrão:', e);
      carregarDadosDemonstracao();
    }

    if (estado.professor && estado.professor.exibirAssinaturasPlano !== undefined) {
      exibirAssinaturasPlano = Boolean(estado.professor.exibirAssinaturasPlano);
    }

    // Se a exigência de senha estiver desativada ou já houver sessão ativa salva, inicia autenticado
    if (!estado.professor.exigirSenha || localStorage.getItem(CHAVE_SESSAO) === 'true') {
      sessao.autenticado = true;
    }

    // Inicializa a conexão com a nuvem Firebase se houver configuração salva
    verificarEInicializarFirebaseSalvo();
  }

  function sincronizarProgressoTurmas() {
    estado.turmas.forEach(turma => {
      if (!turma.progressoTopicos || typeof turma.progressoTopicos !== 'object') {
        turma.progressoTopicos = {};
      }
      if (turma.planoId) {
        const plano = estado.planos.find(p => p.id === turma.planoId);
        if (plano) {
          const aulasDaTurma = estado.aulas.filter(a => a.turmaId === turma.id);
          (plano.modulos || []).forEach(m => {
            (m.topicos || []).forEach(t => {
              if (!turma.progressoTopicos[t.id]) {
                const aulaComTopico = aulasDaTurma.find(a => (a.topicosIds || []).includes(t.id));
                if (aulaComTopico) {
                  turma.progressoTopicos[t.id] = {
                    status: StatusTopico.CONCLUIDO,
                    observacoesAjuste: '',
                    dataUltimaAula: aulaComTopico.data || null
                  };
                } else {
                  turma.progressoTopicos[t.id] = {
                    status: StatusTopico.PENDENTE,
                    observacoesAjuste: '',
                    dataUltimaAula: null
                  };
                }
              }
            });
          });
        }
      }
    });
  }

  // ==========================================================================
  // 2.1 SINCRONIZAÇÃO EM NUVEM (GOOGLE FIREBASE FIRESTORE)
  // ==========================================================================

  const CHAVE_FIREBASE_CONFIG = 'diario_professor_firebase_config';
  const CONFIGURACAO_FIREBASE_PADRAO = {
    apiKey: "AIzaSyB9Uam8rMiMqet57rqj8vGitCyMhgLEouo",
    authDomain: "sodiprom-diario-de-aula.firebaseapp.com",
    projectId: "sodiprom-diario-de-aula",
    storageBucket: "sodiprom-diario-de-aula.firebasestorage.app",
    messagingSenderId: "171794330257",
    appId: "1:171794330257:web:45b11a07c2c117eaf70530"
  };

  let firebaseApp = null;
  let dbFirestore = null;
  let firebaseConectado = false;
  let firebaseProjectId = '';
  let unsubscribesFirebase = [];
  let sincronizacaoEmProgresso = false;

  function isFirebaseConectado() {
    return firebaseConectado && Boolean(dbFirestore);
  }

  function obterDescricaoStatusNuvem() {
    if (isFirebaseConectado()) {
      return `Conectado ao projeto: ${firebaseProjectId} (Tempo Real Ativo)`;
    }
    const salva = localStorage.getItem(CHAVE_FIREBASE_CONFIG);
    if (salva && salva !== 'desconectado') {
      return 'Credenciais salvas — Modo Local (reconectando ao carregar)';
    }
    return 'Modo Local (Offline) — Conecte ao Firebase para sincronizar celular e PC';
  }

  function obterRawConfigFirebase() {
    const raw = localStorage.getItem(CHAVE_FIREBASE_CONFIG);
    if (raw && raw !== 'desconectado') {
      try {
        return JSON.stringify(JSON.parse(raw), null, 2);
      } catch (_) {
        return raw;
      }
    }
    if (CONFIGURACAO_FIREBASE_PADRAO) {
      return JSON.stringify(CONFIGURACAO_FIREBASE_PADRAO, null, 2);
    }
    return '';
  }

  function parsearFirebaseConfig(input) {
    if (!input || typeof input !== 'string') return null;
    let trimmed = input.trim();
    if (!trimmed) return null;

    // Se o usuário colou "const firebaseConfig = { ... };", extrai o objeto entre chaves
    const matchChaves = trimmed.match(/\{[\s\S]*\}/);
    if (matchChaves) {
      trimmed = matchChaves[0];
    }

    try {
      const obj = JSON.parse(trimmed);
      if (obj && (obj.projectId || obj.apiKey)) return obj;
    } catch (_) {}

    try {
      const jsonLike = trimmed
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
        .replace(/'/g, '"')
        .replace(/,\s*([}\]])/g, '$1');
      const obj = JSON.parse(jsonLike);
      if (obj && (obj.projectId || obj.apiKey)) return obj;
    } catch (_) {}

    return null;
  }

  function atualizarBadgeNuvem(status, info = '') {
    const badge = document.getElementById('cloudStatusBadge');
    const text = document.getElementById('cloudStatusText');
    if (!badge || !text) return;

    badge.classList.remove('connected', 'syncing', 'offline');
    badge.classList.add(status);

    if (status === 'connected') {
      text.textContent = info ? `Nuvem: ${info}` : 'Nuvem Conectada';
      badge.title = `Conectado à nuvem Firebase (${info || 'Firestore'}). Sincronização em tempo real ativa!`;
    } else if (status === 'syncing') {
      text.textContent = 'Sincronizando...';
      badge.title = 'Enviando/recebendo atualizações da nuvem...';
    } else {
      text.textContent = 'Modo Local';
      badge.title = 'Armazenamento local no navegador. Clique para conectar ao Firebase.';
    }
  }

  async function inicializarFirebase(config, silencioso = false) {
    if (!config || !config.projectId) {
      if (!silencioso) mostrarToast('Configuração inválida! O campo projectId é obrigatório.', 'error');
      return false;
    }

    if (typeof firebase === 'undefined') {
      console.warn('SDK do Firebase não encontrado no escopo global.');
      if (!silencioso) {
        mostrarToast('SDK do Firebase indisponível. Verifique sua conexão com a internet.', 'warning');
      }
      return false;
    }

    try {
      atualizarBadgeNuvem('syncing');

      // Se já houver um app instanciado, encerra ou reutiliza
      if (firebaseApp) {
        try { await firebaseApp.delete(); } catch (_) {}
      }

      const appName = 'EduPlanApp_' + Date.now();
      firebaseApp = firebase.initializeApp(config, appName);
      dbFirestore = firebaseApp.firestore();

      // Habilita persistência offline do Firestore quando suportado
      try {
        await dbFirestore.enablePersistence({ synchronizeTabs: true });
      } catch (errPersist) {
        // Ignora erro se já habilitado em outra aba
      }

      // Testa a gravação/leitura de um ping de validação
      await dbFirestore.collection('diario_meta').doc('ping').set({
        ultimoAcesso: new Date().toISOString(),
        versao: '2.0',
        docente: estado.professor.nome || 'Professor'
      });

      firebaseConectado = true;
      firebaseProjectId = config.projectId;
      localStorage.setItem(CHAVE_FIREBASE_CONFIG, JSON.stringify(config));

      atualizarBadgeNuvem('connected', config.projectId);

      // Sincronização inicial inteligente
      await sincronizarDadosIniciaisNuvem();

      // Configura listeners em tempo real
      configurarListenersNuvem();

      if (!silencioso) {
        mostrarToast(`Nuvem conectada ao projeto "${config.projectId}"!`, 'success');
      }
      return true;
    } catch (erro) {
      console.error('Erro ao conectar ao Firebase:', erro);
      firebaseConectado = false;
      atualizarBadgeNuvem('offline');
      if (!silencioso) {
        mostrarToast(`Falha ao conectar no Firebase: ${erro.message || 'Verifique as regras do Firestore e chaves.'}`, 'error');
      }
      return false;
    }
  }

  async function sincronizarDadosIniciaisNuvem() {
    if (!isFirebaseConectado()) return;

    try {
      sincronizacaoEmProgresso = true;
      const snapTurmas = await dbFirestore.collection('turmas').get();
      const snapPlanos = await dbFirestore.collection('planos').get();

      if (snapTurmas.empty && snapPlanos.empty) {
        // Banco na nuvem ainda vazio: envia os dados atuais para a nuvem
        console.log('[Firebase] Nuvem vazia. Enviando dados locais para o Firestore...');
        await enviarTudoParaNuvemSilencioso();
      } else {
        // Banco na nuvem já possui dados: puxa para o local
        console.log('[Firebase] Nuvem com registros existentes. Carregando dados da nuvem...');
        await puxarTudoDaNuvemSilencioso();
      }
    } catch (e) {
      console.warn('[Firebase] Aviso na sincronização inicial:', e);
    } finally {
      sincronizacaoEmProgresso = false;
    }
  }

  function configurarListenersNuvem() {
    if (!isFirebaseConectado()) return;

    unsubscribesFirebase.forEach(unsub => {
      try { unsub(); } catch (_) {}
    });
    unsubscribesFirebase = [];

    // 1. Listener de Turmas
    const unsubTurmas = dbFirestore.collection('turmas').onSnapshot(snapshot => {
      if (sincronizacaoEmProgresso || (snapshot.metadata && snapshot.metadata.hasPendingWrites)) return;
      const nuvemTurmas = [];
      snapshot.forEach(doc => nuvemTurmas.push(doc.data()));
      if (nuvemTurmas.length > 0) {
        estado.turmas = nuvemTurmas;
        localStorage.setItem(CHAVE_STORAGE, JSON.stringify(estado));
        notificarMudancas();
      }
    }, err => console.warn('[Firebase] Listener turmas:', err));
    unsubscribesFirebase.push(unsubTurmas);

    // 2. Listener de Planos
    const unsubPlanos = dbFirestore.collection('planos').onSnapshot(snapshot => {
      if (sincronizacaoEmProgresso || (snapshot.metadata && snapshot.metadata.hasPendingWrites)) return;
      const nuvemPlanos = [];
      snapshot.forEach(doc => nuvemPlanos.push(doc.data()));
      if (nuvemPlanos.length > 0) {
        estado.planos = nuvemPlanos;
        localStorage.setItem(CHAVE_STORAGE, JSON.stringify(estado));
        notificarMudancas();
      }
    }, err => console.warn('[Firebase] Listener planos:', err));
    unsubscribesFirebase.push(unsubPlanos);

    // 3. Listener de Aulas
    const unsubAulas = dbFirestore.collection('aulas').onSnapshot(snapshot => {
      if (sincronizacaoEmProgresso || (snapshot.metadata && snapshot.metadata.hasPendingWrites)) return;
      const nuvemAulas = [];
      snapshot.forEach(doc => nuvemAulas.push(doc.data()));
      if (nuvemAulas.length > 0) {
        estado.aulas = nuvemAulas;
        localStorage.setItem(CHAVE_STORAGE, JSON.stringify(estado));
        notificarMudancas();
      }
    }, err => console.warn('[Firebase] Listener aulas:', err));
    unsubscribesFirebase.push(unsubAulas);

    // 4. Listener de Perfil
    const unsubProf = dbFirestore.collection('configuracoes').doc('professor').onSnapshot(doc => {
      if (sincronizacaoEmProgresso || (doc.metadata && doc.metadata.hasPendingWrites)) return;
      if (doc.exists) {
        estado.professor = { ...estado.professor, ...doc.data() };
        localStorage.setItem(CHAVE_STORAGE, JSON.stringify(estado));
        notificarMudancas();
        atualizarChipNavbar();
      }
    }, err => console.warn('[Firebase] Listener perfil:', err));
    unsubscribesFirebase.push(unsubProf);
  }

  function salvarNoFirestore(colecao, id, dados) {
    if (!isFirebaseConectado()) return;
    try {
      dbFirestore.collection(colecao).doc(String(id)).set(JSON.parse(JSON.stringify(dados)), { merge: true })
        .catch(err => console.warn(`[Firebase] Erro ao salvar em ${colecao}/${id}:`, err));
    } catch (e) {
      console.warn(`[Firebase] Exceção ao salvar em ${colecao}/${id}:`, e);
    }
  }

  function excluirDoFirestore(colecao, id) {
    if (!isFirebaseConectado()) return;
    try {
      dbFirestore.collection(colecao).doc(String(id)).delete()
        .catch(err => console.warn(`[Firebase] Erro ao excluir de ${colecao}/${id}:`, err));
    } catch (e) {
      console.warn(`[Firebase] Exceção ao excluir de ${colecao}/${id}:`, e);
    }
  }

  async function enviarTudoParaNuvemSilencioso() {
    if (!isFirebaseConectado()) return;
    try {
      const batch = dbFirestore.batch();
      estado.turmas.forEach(t => batch.set(dbFirestore.collection('turmas').doc(t.id), JSON.parse(JSON.stringify(t))));
      estado.planos.forEach(p => batch.set(dbFirestore.collection('planos').doc(p.id), JSON.parse(JSON.stringify(p))));
      estado.aulas.forEach(a => batch.set(dbFirestore.collection('aulas').doc(a.id), JSON.parse(JSON.stringify(a))));
      batch.set(dbFirestore.collection('configuracoes').doc('professor'), JSON.parse(JSON.stringify(estado.professor)));
      await batch.commit();
    } catch (e) {
      console.warn('[Firebase] Erro batch upload:', e);
    }
  }

  async function enviarTudoParaNuvemManual() {
    if (!isFirebaseConectado()) {
      mostrarToast('Nuvem não conectada! Configure o Firebase primeiro.', 'warning');
      return;
    }
    try {
      atualizarBadgeNuvem('syncing');
      mostrarToast('Enviando registros locais para a nuvem...', 'info');
      await enviarTudoParaNuvemSilencioso();
      atualizarBadgeNuvem('connected', firebaseProjectId);
      mostrarToast('Todos os dados locais foram sincronizados na nuvem!', 'success');
    } catch (e) {
      atualizarBadgeNuvem('connected', firebaseProjectId);
      mostrarToast('Erro ao enviar dados: ' + e.message, 'error');
    }
  }

  async function puxarTudoDaNuvemSilencioso() {
    if (!isFirebaseConectado()) return;
    try {
      const [snapTurmas, snapPlanos, snapAulas, docProf] = await Promise.all([
        dbFirestore.collection('turmas').get(),
        dbFirestore.collection('planos').get(),
        dbFirestore.collection('aulas').get(),
        dbFirestore.collection('configuracoes').doc('professor').get()
      ]);

      if (!snapTurmas.empty) {
        const tList = [];
        snapTurmas.forEach(d => tList.push(d.data()));
        estado.turmas = tList;
      }
      if (!snapPlanos.empty) {
        const pList = [];
        snapPlanos.forEach(d => pList.push(d.data()));
        estado.planos = pList;
      }
      if (!snapAulas.empty) {
        const aList = [];
        snapAulas.forEach(d => aList.push(d.data()));
        estado.aulas = aList;
      }
      if (docProf.exists) {
        estado.professor = { ...estado.professor, ...docProf.data() };
      }

      localStorage.setItem(CHAVE_STORAGE, JSON.stringify(estado));
      notificarMudancas();
      atualizarChipNavbar();
    } catch (e) {
      console.warn('[Firebase] Erro ao baixar dados da nuvem:', e);
    }
  }

  async function puxarTudoDaNuvemManual() {
    if (!isFirebaseConectado()) {
      mostrarToast('Nuvem não conectada!', 'warning');
      return;
    }
    try {
      atualizarBadgeNuvem('syncing');
      mostrarToast('Baixando dados da nuvem...', 'info');
      await puxarTudoDaNuvemSilencioso();
      atualizarBadgeNuvem('connected', firebaseProjectId);
      reRenderizar();
      mostrarToast('Dados baixados da nuvem e sincronizados com sucesso!', 'success');
    } catch (e) {
      atualizarBadgeNuvem('connected', firebaseProjectId);
      mostrarToast('Erro ao baixar da nuvem: ' + e.message, 'error');
    }
  }

  async function desconectarFirebase() {
    unsubscribesFirebase.forEach(unsub => {
      try { unsub(); } catch (_) {}
    });
    unsubscribesFirebase = [];
    localStorage.setItem(CHAVE_FIREBASE_CONFIG, 'desconectado');
    firebaseConectado = false;
    dbFirestore = null;
    firebaseProjectId = '';
    atualizarBadgeNuvem('offline');

    const appParaDeletar = firebaseApp;
    firebaseApp = null;
    if (appParaDeletar) {
      try { await appParaDeletar.delete(); } catch (_) {}
    }
    reRenderizar();
    mostrarToast('Nuvem desconectada. Sistema operando em Modo Local.', 'info');
  }

  function verificarEInicializarFirebaseSalvo() {
    try {
      const salvo = localStorage.getItem(CHAVE_FIREBASE_CONFIG);
      if (salvo === 'desconectado') return;
      let config = null;
      if (salvo) {
        config = JSON.parse(salvo);
      } else if (CONFIGURACAO_FIREBASE_PADRAO && CONFIGURACAO_FIREBASE_PADRAO.projectId) {
        config = CONFIGURACAO_FIREBASE_PADRAO;
      }
      if (config && (config.projectId || config.apiKey)) {
        inicializarFirebase(config, true);
      }
    } catch (e) {
      console.warn('Erro ao restaurar Firebase salvo:', e);
    }
  }

  async function conectarFirebaseForm(e) {
    if (e && e.preventDefault) e.preventDefault();
    const textarea = document.getElementById('inputFirebaseConfig');
    if (!textarea) return;
    const valor = textarea.value.trim();
    if (!valor) {
      mostrarToast('Por favor, cole a configuração do Firebase.', 'warning');
      return;
    }

    const config = parsearFirebaseConfig(valor);
    if (!config || !config.projectId) {
      mostrarToast('Formato inválido! Certifique-se de colar o bloco JSON ou const firebaseConfig contendo projectId.', 'error');
      return;
    }

    const btn = document.getElementById('btnSalvarFirebase');
    const textoOriginal = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>⏳ Conectando...</span>';
    }

    const ok = await inicializarFirebase(config, false);
    if (ok) {
      reRenderizar();
    } else {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = textoOriginal;
      }
    }
  }

  async function desconectarFirebaseConfirmado() {
    if (confirm('Deseja realmente desconectar a nuvem deste navegador? Seus dados continuarão salvos localmente e no Firebase.')) {
      await desconectarFirebase();
    }
  }


  function getEstado() {
    return estado;
  }

  function obterPerfilProfessor() {
    return { ...estado.professor };
  }

  function salvarPerfilProfessor(novosDados) {
    estado.professor = { ...estado.professor, ...novosDados };
    salvarNoStorage();
    salvarNoFirestore('configuracoes', 'professor', estado.professor);
  }

  function listarTurmas(apenasAtivas = false) {
    if (apenasAtivas) {
      return estado.turmas.filter(t => t.status === StatusTurma.ATIVA);
    }
    return [...estado.turmas];
  }

  function obterTurma(id) {
    return estado.turmas.find(t => t.id === id) || null;
  }

  function salvarTurma(dadosTurma) {
    const indice = estado.turmas.findIndex(t => t.id === dadosTurma.id);
    let turmaSalva;
    if (indice >= 0) {
      estado.turmas[indice] = { ...estado.turmas[indice], ...dadosTurma };
      turmaSalva = estado.turmas[indice];
    } else {
      turmaSalva = criarNovaTurma(dadosTurma);
      estado.turmas.push(turmaSalva);
    }
    salvarNoStorage();
    salvarNoFirestore('turmas', turmaSalva.id, turmaSalva);
  }

  function excluirTurma(id) {
    estado.turmas = estado.turmas.filter(t => t.id !== id);
    estado.aulas = estado.aulas.filter(a => a.turmaId !== id);
    salvarNoStorage();
    excluirDoFirestore('turmas', id);
  }

  function listarPlanos() {
    return [...estado.planos];
  }

  function obterPlano(id) {
    return estado.planos.find(p => p.id === id) || null;
  }

  function salvarPlano(dadosPlano) {
    dadosPlano.updatedAt = new Date().toISOString();
    const indice = estado.planos.findIndex(p => p.id === dadosPlano.id);
    let planoSalvo;
    if (indice >= 0) {
      estado.planos[indice] = { ...estado.planos[indice], ...dadosPlano };
      planoSalvo = estado.planos[indice];
    } else {
      planoSalvo = criarNovoPlano(dadosPlano);
      estado.planos.push(planoSalvo);
    }
    salvarNoStorage();
    salvarNoFirestore('planos', planoSalvo.id, planoSalvo);
  }

  function excluirPlano(id) {
    estado.planos = estado.planos.filter(p => p.id !== id);
    estado.turmas.forEach(t => {
      if (t.planoId === id) t.planoId = null;
    });
    salvarNoStorage();
    excluirDoFirestore('planos', id);
  }

  function obterProgressoTopicoTurma(turmaId, topicoId) {
    const turma = obterTurma(turmaId);
    if (!turma || !turma.progressoTopicos || !turma.progressoTopicos[topicoId]) {
      return {
        status: StatusTopico.PENDENTE,
        observacoesAjuste: '',
        dataUltimaAula: null
      };
    }
    return turma.progressoTopicos[topicoId];
  }

  function atualizarStatusTopicoTurma(turmaId, topicoId, novoStatus, observacoes = null) {
    const turma = obterTurma(turmaId);
    if (!turma) return false;

    if (!turma.progressoTopicos) {
      turma.progressoTopicos = {};
    }

    if (!turma.progressoTopicos[topicoId]) {
      turma.progressoTopicos[topicoId] = {
        status: StatusTopico.PENDENTE,
        observacoesAjuste: '',
        dataUltimaAula: null
      };
    }

    if (novoStatus) {
      turma.progressoTopicos[topicoId].status = novoStatus;
    }
    if (observacoes !== null) {
      turma.progressoTopicos[topicoId].observacoesAjuste = observacoes;
    }

    salvarNoStorage();
    return true;
  }

  function atualizarStatusTopico(planoId, topicoId, novoStatus, observacoes = null) {
    const plano = obterPlano(planoId);
    if (!plano) return false;

    let atualizou = false;
    for (const modulo of plano.modulos || []) {
      const topico = (modulo.topicos || []).find(t => t.id === topicoId);
      if (topico) {
        if (novoStatus) topico.status = novoStatus;
        if (observacoes !== null) topico.observacoesAjuste = observacoes;
        atualizou = true;
        break;
      }
    }

    if (atualizou) {
      plano.updatedAt = new Date().toISOString();
      salvarNoStorage();
    }
    return atualizou;
  }

  function listarAulas(filtros = {}) {
    let lista = [...estado.aulas];
    if (filtros.turmaId) {
      lista = lista.filter(a => a.turmaId === filtros.turmaId);
    }
    if (filtros.planoId) {
      lista = lista.filter(a => a.planoId === filtros.planoId);
    }
    if (filtros.dataInicio) {
      lista = lista.filter(a => a.data >= filtros.dataInicio);
    }
    if (filtros.dataFim) {
      lista = lista.filter(a => a.data <= filtros.dataFim);
    }
    return lista.sort((a, b) => (b.data || '').localeCompare(a.data || ''));
  }

  function obterAula(id) {
    return estado.aulas.find(a => a.id === id) || null;
  }

  function salvarAula(dadosAula, atualizarStatusTopicosAutomatico = true) {
    const indice = estado.aulas.findIndex(a => a.id === dadosAula.id);
    const aulaPronta = criarNovaAulaDada(dadosAula);

    if (indice >= 0) {
      estado.aulas[indice] = aulaPronta;
    } else {
      estado.aulas.push(aulaPronta);
    }

    // O progresso pedagógico é atualizado EXCLUSIVAMENTE para a turma vinculada à aula!
    if (atualizarStatusTopicosAutomatico && aulaPronta.turmaId && aulaPronta.topicosIds?.length > 0) {
      const turma = obterTurma(aulaPronta.turmaId);
      if (turma) {
        if (!turma.progressoTopicos) turma.progressoTopicos = {};
        aulaPronta.topicosIds.forEach(tId => {
          const prog = turma.progressoTopicos[tId] || {
            status: StatusTopico.PENDENTE,
            observacoesAjuste: '',
            dataUltimaAula: null
          };
          // Se o tópico estava pendente para esta turma, avança para concluído
          if (prog.status === StatusTopico.PENDENTE) {
            prog.status = StatusTopico.CONCLUIDO;
          }
          prog.dataUltimaAula = aulaPronta.data;
          turma.progressoTopicos[tId] = prog;
        });
      }
    }

    salvarNoStorage();
    salvarNoFirestore('aulas', aulaPronta.id, aulaPronta);
    if (aulaPronta.turmaId) {
      const turma = obterTurma(aulaPronta.turmaId);
      if (turma) salvarNoFirestore('turmas', turma.id, turma);
    }
    return aulaPronta;
  }

  function excluirAula(id) {
    estado.aulas = estado.aulas.filter(a => a.id !== id);
    salvarNoStorage();
    excluirDoFirestore('aulas', id);
  }

  function calcularMetricasTurma(turmaId) {
    const turma = obterTurma(turmaId);
    if (!turma) return null;

    const aulasTurma = estado.aulas.filter(a => a.turmaId === turmaId);
    const totalAulasDadas = aulasTurma.reduce((acc, a) => acc + (Number(a.duracaoAulas) || 1), 0);
    const cargaPrevista = Number(turma.cargaHorariaTotal) || 80;
    const percentualCarga = Math.min(100, Math.round((totalAulasDadas / cargaPrevista) * 100));

    let totalTopicos = 0;
    let topicosConcluidos = 0;
    let topicosEmAndamento = 0;
    let topicosPendentes = 0;
    let topicosRevisao = 0;
    let totalAulasEstimadasPlano = 0;
    let plano = null;
    let modulosMetricas = [];

    if (turma.planoId) {
      plano = obterPlano(turma.planoId);
      if (plano && plano.modulos) {
        modulosMetricas = plano.modulos.map(m => {
          let modTotal = 0;
          let modConcluidos = 0;
          let modAulas = 0;

          (m.topicos || []).forEach(t => {
            totalTopicos++;
            modTotal++;
            const horas = Number(t.aulasEstimadas) || 1;
            totalAulasEstimadasPlano += horas;
            modAulas += horas;

            const prog = (turma.progressoTopicos && turma.progressoTopicos[t.id]) || { status: StatusTopico.PENDENTE };
            if (prog.status === StatusTopico.CONCLUIDO) {
              topicosConcluidos++;
              modConcluidos++;
            } else if (prog.status === StatusTopico.EM_ANDAMENTO) {
              topicosEmAndamento++;
            } else if (prog.status === StatusTopico.REVISAO) {
              topicosRevisao++;
            } else {
              topicosPendentes++;
            }
          });

          return {
            moduloId: m.id,
            titulo: m.titulo,
            totalTopicos: modTotal,
            concluidos: modConcluidos,
            aulasEstimadas: modAulas,
            percentual: modTotal > 0 ? Math.round((modConcluidos / modTotal) * 100) : 0
          };
        });
      }
    }

    const percentualPlano = totalTopicos > 0 ? Math.round((topicosConcluidos / totalTopicos) * 100) : 0;

    let ritmo = 'No prazo';
    if (percentualPlano < 30 && totalAulasDadas > totalAulasEstimadasPlano * 0.4) {
      ritmo = 'Atrasado';
    } else if (percentualPlano > 60 && totalAulasDadas < totalAulasEstimadasPlano * 0.4) {
      ritmo = 'Adiantado';
    }

    let totalPresencas = 0;
    let totalChamadas = 0;
    aulasTurma.forEach(a => {
      if (a.frequencia && a.frequencia.registrada && a.frequencia.totalAlunos > 0) {
        totalPresencas += (a.frequencia.presencas || []).length;
        totalChamadas += a.frequencia.totalAlunos;
      }
    });

    const frequenciaMedia = totalChamadas > 0 ? Math.round((totalPresencas / totalChamadas) * 100) : 100;

    return {
      turma,
      totalAulasDadas,
      cargaPrevista,
      percentualCarga,
      plano,
      totalTopicos,
      topicosConcluidos,
      topicosEmAndamento,
      topicosPendentes,
      topicosRevisao,
      percentualPlano,
      modulosMetricas,
      totalAulasEstimadasPlano,
      ritmo,
      frequenciaMedia,
      totalAlunos: turma.alunos?.length || 0,
      quantidadeEncontros: aulasTurma.length
    };
  }

  function calcularMetricasPlano(planoId) {
    const plano = obterPlano(planoId);
    if (!plano) return null;

    let totalTopicos = 0;
    let totalAulasEstimadas = 0;

    (plano.modulos || []).forEach(m => {
      (m.topicos || []).forEach(t => {
        totalTopicos++;
        totalAulasEstimadas += (Number(t.aulasEstimadas) || 1);
      });
    });

    // Identifica todas as turmas que adotam este plano pedagógico
    const turmasVinculadas = estado.turmas.filter(t => t.planoId === planoId);

    // Mapeia o progresso individualizado de cada turma que aplica o plano
    const progressoTurmas = turmasVinculadas.map(t => {
      const m = calcularMetricasTurma(t.id);
      return {
        turmaId: t.id,
        nomeTurma: t.nome,
        periodo: t.periodo,
        cor: t.cor || '#0284c7',
        percentual: m ? m.percentualPlano : 0,
        concluidos: m ? m.topicosConcluidos : 0,
        emAndamento: m ? m.topicosEmAndamento : 0,
        totalTopicos: m ? m.totalTopicos : totalTopicos,
        aulasDadas: m ? m.totalAulasDadas : 0,
        ritmo: m ? m.ritmo : 'No prazo'
      };
    });

    const somaPct = progressoTurmas.reduce((acc, pt) => acc + pt.percentual, 0);
    const mediaEvolucaoTurmas = progressoTurmas.length > 0 ? Math.round(somaPct / progressoTurmas.length) : 0;

    const aulasVinculadas = estado.aulas.filter(a => a.planoId === planoId || turmasVinculadas.some(t => t.id === a.turmaId));
    const totalAulasDadas = aulasVinculadas.reduce((acc, a) => acc + (Number(a.duracaoAulas) || 1), 0);

    return {
      plano,
      totalModulos: (plano.modulos || []).length,
      totalTopicos,
      totalAulasEstimadas,
      turmasVinculadas,
      progressoTurmas,
      mediaEvolucaoTurmas,
      totalAulasDadas
    };
  }

  function exportarBackupJson() {
    const payload = {
      versao: '2.0',
      sistema: 'Diário do Professor - Educação Profissionalizante',
      dataExportacao: new Date().toISOString(),
      dados: estado
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diario_professor_backup_${dataHojeIso()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importarBackupJson(conteudoJson) {
    try {
      const parsed = JSON.parse(conteudoJson);
      const dados = parsed.dados || parsed;
      if (!dados.turmas || !dados.planos || !dados.aulas) {
        throw new Error('Arquivo de backup inválido.');
      }
      estado = {
        professor: { ...estado.professor, ...(dados.professor || dados.config || {}) },
        turmas: dados.turmas || [],
        planos: dados.planos || [],
        aulas: dados.aulas || []
      };
      salvarNoStorage();
      return { sucesso: true, mensagem: 'Dados importados com sucesso!' };
    } catch (erro) {
      return { sucesso: false, mensagem: erro.message };
    }
  }

  function restaurarDadosDemonstracao() {
    localStorage.removeItem(CHAVE_STORAGE);
    carregarDadosDemonstracao();
    salvarNoStorage();
  }

  function limparTodosDados() {
    estado = {
      professor: { ...estado.professor },
      turmas: [],
      planos: [],
      aulas: []
    };
    salvarNoStorage();
  }

  function obterPlanoInformaticaAprendizes() {
    return {
      id: 'plano_informatica_aprendizes_2026',
      titulo: 'Informática e Rotinas Digitais para Aprendizes (Ciclo 6 Meses)',
      disciplina: 'Informática',
      nivelEnsino: 'Qualificação Profissional / Aprendizagem',
      anoSemestre: '2026 (Contínuo)',
      cargaHorariaTotalEstimada: 24,
      ementa: 'Operações fundamentais de microinformática no ambiente Windows, atalhos de alta produtividade e limites de segurança do operador. Redação corporativa, Netiqueta e gestão de correio eletrônico com Outlook Local, anexos e regras de envio. Estruturação, diagramação profissional, tabelas, revisão e exportação em PDF no Microsoft Word. Criação de apresentações executivas com foco em síntese (regra do menos é mais), alinhamento visual e dinâmica de apresentação no Microsoft PowerPoint. Manipulação de planilhas, operadores matemáticos e funções de resumo no Microsoft Excel Base. Análise gerencial com Filtros, Formatação Condicional, Função SE, buscas avançadas (PROCV e PROCX), Tabelas Dinâmicas e Gráficos Dinâmicos no Microsoft Excel Avançado. Integração prática final simulando expediente corporativo completo.',
      objetivoGeral: 'Qualificar e apoiar jovens aprendizes nas suas atribuições operacionais, nivelando o conhecimento desde a navegação básica e boas práticas de uso da máquina, até a gestão avançada de dados (PROCV, PROCX, Tabelas Dinâmicas) e rotinas corporativas ágeis utilizando o Pacote Office.',
      competenciasBNCC: 'Operar sistemas e hardwares com segurança e boas práticas; redigir e padronizar documentos corporativos; estruturar planilhas eletrônicas com lógicas condicionais e cruzamento de dados avançado; gerenciar correio eletrônico corporativo.',
      metodologia: 'Aulas práticas em laboratório de informática com simulação de rotinas reais de escritório, exercícios cronometrados, desafios de resolução de problemas cotidianos e projeto final integrador sob pressão de tempo.',
      recursos: 'Laboratório de informática, computadores com Pacote Microsoft Office (Word, Excel, PowerPoint, Outlook), rede local, servidor de e-mail (hMailServer/Thunderbird), projetor multimídia e base de dados corporativa simulada.',
      criteriosAvaliacao: 'Avaliação contínua e processual baseada na agilidade operacional, precisão de digitação e atalhos, clareza e padrão estético de documentos, exatidão lógica das fórmulas/tabelas dinâmicas no Excel e autonomia na entrega do desafio integrado de rotina.',
      bibliografia: 'Manuais técnicos oficiais da Microsoft (Word, Excel, PowerPoint, Outlook), normas de redação corporativa e documentação de boas práticas de segurança da informação em ambientes empresariais.',
      modulos: [
        {
          id: 'mod_inf_1',
          ordem: 1,
          titulo: 'Módulo 1: Fundamentos',
          topicos: [
            {
              id: 'top_inf_1_1',
              ordem: 1,
              titulo: '1. Navegação e Atalhos Vitais',
              aulasEstimadas: 1,
              objetivosEspecificos: 'Eliminar a inércia e dependência do mouse no uso do Windows.',
              conteudoProgramatico: 'Atalhos essenciais do sistema operacional (Ctrl+C/V, Win+D, Alt+Tab, Win+E, Win+R, Ctrl+Shift+Esc), ergonomia e digitação acelerada.',
              metodologiaSugerida: 'Prática cronometrada de digitação e execução de atalhos (Ctrl+C/V, Win+D, Alt+Tab).',
              recursosDidaticos: 'Projetor, computador, bloco de notas'
            },
            {
              id: 'top_inf_1_2',
              ordem: 2,
              titulo: '2. Boas Práticas do Operador',
              aulasEstimadas: 1,
              objetivosEspecificos: 'Entender limites técnicos, segurança e quando acionar o suporte.',
              conteudoProgramatico: 'Segurança da informação básica, perigos de download de executáveis não autorizados, arquivos de sistema, limpeza de cache e procedimento de abertura de chamado à TI.',
              metodologiaSugerida: 'Estudo de caso: o que nunca fazer (baixar executáveis, apagar arquivos de sistema), como limpar cache e como relatar um erro à TI.',
              recursosDidaticos: 'Projetor, computador'
            },
            {
              id: 'top_inf_1_3',
              ordem: 3,
              titulo: '3. Gestão de Arquivos e Pastas',
              aulasEstimadas: 1,
              objetivosEspecificos: 'Estruturar arquivos corporativos e entender compactação.',
              conteudoProgramatico: 'Estrutura hierárquica de diretórios corporativos, nomenclatura padronizada, extensões de arquivos, compactação e descompactação ZIP.',
              metodologiaSugerida: 'Desafio prático de criação de hierarquia de pastas e compactação ZIP.',
              recursosDidaticos: 'Projetor, explorador de arquivos'
            },
            {
              id: 'top_inf_1_4',
              ordem: 4,
              titulo: '4. Pesquisa e IA no Trabalho',
              aulasEstimadas: 1,
              objetivosEspecificos: 'Desenvolver autonomia na resolução de problemas técnicos.',
              conteudoProgramatico: 'Motores de busca avançada, operadores de pesquisa (aspas, site:, filetype:) e uso ético de inteligência artificial generativa sem necessidade de login.',
              metodologiaSugerida: 'Resolução de questionário simulado utilizando motores de busca e IA sem login.',
              recursosDidaticos: 'Projetor, navegador web'
            }
          ]
        },
        {
          id: 'mod_inf_2',
          ordem: 2,
          titulo: 'Módulo 2: Outlook Local',
          topicos: [
            {
              id: 'top_inf_2_1',
              ordem: 1,
              titulo: '5. Estrutura e Etiqueta Digital',
              aulasEstimadas: 1,
              objetivosEspecificos: 'Diferenciar mensagens informais do padrão de e-mail corporativo.',
              conteudoProgramatico: 'Netiqueta empresarial, tom profissional, campo de assunto claro e objetivo, saudação, corpo conciso e assinatura institucional.',
              metodologiaSugerida: 'Redação de e-mail formal com assunto, saudação e assinatura institucional.',
              recursosDidaticos: 'Projetor, Outlook Clássico/Thunderbird'
            },
            {
              id: 'top_inf_2_2',
              ordem: 2,
              titulo: '6. Regras de Envio e Anexos',
              aulasEstimadas: 1,
              objetivosEspecificos: 'Dominar campos Para, CC e CCO sem expor contatos.',
              conteudoProgramatico: 'Diferenças de uso entre Para, Com Cópia (CC) e Cópia Oculta (CCO), limites de arquivos anexados e envio seguro via rede local.',
              metodologiaSugerida: 'Envio de arquivo em anexo via rede local com cópias visíveis e ocultas.',
              recursosDidaticos: 'Servidor hMailServer local, Outlook'
            },
            {
              id: 'top_inf_2_3',
              ordem: 3,
              titulo: '7. Calendário e Tarefas',
              aulasEstimadas: 1,
              objetivosEspecificos: 'Gerenciar tempo e compromissos no sistema da empresa.',
              conteudoProgramatico: 'Agendamento de compromissos, envio de convites de reuniões, acompanhamento de tarefas (To-Do) e organização de prioridades corporativas.',
              metodologiaSugerida: 'Agendamento de reunião simulada com colegas da sala via sistema de calendário.',
              recursosDidaticos: 'Projetor, calendário digital'
            }
          ]
        },
        {
          id: 'mod_inf_3',
          ordem: 3,
          titulo: 'Módulo 3: Word',
          topicos: [
            {
              id: 'top_inf_3_1',
              ordem: 1,
              titulo: '8. Formatação Padrão de Texto',
              aulasEstimadas: 1,
              objetivosEspecificos: 'Aplicar estética corporativa (fontes, espaçamento, alinhamento).',
              conteudoProgramatico: 'Tipografia institucional, tamanhos, entrelinhas, alinhamento justificado e técnicas de limpeza de formatação desconfigurada.',
              metodologiaSugerida: 'Limpeza e formatação de texto desconfigurado extraído da internet.',
              recursosDidaticos: 'Projetor, Microsoft Word'
            },
            {
              id: 'top_inf_3_2',
              ordem: 2,
              titulo: '9. Estrutura e Tabelas',
              aulasEstimadas: 1,
              objetivosEspecificos: 'Inserir cabeçalhos, rodapés e organizar dados visualmente.',
              conteudoProgramatico: 'Cabeçalhos e rodapés institucionais, numeração de páginas, inserção de logotipo corporativo e diagramação de tabelas e cronogramas.',
              metodologiaSugerida: 'Inserção de logotipo corporativo e criação de cronograma em tabela.',
              recursosDidaticos: 'Projetor, Microsoft Word'
            },
            {
              id: 'top_inf_3_3',
              ordem: 3,
              titulo: '10. Revisão e Exportação PDF',
              aulasEstimadas: 1,
              objetivosEspecificos: 'Garantir qualidade ortográfica e segurança do arquivo final.',
              conteudoProgramatico: 'Revisão ortográfica e gramatical automática, dicionário corporativo e salvamento seguro em PDF para emissão de ofícios.',
              metodologiaSugerida: 'Aplicação de revisão automática e exportação do documento para PDF.',
              recursosDidaticos: 'Projetor, Microsoft Word'
            }
          ]
        },
        {
          id: 'mod_inf_4',
          ordem: 4,
          titulo: 'Módulo 4: PowerPoint',
          topicos: [
            {
              id: 'top_inf_4_1',
              ordem: 1,
              titulo: '11. Design Limpo e Síntese',
              aulasEstimadas: 1,
              objetivosEspecificos: 'Quebrar o hábito de slides com excesso de texto (Regra do Menos é Mais).',
              conteudoProgramatico: 'Comunicação visual executiva, contraste de cores, uso de bullet points objetivos e eliminação de poluição textual.',
              metodologiaSugerida: 'Resumo de um texto longo em 3 tópicos curtos (bullet points) com alto contraste.',
              recursosDidaticos: 'Projetor, Microsoft PowerPoint'
            },
            {
              id: 'top_inf_4_2',
              ordem: 2,
              titulo: '12. Hierarquia e Imagens',
              aulasEstimadas: 1,
              objetivosEspecificos: 'Alinhar elementos visuais e manter o padrão estético.',
              conteudoProgramatico: 'Alinhamento e distribuição automática de objetos, corte proporcional de imagens corporativas e manutenção da identidade visual.',
              metodologiaSugerida: 'Criação de slide de indicadores com inserção e corte correto de imagens corporativas.',
              recursosDidaticos: 'Projetor, Microsoft PowerPoint'
            },
            {
              id: 'top_inf_4_3',
              ordem: 3,
              titulo: '13. Dinâmica de Apresentação',
              aulasEstimadas: 1,
              objetivosEspecificos: 'Configurar exibição profissional e geração de material de apoio.',
              conteudoProgramatico: 'Modo Apresentador, notas do palestrante, transições discretas e exportação em formato de material de apoio (handout/PDF).',
              metodologiaSugerida: 'Aplicação de transições discretas e exportação dos slides em formato de handout (PDF).',
              recursosDidaticos: 'Projetor, Microsoft PowerPoint'
            }
          ]
        },
        {
          id: 'mod_inf_5',
          ordem: 5,
          titulo: 'Módulo 5: Excel Base',
          topicos: [
            {
              id: 'top_inf_5_1',
              ordem: 1,
              titulo: '14. Interface e Congelamento',
              aulasEstimadas: 1,
              objetivosEspecificos: 'Superar bloqueio inicial e manipular planilhas longas com conforto.',
              conteudoProgramatico: 'Estrutura de linhas, colunas e células, tipos de dados (Moeda, Data, Geral) e uso prático da ferramenta Congelar Painéis.',
              metodologiaSugerida: 'Ajuste visual (Moeda, Data) e aplicação de Congelar Painéis para rolar listas grandes.',
              recursosDidaticos: 'Projetor, Microsoft Excel, base de dados'
            },
            {
              id: 'top_inf_5_2',
              ordem: 2,
              titulo: '15. Matemática e Função SOMA',
              aulasEstimadas: 1,
              objetivosEspecificos: 'Substituir calculadoras na automatização de rotinas financeiras.',
              conteudoProgramatico: 'Operadores matemáticos básicos (+, -, *, /), precedência de parênteses, função =SOMA() e uso da alça de preenchimento.',
              metodologiaSugerida: 'Prática com operadores básicos (+, -, *, /) e uso rápido da =SOMA() com alça de preenchimento.',
              recursosDidaticos: 'Projetor, Microsoft Excel'
            },
            {
              id: 'top_inf_5_3',
              ordem: 3,
              titulo: '16. Funções de Resumo',
              aulasEstimadas: 1,
              objetivosEspecificos: 'Extrair dados rápidos de listas numéricas extensas.',
              conteudoProgramatico: 'Funções estatísticas fundamentais: =MÉDIA(), =MÁXIMO(), =MÍNIMO() e =CONT.VALORES() para análise ágil de tabelas.',
              metodologiaSugerida: 'Aplicação condensada das funções =MÉDIA(), =MÁXIMO(), =MÍNIMO() e =CONT.VALORES().',
              recursosDidaticos: 'Projetor, Microsoft Excel'
            }
          ]
        },
        {
          id: 'mod_inf_6',
          ordem: 6,
          titulo: 'Módulo 6: Excel Avançado',
          topicos: [
            {
              id: 'top_inf_6_1',
              ordem: 1,
              titulo: '17. Filtros e Regras Visuais',
              aulasEstimadas: 1,
              objetivosEspecificos: 'Localizar dados e criar alertas automáticos de vencimento.',
              conteudoProgramatico: 'Autofiltros, classificação de listas e regras de Formatação Condicional com realce de prazos e valores críticos.',
              metodologiaSugerida: 'Aplicação de Filtros e Formatação Condicional (ex: pintar de vermelho o que estiver vencido).',
              recursosDidaticos: 'Projetor, Microsoft Excel'
            },
            {
              id: 'top_inf_6_2',
              ordem: 2,
              titulo: '18. A Função Lógica SE',
              aulasEstimadas: 1,
              objetivosEspecificos: 'Destravar a lógica de condições, testes e resultados.',
              conteudoProgramatico: 'Operadores de comparação (>, <, >=, <=, =, <>), estrutura da função =SE(teste_lógico; valor_verdadeiro; valor_falso) e automação de alertas de estoque.',
              metodologiaSugerida: 'Automação de status de estoque (ex: "Comprar" ou "OK") usando =SE().',
              recursosDidaticos: 'Lousa, projetor, Microsoft Excel'
            },
            {
              id: 'top_inf_6_3',
              ordem: 3,
              titulo: '19. Cruzamento de Dados (PROCV)',
              aulasEstimadas: 1,
              objetivosEspecificos: 'Automatizar o preenchimento de planilhas buscando dados em outras abas.',
              conteudoProgramatico: 'Função =PROCV() com correspondência exata (0/FALSO), indicação de índice de coluna e fixação de intervalos com $ (F4).',
              metodologiaSugerida: 'Exercício prático de busca de preços em uma tabela de produtos usando o =PROCV().',
              recursosDidaticos: 'Projetor, Microsoft Excel'
            },
            {
              id: 'top_inf_6_4',
              ordem: 4,
              titulo: '20. Buscas Modernas (PROCX)',
              aulasEstimadas: 1,
              objetivosEspecificos: 'Atualizar o conhecimento para a função de busca mais moderna do mercado.',
              conteudoProgramatico: 'Sintaxe e vantagens do =PROCX(), busca à esquerda, tratamento nativo de erro e correspondência exata por padrão.',
              metodologiaSugerida: 'Substituição do PROCV pelo =PROCX(), explorando a busca reversa e tratamento de erros.',
              recursosDidaticos: 'Projetor, Microsoft Excel'
            },
            {
              id: 'top_inf_6_5',
              ordem: 5,
              titulo: '21. Tabelas Dinâmicas - Fase 1',
              aulasEstimadas: 1,
              objetivosEspecificos: 'Resumir milhares de linhas em relatórios instantâneos.',
              conteudoProgramatico: 'Estruturação da Tabela Dinâmica: Linhas, Colunas, Valores e Filtros para sumarização de faturamento e vendas.',
              metodologiaSugerida: 'Criação do zero de uma Tabela Dinâmica para resumir faturamento por vendedor e setor.',
              recursosDidaticos: 'Projetor, Microsoft Excel'
            },
            {
              id: 'top_inf_6_6',
              ordem: 6,
              titulo: '22. Tabelas Dinâmicas - Fase 2',
              aulasEstimadas: 1,
              objetivosEspecificos: 'Extrair inteligência visual dos resumos gerados.',
              conteudoProgramatico: 'Inserção de Gráficos Dinâmicos e Segmentação de Dados (Slicers) com filtros interativos em formato de botões.',
              metodologiaSugerida: 'Inserção de Gráficos Dinâmicos e Segmentação de Dados (Filtros interativos/botões).',
              recursosDidaticos: 'Projetor, Microsoft Excel'
            },
            {
              id: 'top_inf_6_7',
              ordem: 7,
              titulo: '23. Desafio de Lógica Excel',
              aulasEstimadas: 1,
              objetivosEspecificos: 'Consolidar as fórmulas complexas (SE, PROCV, Dinâmica) sem ajuda direta.',
              conteudoProgramatico: 'Limpeza de base de dados bruta, cruzamento com PROCV/PROCX, automação lógica com SE e painel consolidado em Tabela Dinâmica.',
              metodologiaSugerida: 'O aluno recebe um banco de dados sujo e deve entregar um painel gerencial resumido.',
              recursosDidaticos: 'Projetor, Microsoft Excel'
            }
          ]
        },
        {
          id: 'mod_inf_7',
          ordem: 7,
          titulo: 'Módulo 7: Integração',
          topicos: [
            {
              id: 'top_inf_7_1',
              ordem: 1,
              titulo: '24. Desafio Final de Rotina',
              aulasEstimadas: 1,
              objetivosEspecificos: 'Validar autonomia prática integrando ferramentas sob pressão de tempo.',
              conteudoProgramatico: 'Simulação corporativa completa: processamento de dados no Excel, redação de relatório formal no Word e envio com cópias via Outlook Local.',
              metodologiaSugerida: 'Processar Excel, redigir ofício no Word justificando os dados, e enviar tudo via Outlook.',
              recursosDidaticos: 'Pacote Office, Servidor hMailServer'
            }
          ]
        }
      ]
    };
  }

  function obterPlanoTNCIniciantes() {
    return {
      id: 'plano_tnc_iniciantes_2026',
      titulo: 'TNC - Iniciantes — Informática TNC (Treinamento de Novos Contratados) - Integração e Revisão',
      disciplina: 'Informática',
      nivelEnsino: 'Qualificação Profissional / Integração de Aprendizagem',
      anoSemestre: '2026 (Contínuo)',
      cargaHorariaTotalEstimada: 4,
      ementa: 'Diretrizes operacionais e de segurança da infraestrutura de tecnologia da informação em ambiente corporativo. Bloqueio de tela, ergonomia e atalhos essenciais de produtividade no Windows. Estruturação hierárquica de diretórios, armazenamento, nomenclatura corporativa e manipulação de arquivos. Revisão prática de planilhas eletrônicas no Microsoft Excel: estrutura de dados, formatação de células e operações matemáticas fundamentais. Revisão prática no Microsoft Word: normas de formatação padrão corporativa, espaçamento, alinhamento e edição de ofícios e memorandos.',
      objetivoGeral: 'Nivelar os novos aprendizes para o ambiente laboratorial e corporativo. O módulo consolida as diretrizes de uso e segurança da infraestrutura de TI, além de revisar a operação básica de edição de planilhas eletrônicas e textos, garantindo que o aprendiz inicie o ciclo regular com autonomia técnica e postura profissional adequadas.',
      competenciasBNCC: 'Operar sistemas e hardwares com segurança e boas práticas; manipular e estruturar planilhas eletrônicas de dados básicos; redigir e formatar documentos corporativos simples.',
      metodologia: 'Aula expositiva dialogada e práticas aplicadas em laboratório de informática com exercícios individuais de simulação corporativa e revisões guiadas.',
      recursos: 'Projetor multimídia, computadores individuais com sistema operacional Windows, explorador de arquivos, Microsoft Excel e Microsoft Word.',
      criteriosAvaliacao: 'Avaliação processual formativa com foco na observância das regras de segurança digital, postura no laboratório, precisão na hierarquia de arquivos e correta aplicação das formatações no Excel e Word.',
      bibliografia: 'Manuais técnicos oficiais da Microsoft (Word e Excel), diretrizes corporativas de uso seguro de TI e normas fundamentais de redação técnica e empresarial.',
      modulos: [
        {
          id: 'mod_tnc_1',
          ordem: 1,
          titulo: 'Módulo 1: Integração (TNC)',
          topicos: [
            {
              id: 'top_tnc_1_1',
              ordem: 1,
              titulo: '1. Fundamentos e Postura no Ambiente Digital',
              aulasEstimadas: 1,
              objetivosEspecificos: 'Compreender as diretrizes de uso do equipamento corporativo, navegação no sistema e atalhos de produtividade.',
              conteudoProgramatico: 'Regras de segurança digital (bloqueio de tela, restrições de uso), ergonomia, operações de mouse/teclado e atalhos essenciais (Ctrl+C/V, Win+D, Win+L).',
              metodologiaSugerida: 'Aula expositiva e prática: regras de segurança (bloqueio de tela, restrições de uso), operações de mouse/teclado, e atalhos essenciais (Ctrl+C/V, Win+D, Win+L).',
              recursosDidaticos: 'Projetor, computador'
            },
            {
              id: 'top_tnc_1_2',
              ordem: 2,
              titulo: '2. Organização de Diretórios e Armazenamento',
              aulasEstimadas: 1,
              objetivosEspecificos: 'Desenvolver a competência de estruturar arquivos, evitando perdas de dados e desorganização na rede.',
              conteudoProgramatico: 'Criação de hierarquia de pastas departamentais, nomenclatura profissional de arquivos, extensões e uso básico do explorador do Windows.',
              metodologiaSugerida: 'Exercício prático: criação de hierarquia de pastas departamentais, nomenclatura profissional de arquivos, e uso básico do explorador do Windows.',
              recursosDidaticos: 'Projetor, computador, explorador de arquivos'
            },
            {
              id: 'top_tnc_1_3',
              ordem: 3,
              titulo: '3. Revisão Prática: Microsoft Excel',
              aulasEstimadas: 1,
              objetivosEspecificos: 'Resgatar os conceitos estruturais de planilhas e operações fundamentais.',
              conteudoProgramatico: 'Construção de tabela de controle simples, formatação de células (Moeda, Data) e aplicação das 4 operações matemáticas básicas (+, -, *, /).',
              metodologiaSugerida: 'Construção de uma tabela de controle simples, formatação de células (Moeda, Data) e revisão das 4 operações matemáticas básicas.',
              recursosDidaticos: 'Projetor, Microsoft Excel'
            },
            {
              id: 'top_tnc_1_4',
              ordem: 4,
              titulo: '4. Revisão Prática: Microsoft Word',
              aulasEstimadas: 1,
              objetivosEspecificos: 'Nivelar a capacidade de formatação e edição de textos corporativos antes do ingresso nas turmas regulares.',
              conteudoProgramatico: 'Estruturação e formatação padrão corporativa de textos (famílias tipográficas, tamanhos, entrelinhas, alinhamento e margens) em ofícios e memorandos.',
              metodologiaSugerida: 'Dinâmica de revisão: aplicação de formatação padrão (fonte, espaçamento, alinhamento) em um ofício ou memorando simples.',
              recursosDidaticos: 'Projetor, Microsoft Word'
            }
          ]
        }
      ]
    };
  }

  function carregarDadosDemonstracao() {
    const idPlanoTI = 'plano_ti_2026';
    const idPlanoAutomacao = 'plano_automacao_2026';
    const idTurmaDev = 'turma_dev_mod2';
    const idTurmaAuto = 'turma_auto_mod1';

    const planoTI = {
      id: idPlanoTI,
      titulo: 'Desenvolvimento de Aplicações Web & APIs',
      disciplina: 'Programação de Sistemas',
      nivelEnsino: 'Técnico em Desenvolvimento de Sistemas',
      anoSemestre: '2026.1',
      ementa: 'Estruturação de sistemas web, arquitetura cliente-servidor, JavaScript ES6+, consumo de APIs REST e banco de dados.',
      objetivoGeral: 'Capacitar o estudante a projetar, desenvolver e testar aplicações web profissionais e seguras.',
      competenciasBNCC: 'Desenvolvimento e implementação de algoritmos computacionais e boas práticas de engenharia de software.',
      cargaHorariaTotalEstimada: 100,
      modulos: [
        {
          id: 'mod_ti_1',
          ordem: 1,
          titulo: 'Módulo I: Front-End Responsivo e Acessível',
          topicos: [
            {
              id: 'top_ti_1_1',
              ordem: 1,
              titulo: 'Arquitetura Web Moderna e HTML5 Semântico',
              objetivosEspecificos: 'Estruturar páginas com tags semânticas e diretrizes de acessibilidade (WCAG).',
              conteudoProgramatico: 'Estrutura do DOM, tags semânticas, atributos ARIA e validação de formulários.',
              metodologiaSugerida: 'Live coding com prática individual guiada no laboratório de TI.',
              recursosDidaticos: 'VS Code, navegadores, projetor multimídia.',
              aulasEstimadas: 4,
              status: StatusTopico.CONCLUIDO,
              observacoesAjuste: 'Excelente rendimento dos alunos na prática de laboratório.'
            },
            {
              id: 'top_ti_1_2',
              ordem: 2,
              titulo: 'Estilização Avançada com CSS Flexbox e Grid Layout',
              objetivosEspecificos: 'Construir layouts adaptáveis a desktops, tablets e smartphones.',
              conteudoProgramatico: 'Eixos flexíveis, media queries, CSS Grid bi-dimensional e CSS variables.',
              metodologiaSugerida: 'Desenvolvimento prático do layout de um dashboard corporativo.',
              recursosDidaticos: 'Laboratório de informática e VS Code.',
              aulasEstimadas: 6,
              status: StatusTopico.CONCLUIDO,
              observacoesAjuste: ''
            }
          ]
        },
        {
          id: 'mod_ti_2',
          ordem: 2,
          titulo: 'Módulo II: Lógica Avançada com JavaScript e Manipulação do DOM',
          topicos: [
            {
              id: 'top_ti_2_1',
              ordem: 1,
              titulo: 'JavaScript ES6+: Funções, Arrays e Desestruturação',
              objetivosEspecificos: 'Dominar map, filter, reduce, arrow functions e modularização.',
              conteudoProgramatico: 'Funções de alta ordem, escopo, closures e import/export.',
              metodologiaSugerida: 'Resolução colaborativa de desafios no terminal.',
              recursosDidaticos: 'Node.js e terminal interativo.',
              aulasEstimadas: 6,
              status: StatusTopico.EM_ANDAMENTO,
              observacoesAjuste: 'Reforçar manipulação de objetos e arrays aninhados.'
            },
            {
              id: 'top_ti_2_2',
              ordem: 2,
              titulo: 'Eventos, DOM e Persistência Local (LocalStorage)',
              objetivosEspecificos: 'Desenvolver aplicações SPA capazes de gravar dados sem backend.',
              conteudoProgramatico: 'Event listeners, manipulação de elementos dinâmicos, LocalStorage e JSON.',
              metodologiaSugerida: 'Criação de um sistema CRUD completo no navegador.',
              recursosDidaticos: 'Laboratório de informática.',
              aulasEstimadas: 8,
              status: StatusTopico.PENDENTE,
              observacoesAjuste: ''
            }
          ]
        },
        {
          id: 'mod_ti_3',
          ordem: 3,
          titulo: 'Módulo III: Consumo de APIs e Integração Assíncrona',
          topicos: [
            {
              id: 'top_ti_3_1',
              ordem: 1,
              titulo: 'Programação Assíncrona: Promises e Async/Await',
              objetivosEspecificos: 'Compreender requisições assíncronas e tratamento de erros com try/catch.',
              conteudoProgramatico: 'Event loop, Fetch API, headers HTTP e parse de respostas JSON.',
              metodologiaSugerida: 'Consumo de APIs públicas em tempo real.',
              recursosDidaticos: 'Postman / Insomnia e VS Code.',
              aulasEstimadas: 6,
              status: StatusTopico.PENDENTE,
              observacoesAjuste: ''
            }
          ]
        }
      ]
    };

    const planoAuto = {
      id: idPlanoAutomacao,
      titulo: 'Eletrotécnica & Comandos Industriais',
      disciplina: 'Comandos Elétricos',
      nivelEnsino: 'Técnico em Eletrotécnica',
      anoSemestre: '2026.1',
      ementa: 'Dispositivos de manobra e proteção, dimensionamento de condutores, relés térmicos e acionamento de motores trifásicos.',
      objetivoGeral: 'Projetar e montar painéis de acionamento elétrico industrial com foco nas normas NR-10 e NR-12.',
      competenciasBNCC: 'Instalação e manutenção de sistemas elétricos e automação industrial.',
      cargaHorariaTotalEstimada: 80,
      modulos: [
        {
          id: 'mod_auto_1',
          ordem: 1,
          titulo: 'Módulo I: Componentes e Dispositivos de Proteção',
          topicos: [
            {
              id: 'top_auto_1_1',
              ordem: 1,
              titulo: 'Disjuntores Termomagnéticos, Fusíveis e Relés Térmicos',
              objetivosEspecificos: 'Dimensionar elementos de proteção para circuitos de força e comando.',
              conteudoProgramatico: 'Curvas de disparo (B, C, D), capacidade de interrupção e coordenação tipo 1 e 2.',
              metodologiaSugerida: 'Aula prática na bancada didática de comandos elétricos.',
              recursosDidaticos: 'Bancadas didáticas, contatores, disjuntores motor.',
              aulasEstimadas: 4,
              status: StatusTopico.CONCLUIDO,
              observacoesAjuste: ''
            },
            {
              id: 'top_auto_1_2',
              ordem: 2,
              titulo: 'Contatores de Potência e Contatos Auxiliares',
              objetivosEspecificos: 'Compreender funcionamento eletromagnético e chaveamento sob carga.',
              conteudoProgramatico: 'Bobinas AC/DC, contatos NA/NF, intertravamento mecânico e elétrico.',
              metodologiaSugerida: 'Montagem de circuito de partida direta com selo e lâmpadas piloto.',
              recursosDidaticos: 'Contatores auxiliares e botoeiras.',
              aulasEstimadas: 4,
              status: StatusTopico.CONCLUIDO,
              observacoesAjuste: ''
            }
          ]
        },
        {
          id: 'mod_auto_2',
          ordem: 2,
          titulo: 'Módulo II: Partidas e Acionamento de Motores Trifásicos',
          topicos: [
            {
              id: 'top_auto_2_1',
              ordem: 1,
              titulo: 'Partida Direta com Reversão de Rotação',
              objetivosEspecificos: 'Elaborar diagrama elétrico unifilar e multifilar de reversão de giro.',
              conteudoProgramatico: 'Troca de fases, intertravamento duplo de segurança e sinalização.',
              metodologiaSugerida: 'Simulação no software CADe_SIMU seguida de montagem física em bancada.',
              recursosDidaticos: 'Software CADe_SIMU e motores trifásicos.',
              aulasEstimadas: 6,
              status: StatusTopico.EM_ANDAMENTO,
              observacoesAjuste: 'Atenção redobrada com intertravamento elétrico dos contatores.'
            }
          ]
        }
      ]
    };

    const turmaDevVesp = {
      id: 'turma_dev_vesp',
      nome: 'Módulo 2 - Téc. Desenvolvimento de Sistemas (Vespertino)',
      disciplina: 'Programação de Sistemas',
      anoLetivo: '2026',
      periodo: 'Vespertino',
      sala: 'Laboratório de Software 03',
      diasSemana: ['Terça-feira', 'Quinta-feira'],
      cargaHorariaTotal: 100,
      cor: '#0284c7',
      status: StatusTurma.ATIVA,
      planoId: idPlanoTI,
      progressoTopicos: {
        'top_ti_1_1': {
          status: StatusTopico.CONCLUIDO,
          observacoesAjuste: 'Turma com excelente ritmo prático na estruturação semântica.',
          dataUltimaAula: '2026-08-06'
        },
        'top_ti_1_2': {
          status: StatusTopico.CONCLUIDO,
          observacoesAjuste: 'Layouts de Flexbox e Grid finalizados com êxito.',
          dataUltimaAula: '2026-08-11'
        },
        'top_ti_2_1': {
          status: StatusTopico.EM_ANDAMENTO,
          observacoesAjuste: 'Reforçar exercícios de manipulação funcional (map e filter).',
          dataUltimaAula: '2026-08-13'
        },
        'top_ti_2_2': {
          status: StatusTopico.PENDENTE,
          observacoesAjuste: '',
          dataUltimaAula: null
        },
        'top_ti_3_1': {
          status: StatusTopico.PENDENTE,
          observacoesAjuste: '',
          dataUltimaAula: null
        }
      },
      alunos: [
        { id: 'al_ti_1', nome: 'Ana Beatriz Souza', matricula: 'TDS-2026-01', numero: 1 },
        { id: 'al_ti_2', nome: 'Arthur Lima Ramos', matricula: 'TDS-2026-02', numero: 2 },
        { id: 'al_ti_3', nome: 'Bruno Henrique Silva', matricula: 'TDS-2026-03', numero: 3 },
        { id: 'al_ti_4', nome: 'Camila de Oliveira', matricula: 'TDS-2026-04', numero: 4 },
        { id: 'al_ti_5', nome: 'Daniel Mendes Costa', matricula: 'TDS-2026-05', numero: 5 },
        { id: 'al_ti_6', nome: 'Eduardo Martins Dias', matricula: 'TDS-2026-06', numero: 6 },
        { id: 'al_ti_7', nome: 'Fernanda Rocha Ribeiro', matricula: 'TDS-2026-07', numero: 7 },
        { id: 'al_ti_8', nome: 'Gabriel Barbosa Gomes', matricula: 'TDS-2026-08', numero: 8 },
        { id: 'al_ti_9', nome: 'Helena Castro Pires', matricula: 'TDS-2026-09', numero: 9 },
        { id: 'al_ti_10', nome: 'Lucas Vieira Prado', matricula: 'TDS-2026-10', numero: 10 }
      ]
    };

    const turmaDevNoite = {
      id: 'turma_dev_noite',
      nome: 'Módulo 2 - Téc. Desenvolvimento de Sistemas (Noturno)',
      disciplina: 'Programação de Sistemas',
      anoLetivo: '2026',
      periodo: 'Noturno',
      sala: 'Laboratório de Software 01',
      diasSemana: ['Segunda-feira', 'Quarta-feira'],
      cargaHorariaTotal: 100,
      cor: '#6366f1',
      status: StatusTurma.ATIVA,
      planoId: idPlanoTI,
      progressoTopicos: {
        'top_ti_1_1': {
          status: StatusTopico.CONCLUIDO,
          observacoesAjuste: 'Turma noturna focada em revisão de tags e terminal Linux.',
          dataUltimaAula: '2026-08-05'
        },
        'top_ti_1_2': {
          status: StatusTopico.EM_ANDAMENTO,
          observacoesAjuste: 'Iniciado Flexbox. Será continuado com exercícios de alinhamento.',
          dataUltimaAula: null
        },
        'top_ti_2_1': {
          status: StatusTopico.PENDENTE,
          observacoesAjuste: '',
          dataUltimaAula: null
        },
        'top_ti_2_2': {
          status: StatusTopico.PENDENTE,
          observacoesAjuste: '',
          dataUltimaAula: null
        },
        'top_ti_3_1': {
          status: StatusTopico.PENDENTE,
          observacoesAjuste: '',
          dataUltimaAula: null
        }
      },
      alunos: [
        { id: 'al_tin_1', nome: 'Amanda Cristina Leite', matricula: 'TDSN-2026-01', numero: 1 },
        { id: 'al_tin_2', nome: 'Caio Vinicius Toledo', matricula: 'TDSN-2026-02', numero: 2 },
        { id: 'al_tin_3', nome: 'Danilo Silva Faria', matricula: 'TDSN-2026-03', numero: 3 },
        { id: 'al_tin_4', nome: 'Ingrid Caroline Matos', matricula: 'TDSN-2026-04', numero: 4 },
        { id: 'al_tin_5', nome: 'Renan Cavalcanti Cruz', matricula: 'TDSN-2026-05', numero: 5 },
        { id: 'al_tin_6', nome: 'Vanessa Rodrigues Lima', matricula: 'TDSN-2026-06', numero: 6 }
      ]
    };

    const turmaAuto = {
      id: idTurmaAuto,
      nome: 'Módulo 1 - Téc. em Eletrotécnica',
      disciplina: 'Comandos Elétricos',
      anoLetivo: '2026',
      periodo: 'Noturno',
      sala: 'Laboratório de Eletrotécnica 01',
      diasSemana: ['Segunda-feira', 'Quarta-feira'],
      cargaHorariaTotal: 80,
      cor: '#0d9488',
      status: StatusTurma.ATIVA,
      planoId: idPlanoAutomacao,
      progressoTopicos: {
        'top_auto_1_1': {
          status: StatusTopico.CONCLUIDO,
          observacoesAjuste: '',
          dataUltimaAula: '2026-08-03'
        },
        'top_auto_1_2': {
          status: StatusTopico.CONCLUIDO,
          observacoesAjuste: '',
          dataUltimaAula: '2026-08-03'
        },
        'top_auto_2_1': {
          status: StatusTopico.EM_ANDAMENTO,
          observacoesAjuste: 'Atenção redobrada com intertravamento elétrico dos contatores.',
          dataUltimaAula: null
        }
      },
      alunos: [
        { id: 'al_el_1', nome: 'Carlos Vinicius Prado', matricula: 'ELE-2026-01', numero: 1 },
        { id: 'al_el_2', nome: 'Débora Moreira Freitas', matricula: 'ELE-2026-02', numero: 2 },
        { id: 'al_el_3', nome: 'Felipe Alcantara Cunha', matricula: 'ELE-2026-03', numero: 3 },
        { id: 'al_el_4', nome: 'Juliana Penteado Lopes', matricula: 'ELE-2026-04', numero: 4 },
        { id: 'al_el_5', nome: 'Matheus Nogueira Siqueira', matricula: 'ELE-2026-05', numero: 5 }
      ]
    };

    const aulas = [
      {
        id: 'aula_ti_1',
        turmaId: 'turma_dev_vesp',
        planoId: idPlanoTI,
        data: '2026-08-04',
        duracaoAulas: 2,
        topicosIds: ['top_ti_1_1'],
        conteudoMinistrado: 'Apresentação do plano de ensino técnico, ambientação com ferramentas profissionais (VS Code, Git) e estruturação semântica com HTML5.',
        metodologiaUtilizada: 'Aula prática em laboratório com replicação de código no terminal.',
        recursosUtilizados: 'Computadores individuais com Linux, VS Code e projetor.',
        observacoesTurma: 'Alunos demonstraram boa base e instalaram as extensões recomendadas.',
        tarefasCasa: 'Criar uma página com semântica completa para o portfólio pessoal.',
        avaliacaoRealizada: '',
        frequencia: {
          registrada: true,
          totalAlunos: 10,
          presencas: ['al_ti_1', 'al_ti_2', 'al_ti_3', 'al_ti_4', 'al_ti_5', 'al_ti_6', 'al_ti_7', 'al_ti_8', 'al_ti_9', 'al_ti_10'],
          ausencias: []
        }
      },
      {
        id: 'aula_ti_noite_1',
        turmaId: 'turma_dev_noite',
        planoId: idPlanoTI,
        data: '2026-08-05',
        duracaoAulas: 2,
        topicosIds: ['top_ti_1_1'],
        conteudoMinistrado: 'Introdução à arquitetura web e estruturação semântica com HTML5. Exercícios em laboratório.',
        metodologiaUtilizada: 'Live coding com resolução orientada de problemas no terminal.',
        recursosUtilizados: 'Laboratório de Software 01.',
        observacoesTurma: 'Turma noturna muito engajada nas práticas de laboratório.',
        tarefasCasa: 'Exercícios práticos de tags estruturais do HTML5.',
        avaliacaoRealizada: '',
        frequencia: {
          registrada: true,
          totalAlunos: 6,
          presencas: ['al_tin_1', 'al_tin_2', 'al_tin_3', 'al_tin_4', 'al_tin_5', 'al_tin_6'],
          ausencias: []
        }
      },
      {
        id: 'aula_ti_2',
        turmaId: 'turma_dev_vesp',
        planoId: idPlanoTI,
        data: '2026-08-06',
        duracaoAulas: 2,
        topicosIds: ['top_ti_1_1', 'top_ti_1_2'],
        conteudoMinistrado: 'Tags de acessibilidade (WAI-ARIA), semântica de formulários técnicos e introdução ao CSS Flexbox.',
        metodologiaUtilizada: 'Exercício prático em duplas para alinhamento de componentes técnicos.',
        recursosUtilizados: 'Laboratório de informática e simuladores de tela.',
        observacoesTurma: 'Todos concluíram os exercícios de layout com flex-direction e justify-content.',
        tarefasCasa: 'Implementar um card de produto técnico com Flexbox.',
        avaliacaoRealizada: 'Visto no código dos alunos.',
        frequencia: {
          registrada: true,
          totalAlunos: 10,
          presencas: ['al_ti_1', 'al_ti_2', 'al_ti_3', 'al_ti_4', 'al_ti_5', 'al_ti_6', 'al_ti_7', 'al_ti_8', 'al_ti_10'],
          ausencias: ['al_ti_9']
        }
      },
      {
        id: 'aula_ti_3',
        turmaId: 'turma_dev_vesp',
        planoId: idPlanoTI,
        data: '2026-08-11',
        duracaoAulas: 2,
        topicosIds: ['top_ti_1_2'],
        conteudoMinistrado: 'CSS Grid bi-dimensional, áreas nomeadas (grid-template-areas) e media queries para design responsivo mobile-first.',
        metodologiaUtilizada: 'Desenvolvimento guiado de um painel de controle administrativo responsivo.',
        recursosUtilizados: 'VS Code e DevTools no modo emulação de dispositivos móveis.',
        observacoesTurma: 'A compreensão de grid foi rápida devido ao uso prático no laboratório.',
        tarefasCasa: 'Finalizar responsividade do painel administrativo.',
        avaliacaoRealizada: '',
        frequencia: {
          registrada: true,
          totalAlunos: 10,
          presencas: ['al_ti_1', 'al_ti_2', 'al_ti_3', 'al_ti_4', 'al_ti_5', 'al_ti_6', 'al_ti_7', 'al_ti_8', 'al_ti_9', 'al_ti_10'],
          ausencias: []
        }
      },
      {
        id: 'aula_ti_4',
        turmaId: 'turma_dev_vesp',
        planoId: idPlanoTI,
        data: '2026-08-13',
        duracaoAulas: 2,
        topicosIds: ['top_ti_2_1'],
        conteudoMinistrado: 'Introdução ao JavaScript ES6+: sintaxe moderna, arrow functions, destructuring e manipulação funcional de arrays (map, filter).',
        metodologiaUtilizada: 'Desafios de live coding com resolução comentada no quadro e computador.',
        recursosUtilizados: 'Node.js e terminal interativo.',
        observacoesTurma: 'Alguns alunos demandaram exercícios adicionais sobre a diferença entre map e filter.',
        tarefasCasa: 'Lista de 5 exercícios de transformação de dados em JavaScript.',
        avaliacaoRealizada: 'Avaliação diagnóstica de lógica de programação.',
        frequencia: {
          registrada: true,
          totalAlunos: 10,
          presencas: ['al_ti_1', 'al_ti_2', 'al_ti_3', 'al_ti_4', 'al_ti_5', 'al_ti_6', 'al_ti_7', 'al_ti_8', 'al_ti_9', 'al_ti_10'],
          ausencias: []
        }
      },
      {
        id: 'aula_el_1',
        turmaId: idTurmaAuto,
        planoId: idPlanoAutomacao,
        data: '2026-08-03',
        duracaoAulas: 2,
        topicosIds: ['top_auto_1_1', 'top_auto_1_2'],
        conteudoMinistrado: 'Normas de segurança NR-10/NR-12, funcionamento e especificação técnica de disjuntores e contatores de potência.',
        metodologiaUtilizada: 'Aula expositiva e demonstração prática de desarme térmico e chaveamento com multímetro.',
        recursosUtilizados: 'Bancada didática de comandos, contatores tripolares e multímetro digital.',
        observacoesTurma: 'Turma noturna muito participativa e atenta às recomendações de EPIs e segurança.',
        tarefasCasa: 'Consulta ao catálogo técnico da WEG para dimensionamento de contatores CWM.',
        avaliacaoRealizada: '',
        frequencia: {
          registrada: true,
          totalAlunos: 5,
          presencas: ['al_el_1', 'al_el_2', 'al_el_3', 'al_el_4', 'al_el_5'],
          ausencias: []
        }
      }
    ];

    estado = {
      professor: {
        nome: 'Prof. Carlos Eduardo',
        email: 'professor@educacao.tec.br',
        materia: 'Desenvolvimento de Sistemas & TI',
        titulacao: 'Especialista em Engenharia de Software',
        fotoUrl: '',
        escola: 'Instituto Técnico de Educação Profissional',
        anoLetivoPadrao: '2026',
        tema: 'light',
        senha: '123456',
        pin: '1234',
        exigirSenha: true
      },
      turmas: [turmaDevVesp, turmaDevNoite, turmaAuto],
      planos: [planoTI, planoAuto, obterPlanoInformaticaAprendizes(), obterPlanoTNCIniciantes()],
      aulas: aulas
    };

    salvarNoStorage();
  }

  // ==========================================================================
  // 3. NAVEGAÇÃO, AUTENTICAÇÃO E CONTROLE DE ESTADO DA UI
  // ==========================================================================

  let abaAtiva = 'dashboard';
  let planoSendoEditado = null;

  // Filtros de estado das abas
  let filtroTurmasStatus = 'todas';
  let buscaTurmas = '';
  let buscaPlanos = '';
  let filtroAulasTurmaId = '';
  let buscaAulas = '';
  let turmaAcompanhamentoId = '';
  let planoAcompanhamentoId = '';
  let filtroTopicoAcompStatus = 'todos';
  let tipoRelatorioAtual = 'diario';
  let turmaRelatorioId = '';
  let planoRelatorioId = '';
  let exibirAssinaturasPlano = true;

  function formatarMesAbrev(dataIso) {
    const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const partes = String(dataIso).split('-');
    if (partes.length >= 2) {
      const idx = parseInt(partes[1], 10) - 1;
      return meses[idx] || '';
    }
    return '';
  }

  function escapeAttr(str) {
    return String(str || '')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/\n/g, ' ');
  }

  function aplicarTemaConfigurado() {
    const prof = obterPerfilProfessor();
    if (prof.tema === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  function alternarTema() {
    const prof = obterPerfilProfessor();
    const novoTema = prof.tema === 'dark' ? 'light' : 'dark';
    salvarPerfilProfessor({ tema: novoTema });
    aplicarTemaConfigurado();
    mostrarToast(`Tema ${novoTema === 'dark' ? 'escuro' : 'claro'} ativado!`, 'info');
  }

  function navegarPara(tab) {
    abaAtiva = tab;
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-tab') === tab);
    });
    renderizarAba(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function reRenderizar() {
    renderizarAba(abaAtiva);
  }

  function abrirModal(htmlContent) {
    const modalContainer = document.getElementById('modalContainer');
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalContainer && modalOverlay) {
      modalContainer.innerHTML = htmlContent;
      modalOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function fecharModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
      modalOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function animarAtencaoModal() {
    const modalEl = document.querySelector('#modalContainer .modal-content');
    if (modalEl) {
      modalEl.classList.remove('modal-attention-pulse');
      void modalEl.offsetWidth;
      modalEl.classList.add('modal-attention-pulse');
    }
  }

  function mostrarToast(mensagem, tipo = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    const icones = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
    toast.innerHTML = `
      <span class="toast-icon">${icones[tipo] || 'ℹ️'}</span>
      <span class="toast-text">${mensagem}</span>
    `;

    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function atualizarChipNavbar() {
    const prof = obterPerfilProfessor();
    const navAvatar = document.getElementById('userNavAvatar');
    const chipName = document.getElementById('userChipName');
    const chipMateria = document.getElementById('userChipMateria');

    if (chipName) chipName.textContent = prof.nome || 'Professor';
    if (chipMateria) chipMateria.textContent = prof.materia || 'Educação Profissional';

    if (navAvatar) {
      if (prof.fotoUrl) {
        navAvatar.innerHTML = `<img src="${prof.fotoUrl}" alt="${escapeAttr(prof.nome)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`;
      } else {
        const iniciais = (prof.nome || 'P')
          .split(' ')
          .filter(Boolean)
          .map(p => p[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();
        navAvatar.textContent = iniciais;
      }
    }
  }

  // ==========================================================================
  // 4. AUTENTICAÇÃO, LOGIN E BLOQUEIO DE TELA
  // ==========================================================================

  function verificarAutenticacao() {
    const prof = obterPerfilProfessor();
    const authOverlay = document.getElementById('authOverlay');
    if (!authOverlay) return;

    if (prof.exigirSenha && !sessao.autenticado) {
      authOverlay.classList.remove('hidden');
      const emailInput = document.getElementById('loginEmail');
      if (emailInput && !emailInput.value) {
        emailInput.value = prof.email || 'professor@educacao.tec.br';
      }
    } else {
      authOverlay.classList.add('hidden');
    }
  }

  function bloquearTela() {
    sessao.autenticado = false;
    localStorage.removeItem(CHAVE_SESSAO);
    const authOverlay = document.getElementById('authOverlay');
    if (authOverlay) {
      authOverlay.classList.remove('hidden');
      const senhaInput = document.getElementById('loginSenha');
      const pinInput = document.getElementById('loginPin');
      if (senhaInput) senhaInput.value = '';
      if (pinInput) pinInput.value = '';
    }
    mostrarToast('Tela bloqueada com segurança.', 'info');
  }

  function alternarModoLogin(modo) {
    const formSenha = document.getElementById('formLoginSenha');
    const formPin = document.getElementById('formLoginPin');
    const btnSenha = document.getElementById('tabLoginSenha');
    const btnPin = document.getElementById('tabLoginPin');

    if (modo === 'senha') {
      if (formSenha) formSenha.style.display = 'flex';
      if (formPin) formPin.style.display = 'none';
      if (btnSenha) btnSenha.classList.add('active');
      if (btnPin) btnPin.classList.remove('active');
    } else {
      if (formSenha) formSenha.style.display = 'none';
      if (formPin) formPin.style.display = 'flex';
      if (btnSenha) btnSenha.classList.remove('active');
      if (btnPin) btnPin.classList.add('active');
      const pinInput = document.getElementById('loginPin');
      if (pinInput) pinInput.focus();
    }
  }

  function submeterLoginSenha(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const senha = document.getElementById('loginSenha').value;
    const prof = obterPerfilProfessor();

    const emailEsperado = (prof.email || 'professor@educacao.tec.br').trim().toLowerCase();
    const senhaEsperada = String(prof.senha || '123456');

    if (email === emailEsperado && senha === senhaEsperada) {
      sessao.autenticado = true;
      localStorage.setItem(CHAVE_SESSAO, 'true');
      const authOverlay = document.getElementById('authOverlay');
      if (authOverlay) authOverlay.classList.add('hidden');
      mostrarToast(`Bem-vindo, ${prof.nome}!`, 'success');
      reRenderizar();
    } else {
      mostrarToast('E-mail ou senha incorretos. Verifique suas credenciais.', 'error');
    }
  }

  function submeterLoginPin(e) {
    e.preventDefault();
    const pin = document.getElementById('loginPin').value.trim();
    const prof = obterPerfilProfessor();
    const pinEsperado = String(prof.pin || '1234');

    if (pin === pinEsperado) {
      sessao.autenticado = true;
      localStorage.setItem(CHAVE_SESSAO, 'true');
      const authOverlay = document.getElementById('authOverlay');
      if (authOverlay) authOverlay.classList.add('hidden');
      mostrarToast(`Desbloqueado com sucesso!`, 'success');
      reRenderizar();
    } else {
      mostrarToast('PIN de acesso incorreto.', 'error');
    }
  }

  function recuperarSenha() {
    if (confirm('Esqueceu sua senha? Deseja redefinir a senha de acesso para "123456" e o PIN para "1234"?')) {
      salvarPerfilProfessor({
        senha: '123456',
        pin: '1234'
      });
      sessao.autenticado = true;
      localStorage.setItem(CHAVE_SESSAO, 'true');
      const authOverlay = document.getElementById('authOverlay');
      if (authOverlay) authOverlay.classList.add('hidden');
      mostrarToast('Senha redefinida para 123456! Você já está conectado.', 'success');
      reRenderizar();
    }
  }

  // ==========================================================================
  // 5. RENDERIZADORES DE CADA ABA
  // ==========================================================================

  function renderizarAba(tab) {
    const main = document.getElementById('mainContentArea');
    if (!main) return;

    switch (tab) {
      case 'dashboard':
        renderizarDashboard(main);
        break;
      case 'turmas':
        renderizarTurmas(main);
        break;
      case 'planos':
        renderizarPlanos(main);
        break;
      case 'aulas':
        renderizarAulas(main);
        break;
      case 'acompanhamento':
        renderizarAcompanhamento(main);
        break;
      case 'relatorios':
        renderizarRelatorios(main);
        break;
      case 'configuracoes':
        renderizarConfiguracoes(main);
        break;
      default:
        renderizarDashboard(main);
    }
  }

  // --- ABA: DASHBOARD ---
  function renderizarDashboard(container) {
    const turmas = listarTurmas(true);
    const todasTurmas = listarTurmas(false);
    const planos = listarPlanos();
    const aulas = listarAulas();
    const prof = obterPerfilProfessor();

    const metricasPorTurma = todasTurmas.map(t => calcularMetricasTurma(t.id)).filter(Boolean);
    const metricasPorPlano = planos.map(p => calcularMetricasPlano(p.id)).filter(Boolean);

    const totalAulasDadas = aulas.reduce((acc, a) => acc + (Number(a.duracaoAulas) || 1), 0);
    const totalCargaPrevista = todasTurmas.reduce((acc, t) => acc + (Number(t.cargaHorariaTotal) || 0), 0);
    const percentualCargaGeral = totalCargaPrevista > 0 ? Math.min(100, Math.round((totalAulasDadas / totalCargaPrevista) * 100)) : 0;

    const turmasComPlano = metricasPorTurma.filter(m => m.plano);
    const mediaCumprimentoPlanos = turmasComPlano.length > 0 
      ? Math.round(turmasComPlano.reduce((acc, m) => acc + m.percentualPlano, 0) / turmasComPlano.length) 
      : 0;

    const mesAtualStr = new Date().toISOString().substring(0, 7);
    const aulasMes = aulas.filter(a => (a.data || '').startsWith(mesAtualStr));
    const totalAulasMes = aulasMes.reduce((acc, a) => acc + (Number(a.duracaoAulas) || 1), 0);

    const alertas = [];
    todasTurmas.forEach(t => {
      if (!t.planoId) {
        alertas.push({
          tipo: 'aviso',
          icone: '⚠️',
          titulo: `Turma sem matriz curricular: ${t.nome}`,
          descricao: 'Vincule um plano pedagógico para acompanhar o cumprimento prático e teórico.',
          acao: `window.EduPlanApp.navegarPara('turmas')`
        });
      }
    });

    metricasPorTurma.forEach(m => {
      if (m.plano && m.ritmo === 'Atrasado') {
        alertas.push({
          tipo: 'atencao',
          icone: '⏳',
          titulo: `Atenção ao ritmo: ${m.turma.nome}`,
          descricao: `A turma está em ${m.percentualPlano}% de conclusão da matriz (${m.plano.titulo}) com alto consumo da carga horária.`,
          acao: `window.EduPlanApp.verAcompanhamentoTurma('${m.turma.id}')`
        });
      }
    });

    container.innerHTML = `
      <div class="dashboard-wrapper">
        <section class="welcome-banner">
          <div class="welcome-text">
            <span class="badge badge-primary">Painel Docente ${prof.anoLetivoPadrao} • Educação Profissionalizante</span>
            <h2>Olá, ${prof.nome}! 👋</h2>
            <p class="subtitle">${prof.escola} • Especialidade: <strong>${prof.materia}</strong></p>
          </div>
          <div class="welcome-actions">
            <button class="btn btn-primary" onclick="window.EduPlanApp.abrirModalRegistrarAula()">
              <span class="btn-icon">✍️</span> Registrar Aula Dada
            </button>
            <button class="btn btn-secondary" onclick="window.EduPlanApp.abrirModalNovaTurma()">
              <span class="btn-icon">👥</span> Nova Turma
            </button>
            <button class="btn btn-secondary" onclick="window.EduPlanApp.abrirModalNovoPlano()">
              <span class="btn-icon">📋</span> Novo Plano
            </button>
          </div>
        </section>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon icon-blue">🏫</div>
            <div class="kpi-content">
              <span class="kpi-title">Turmas Técnicas</span>
              <span class="kpi-value">${turmas.length}</span>
              <span class="kpi-meta">${todasTurmas.length} turmas cadastradas</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon icon-emerald">📚</div>
            <div class="kpi-content">
              <span class="kpi-title">Aulas Práticas / Teóricas</span>
              <span class="kpi-value">${totalAulasDadas} <small>aulas</small></span>
              <span class="kpi-meta">${totalAulasMes} ministradas neste mês</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon icon-purple">🎯</div>
            <div class="kpi-content">
              <span class="kpi-title">Cumprimento dos Planos</span>
              <span class="kpi-value">${mediaCumprimentoPlanos}%</span>
              <div class="kpi-progress-bar">
                <div class="progress-fill fill-purple" style="width: ${mediaCumprimentoPlanos}%"></div>
              </div>
              <span class="kpi-meta">Média de conteúdos cobertos</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon icon-amber">⏱️</div>
            <div class="kpi-content">
              <span class="kpi-title">Carga Horária Ministrada</span>
              <span class="kpi-value">${percentualCargaGeral}%</span>
              <div class="kpi-progress-bar">
                <div class="progress-fill fill-amber" style="width: ${percentualCargaGeral}%"></div>
              </div>
              <span class="kpi-meta">${totalAulasDadas} de ${totalCargaPrevista} horas/aulas</span>
            </div>
          </div>
        </div>

        ${alertas.length > 0 ? `
          <div class="alerts-section">
            <h3 class="section-title">🔔 Alertas e Lembretes Pedagógicos</h3>
            <div class="alerts-list">
              ${alertas.map(a => `
                <div class="alert-item alert-${a.tipo}">
                  <div class="alert-icon">${a.icone}</div>
                  <div class="alert-body">
                    <strong>${a.titulo}</strong>
                    <p>${a.descricao}</p>
                  </div>
                  <button class="btn btn-sm btn-outline" onclick="${a.acao}">Ver detalhes</button>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div class="dashboard-grid-2col">
          <div class="card">
            <div class="card-header">
              <h3>Visão Geral das Turmas</h3>
              <button class="btn-link" onclick="window.EduPlanApp.navegarPara('turmas')">Ver todas →</button>
            </div>
            <div class="turmas-summary-list">
              ${metricasPorTurma.length === 0 ? `
                <div class="empty-state-sm">
                  <p>Nenhuma turma cadastrada ainda.</p>
                  <button class="btn btn-sm btn-primary" onclick="window.EduPlanApp.abrirModalNovaTurma()">Cadastrar Turma</button>
                </div>
              ` : metricasPorTurma.map(m => `
                <div class="turma-summary-card" style="border-left: 5px solid ${m.turma.cor || '#0284c7'};">
                  <div class="tsc-header">
                    <div>
                      <h4 class="tsc-title">${m.turma.nome}</h4>
                      <span class="tsc-meta">${m.turma.disciplina} • ${m.turma.periodo} • ${m.totalAlunos} alunos</span>
                    </div>
                    <span class="badge ${m.turma.status === 'ativa' ? 'badge-success' : 'badge-neutral'}">
                      ${m.turma.status}
                    </span>
                  </div>

                  <div class="tsc-metrics">
                    <div class="tsc-metric-col">
                      <span class="metric-label">Carga Ministrada</span>
                      <span class="metric-val">${m.totalAulasDadas} / ${m.cargaPrevista} aulas</span>
                      <div class="progress-bar-sm">
                        <div class="progress-fill fill-blue" style="width: ${m.percentualCarga}%"></div>
                      </div>
                    </div>

                    <div class="tsc-metric-col">
                      <span class="metric-label">Plano de Ensino</span>
                      <span class="metric-val">
                        ${m.plano ? `${m.percentualPlano}% concluído` : '<span class="text-muted">Sem plano</span>'}
                      </span>
                      <div class="progress-bar-sm">
                        <div class="progress-fill fill-emerald" style="width: ${m.percentualPlano}%"></div>
                      </div>
                    </div>
                  </div>

                  <div class="tsc-footer">
                    <button class="btn btn-xs btn-outline" onclick="window.EduPlanApp.abrirModalRegistrarAula('${m.turma.id}')">
                      + Registrar Aula
                    </button>
                    ${m.plano ? `
                      <button class="btn btn-xs btn-link" onclick="window.EduPlanApp.verAcompanhamentoTurma('${m.turma.id}')">
                        Acompanhar Plano →
                      </button>
                    ` : `
                      <button class="btn btn-xs btn-link text-warning" onclick="window.EduPlanApp.abrirModalEditarTurma('${m.turma.id}')">
                        Vincular Plano
                      </button>
                    `}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3>Últimas Aulas Ministradas</h3>
              <button class="btn-link" onclick="window.EduPlanApp.navegarPara('aulas')">Ver diário completo →</button>
            </div>
            <div class="recent-aulas-list">
              ${aulas.length === 0 ? `
                <div class="empty-state-sm">
                  <p>Nenhuma aula registrada ainda.</p>
                  <button class="btn btn-sm btn-primary" onclick="window.EduPlanApp.abrirModalRegistrarAula()">Registrar Primeira Aula</button>
                </div>
              ` : aulas.slice(0, 5).map(aula => {
                const turma = todasTurmas.find(t => t.id === aula.turmaId);
                return `
                  <div class="recent-aula-item">
                    <div class="rai-date-col">
                      <span class="rai-day">${aula.data ? aula.data.split('-')[2] : '--'}</span>
                      <span class="rai-month">${aula.data ? formatarMesAbrev(aula.data) : ''}</span>
                    </div>
                    <div class="rai-content-col">
                      <div class="rai-header">
                        <strong class="rai-turma">${turma ? turma.nome : 'Turma'}</strong>
                        <span class="badge badge-neutral">${aula.duracaoAulas} ${aula.duracaoAulas === 1 ? 'aula' : 'aulas'}</span>
                      </div>
                      <p class="rai-conteudo">${aula.conteudoMinistrado || 'Sem descrição.'}</p>
                      ${aula.observacoesTurma ? `<p class="rai-obs">💡 <em>${aula.observacoesTurma}</em></p>` : ''}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- ABA: TURMAS ---
  function renderizarTurmas(container) {
    const todas = listarTurmas(false);
    const filtradas = todas.filter(t => {
      const matchStatus = filtroTurmasStatus === 'todas' || t.status === filtroTurmasStatus;
      const matchBusca = !buscaTurmas ||
        t.nome.toLowerCase().includes(buscaTurmas.toLowerCase()) ||
        t.disciplina.toLowerCase().includes(buscaTurmas.toLowerCase());
      return matchStatus && matchBusca;
    });

    container.innerHTML = `
      <div class="module-wrapper">
        <div class="module-header-row">
          <div>
            <h2>Gestão de Turmas Técnicas</h2>
            <p class="subtitle">Turmas, horários de laboratório, alunos matriculados e planos de ensino</p>
          </div>
          <button class="btn btn-primary" onclick="window.EduPlanApp.abrirModalNovaTurma()">
            <span class="btn-icon">➕</span> Nova Turma
          </button>
        </div>

        <div class="filter-bar">
          <div class="search-input-box">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              id="inputBuscaTurmas" 
              placeholder="Buscar por nome da turma ou disciplina..." 
              value="${buscaTurmas}"
            />
          </div>
          <div class="filter-pills">
            <button class="pill ${filtroTurmasStatus === 'todas' ? 'active' : ''}" onclick="window.EduPlanApp.filtrarTurmasStatus('todas')">
              Todas (${todas.length})
            </button>
            <button class="pill ${filtroTurmasStatus === 'ativa' ? 'active' : ''}" onclick="window.EduPlanApp.filtrarTurmasStatus('ativa')">
              Ativas (${todas.filter(t => t.status === 'ativa').length})
            </button>
            <button class="pill ${filtroTurmasStatus === 'concluida' ? 'active' : ''}" onclick="window.EduPlanApp.filtrarTurmasStatus('concluida')">
              Concluídas (${todas.filter(t => t.status === 'concluida').length})
            </button>
          </div>
        </div>

        ${filtradas.length === 0 ? `
          <div class="empty-state-card">
            <div class="empty-icon">👥</div>
            <h3>Nenhuma turma encontrada</h3>
            <p>Cadastre uma turma técnica ou altere os filtros de pesquisa.</p>
            <button class="btn btn-primary" onclick="window.EduPlanApp.abrirModalNovaTurma()">Criar Nova Turma</button>
          </div>
        ` : `
          <div class="turmas-grid">
            ${filtradas.map(turma => {
              const metricas = calcularMetricasTurma(turma.id);
              return `
                <div class="turma-card" style="border-top: 6px solid ${turma.cor || '#0284c7'}">
                  <div class="tc-header">
                    <div class="tc-badge-row">
                      <span class="badge ${turma.status === 'ativa' ? 'badge-success' : 'badge-neutral'}">
                        ${turma.status.toUpperCase()}
                      </span>
                      <span class="badge badge-outline">${turma.periodo}</span>
                    </div>
                    <div class="tc-actions-menu">
                      <button class="btn-icon-subtle" title="Editar Turma" onclick="window.EduPlanApp.abrirModalEditarTurma('${turma.id}')">✏️</button>
                      <button class="btn-icon-subtle text-danger" title="Excluir Turma" onclick="window.EduPlanApp.confirmarExclusaoTurma('${turma.id}')">🗑️</button>
                    </div>
                  </div>

                  <div class="tc-body">
                    <h3 class="tc-nome">${turma.nome}</h3>
                    <div class="tc-disciplina">${turma.disciplina}</div>

                    <div class="tc-info-list">
                      <div class="tc-info-item">
                        <span class="tii-icon">📍</span>
                        <span>${turma.sala || 'Laboratório regular'}</span>
                      </div>
                      <div class="tc-info-item">
                        <span class="tii-icon">📅</span>
                        <span>${(turma.diasSemana || []).join(', ') || 'Dias flexíveis'}</span>
                      </div>
                      <div class="tc-info-item">
                        <span class="tii-icon">🎓</span>
                        <span>${turma.alunos ? turma.alunos.length : 0} estudantes matriculados</span>
                        <button class="btn-link btn-xs" onclick="window.EduPlanApp.abrirModalAlunos('${turma.id}')">Gerenciar Alunos</button>
                      </div>
                    </div>

                    <div class="tc-plano-box">
                      <div class="tpb-header">
                        <span class="tpb-title">📖 Matriz Curricular / Plano:</span>
                        ${metricas.plano ? `
                          <button class="btn-link btn-xs" onclick="window.EduPlanApp.verAcompanhamentoTurma('${turma.id}')">Ver Acompanhamento</button>
                        ` : `
                          <button class="btn-link btn-xs text-warning" onclick="window.EduPlanApp.abrirModalEditarTurma('${turma.id}')">+ Vincular Plano</button>
                        `}
                      </div>
                      ${metricas.plano ? `
                        <strong class="tpb-nome">${metricas.plano.titulo}</strong>
                        <div class="tpb-progress">
                          <div class="progress-bar-sm">
                            <div class="progress-fill fill-emerald" style="width: ${metricas.percentualPlano}%"></div>
                          </div>
                          <span class="tpb-pct">${metricas.percentualPlano}% cumprido (${metricas.topicosConcluidos}/${metricas.totalTopicos} tópicos)</span>
                        </div>
                      ` : `
                        <p class="tpb-empty">Nenhum plano pedagógico vinculado a esta turma.</p>
                      `}
                    </div>

                    <div class="tc-carga-box">
                      <div class="tcb-header">
                        <span>Carga Horária Ministrada:</span>
                        <strong>${metricas.totalAulasDadas} / ${metricas.cargaPrevista} aulas</strong>
                      </div>
                      <div class="progress-bar-sm">
                        <div class="progress-fill fill-blue" style="width: ${metricas.percentualCarga}%"></div>
                      </div>
                    </div>
                  </div>

                  <div class="tc-footer">
                    <button class="btn btn-sm btn-primary" onclick="window.EduPlanApp.abrirModalRegistrarAula('${turma.id}')">
                      <span class="btn-icon">✍️</span> Dar Aula
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="window.EduPlanApp.verDiarioTurma('${turma.id}')">
                      Diário da Turma
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;

    const input = container.querySelector('#inputBuscaTurmas');
    if (input) {
      input.addEventListener('input', e => {
        buscaTurmas = e.target.value;
        renderizarTurmas(container);
      });
    }
  }

  // --- ABA: PLANOS DE AULA ---
  function renderizarPlanos(container) {
    const planos = listarPlanos();
    const turmas = listarTurmas(false);

    const filtrados = planos.filter(p => {
      return !buscaPlanos ||
        p.titulo.toLowerCase().includes(buscaPlanos.toLowerCase()) ||
        p.disciplina.toLowerCase().includes(buscaPlanos.toLowerCase());
    });

    container.innerHTML = `
      <div class="module-wrapper">
        <div class="module-header-row">
          <div>
            <h2>Planos de Ensino & Matrizes Curriculares</h2>
            <p class="subtitle">Estruture módulos técnicos, tópicos práticos, objetivos e competências profissionais</p>
          </div>
          <div class="header-action-group">
            <button class="btn btn-secondary" onclick="window.EduPlanApp.abrirModalTemplatesPlano()">
              <span class="btn-icon">💡</span> Modelos Técnicos Prontos
            </button>
            <button class="btn btn-primary" onclick="window.EduPlanApp.abrirModalNovoPlano()">
              <span class="btn-icon">➕</span> Novo Plano de Ensino
            </button>
          </div>
        </div>

        <div class="filter-bar">
          <div class="search-input-box">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              id="inputBuscaPlanos" 
              placeholder="Buscar por título do plano ou disciplina..." 
              value="${buscaPlanos}"
            />
          </div>
        </div>

        ${filtrados.length === 0 ? `
          <div class="empty-state-card">
            <div class="empty-icon">📋</div>
            <h3>Nenhum plano de aula cadastrado</h3>
            <p>Crie uma matriz curricular do zero ou use um modelo profissional pronto.</p>
            <div class="btn-group-center">
              <button class="btn btn-primary" onclick="window.EduPlanApp.abrirModalNovoPlano()">Criar Plano do Zero</button>
              <button class="btn btn-secondary" onclick="window.EduPlanApp.abrirModalTemplatesPlano()">Usar Modelo Pronto</button>
            </div>
          </div>
        ` : `
          <div class="planos-grid">
            ${filtrados.map(plano => {
              const metricas = calcularMetricasPlano(plano.id);
              const turmasQueUsam = turmas.filter(t => t.planoId === plano.id);

              return `
                <div class="plano-card">
                  <div class="pc-header">
                    <div class="pc-header-left">
                      <span class="badge badge-primary">${plano.disciplina || 'Técnico'}</span>
                      <span class="badge badge-tech">${plano.nivelEnsino || 'Ensino Profissional'}</span>
                    </div>
                    <div class="pc-actions-menu">
                      <button class="btn-icon-subtle" title="Imprimir Matriz Completa em A4 / PDF" onclick="window.EduPlanApp.imprimirPlanoCompleto('${plano.id}')">🖨️</button>
                      <button class="btn-icon-subtle" title="Editar Plano" onclick="window.EduPlanApp.abrirModalEditarPlano('${plano.id}')">✏️</button>
                      <button class="btn-icon-subtle" title="Duplicar Plano" onclick="window.EduPlanApp.duplicarPlano('${plano.id}')">📑</button>
                      <button class="btn-icon-subtle text-danger" title="Excluir Plano" onclick="window.EduPlanApp.confirmarExclusaoPlano('${plano.id}')">🗑️</button>
                    </div>
                  </div>

                  <div class="pc-body">
                    <h3 class="pc-titulo">${plano.titulo}</h3>
                    <p class="pc-desc">${plano.objetivoGeral || plano.ementa || 'Sem objetivo cadastrado.'}</p>

                    <div class="pc-stats-row">
                      <div class="pc-stat-item">
                        <span class="stat-num">${(plano.modulos || []).length}</span>
                        <span class="stat-lbl">Módulos</span>
                      </div>
                      <div class="pc-stat-item">
                        <span class="stat-num">${metricas.totalTopicos}</span>
                        <span class="stat-lbl">Tópicos</span>
                      </div>
                      <div class="pc-stat-item">
                        <span class="stat-num">${metricas.totalAulasEstimadas}h</span>
                        <span class="stat-lbl">Carga Matriz</span>
                      </div>
                      <div class="pc-stat-item">
                        <span class="stat-num text-primary">${metricas.turmasVinculadas.length}</span>
                        <span class="stat-lbl">Turmas</span>
                      </div>
                    </div>

                    <div class="pc-turmas-evolution">
                      <div class="pte-header-title">
                        <span>Evolução por Turma Aplicando Esta Matriz:</span>
                        ${metricas.progressoTurmas.length > 0 ? `
                          <span class="badge badge-tech">${metricas.progressoTurmas.length} ${metricas.progressoTurmas.length === 1 ? 'turma ativa' : 'turmas ativas'}</span>
                        ` : ''}
                      </div>

                      ${metricas.progressoTurmas.length === 0 ? `
                        <div class="empty-turmas-plan-msg">
                          <span class="text-muted text-xs">ℹ️ Matriz pedagógica cadastrada e pronta para ser aplicada em turmas.</span>
                          <button class="btn-link btn-xs" onclick="window.EduPlanApp.navegarPara('turmas')">Vincular a uma Turma →</button>
                        </div>
                      ` : metricas.progressoTurmas.map(pt => `
                        <div class="plano-turma-evolution-row">
                          <div class="pter-top">
                            <span class="pter-name" style="border-left: 3px solid ${pt.cor}; padding-left: 6px;">
                              <strong>${pt.nomeTurma}</strong> <span class="text-muted text-xs">(${pt.periodo})</span>
                            </span>
                            <span class="pter-pct text-emerald">${pt.percentual}%</span>
                          </div>
                          <div class="progress-bar-sm">
                            <div class="progress-fill fill-emerald" style="width: ${pt.percentual}%"></div>
                          </div>
                          <div class="pter-sub">
                            <span>${pt.concluidos} de ${pt.totalTopicos} tópicos concluídos • ${pt.aulasDadas}h ministradas</span>
                            <button class="btn-link btn-xs font-bold" onclick="window.EduPlanApp.verAcompanhamentoTurma('${pt.turmaId}')">
                              Acompanhar Turma →
                            </button>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  </div>

                  <div class="pc-footer">
                    ${metricas.progressoTurmas.length > 0 ? `
                      <button class="btn btn-sm btn-primary" onclick="window.EduPlanApp.verAcompanhamentoTurma('${metricas.progressoTurmas[0].turmaId}')">
                        <span class="btn-icon">📊</span> Acompanhar Turmas
                      </button>
                    ` : `
                      <button class="btn btn-sm btn-primary" onclick="window.EduPlanApp.navegarPara('turmas')">
                        Vincular a uma Turma
                      </button>
                    `}
                    <button class="btn btn-sm btn-secondary" onclick="window.EduPlanApp.imprimirPlanoCompleto('${plano.id}')" title="Visualizar e Imprimir Matriz Curricular Completa em Folha A4 / PDF">
                      <span class="btn-icon">🖨️</span> Imprimir Plano Completo
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="window.EduPlanApp.abrirModalEditarPlano('${plano.id}')">
                      Editar Matriz
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;

    const input = container.querySelector('#inputBuscaPlanos');
    if (input) {
      input.addEventListener('input', e => {
        buscaPlanos = e.target.value;
        renderizarPlanos(container);
      });
    }
  }

  // --- ABA: AULAS DADAS (DIÁRIO) ---
  function renderizarAulas(container) {
    const turmas = listarTurmas(false);
    const aulas = listarAulas({ turmaId: filtroAulasTurmaId });

    const filtradas = aulas.filter(a => {
      return !buscaAulas ||
        (a.conteudoMinistrado && a.conteudoMinistrado.toLowerCase().includes(buscaAulas.toLowerCase())) ||
        (a.observacoesTurma && a.observacoesTurma.toLowerCase().includes(buscaAulas.toLowerCase()));
    });

    const totalHoras = filtradas.reduce((acc, a) => acc + (Number(a.duracaoAulas) || 1), 0);

    container.innerHTML = `
      <div class="module-wrapper">
        <div class="module-header-row">
          <div>
            <h2>Diário de Aulas Dadas</h2>
            <p class="subtitle">Registro de aulas teóricas e práticas, vínculo com o plano e chamada de presença</p>
          </div>
          <div class="header-action-group">
            <button class="btn btn-secondary" onclick="window.EduPlanApp.imprimirDiarioClasse('${filtroAulasTurmaId}')">
              <span class="btn-icon">🖨️</span> Imprimir Diário Oficial
            </button>
            <button class="btn btn-primary" onclick="window.EduPlanApp.abrirModalRegistrarAula('${filtroAulasTurmaId}')">
              <span class="btn-icon">✍️</span> Registrar Nova Aula
            </button>
          </div>
        </div>

        <div class="filter-bar">
          <div class="form-inline-group">
            <label>Filtrar por Turma:</label>
            <select id="selectFiltroAulasTurma" onchange="window.EduPlanApp.filtrarAulasTurma(this.value)">
              <option value="">-- Todas as Turmas --</option>
              ${turmas.map(t => `
                <option value="${t.id}" ${t.id === filtroAulasTurmaId ? 'selected' : ''}>
                  ${t.nome} (${t.disciplina})
                </option>
              `).join('')}
            </select>
          </div>

          <div class="search-input-box">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              id="inputBuscaAulas" 
              placeholder="Buscar por conteúdo trabalhado ou observações..." 
              value="${buscaAulas}"
            />
          </div>

          <div class="stats-pill">
            <strong>${filtradas.length}</strong> encontros • <strong>${totalHoras}</strong> horas/aulas ministradas
          </div>
        </div>

        ${filtradas.length === 0 ? `
          <div class="empty-state-card">
            <div class="empty-icon">📝</div>
            <h3>Nenhuma aula registrada</h3>
            <p>Selecione uma turma e registre as práticas e conteúdos trabalhados no encontro pedagógico.</p>
            <button class="btn btn-primary" onclick="window.EduPlanApp.abrirModalRegistrarAula('${filtroAulasTurmaId}')">
              Registrar Primeira Aula
            </button>
          </div>
        ` : `
          <div class="aulas-timeline-list">
            ${filtradas.map(aula => {
              const turma = obterTurma(aula.turmaId);
              const plano = aula.planoId ? obterPlano(aula.planoId) : (turma?.planoId ? obterPlano(turma.planoId) : null);

              const topicosCobertos = [];
              if (plano && aula.topicosIds && aula.topicosIds.length > 0) {
                (plano.modulos || []).forEach(m => {
                  (m.topicos || []).forEach(t => {
                    if (aula.topicosIds.includes(t.id)) {
                      topicosCobertos.push({ ...t, moduloTitulo: m.titulo });
                    }
                  });
                });
              }

              let badgePresenca = '';
              if (aula.frequencia && aula.frequencia.registrada && aula.frequencia.totalAlunos > 0) {
                const pres = (aula.frequencia.presencas || []).length;
                const tot = aula.frequencia.totalAlunos;
                const pct = Math.round((pres / tot) * 100);
                badgePresenca = `
                  <span class="badge ${pct >= 75 ? 'badge-success' : 'badge-warning'}">
                    👥 ${pres}/${tot} presentes (${pct}%)
                  </span>
                `;
              }

              return `
                <div class="aula-card" style="border-left: 6px solid ${turma?.cor || '#0284c7'}">
                  <div class="ac-header">
                    <div class="ac-header-info">
                      <span class="ac-date-tag">📅 ${formatarData(aula.data)}</span>
                      <span class="badge badge-primary">${turma ? turma.nome : 'Turma'}</span>
                      <span class="badge badge-outline">${aula.duracaoAulas} ${aula.duracaoAulas === 1 ? 'aula' : 'aulas'} ministradas</span>
                      ${badgePresenca}
                    </div>
                    <div class="ac-actions">
                      <button class="btn-icon-subtle" title="Editar Registro" onclick="window.EduPlanApp.abrirModalEditarAula('${aula.id}')">✏️</button>
                      <button class="btn-icon-subtle text-danger" title="Excluir Aula" onclick="window.EduPlanApp.confirmarExclusaoAula('${aula.id}')">🗑️</button>
                    </div>
                  </div>

                  <div class="ac-body">
                    <div class="ac-conteudo-box">
                      <h4 class="ac-conteudo-title">Conteúdo Efetivamente Desenvolvido:</h4>
                      <p class="ac-conteudo-text">${aula.conteudoMinistrado || 'Sem resumo informado.'}</p>
                    </div>

                    ${topicosCobertos.length > 0 ? `
                      <div class="ac-topicos-box">
                        <span class="atb-label">🎯 Tópicos do Plano Cumpridos Nesta Aula:</span>
                        <div class="atb-tags">
                          ${topicosCobertos.map(t => `
                            <span class="badge badge-emerald">
                              ✓ ${t.titulo} <small>(${t.moduloTitulo})</small>
                            </span>
                          `).join('')}
                        </div>
                      </div>
                    ` : ''}

                    <div class="ac-meta-grid">
                      ${aula.metodologiaUtilizada ? `
                        <div class="ac-meta-item">
                          <strong>Metodologia:</strong> ${aula.metodologiaUtilizada}
                        </div>
                      ` : ''}
                      ${aula.recursosUtilizados ? `
                        <div class="ac-meta-item">
                          <strong>Recursos:</strong> ${aula.recursosUtilizados}
                        </div>
                      ` : ''}
                      ${aula.tarefasCasa ? `
                        <div class="ac-meta-item text-primary">
                          <strong>Tarefas / Próxima Aula:</strong> ${aula.tarefasCasa}
                        </div>
                      ` : ''}
                      ${aula.avaliacaoRealizada ? `
                        <div class="ac-meta-item text-purple">
                          <strong>Avaliação Técnica:</strong> ${aula.avaliacaoRealizada}
                        </div>
                      ` : ''}
                    </div>

                    ${aula.observacoesTurma ? `
                      <div class="ac-observacoes-box">
                        <strong>💡 Observações Pedagógicas & Rendimento dos Alunos:</strong>
                        <p>${aula.observacoesTurma}</p>
                      </div>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;

    const input = container.querySelector('#inputBuscaAulas');
    if (input) {
      input.addEventListener('input', e => {
        buscaAulas = e.target.value;
        renderizarAulas(container);
      });
    }
  }

  // --- ABA: ACOMPANHAMENTO DO PLANO (PLANEJADO VS EXECUTADO POR TURMA) ---
  function renderizarAcompanhamento(container) {
    const turmas = listarTurmas(false);
    const turmasComPlano = turmas.filter(t => Boolean(t.planoId));

    if (!turmaAcompanhamentoId && turmasComPlano.length > 0) {
      turmaAcompanhamentoId = turmasComPlano[0].id;
    } else if (!turmaAcompanhamentoId && turmas.length > 0) {
      turmaAcompanhamentoId = turmas[0].id;
    }

    const turmaAtual = obterTurma(turmaAcompanhamentoId);
    const planoAtual = turmaAtual?.planoId ? obterPlano(turmaAtual.planoId) : null;
    const metricas = turmaAtual ? calcularMetricasTurma(turmaAtual.id) : null;
    const todasAulas = turmaAtual ? listarAulas({ turmaId: turmaAtual.id }) : [];

    // Turmas que compartilham a mesma matriz curricular deste plano
    const turmasIrmas = planoAtual ? turmas.filter(t => t.planoId === planoAtual.id) : [];

    container.innerHTML = `
      <div class="module-wrapper">
        <div class="module-header-row">
          <div>
            <h2>Gestão do Plano de Ensino: Planejado vs. Executado</h2>
            <p class="subtitle">A matriz curricular é a referência pedagógica; cada turma tem seu próprio ritmo e evolução independente.</p>
          </div>
          <div class="header-action-group">
            ${turmaAtual && planoAtual ? `
              <button class="btn btn-secondary" onclick="window.EduPlanApp.imprimirRelatorioCumprimentoTurma('${turmaAtual.id}')">
                <span class="btn-icon">📄</span> Relatório de Cumprimento
              </button>
            ` : ''}
            <button class="btn btn-primary" onclick="window.EduPlanApp.abrirModalRegistrarAula(${turmaAtual ? `'${turmaAtual.id}'` : ''})">
              <span class="btn-icon">✍️</span> Registrar Aula Ministrada
            </button>
          </div>
        </div>

        <div class="filter-bar">
          <div class="form-inline-group">
            <label><strong>Turma Selecionada:</strong></label>
            <select id="selectAcompanhamentoTurma" onchange="window.EduPlanApp.trocarTurmaAcompanhamento(this.value)">
              ${turmas.map(t => {
                const p = t.planoId ? obterPlano(t.planoId) : null;
                return `
                  <option value="${t.id}" ${turmaAcompanhamentoId === t.id ? 'selected' : ''}>
                    ${t.nome} (${t.periodo} • ${p ? p.titulo : 'Sem plano vinculado'})
                  </option>
                `;
              }).join('')}
            </select>
          </div>

          <div class="filter-pills">
            <button class="pill ${filtroTopicoAcompStatus === 'todos' ? 'active' : ''}" onclick="window.EduPlanApp.filtrarStatusAcompanhamento('todos')">
              Todos os Tópicos (${metricas?.totalTopicos || 0})
            </button>
            <button class="pill ${filtroTopicoAcompStatus === 'concluido' ? 'active' : ''}" onclick="window.EduPlanApp.filtrarStatusAcompanhamento('concluido')">
              Concluídos (${metricas?.topicosConcluidos || 0})
            </button>
            <button class="pill ${filtroTopicoAcompStatus === 'em_andamento' ? 'active' : ''}" onclick="window.EduPlanApp.filtrarStatusAcompanhamento('em_andamento')">
              Em Andamento (${metricas?.topicosEmAndamento || 0})
            </button>
            <button class="pill ${filtroTopicoAcompStatus === 'pendente' ? 'active' : ''}" onclick="window.EduPlanApp.filtrarStatusAcompanhamento('pendente')">
              Pendentes (${metricas?.topicosPendentes || 0})
            </button>
            <button class="pill ${filtroTopicoAcompStatus === 'revisao' ? 'active' : ''}" onclick="window.EduPlanApp.filtrarStatusAcompanhamento('revisao')">
              Revisão (${metricas?.topicosRevisao || 0})
            </button>
          </div>
        </div>

        ${turmasIrmas.length > 1 ? `
          <div class="turma-context-banner">
            <div class="tcb-info">
              <span>📖 <strong>Matriz Compartilhada:</strong> ${planoAtual.titulo} (${planoAtual.disciplina})</span>
            </div>
            <div class="sibling-turmas-switcher">
              <span class="text-xs text-muted font-semibold">Comparar evolução das turmas:</span>
              ${turmasIrmas.map(ti => {
                const mTi = calcularMetricasTurma(ti.id);
                const isAtiva = ti.id === turmaAtual.id;
                return `
                  <button 
                    class="sibling-pill ${isAtiva ? 'active' : ''}" 
                    style="border-left: 4px solid ${ti.cor || '#0284c7'}"
                    onclick="window.EduPlanApp.trocarTurmaAcompanhamento('${ti.id}')"
                    title="${ti.nome} (${ti.periodo}) - Clique para alternar"
                  >
                    ${ti.nome.replace('Módulo 2 - ', '').replace('Módulo 1 - ', '')}: <strong>${mTi ? mTi.percentualPlano : 0}%</strong>
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        ${!turmaAtual ? `
          <div class="empty-state-card">
            <div class="empty-icon">👥</div>
            <h3>Nenhuma turma cadastrada</h3>
            <p>Cadastre uma turma técnica para acompanhar o planejado vs. executado.</p>
            <button class="btn btn-primary" onclick="window.EduPlanApp.navegarPara('turmas')">Cadastrar Turma</button>
          </div>
        ` : (!planoAtual ? `
          <div class="empty-state-card">
            <div class="empty-icon">📋</div>
            <h3>Turma sem Plano de Ensino Vinculado</h3>
            <p>A turma <strong>${turmaAtual.nome}</strong> ainda não possui uma matriz curricular associada.</p>
            <button class="btn btn-primary" onclick="window.EduPlanApp.abrirModalEditarTurma('${turmaAtual.id}')">Vincular Plano de Ensino</button>
          </div>
        ` : `
          <div class="plano-kpi-summary card" style="border-top: 5px solid ${turmaAtual.cor || '#0284c7'}">
            <div class="pks-main-row">
              <div class="pks-col">
                <span class="pks-label">Evolução do Plano nesta Turma</span>
                <div class="pks-val-row">
                  <span class="pks-huge-val text-emerald">${metricas.percentualPlano}%</span>
                  <span class="pks-subval">${metricas.topicosConcluidos} de ${metricas.totalTopicos} tópicos</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill fill-emerald" style="width: ${metricas.percentualPlano}%"></div>
                </div>
              </div>

              <div class="pks-col">
                <span class="pks-label">Carga Ministrada na Turma</span>
                <div class="pks-val-row">
                  <span class="pks-huge-val">${metricas.totalAulasDadas}h</span>
                  <span class="pks-subval">de ${metricas.cargaPrevista}h previstas</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill fill-blue" style="width: ${metricas.percentualCarga}%"></div>
                </div>
              </div>

              <div class="pks-col">
                <span class="pks-label">Ritmo Pedagógico da Turma</span>
                <div class="pks-val-row">
                  <span class="badge ${metricas.ritmo === 'No prazo' ? 'badge-success' : 'badge-warning'} badge-lg">
                    ${metricas.ritmo === 'No prazo' ? '⏱️ No Prazo Previsto' : (metricas.ritmo === 'Atrasado' ? '⚠️ Atenção: Atrasado' : '⚡ Ritmo Acelerado')}
                  </span>
                </div>
                <p class="text-xs text-muted mt-xs">
                  ${metricas.ritmo === 'No prazo' ? 'A turma está acompanhando a matriz técnica dentro do cronograma previsto.' : 'Recomenda-se remanejar tópicos práticos para conclusão no calendário letivo.'}
                </p>
              </div>
            </div>

            <div class="pks-turmas-row">
              <span><strong>Turma Ativa:</strong></span>
              <span class="turma-tag" style="border-left: 3px solid ${turmaAtual.cor || '#0284c7'}; font-weight: 700;">
                ${turmaAtual.nome} (${turmaAtual.periodo} • ${turmaAtual.sala || 'Sala/Laboratório'})
              </span>
              <span class="text-muted text-xs">| Matriz: <strong>${planoAtual.titulo}</strong></span>
            </div>
          </div>

          <div class="acompanhamento-modulos-list">
            ${(planoAtual.modulos || []).map((modulo, mIdx) => {
              const topicosFiltrados = (modulo.topicos || []).filter(t => {
                if (filtroTopicoAcompStatus === 'todos') return true;
                const prog = obterProgressoTopicoTurma(turmaAtual.id, t.id);
                return prog.status === filtroTopicoAcompStatus;
              });

              if (topicosFiltrados.length === 0 && filtroTopicoAcompStatus !== 'todos') return '';

              const modMetrica = metricas.modulosMetricas.find(mm => mm.moduloId === modulo.id) || { percentual: 0, concluidos: 0, totalTopicos: 0 };

              return `
                <div class="modulo-tracking-card card">
                  <div class="mtc-header">
                    <div>
                      <h3 class="mtc-title">${modulo.titulo}</h3>
                      <span class="mtc-subtitle">${modulo.topicos ? modulo.topicos.length : 0} tópicos programados na matriz</span>
                    </div>
                    <div class="mtc-progress-wrap">
                      <span class="mtc-pct-label">${modMetrica.percentual}% cumprido nesta turma</span>
                      <div class="progress-bar-sm">
                        <div class="progress-fill fill-emerald" style="width: ${modMetrica.percentual}%"></div>
                      </div>
                    </div>
                  </div>

                  <div class="mtc-table-wrap">
                    <table class="tracking-table">
                      <thead>
                        <tr>
                          <th style="width: 45px">#</th>
                          <th>Conteúdo / Tópico da Matriz</th>
                          <th style="width: 75px" class="text-center">Carga</th>
                          <th style="width: 180px">Status Nesta Turma</th>
                          <th>Aulas Ministradas Nesta Turma</th>
                          <th style="width: 70px" class="text-center">Ajuste</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${topicosFiltrados.map((topico, tIdx) => {
                          const prog = obterProgressoTopicoTurma(turmaAtual.id, topico.id);
                          const aulasDoTopico = todasAulas.filter(a => (a.topicosIds || []).includes(topico.id));

                          return `
                            <tr class="tracking-row status-row-${prog.status}">
                              <td class="text-center font-bold text-muted">${tIdx + 1}</td>
                              <td>
                                <div class="tt-topic-info">
                                  <strong class="tt-topic-title">${topico.titulo}</strong>
                                  ${topico.objetivosEspecificos ? `
                                    <p class="tt-topic-obj">🎯 <em>${topico.objetivosEspecificos}</em></p>
                                  ` : ''}
                                  ${prog.observacoesAjuste ? `
                                    <div class="tt-topic-note">
                                      <strong>Ajuste da Turma:</strong> ${prog.observacoesAjuste}
                                    </div>
                                  ` : ''}
                                </div>
                              </td>
                              <td class="text-center font-semibold">${topico.aulasEstimadas}h</td>
                              <td>
                                <select 
                                  class="status-select status-select-${prog.status}" 
                                  onchange="window.EduPlanApp.alterarStatusTopicoTurma('${turmaAtual.id}', '${topico.id}', this.value)"
                                >
                                  <option value="${StatusTopico.PENDENTE}" ${prog.status === StatusTopico.PENDENTE ? 'selected' : ''}>⏳ Pendente</option>
                                  <option value="${StatusTopico.EM_ANDAMENTO}" ${prog.status === StatusTopico.EM_ANDAMENTO ? 'selected' : ''}>🔄 Em Andamento</option>
                                  <option value="${StatusTopico.CONCLUIDO}" ${prog.status === StatusTopico.CONCLUIDO ? 'selected' : ''}>✅ Concluído</option>
                                  <option value="${StatusTopico.REVISAO}" ${prog.status === StatusTopico.REVISAO ? 'selected' : ''}>⚠️ Revisão / Reforço</option>
                                </select>
                              </td>
                              <td>
                                ${aulasDoTopico.length === 0 ? `
                                  <span class="text-muted text-xs">Ainda não ministrado nesta turma</span>
                                ` : `
                                  <div class="topic-history-tags">
                                    ${aulasDoTopico.map(a => `
                                      <span class="topic-aula-tag" title="Conteúdo: ${escapeAttr(a.conteudoMinistrado)}">
                                        📅 ${formatarData(a.data)} (${a.duracaoAulas}h)
                                      </span>
                                    `).join('')}
                                  </div>
                                `}
                              </td>
                              <td class="text-center">
                                <button 
                                  class="btn-icon-subtle" 
                                  title="Anotação de ajuste pedagógico para esta turma" 
                                  onclick="window.EduPlanApp.abrirModalNotaAjusteTurma('${turmaAtual.id}', '${topico.id}', '${escapeAttr(prog.observacoesAjuste || '')}')"
                                >
                                  📝
                                </button>
                              </td>
                            </tr>
                          `;
                        }).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `)}
      </div>
    `;
  }

  // --- ABA: RELATÓRIOS E IMPRESSÃO ---
  function renderizarRelatorios(container) {
    const turmas = listarTurmas(false);
    const planos = listarPlanos();

    if (!turmaRelatorioId && turmas.length > 0) turmaRelatorioId = turmas[0].id;
    if (!planoRelatorioId && planos.length > 0) planoRelatorioId = planos[0].id;

    container.innerHTML = `
      <div class="module-wrapper">
        <div class="relatorios-control-bar no-print">
          <div class="rcb-left">
            <h2>Relatórios & Documentos Pedagógicos</h2>
            <p class="subtitle">Documentos oficiais de Educação Profissional prontos para impressão A4 e entrega à coordenação</p>
          </div>
          <div class="rcb-actions">
            <button class="btn btn-secondary" onclick="window.EduPlanApp.exportarCsvAulas()">
              <span class="btn-icon">📊</span> Exportar Excel (CSV)
            </button>
            <button class="btn btn-primary" onclick="window.print()">
              <span class="btn-icon">🖨️</span> Imprimir / Salvar em PDF
            </button>
          </div>
        </div>

        <div class="filter-bar no-print">
          <div class="filter-pills">
            <button 
              class="pill ${tipoRelatorioAtual === 'diario' ? 'active' : ''}" 
              onclick="window.EduPlanApp.trocarTipoRelatorio('diario')"
            >
              📋 Diário de Classe Oficial
            </button>
            <button 
              class="pill ${tipoRelatorioAtual === 'cumprimento' ? 'active' : ''}" 
              onclick="window.EduPlanApp.trocarTipoRelatorio('cumprimento')"
            >
              🎯 Relatório de Cumprimento do Plano
            </button>
            <button 
              class="pill ${tipoRelatorioAtual === 'plano_completo' ? 'active' : ''}" 
              onclick="window.EduPlanApp.trocarTipoRelatorio('plano_completo')"
            >
              📘 Plano de Ensino Completo
            </button>
          </div>

          ${tipoRelatorioAtual === 'diario' ? `
            <div class="form-inline-group">
              <label>Selecione a Turma:</label>
              <select id="selectRelatorioTurma" onchange="window.EduPlanApp.trocarTurmaRelatorio(this.value)">
                ${turmas.map(t => `
                  <option value="${t.id}" ${t.id === turmaRelatorioId ? 'selected' : ''}>
                    ${t.nome} (${t.disciplina} • ${t.periodo})
                  </option>
                `).join('')}
              </select>
            </div>
          ` : (tipoRelatorioAtual === 'cumprimento' ? `
            <div class="form-inline-group">
              <label>Selecione a Turma para o Parecer do Plano:</label>
              <select id="selectRelatorioTurmaCumprimento" onchange="window.EduPlanApp.trocarTurmaRelatorio(this.value)">
                ${turmas.map(t => {
                  const p = t.planoId ? obterPlano(t.planoId) : null;
                  return `
                    <option value="${t.id}" ${t.id === turmaRelatorioId ? 'selected' : ''}>
                      ${t.nome} (${t.periodo} • ${p ? p.titulo : 'Sem plano'})
                    </option>
                  `;
                }).join('')}
              </select>
            </div>
          ` : `
            <div class="form-inline-group">
              <label>Selecione a Matriz / Plano de Ensino:</label>
              <select id="selectRelatorioPlanoCompleto" onchange="window.EduPlanApp.trocarPlanoRelatorio(this.value)">
                ${planos.map(p => `
                  <option value="${p.id}" ${p.id === planoRelatorioId ? 'selected' : ''}>
                    ${p.titulo} (${p.disciplina || p.nivelEnsino} • ${p.cargaHorariaTotalEstimada || 80}h)
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="form-inline-group" style="align-items: center; margin-left: auto;">
              <label class="checkbox-label-inline" style="display: inline-flex; align-items: center; gap: 0.45rem; cursor: pointer; font-size: 0.85rem; font-weight: 600; color: var(--text-color); user-select: none;">
                <input 
                  type="checkbox" 
                  id="chkAssinaturasPlano" 
                  ${exibirAssinaturasPlano ? 'checked' : ''} 
                  onchange="window.EduPlanApp.alternarAssinaturasPlano(this.checked)"
                  style="width: 17px; height: 17px; cursor: pointer; accent-color: var(--primary);"
                />
                <span>Incluir campos de assinatura no rodapé</span>
              </label>
            </div>
          `)}
        </div>

        <div class="printable-document-container">
          ${tipoRelatorioAtual === 'diario' 
            ? renderizarDocumentoDiario(turmaRelatorioId) 
            : (tipoRelatorioAtual === 'cumprimento' 
                ? renderizarDocumentoCumprimento(turmaRelatorioId) 
                : renderizarDocumentoPlanoCompleto(planoRelatorioId))}
        </div>
      </div>
    `;
  }

  function renderizarDocumentoDiario(turmaId) {
    const turma = obterTurma(turmaId);
    const prof = obterPerfilProfessor();
    if (!turma) {
      return `<div class="empty-state-card"><p>Nenhuma turma selecionada para o Diário de Classe.</p></div>`;
    }

    const metricas = calcularMetricasTurma(turmaId);
    const aulas = listarAulas({ turmaId });
    const aulasCronologicas = [...aulas].sort((a, b) => (a.data || '').localeCompare(a.data || ''));

    return `
      <article class="doc-a4-sheet">
        <header class="doc-header">
          <div class="doc-institution">
            <h2>${prof.escola}</h2>
            <h3>DIÁRIO DE CLASSE & REGISTRO DE AULAS PRÁTICAS/TEÓRICAS</h3>
            <p class="doc-sub">Educação Profissionalizante • Ano Letivo: <strong>${turma.anoLetivo || prof.anoLetivoPadrao}</strong> • Turno: <strong>${turma.periodo}</strong></p>
          </div>
        </header>

        <section class="doc-meta-table-wrap">
          <table class="doc-meta-table">
            <tr>
              <td><strong>Docente:</strong> ${prof.nome}</td>
              <td><strong>Turma:</strong> ${turma.nome}</td>
              <td><strong>Turno:</strong> ${turma.periodo}</td>
            </tr>
            <tr>
              <td><strong>Componente / Matéria:</strong> ${turma.disciplina}</td>
              <td><strong>Carga Prevista:</strong> ${turma.cargaHorariaTotal} aulas</td>
              <td><strong>Carga Ministrada:</strong> ${metricas.totalAulasDadas} aulas (${metricas.percentualCarga}%)</td>
            </tr>
            <tr>
              <td><strong>Local / Laboratório:</strong> ${turma.sala || 'Bancada regular'}</td>
              <td><strong>Estudantes:</strong> ${metricas.totalAlunos} matriculados</td>
              <td><strong>Frequência Média:</strong> ${metricas.frequenciaMedia}%</td>
            </tr>
          </table>
        </section>

        <section class="doc-body-section">
          <h4 class="doc-section-title">REGISTRO CRONOLÓGICO DE AULAS</h4>
          <table class="doc-data-table">
            <thead>
              <tr>
                <th style="width: 35px">Nº</th>
                <th style="width: 85px">Data</th>
                <th style="width: 50px">Aulas</th>
                <th>Conteúdo Programático Efetivamente Desenvolvido</th>
                <th style="width: 140px">Metodologia / Prática</th>
                <th style="width: 90px">Presença</th>
              </tr>
            </thead>
            <tbody>
              ${aulasCronologicas.length === 0 ? `
                <tr>
                  <td colspan="6" class="text-center">Nenhuma aula registrada até o momento.</td>
                </tr>
              ` : aulasCronologicas.map((aula, idx) => {
                let infoPresenca = '-';
                if (aula.frequencia && aula.frequencia.registrada && aula.frequencia.totalAlunos > 0) {
                  const pres = (aula.frequencia.presencas || []).length;
                  infoPresenca = `${pres}/${aula.frequencia.totalAlunos}`;
                }

                return `
                  <tr>
                    <td class="text-center"><strong>${idx + 1}</strong></td>
                    <td class="text-center">${formatarData(aula.data)}</td>
                    <td class="text-center">${aula.duracaoAulas}</td>
                    <td>
                      <div class="doc-content-text">${aula.conteudoMinistrado || '-'}</div>
                      ${aula.observacoesTurma ? `<div class="doc-obs-text"><em>Obs: ${aula.observacoesTurma}</em></div>` : ''}
                    </td>
                    <td>
                      <small>${aula.metodologiaUtilizada || aula.recursosUtilizados || 'Prática orientada'}</small>
                    </td>
                    <td class="text-center font-bold">${infoPresenca}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </section>

        <footer class="doc-signatures">
          <div class="signature-line">
            <div class="sig-line"></div>
            <span>${prof.nome}</span>
            <small>Docente Responsável</small>
          </div>
          <div class="signature-line">
            <div class="sig-line"></div>
            <span>Coordenação Pedagógica / Técnica</span>
            <small>Visto e Homologação Institucional</small>
          </div>
        </footer>
      </article>
    `;
  }

  function renderizarDocumentoCumprimento(turmaId) {
    const turma = obterTurma(turmaId);
    const prof = obterPerfilProfessor();
    if (!turma) {
      return `<div class="empty-state-card"><p>Nenhuma turma selecionada para o relatório de cumprimento.</p></div>`;
    }

    const plano = turma.planoId ? obterPlano(turma.planoId) : null;
    if (!plano) {
      return `
        <div class="empty-state-card">
          <p>A turma <strong>${turma.nome}</strong> não possui matriz pedagógica vinculada.</p>
          <button class="btn btn-primary" onclick="window.EduPlanApp.abrirModalEditarTurma('${turma.id}')">Vincular Plano</button>
        </div>
      `;
    }

    const metricas = calcularMetricasTurma(turma.id);
    const todasAulas = listarAulas({ turmaId: turma.id });

    return `
      <article class="doc-a4-sheet">
        <header class="doc-header">
          <div class="doc-institution">
            <h2>${prof.escola}</h2>
            <h3>RELATÓRIO DE CUMPRIMENTO DO PLANO DE ENSINO TÉCNICO</h3>
            <p class="doc-sub">Educação Profissionalizante • Turma: <strong>${turma.nome} (${turma.periodo})</strong> • Ano: <strong>${turma.anoLetivo || prof.anoLetivoPadrao}</strong></p>
          </div>
        </header>

        <section class="doc-meta-table-wrap">
          <table class="doc-meta-table">
            <tr>
              <td><strong>Componente Curricular:</strong> ${turma.disciplina}</td>
              <td><strong>Matriz / Plano:</strong> ${plano.titulo}</td>
              <td><strong>Habilitação:</strong> ${plano.nivelEnsino}</td>
            </tr>
            <tr>
              <td><strong>Turma Técnica:</strong> ${turma.nome} (${turma.periodo})</td>
              <td><strong>Professor Responsável:</strong> ${prof.nome} (${prof.titulacao})</td>
              <td><strong>Índice de Conclusão:</strong> <strong class="text-emerald">${metricas.percentualPlano}%</strong></td>
            </tr>
            <tr>
              <td><strong>Carga Ministrada:</strong> ${metricas.totalAulasDadas} de ${turma.cargaHorariaTotal} aulas</td>
              <td><strong>Tópicos Cumpridos:</strong> ${metricas.topicosConcluidos} de ${metricas.totalTopicos}</td>
              <td><strong>Ritmo da Turma:</strong> ${metricas.ritmo}</td>
            </tr>
            <tr>
              <td colspan="3"><strong>Competências Profissionais:</strong> ${plano.competenciasBNCC || 'Competências do Catálogo Nacional de Cursos Técnicos'}</td>
            </tr>
          </table>
        </section>

        <section class="doc-body-section">
          <h4 class="doc-section-title">MATRIZ TÉCNICA E ESTÁGIO DE EXECUÇÃO NESTA TURMA</h4>
          ${(plano.modulos || []).map(modulo => `
            <div class="doc-modulo-block">
              <h5 class="doc-modulo-title">${modulo.titulo}</h5>
              <table class="doc-data-table mb-md">
                <thead>
                  <tr>
                    <th style="width: 35px">#</th>
                    <th>Competência / Conteúdo da Habilitação</th>
                    <th style="width: 65px" class="text-center">Carga</th>
                    <th style="width: 130px" class="text-center">Status na Turma</th>
                    <th>Histórico de Práticas / Ajustes da Turma</th>
                  </tr>
                </thead>
                <tbody>
                  ${(modulo.topicos || []).map((t, idx) => {
                    const prog = obterProgressoTopicoTurma(turma.id, t.id);
                    const aulasT = todasAulas.filter(a => (a.topicosIds || []).includes(t.id));
                    let statusLabel = '⏳ Pendente';
                    if (prog.status === 'concluido') statusLabel = '✅ Concluído';
                    else if (prog.status === 'em_andamento') statusLabel = '🔄 Em Andamento';
                    else if (prog.status === 'revisao') statusLabel = '⚠️ Revisão / Reforço';

                    return `
                      <tr>
                        <td class="text-center">${idx + 1}</td>
                        <td>
                          <strong>${t.titulo}</strong>
                          ${t.objetivosEspecificos ? `<div class="doc-subtopic-obj">Obj: ${t.objetivosEspecificos}</div>` : ''}
                        </td>
                        <td class="text-center">${t.aulasEstimadas}h</td>
                        <td class="text-center font-bold">${statusLabel}</td>
                        <td>
                          ${aulasT.length > 0 ? `
                            <small>Praticado em: ${aulasT.map(a => formatarData(a.data)).join(', ')}</small>
                          ` : '<small class="text-muted">Ainda não ministrado nesta turma</small>'}
                          ${prog.observacoesAjuste ? `
                            <div class="doc-ajuste-box"><strong>Adaptação da Turma:</strong> ${prog.observacoesAjuste}</div>
                          ` : ''}
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `).join('')}
        </section>

        <section class="doc-parecer-section">
          <h4 class="doc-section-title">PARECER TÉCNICO-PEDAGÓGICO DO DOCENTE</h4>
          <div class="doc-parecer-box">
            <p>
              A turma <strong>${turma.nome}</strong> (${turma.periodo}) atinge <strong>${metricas.percentualPlano}%</strong> de cumprimento da matriz curricular profissionalizante <strong>${plano.titulo}</strong>. 
              Foram ministradas <strong>${metricas.totalAulasDadas}</strong> horas/aulas práticas em laboratório e teóricas, cobrindo <strong>${metricas.topicosConcluidos} de ${metricas.totalTopicos}</strong> competências programadas.
            </p>
          </div>
        </section>

        <footer class="doc-signatures">
          <div class="signature-line">
            <div class="sig-line"></div>
            <span>${prof.nome}</span>
            <small>Docente Técnico</small>
          </div>
          <div class="signature-line">
            <div class="sig-line"></div>
            <span>Supervisão / Coordenação de Curso</span>
            <small>Recebido e Aprovado em ____/____/2026</small>
          </div>
        </footer>
      </article>
    `;
  }

  function renderizarDocumentoPlanoCompleto(planoId) {
    const plano = obterPlano(planoId);
    const prof = obterPerfilProfessor();
    const turmas = listarTurmas(false).filter(t => t.planoId === planoId);

    if (!plano) {
      return `
        <div class="empty-state-card">
          <p>Nenhum plano de ensino selecionado para visualização e impressão.</p>
        </div>
      `;
    }

    const totalHoras = (plano.modulos || []).reduce((acc, m) => {
      return acc + (m.topicos || []).reduce((tAcc, t) => tAcc + (Number(t.aulasEstimadas) || 2), 0);
    }, 0) || plano.cargaHorariaTotalEstimada || 80;

    return `
      <article class="doc-a4-sheet doc-plano-completo">
        <header class="doc-header">
          <div class="doc-institution">
            <h2>${prof.escola}</h2>
            <h3>PLANO DE ENSINO E MATRIZ CURRICULAR TÉCNICA</h3>
            <p class="doc-sub">Educação Profissionalizante e Tecnológica • Catálogo Nacional de Cursos Técnicos (CNCT) • Ano/Semestre: <strong>${plano.anoSemestre || '2026.1'}</strong></p>
          </div>
        </header>

        <section class="doc-meta-table-wrap">
          <table class="doc-meta-table">
            <tr>
              <td style="width: 50%;"><strong>Plano / Matriz Pedagógica:</strong> ${plano.titulo}</td>
              <td style="width: 50%;"><strong>Componente Curricular:</strong> ${plano.disciplina || 'Área Técnica'}</td>
            </tr>
            <tr>
              <td><strong>Habilitação Profissional:</strong> ${plano.nivelEnsino || 'Curso Técnico'}</td>
              <td><strong>Carga Horária Total Prevista:</strong> ${totalHoras} horas / aulas</td>
            </tr>
            <tr>
              <td><strong>Docente Responsável:</strong> ${prof.nome} (${prof.titulacao || 'Especialista'})</td>
              <td><strong>E-mail Institucional:</strong> ${prof.email}</td>
            </tr>
            <tr>
              <td colspan="2">
                <strong>Turmas Atualmente Vinculadas a Esta Matriz:</strong>
                ${turmas.length > 0 
                  ? turmas.map(t => `<span class="badge badge-primary" style="margin-right: 4px;">${t.nome} (${t.periodo})</span>`).join(' ')
                  : '<span class="text-muted">Matriz de referência curricular pronta para ser aplicada em turmas.</span>'
                }
              </td>
            </tr>
          </table>
        </section>

        <!-- 1. Ementa e Objetivos Gerais -->
        <section class="doc-body-section">
          <h4 class="doc-section-title">1. EMENTA DO COMPONENTE CURRICULAR</h4>
          <div class="doc-text-block">
            <p>${plano.ementa || plano.descricao || 'Estrutura teórica e prática com foco no desenvolvimento de competências técnicas, boas práticas profissionais e rotinas de laboratório.'}</p>
          </div>
        </section>

        <section class="doc-body-section">
          <h4 class="doc-section-title">2. OBJETIVO GERAL DA DISCIPLINA</h4>
          <div class="doc-text-block">
            <p>${plano.objetivoGeral || 'Capacitar o estudante para o domínio técnico, analítico e prático das habilidades requeridas pelo perfil de formação profissional e pelo mercado de trabalho.'}</p>
          </div>
        </section>

        <!-- 2. Competências e Habilidades Profissionais -->
        <section class="doc-body-section">
          <h4 class="doc-section-title">3. COMPETÊNCIAS E HABILIDADES PROFISSIONAIS (CNCT)</h4>
          <div class="doc-text-block">
            <p>${plano.competenciasBNCC || 'Desenvolvimento das competências técnicas operacionais, metodológicas, raciocínio lógico-científico e responsabilidade profissional e socioambiental.'}</p>
          </div>
        </section>

        <!-- 3. Metodologias e Recursos Didáticos -->
        <section class="doc-body-section">
          <h4 class="doc-section-title">4. METODOLOGIA DE ENSINO & RECURSOS DIDÁTICOS DE LABORATÓRIO</h4>
          <table class="doc-meta-table mb-md">
            <tr>
              <td style="width: 50%;">
                <strong>Metodologia Aplicada:</strong><br/>
                <span class="text-muted">${plano.metodologia || 'Aulas expositivas dialogadas, práticas em bancada e laboratório técnico, resolução de problemas reais (PBL), estudos de caso e desenvolvimento de projetos práticos integradores.'}</span>
              </td>
              <td style="width: 50%;">
                <strong>Recursos e Infraestrutura de Laboratório:</strong><br/>
                <span class="text-muted">${plano.recursos || 'Laboratório técnico especializado, computadores com ferramentas e softwares de desenvolvimento/simulação, equipamentos de medição/bancada, apostilas e documentações técnicas oficiais.'}</span>
              </td>
            </tr>
          </table>
        </section>

        <!-- 4. Conteúdo Programático Detalhado (Módulos e Tópicos) -->
        <section class="doc-body-section">
          <h4 class="doc-section-title">5. CONTEÚDO PROGRAMÁTICO & ESTRUTURA MODULAR DETALHADA</h4>
          ${(plano.modulos || []).length === 0 ? `
            <p class="text-muted">Nenhum módulo ou tópico cadastrado nesta matriz curricular.</p>
          ` : (plano.modulos || []).map((modulo, mIdx) => {
            const chModulo = (modulo.topicos || []).reduce((acc, t) => acc + (Number(t.aulasEstimadas) || 2), 0);
            return `
              <div class="doc-modulo-block">
                <div class="doc-modulo-header-row">
                  <h5 class="doc-modulo-title">${modulo.titulo}</h5>
                  <span class="doc-modulo-badge">Carga Prevista: ${chModulo}h</span>
                </div>
                <table class="doc-data-table mb-md">
                  <thead>
                    <tr>
                      <th style="width: 40px" class="text-center">#</th>
                      <th style="width: 35%">Conteúdo / Tópico Programático</th>
                      <th>Objetivos Práticos de Laboratório / Habilidades</th>
                      <th style="width: 65px" class="text-center">Carga</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(modulo.topicos || []).map((topico, tIdx) => `
                      <tr>
                        <td class="text-center font-bold">${mIdx + 1}.${tIdx + 1}</td>
                        <td>
                          <strong>${topico.titulo}</strong>
                          ${topico.conteudoProgramatico ? `<br/><small class="text-muted">${topico.conteudoProgramatico}</small>` : ''}
                        </td>
                        <td>
                          ${topico.objetivosEspecificos || 'Desenvolvimento das habilidades práticas e operacionais previstas na matriz.'}
                          ${topico.metodologiaSugerida && topico.metodologiaSugerida !== 'Aula expositiva dialogada e prática em laboratório' ? `<br/><small><em>Método: ${topico.metodologiaSugerida}</em></small>` : ''}
                          ${topico.recursosDidaticos ? `<br/><small class="text-muted"><em>Recursos: ${topico.recursosDidaticos}</em></small>` : ''}
                        </td>
                        <td class="text-center font-bold">${topico.aulasEstimadas || 2}h</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `;
          }).join('')}
        </section>

        <!-- 5. Sistema de Avaliação -->
        <section class="doc-body-section">
          <h4 class="doc-section-title">6. CRITÉRIOS DE AVALIAÇÃO DA APRENDIZAGEM PROFISSIONAL</h4>
          <div class="doc-text-block">
            <p>${plano.criteriosAvaliacao || 'A avaliação terá caráter contínuo, formativo e somativo. Serão avaliados: desempenho prático individual e em equipe em ambiente de laboratório, entrega de projetos técnicos aplicados, relatórios de atividades, domínio conceitual, assiduidade, cumprimento de prazos e observância rigorosa às normas técnicas e de segurança.'}</p>
          </div>
        </section>

        <!-- 6. Bibliografia e Referências -->
        <section class="doc-body-section">
          <h4 class="doc-section-title">7. BIBLIOGRAFIA E REFERÊNCIAS TÉCNICAS RECOMENDADAS</h4>
          <div class="doc-text-block">
            <p>${plano.bibliografia || 'Normas regulamentadoras, documentações e especificações técnicas oficiais, manuais de boas práticas da indústria e livros de referência adotados no Catálogo Nacional de Cursos Técnicos.'}</p>
          </div>
        </section>

        <!-- Assinaturas Formais (Opcional) -->
        ${exibirAssinaturasPlano ? `
          <footer class="doc-signatures">
            <div class="signature-line">
              <div class="sig-line"></div>
              <span>${prof.nome}</span>
              <small>Docente Titular / Especialista</small>
            </div>
            <div class="signature-line">
              <div class="sig-line"></div>
              <span>Coordenação do Curso</span>
              <small>${plano.nivelEnsino || 'Educação Profissional'}</small>
            </div>
            <div class="signature-line">
              <div class="sig-line"></div>
              <span>Direção / Supervisão Pedagógica</span>
              <small>${prof.escola}</small>
            </div>
          </footer>
        ` : `
          <div class="doc-signatures-omitted-notice no-print text-center text-muted text-xs my-md" style="margin-top: 2rem; border: 1px dashed #cbd5e1; padding: 0.75rem; border-radius: 4px; background: #f8fafc;">
            <span>ℹ️ Os campos de assinatura do rodapé foram ocultados para esta impressão.</span>
            <button class="btn-link btn-xs font-bold" onclick="window.EduPlanApp.alternarAssinaturasPlano(true)" style="margin-left: 8px;">
              Reativar Assinaturas
            </button>
          </div>
        `}
      </article>
    `;
  }

  function exportarAulasParaCsv() {
    const aulas = listarAulas();
    const turmas = listarTurmas(false);

    let csvContent = '\uFEFF';
    csvContent += 'ID;Data;Turma;Disciplina;Duração (Aulas);Conteúdo Trabalhado;Metodologia;Recursos;Tarefas;Avaliação;Presenças;Total Alunos\n';

    aulas.forEach(a => {
      const turma = turmas.find(t => t.id === a.turmaId);
      const pres = a.frequencia?.presencas?.length || 0;
      const tot = a.frequencia?.totalAlunos || 0;

      const linha = [
        a.id,
        formatarData(a.data),
        `"${(turma?.nome || 'Turma').replace(/"/g, '""')}"`,
        `"${(turma?.disciplina || '').replace(/"/g, '""')}"`,
        a.duracaoAulas,
        `"${(a.conteudoMinistrado || '').replace(/"/g, '""')}"`,
        `"${(a.metodologiaUtilizada || '').replace(/"/g, '""')}"`,
        `"${(a.recursosUtilizados || '').replace(/"/g, '""')}"`,
        `"${(a.tarefasCasa || '').replace(/"/g, '""')}"`,
        `"${(a.avaliacaoRealizada || '').replace(/"/g, '""')}"`,
        pres,
        tot
      ].join(';');

      csvContent += linha + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diario_professor_aulas_${dataHojeIso()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // --- ABA: CONFIGURAÇÕES & PERFIL DO PROFESSOR ---
  function renderizarConfiguracoes(container) {
    const prof = obterPerfilProfessor();

    container.innerHTML = `
      <div class="module-wrapper">
        <div class="module-header-row">
          <div>
            <h2>Perfil Docente & Configurações do Sistema</h2>
            <p class="subtitle">Gerencie suas informações profissionais, foto, segurança, senha e preferências</p>
          </div>
        </div>

        <div class="config-grid">
          <!-- Coluna Esquerda: Perfil do Professor com Foto -->
          <div class="card">
            <div class="card-header">
              <h3>Perfil do(a) Professor(a)</h3>
              <span class="badge badge-tech">Educação Profissional</span>
            </div>

            <!-- Uploader de Foto de Perfil -->
            <div class="profile-photo-uploader-box">
              <div class="profile-photo-circle" id="profilePhotoDisplay">
                ${prof.fotoUrl ? `
                  <img src="${prof.fotoUrl}" class="profile-photo-img" alt="Foto de ${escapeAttr(prof.nome)}" />
                ` : `
                  <span class="profile-photo-fallback">
                    ${(prof.nome || 'P').split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase()}
                  </span>
                `}
              </div>

              <div class="profile-photo-actions">
                <h4>Foto de Perfil</h4>
                <p>Formatos suportados: PNG, JPG ou WEBP (redimensionada automaticamente).</p>
                <div class="profile-photo-btn-row">
                  <label class="btn btn-sm btn-primary file-btn-label">
                    <span>📷 Alterar Foto</span>
                    <input type="file" id="inputFotoPerfil" accept="image/*" onchange="window.EduPlanApp.processarUploadFoto(event)" hidden />
                  </label>
                  ${prof.fotoUrl ? `
                    <button type="button" class="btn btn-sm btn-outline text-danger" onclick="window.EduPlanApp.removerFotoPerfil()">
                      Remover
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>

            <!-- Formulário de Dados Pessoais & Docentes -->
            <form onsubmit="window.EduPlanApp.salvarDadosPerfilForm(event)">
              <div class="form-group">
                <label for="profNome">Nome Completo *</label>
                <input type="text" id="profNome" required value="${prof.nome || ''}" />
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label for="profEmail">E-mail Institucional *</label>
                  <input type="email" id="profEmail" required value="${prof.email || ''}" />
                </div>

                <div class="form-group">
                  <label for="profMateria">Matéria / Área Técnica Principal *</label>
                  <input type="text" id="profMateria" required placeholder="Ex: Informática, Eletrotécnica..." value="${prof.materia || ''}" />
                </div>
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label for="profTitulacao">Titulação / Qualificação</label>
                  <input type="text" id="profTitulacao" placeholder="Ex: Especialista, Engenheiro, Mestre..." value="${prof.titulacao || ''}" />
                </div>

                <div class="form-group">
                  <label for="profEscola">Instituição de Ensino / Campus *</label>
                  <input type="text" id="profEscola" required value="${prof.escola || ''}" />
                </div>
              </div>

              <div class="form-group">
                <label for="profAno">Ano Letivo Padrão</label>
                <input type="text" id="profAno" required value="${prof.anoLetivoPadrao || '2026'}" />
              </div>

              <button type="submit" class="btn btn-primary">
                <span>💾 Salvar Perfil</span>
              </button>
            </form>
          </div>

          <!-- Coluna Direita: Segurança, Senha e Backup -->
          <div class="security-settings-box">
            <!-- Cartão de Senha e PIN -->
            <div class="card">
              <div class="card-header">
                <h3>Segurança & Senha de Acesso</h3>
                <span class="badge badge-outline">Proteção Local</span>
              </div>

              <form onsubmit="window.EduPlanApp.alterarSenhaForm(event)">
                <div class="form-group">
                  <label for="senhaAtual">Senha Atual *</label>
                  <input type="password" id="senhaAtual" required placeholder="Digite sua senha atual" />
                </div>

                <div class="form-grid-2">
                  <div class="form-group">
                    <label for="novaSenha">Nova Senha *</label>
                    <input type="password" id="novaSenha" minlength="4" required placeholder="Mínimo 4 caracteres" />
                  </div>

                  <div class="form-group">
                    <label for="confirmaSenha">Confirmar Nova Senha *</label>
                    <input type="password" id="confirmaSenha" minlength="4" required placeholder="Repita a nova senha" />
                  </div>
                </div>

                <div class="form-group">
                  <label for="novoPin">PIN de Desbloqueio Rápido (4 dígitos numéricos)</label>
                  <input type="text" id="novoPin" maxlength="4" pattern="[0-9]{4}" value="${prof.pin || '1234'}" placeholder="Ex: 1234" />
                </div>

                <hr class="divider-my" />

                <div class="security-toggle-row">
                  <div>
                    <strong>Exigir Senha ao Abrir o Sistema</strong>
                    <p>Bloqueia a tela e protege seus registros e notas de alunos ao iniciar.</p>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" id="toggleExigirSenha" ${prof.exigirSenha ? 'checked' : ''} onchange="window.EduPlanApp.alternarExigirSenha(this.checked)" />
                    <span class="slider"></span>
                  </label>
                </div>

                <div class="mt-md" style="margin-top: 1.25rem;">
                  <button type="submit" class="btn btn-secondary">
                    <span>🔒 Atualizar Senha & PIN</span>
                  </button>
                </div>
              </form>
            </div>

            <!-- Cartão de Sincronização em Nuvem (Google Firebase Firestore) -->
            <div class="card">
              <div class="card-header">
                <h3>Sincronização em Nuvem (Firebase)</h3>
                <span class="badge ${isFirebaseConectado() ? 'badge-tech' : 'badge-outline'}">
                  ${isFirebaseConectado() ? '🟢 Nuvem Ativa' : '🟡 Modo Local'}
                </span>
              </div>
              <div class="card-body-spaced">
                <div class="cloud-status-banner">
                  <div class="cloud-banner-info">
                    <span class="cloud-status-dot ${isFirebaseConectado() ? 'connected' : 'offline'}"></span>
                    <span style="font-size: 0.85rem;">${obterDescricaoStatusNuvem()}</span>
                  </div>
                  ${isFirebaseConectado() ? `
                    <button type="button" class="btn btn-xs btn-outline text-danger" onclick="window.EduPlanApp.desconectarFirebaseConfirmado()">
                      Desconectar
                    </button>
                  ` : ''}
                </div>

                <p class="text-sm">
                  Conecte seu projeto gratuito do <strong>Google Firebase Firestore</strong> para sincronizar turmas, planos e aulas em tempo real entre computadores, celulares, tablets e no <strong>GitHub Pages</strong>.
                </p>

                <form onsubmit="window.EduPlanApp.conectarFirebaseForm(event)">
                  <div class="form-group" style="margin-top: 0.75rem;">
                    <label for="inputFirebaseConfig">Configuração do Firebase (JSON ou Snippet copiado do Console):</label>
                    <textarea 
                      id="inputFirebaseConfig" 
                      class="cloud-code-input" 
                      rows="5" 
                      placeholder="Cole aqui o objeto firebaseConfig do console do Firebase:&#10;{&#10;  apiKey: &quot;...&quot;,&#10;  authDomain: &quot;...&quot;,&#10;  projectId: &quot;...&quot;,&#10;  storageBucket: &quot;...&quot;,&#10;  messagingSenderId: &quot;...&quot;,&#10;  appId: &quot;...&quot;&#10;}"
                    >${obterRawConfigFirebase()}</textarea>
                  </div>

                  <div class="cloud-actions-row">
                    <button type="submit" class="btn btn-primary" id="btnSalvarFirebase">
                      <span>🔗 ${isFirebaseConectado() ? 'Atualizar Conexão' : 'Conectar à Nuvem'}</span>
                    </button>
                    ${isFirebaseConectado() ? `
                      <button type="button" class="btn btn-secondary" onclick="window.EduPlanApp.enviarTudoParaNuvemManual()" title="Garante que todos os dados deste aparelho subam para o Firebase">
                        <span>⬆️ Enviar Dados</span>
                      </button>
                      <button type="button" class="btn btn-outline" onclick="window.EduPlanApp.puxarTudoDaNuvemManual()" title="Recarrega as informações mais recentes do Firebase">
                        <span>⬇️ Baixar da Nuvem</span>
                      </button>
                    ` : ''}
                  </div>
                </form>

                <div style="margin-top: 0.85rem; font-size: 0.8rem; color: var(--text-muted); background: var(--bg-subtle); padding: 0.6rem; border-radius: var(--radius-sm);">
                  💡 <em>Passo a passo completo e gratuito no arquivo <strong>GUIA_FIREBASE.md</strong> na pasta do projeto.</em>
                </div>
              </div>
            </div>

            <!-- Cartão de Backup e Manutenção -->
            <div class="card">
              <div class="card-header">
                <h3>Backup dos Diários & Restauração</h3>
              </div>
              <div class="card-body-spaced">
                <p class="text-sm">Seus dados e notas ficam gravados de forma segura e autônoma no navegador. Exporte regularmente o backup em JSON para manter uma cópia externa.</p>

                <div class="backup-actions-block" style="display: flex; gap: 0.6rem; margin: 1rem 0; flex-wrap: wrap;">
                  <button class="btn btn-secondary" style="flex: 1;" onclick="window.EduPlanApp.exportarBackup()">
                    <span class="btn-icon">💾</span> Fazer Backup (JSON)
                  </button>

                  <label class="btn btn-outline file-btn-label" style="flex: 1;">
                    <span class="btn-icon">📂</span> Restaurar Backup
                    <input type="file" id="fileInputBackup" accept=".json" onchange="window.EduPlanApp.importarBackupArquivo(event)" hidden />
                  </label>
                </div>

                <hr class="divider-my" />

                <div class="reset-actions-block" style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
                  <button class="btn btn-outline btn-sm" onclick="window.EduPlanApp.restaurarExemplos()">
                    🔄 Restaurar Dados Técnicos Padrão
                  </button>
                  <button class="btn btn-danger btn-sm" onclick="window.EduPlanApp.limparTudoConfirmado()">
                    🗑️ Zerar Sistema
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // 6. MODAIS (TURMAS, ALUNOS, PLANOS, AULAS, TEMPLATES)
  // ==========================================================================

  function renderizarModalTurma(turmaExistente = null) {
    const planos = listarPlanos();
    const t = turmaExistente || criarNovaTurma();
    const isEdicao = Boolean(turmaExistente && turmaExistente.id);

    const diasDisponiveis = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const coresDisponiveis = ['#0284c7', '#0d9488', '#16a34a', '#7c3aed', '#ea580c', '#e11d48', '#2563eb'];

    return `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${isEdicao ? 'Editar Turma Técnica' : 'Cadastrar Nova Turma Técnica'}</h3>
          <button class="modal-close" onclick="window.EduPlanApp.fecharModal()">&times;</button>
        </div>

        <form id="formSalvarTurma" onsubmit="window.EduPlanApp.submeterFormTurma(event)">
          <input type="hidden" name="id" value="${t.id}" />

          <div class="form-grid-2">
            <div class="form-group">
              <label for="turmaNome">Nome da Turma / Habilitação *</label>
              <input type="text" id="turmaNome" name="nome" required placeholder="Ex: Módulo 1 - Téc. em Automação..." value="${t.nome || ''}" />
            </div>

            <div class="form-group">
              <label for="turmaDisciplina">Componente Curricular / Matéria *</label>
              <input type="text" id="turmaDisciplina" name="disciplina" required placeholder="Ex: Programação Web, Eletrotécnica..." value="${t.disciplina || ''}" />
            </div>
          </div>

          <div class="form-grid-3">
            <div class="form-group">
              <label for="turmaAno">Ano Letivo</label>
              <input type="text" id="turmaAno" name="anoLetivo" value="${t.anoLetivo || '2026'}" />
            </div>

            <div class="form-group">
              <label for="turmaPeriodo">Turno</label>
              <select id="turmaPeriodo" name="periodo">
                <option value="Matutino" ${t.periodo === 'Matutino' ? 'selected' : ''}>Matutino</option>
                <option value="Vespertino" ${t.periodo === 'Vespertino' ? 'selected' : ''}>Vespertino</option>
                <option value="Noturno" ${t.periodo === 'Noturno' ? 'selected' : ''}>Noturno</option>
                <option value="Integral" ${t.periodo === 'Integral' ? 'selected' : ''}>Integral</option>
              </select>
            </div>

            <div class="form-group">
              <label for="turmaSala">Laboratório / Sala</label>
              <input type="text" id="turmaSala" name="sala" placeholder="Ex: Lab de Informática 3, Oficina 2" value="${t.sala || ''}" />
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label for="turmaCarga">Carga Horária Total (Aulas/Horas) *</label>
              <input type="number" id="turmaCarga" name="cargaHorariaTotal" min="1" max="1000" required value="${t.cargaHorariaTotal || 80}" />
            </div>

            <div class="form-group">
              <label for="turmaPlano">Vincular Plano de Ensino Técnico</label>
              <select id="turmaPlano" name="planoId">
                <option value="">-- Selecione um Plano --</option>
                ${planos.map(p => `
                  <option value="${p.id}" ${t.planoId === p.id ? 'selected' : ''}>
                    ${p.titulo} (${p.disciplina})
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Dias da Semana</label>
            <div class="checkbox-group">
              ${diasDisponiveis.map(dia => `
                <label class="checkbox-label">
                  <input type="checkbox" name="diasSemana" value="${dia}" ${(t.diasSemana || []).includes(dia) ? 'checked' : ''} />
                  ${dia}
                </label>
              `).join('')}
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label>Cor de Destaque da Turma</label>
              <div class="color-picker-row">
                ${coresDisponiveis.map(cor => `
                  <label class="color-swatch-label">
                    <input type="radio" name="cor" value="${cor}" ${(t.cor || '#0284c7') === cor ? 'checked' : ''} />
                    <span class="color-circle" style="background-color: ${cor}"></span>
                  </label>
                `).join('')}
              </div>
            </div>

            <div class="form-group">
              <label for="turmaStatus">Status</label>
              <select id="turmaStatus" name="status">
                <option value="ativa" ${t.status === 'ativa' ? 'selected' : ''}>Ativa</option>
                <option value="concluida" ${t.status === 'concluida' ? 'selected' : ''}>Concluída</option>
                <option value="arquivada" ${t.status === 'arquivada' ? 'selected' : ''}>Arquivada</option>
              </select>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="window.EduPlanApp.fecharModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary">Salvar Turma</button>
          </div>
        </form>
      </div>
    `;
  }

  function renderizarModalAlunos(turmaId) {
    const turma = obterTurma(turmaId);
    if (!turma) return '<p>Turma não encontrada</p>';
    const alunos = turma.alunos || [];

    return `
      <div class="modal-content modal-large">
        <div class="modal-header">
          <div>
            <h3>Alunos da Turma: ${turma.nome}</h3>
            <p class="subtitle">${alunos.length} estudantes matriculados</p>
          </div>
          <button class="modal-close" onclick="window.EduPlanApp.fecharModal()">&times;</button>
        </div>

        <div class="alunos-manager-grid">
          <div class="card-inner">
            <h4>Adicionar Estudante</h4>
            <form id="formAdicionarAluno" onsubmit="window.EduPlanApp.adicionarAlunoTurma(event, '${turma.id}')">
              <div class="form-group">
                <label for="alunoNome">Nome Completo *</label>
                <input type="text" id="alunoNome" required placeholder="Ex: Gabriel Barbosa Silva" />
              </div>
              <div class="form-group">
                <label for="alunoMatricula">Matrícula do Aluno</label>
                <input type="text" id="alunoMatricula" placeholder="Ex: 2026-TEC01" />
              </div>
              <button type="submit" class="btn btn-primary btn-block">+ Adicionar Aluno</button>
            </form>

            <hr class="divider-my" />

            <h4>Importar em Massa</h4>
            <p class="text-xs text-muted">Cole a lista com um nome por linha:</p>
            <form id="formImportarAlunos" onsubmit="window.EduPlanApp.importarAlunosEmMassa(event, '${turma.id}')">
              <div class="form-group">
                <textarea id="textareaAlunosMassa" rows="4" placeholder="Ana Beatriz&#10;Arthur Lima&#10;Bruno Henrique"></textarea>
              </div>
              <button type="submit" class="btn btn-secondary btn-block">📥 Importar Nomes</button>
            </form>
          </div>

          <div class="card-inner">
            <div class="students-list-header">
              <h4>Lista de Chamada</h4>
              ${alunos.length > 0 ? `
                <button class="btn-link btn-xs text-danger" onclick="window.EduPlanApp.limparAlunosTurma('${turma.id}')">
                  Limpar Todos
                </button>
              ` : ''}
            </div>

            ${alunos.length === 0 ? `
              <div class="empty-state-sm">
                <p>Nenhum aluno cadastrado nesta turma.</p>
              </div>
            ` : `
              <div class="students-table-wrap">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th style="width: 40px">Nº</th>
                      <th>Nome do Estudante</th>
                      <th>Matrícula</th>
                      <th style="width: 45px" class="text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${alunos.map((aluno, idx) => `
                      <tr>
                        <td class="text-center"><strong>${idx + 1}</strong></td>
                        <td>${aluno.nome}</td>
                        <td><span class="code-badge">${aluno.matricula || '-'}</span></td>
                        <td class="text-center">
                          <button class="btn-icon-subtle text-danger" title="Remover" onclick="window.EduPlanApp.removerAlunoTurma('${turma.id}', '${aluno.id}')">✕</button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="window.EduPlanApp.fecharModal()">Fechar</button>
        </div>
      </div>
    `;
  }

  function renderizarModalPlano(planoExistente = null) {
    if (planoExistente) {
      planoSendoEditado = JSON.parse(JSON.stringify(planoExistente));
    } else {
      planoSendoEditado = criarNovoPlano({
        modulos: [
          criarNovoModulo({
            titulo: 'Módulo 1: Fundamentos Técnicos & Laboratório',
            topicos: [criarNovoTopico({ titulo: 'Introdução, Normas de Segurança e Ferramentas', aulasEstimadas: 2 })]
          })
        ]
      });
    }

    const p = planoSendoEditado;
    const isEdicao = Boolean(planoExistente && planoExistente.id);

    return `
      <div class="modal-content modal-extra-large">
        <div class="modal-header">
          <div>
            <h3>${isEdicao ? 'Editar Plano de Ensino Técnico' : 'Novo Plano de Ensino Técnico'}</h3>
            <p class="subtitle">Estruture competências profissionais, módulos e práticas de laboratório</p>
          </div>
          <button class="modal-close" onclick="window.EduPlanApp.fecharModal()">&times;</button>
        </div>

        <div class="modal-body-scrollable">
          <form id="formPlanoCabecalho">
            <input type="hidden" id="planoId" value="${p.id}" />

            <div class="card-inner-box">
              <h4 class="cib-title">1. Informações Gerais da Habilitação</h4>
              
              <div class="form-grid-2">
                <div class="form-group">
                  <label for="planoTitulo">Título da Matriz / Plano de Ensino *</label>
                  <input type="text" id="planoTitulo" required placeholder="Ex: Programação de Sistemas Web..." value="${p.titulo || ''}" />
                </div>

                <div class="form-group">
                  <label for="planoDisciplina">Componente Curricular *</label>
                  <input type="text" id="planoDisciplina" required placeholder="Ex: Programação, Eletrotécnica..." value="${p.disciplina || ''}" />
                </div>
              </div>

              <div class="form-grid-3">
                <div class="form-group">
                  <label for="planoNivel">Habilitação / Nível</label>
                  <select id="planoNivel">
                    <option value="Curso Técnico Integrado" ${p.nivelEnsino === 'Curso Técnico Integrado' ? 'selected' : ''}>Curso Técnico Integrado</option>
                    <option value="Curso Técnico Subsequente / Concomitante" ${p.nivelEnsino === 'Curso Técnico Subsequente / Concomitante' ? 'selected' : ''}>Curso Técnico Subsequente / Concomitante</option>
                    <option value="Qualificação Profissional / FIC" ${p.nivelEnsino === 'Qualificação Profissional / FIC' ? 'selected' : ''}>Qualificação Profissional / FIC</option>
                    <option value="Ensino Médio Técnico" ${p.nivelEnsino === 'Ensino Médio Técnico' ? 'selected' : ''}>Ensino Médio Técnico</option>
                    <option value="Tecnólogo / Graduação" ${p.nivelEnsino === 'Tecnólogo / Graduação' ? 'selected' : ''}>Tecnólogo / Graduação</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="planoAnoSemestre">Ano / Semestre</label>
                  <input type="text" id="planoAnoSemestre" value="${p.anoSemestre || '2026.1'}" />
                </div>

                <div class="form-group">
                  <label for="planoCargaEst">Carga Estimada (Horas/Aulas)</label>
                  <input type="number" id="planoCargaEst" min="1" max="1000" value="${p.cargaHorariaTotalEstimada || 80}" />
                </div>
              </div>

              <div class="form-group">
                <label for="planoObjetivoGeral">Objetivo Geral & Perfil de Saída do Estudante</label>
                <textarea id="planoObjetivoGeral" rows="2" placeholder="Descreva as competências e habilidades profissionais que o aluno desenvolverá...">${p.objetivoGeral || ''}</textarea>
              </div>

              <div class="form-group">
                <label for="planoBNCC">Competências do Catálogo Nacional de Cursos Técnicos (CNCT)</label>
                <input type="text" id="planoBNCC" placeholder="Ex: Projetar, documentar e implementar sistemas computacionais..." value="${p.competenciasBNCC || ''}" />
              </div>
            </div>
          </form>

          <div class="modulos-builder-section">
            <div class="builder-header">
              <div>
                <h4 class="cib-title">2. Módulos & Tópicos de Aula (Teoria & Prática)</h4>
                <p class="subtitle">Sequência programática com objetivos e recursos de bancada/computadores</p>
              </div>
              <button type="button" class="btn btn-sm btn-secondary" onclick="window.EduPlanApp.adicionarModuloEditor()">
                + Adicionar Módulo
              </button>
            </div>

            <div id="containerModulosEditor">
              ${renderizarListaModulosEditor(p.modulos)}
            </div>
          </div>
        </div>

        <div class="modal-footer">
          ${isEdicao ? `
            <button type="button" class="btn btn-secondary" onclick="window.EduPlanApp.imprimirPlanoCompleto('${p.id}'); window.EduPlanApp.fecharModal();" title="Imprimir Matriz Curricular Completa em A4 / PDF">
              <span class="btn-icon">🖨️</span> Imprimir Matriz Completa
            </button>
          ` : ''}
          <button type="button" class="btn btn-secondary" onclick="window.EduPlanApp.fecharModal()">Cancelar</button>
          <button type="button" class="btn btn-primary" onclick="window.EduPlanApp.salvarPlanoCompleto()">Salvar Plano de Ensino</button>
        </div>
      </div>
    `;
  }

  function renderizarListaModulosEditor(modulos = []) {
    if (!modulos || modulos.length === 0) {
      return `<div class="empty-state-sm"><p>Nenhum módulo criado. Clique em "+ Adicionar Módulo".</p></div>`;
    }

    return modulos.map((modulo, mIdx) => `
      <div class="modulo-edit-box" data-modulo-idx="${mIdx}">
        <div class="meb-header">
          <div class="meb-title-input">
            <span class="meb-num">Módulo ${mIdx + 1}:</span>
            <input 
              type="text" 
              class="input-modulo-titulo" 
              placeholder="Nome do Módulo (Ex: Lógica de Programação e Banco de Dados)" 
              value="${modulo.titulo || ''}"
              oninput="window.EduPlanApp.atualizarTituloModulo(${mIdx}, this.value)"
            />
          </div>
          <div class="meb-actions">
            <button type="button" class="btn btn-xs btn-outline" onclick="window.EduPlanApp.adicionarTopicoEditor(${mIdx})">
              + Tópico/Aula
            </button>
            <button type="button" class="btn-icon-subtle text-danger" title="Excluir Módulo" onclick="window.EduPlanApp.removerModuloEditor(${mIdx})">
              🗑️
            </button>
          </div>
        </div>

        <div class="meb-topicos-list">
          ${(modulo.topicos || []).map((topico, tIdx) => `
            <div class="topico-edit-card" data-topico-idx="${tIdx}">
              <div class="tec-header">
                <div class="tec-order-badge">Aula ${tIdx + 1}</div>
                <input 
                  type="text" 
                  class="input-topico-titulo" 
                  placeholder="Título do Conteúdo / Prática de Laboratório *" 
                  value="${topico.titulo || ''}" 
                  oninput="window.EduPlanApp.atualizarTopicoCampo(${mIdx}, ${tIdx}, 'titulo', this.value)"
                />
                <div class="tec-duracao-box">
                  <label>Aulas:</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="40" 
                    style="width: 55px" 
                    value="${topico.aulasEstimadas || 2}" 
                    oninput="window.EduPlanApp.atualizarTopicoCampo(${mIdx}, ${tIdx}, 'aulasEstimadas', this.value)"
                  />
                </div>
                <button type="button" class="btn-icon-subtle text-danger" title="Remover Tópico" onclick="window.EduPlanApp.removerTopicoEditor(${mIdx}, ${tIdx})">✕</button>
              </div>

              <div class="tec-details-grid">
                <div class="form-group-sm">
                  <label>Objetivo Prático / Específico</label>
                  <input 
                    type="text" 
                    placeholder="O que o aluno aprenderá a fazer..." 
                    value="${topico.objetivosEspecificos || ''}"
                    oninput="window.EduPlanApp.atualizarTopicoCampo(${mIdx}, ${tIdx}, 'objetivosEspecificos', this.value)"
                  />
                </div>
                <div class="form-group-sm">
                  <label>Metodologia / Prática</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Prática em laboratório, simulação CAD..." 
                    value="${topico.metodologiaSugerida || ''}"
                    oninput="window.EduPlanApp.atualizarTopicoCampo(${mIdx}, ${tIdx}, 'metodologiaSugerida', this.value)"
                  />
                </div>
                <div class="form-group-sm">
                  <label>Recursos / Equipamentos</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Bancada, multímetro, VS Code..." 
                    value="${topico.recursosDidaticos || ''}"
                    oninput="window.EduPlanApp.atualizarTopicoCampo(${mIdx}, ${tIdx}, 'recursosDidaticos', this.value)"
                  />
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  function renderizarModalTemplates() {
    return `
      <div class="modal-content modal-large">
        <div class="modal-header">
          <div>
            <h3>Modelos Prontos para Cursos Técnicos</h3>
            <p class="subtitle">Estruturas curriculares alinhadas à Educação Profissionalizante</p>
          </div>
          <button class="modal-close" onclick="window.EduPlanApp.fecharModal()">&times;</button>
        </div>

        <div class="templates-grid">
          <div class="template-card">
            <div class="tpl-icon">💻</div>
            <h4>Desenvolvimento de Sistemas</h4>
            <p>Lógica de programação, APIs REST, banco de dados e aplicações web completas.</p>
            <button class="btn btn-sm btn-primary" onclick="window.EduPlanApp.carregarTemplate('programacao')">Usar Modelo</button>
          </div>

          <div class="template-card">
            <div class="tpl-icon">⚡</div>
            <h4>Eletrotécnica & Automação</h4>
            <p>Comandos elétricos, dispositivos de proteção, partida de motores e normas NR-10.</p>
            <button class="btn btn-sm btn-primary" onclick="window.EduPlanApp.carregarTemplate('automacao')">Usar Modelo</button>
          </div>

          <div class="template-card">
            <div class="tpl-icon">📊</div>
            <h4>Administração & Logística</h4>
            <p>Gestão de estoques, rotinas financeiras, cadeia de suprimentos e planilhas gerenciais.</p>
            <button class="btn btn-sm btn-primary" onclick="window.EduPlanApp.carregarTemplate('administracao')">Usar Modelo</button>
          </div>

          <div class="template-card">
            <div class="tpl-icon">⚙️</div>
            <h4>Mecânica & Manutenção</h4>
            <p>Metrologia dimensional, elementos de máquinas, desenho técnico e manutenção preventiva.</p>
            <button class="btn btn-sm btn-primary" onclick="window.EduPlanApp.carregarTemplate('mecanica')">Usar Modelo</button>
          </div>

          <div class="template-card">
            <div class="tpl-icon">💼</div>
            <h4>Informática & Rotinas Digitais</h4>
            <p>Pacote Office (Word, Excel Avançado, PowerPoint, Outlook), IA e rotinas corporativas para aprendizes.</p>
            <button class="btn btn-sm btn-primary" onclick="window.EduPlanApp.carregarTemplate('informatica_aprendizes')">Usar Modelo</button>
          </div>

          <div class="template-card">
            <div class="tpl-icon">🚀</div>
            <h4>TNC - Iniciantes</h4>
            <p>Treinamento de Novos Contratados (4h): Segurança digital, diretórios e revisão prática de Word e Excel.</p>
            <button class="btn btn-sm btn-primary" onclick="window.EduPlanApp.carregarTemplate('tnc_iniciantes')">Usar Modelo</button>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="window.EduPlanApp.fecharModal()">Fechar</button>
        </div>
      </div>
    `;
  }

  function renderizarModalAula(aulaExistente = null, turmaIdPreSelecionada = null) {
    const turmas = listarTurmas(true);
    const aula = aulaExistente || criarNovaAulaDada({
      turmaId: turmaIdPreSelecionada || (turmas[0] ? turmas[0].id : ''),
      data: dataHojeIso(),
      duracaoAulas: 2
    });

    const isEdicao = Boolean(aulaExistente && aulaExistente.id);
    const turmaSelecionada = obterTurma(aula.turmaId);
    const planoVinculado = turmaSelecionada?.planoId ? obterPlano(turmaSelecionada.planoId) : null;
    const alunos = turmaSelecionada?.alunos || [];

    return `
      <div class="modal-content modal-large">
        <div class="modal-header">
          <div>
            <h3>${isEdicao ? 'Editar Registro de Aula' : 'Registrar Aula Ministrada'}</h3>
            <p class="subtitle">Diário oficial, vínculo aos tópicos do plano e chamada de presença</p>
          </div>
          <button class="modal-close" onclick="window.EduPlanApp.fecharModal()">&times;</button>
        </div>

        <div class="modal-body-scrollable">
          <form id="formSalvarAula" onsubmit="window.EduPlanApp.submeterFormAula(event)">
            <input type="hidden" name="id" value="${aula.id}" />

            <div class="form-grid-3">
              <div class="form-group">
                <label for="formAulaTurma">Turma Técnica *</label>
                <select id="formAulaTurma" name="turmaId" required onchange="window.EduPlanApp.trocarTurmaModalAula(this.value)">
                  ${turmas.map(t => `
                    <option value="${t.id}" ${t.id === aula.turmaId ? 'selected' : ''}>
                      ${t.nome} (${t.disciplina})
                    </option>
                  `).join('')}
                </select>
              </div>

              <div class="form-group">
                <label for="formAulaData">Data da Aula *</label>
                <input type="date" id="formAulaData" name="data" required value="${aula.data || dataHojeIso()}" />
              </div>

              <div class="form-group">
                <label for="formAulaDuracao">Quantidade de Horas/Aulas *</label>
                <input type="number" id="formAulaDuracao" name="duracaoAulas" min="1" max="10" required value="${aula.duracaoAulas || 2}" />
              </div>
            </div>

            <div class="card-inner-box">
              <div class="cib-header">
                <span class="cib-title">🎯 Tópicos Práticos/Teóricos do Plano Desenvolvidos:</span>
                ${planoVinculado ? `
                  <span class="badge badge-outline">${planoVinculado.titulo}</span>
                ` : `
                  <span class="badge badge-warning">Turma sem plano vinculado</span>
                `}
              </div>

              <div id="containerTopicosPlanoAula">
                ${renderizarChecklistTopicosPlano(planoVinculado, aula.topicosIds)}
              </div>
            </div>

            <div class="form-group">
              <label for="formAulaConteudo">Resumo das Atividades e Conteúdos Desenvolvidos *</label>
              <textarea 
                id="formAulaConteudo" 
                name="conteudoMinistrado" 
                rows="3" 
                required 
                placeholder="Descreva detalhadamente as explicações, exercícios e práticas em laboratório..."
              >${aula.conteudoMinistrado || ''}</textarea>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label for="formAulaMetodologia">Metodologia e Estratégias Pedagógicas</label>
                <input type="text" id="formAulaMetodologia" name="metodologiaUtilizada" placeholder="Ex: Prática em bancada, simulação de circuitos..." value="${aula.metodologiaUtilizada || ''}" />
              </div>

              <div class="form-group">
                <label for="formAulaRecursos">Equipamentos e Recursos Utilizados</label>
                <input type="text" id="formAulaRecursos" name="recursosUtilizados" placeholder="Ex: Multímetro, IDE, bancada didática..." value="${aula.recursosUtilizados || ''}" />
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label for="formAulaTarefas">Tarefas Práticas / Orientações</label>
                <input type="text" id="formAulaTarefas" name="tarefasCasa" placeholder="Ex: Estudo de caso técnico, relatório de ensaio..." value="${aula.tarefasCasa || ''}" />
              </div>

              <div class="form-group">
                <label for="formAulaAvaliacao">Avaliação Formativa / Somativa</label>
                <input type="text" id="formAulaAvaliacao" name="avaliacaoRealizada" placeholder="Ex: Avaliação prática de laboratório, entrega de código..." value="${aula.avaliacaoRealizada || ''}" />
              </div>
            </div>

            <div class="form-group">
              <label for="formAulaObs">Observações Pedagógicas & Desempenho dos Estudantes</label>
              <textarea id="formAulaObs" name="observacoesTurma" rows="2" placeholder="Dificuldades técnicas observadas, pontos fortes e recomendações...">${aula.observacoesTurma || ''}</textarea>
            </div>

            <div class="card-inner-box">
              <div class="cib-header">
                <span class="cib-title">📋 Chamada de Frequência (${alunos.length} alunos)</span>
                ${alunos.length > 0 ? `
                  <div class="chamada-actions">
                    <button type="button" class="btn-link btn-xs" onclick="window.EduPlanApp.marcarTodosPresentes(true)">Marcar Todos Presentes</button>
                    <span class="text-muted">|</span>
                    <button type="button" class="btn-link btn-xs text-muted" onclick="window.EduPlanApp.marcarTodosPresentes(false)">Desmarcar Todos</button>
                  </div>
                ` : ''}
              </div>

              <div id="containerChamadaPresenca">
                ${renderizarGradePresenca(alunos, aula.frequencia)}
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="window.EduPlanApp.fecharModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary">Salvar no Diário</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function renderizarChecklistTopicosPlano(plano, topicosSelecionados = []) {
    if (!plano || !plano.modulos || plano.modulos.length === 0) {
      return `<div class="empty-state-sm"><p>Esta turma não possui plano técnico vinculado com tópicos cadastrados.</p></div>`;
    }

    return `
      <div class="plan-topics-checklist">
        <p class="text-xs text-muted mb-sm">Marque as competências/tópicos desenvolvidos nesta aula (o acompanhamento será atualizado):</p>
        ${plano.modulos.map(modulo => `
          <div class="ptc-modulo">
            <h5 class="ptc-modulo-title">${modulo.titulo}</h5>
            <div class="ptc-topicos-grid">
              ${(modulo.topicos || []).map(topico => {
                const isChecked = topicosSelecionados.includes(topico.id);
                return `
                  <label class="topic-checkbox-card ${isChecked ? 'checked' : ''}">
                    <input 
                      type="checkbox" 
                      name="topicosIds" 
                      value="${topico.id}" 
                      ${isChecked ? 'checked' : ''}
                      onchange="this.closest('.topic-checkbox-card').classList.toggle('checked', this.checked)"
                    />
                    <div class="tcc-content">
                      <strong class="tcc-title">${topico.titulo}</strong>
                      <div class="tcc-meta">
                        <span class="badge ${topico.status === 'concluido' ? 'badge-success' : 'badge-neutral'}">
                          ${topico.status}
                        </span>
                        <span>${topico.aulasEstimadas}h est.</span>
                      </div>
                    </div>
                  </label>
                `;
              }).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderizarGradePresenca(alunos = [], frequencia = null) {
    if (!alunos || alunos.length === 0) {
      return `<div class="empty-state-sm"><p>Nenhum aluno cadastrado nesta turma.</p></div>`;
    }

    const presencasIds = frequencia?.presencas || alunos.map(a => a.id);

    return `
      <div class="attendance-grid">
        ${alunos.map((aluno, idx) => {
          const estaPresente = presencasIds.includes(aluno.id);
          return `
            <label class="attendance-item ${estaPresente ? 'present' : 'absent'}">
              <input 
                type="checkbox" 
                name="presencasIds" 
                value="${aluno.id}" 
                ${estaPresente ? 'checked' : ''}
                onchange="window.EduPlanApp.togglePresencaAluno(this)"
              />
              <span class="att-num">${idx + 1}</span>
              <span class="att-name">${aluno.nome}</span>
              <span class="att-status">${estaPresente ? 'Presente' : 'Falta'}</span>
            </label>
          `;
        }).join('')}
      </div>
    `;
  }

  // ==========================================================================
  // 7. EXPOSIÇÃO GLOBAL (API window.EduPlanApp)
  // ==========================================================================

  window.EduPlanApp = {
    navegarPara,
    alternarTema,
    fecharModal,
    animarAtencaoModal,
    mostrarToast,

    // Autenticação & Login
    bloquearTela,
    alternarModoLogin,
    submeterLoginSenha,
    submeterLoginPin,
    recuperarSenha,

    // Perfil do Professor & Fotos
    processarUploadFoto: (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG ou WEBP).');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Redimensiona para manter o localStorage leve (max 400x400)
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const maxDim = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height *= maxDim / width;
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width *= maxDim / height;
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          const base64Foto = canvas.toDataURL('image/jpeg', 0.85);
          salvarPerfilProfessor({ fotoUrl: base64Foto });
          mostrarToast('Foto de perfil atualizada com sucesso!', 'success');
          reRenderizar();
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    },

    removerFotoPerfil: () => {
      salvarPerfilProfessor({ fotoUrl: '' });
      mostrarToast('Foto de perfil removida.', 'info');
      reRenderizar();
    },

    salvarDadosPerfilForm: (e) => {
      e.preventDefault();
      salvarPerfilProfessor({
        nome: document.getElementById('profNome').value.trim(),
        email: document.getElementById('profEmail').value.trim(),
        materia: document.getElementById('profMateria').value.trim(),
        titulacao: document.getElementById('profTitulacao').value.trim(),
        escola: document.getElementById('profEscola').value.trim(),
        anoLetivoPadrao: document.getElementById('profAno').value.trim()
      });
      mostrarToast('Perfil do professor atualizado com sucesso!', 'success');
      reRenderizar();
    },

    alterarSenhaForm: (e) => {
      e.preventDefault();
      const prof = obterPerfilProfessor();
      const senhaAtual = document.getElementById('senhaAtual').value;
      const novaSenha = document.getElementById('novaSenha').value;
      const confirmaSenha = document.getElementById('confirmaSenha').value;
      const novoPin = document.getElementById('novoPin').value.trim();

      if (senhaAtual !== String(prof.senha || '123456')) {
        alert('A senha atual digitada está incorreta.');
        return;
      }

      if (novaSenha !== confirmaSenha) {
        alert('A nova senha e a confirmação não coincidem.');
        return;
      }

      salvarPerfilProfessor({
        senha: novaSenha,
        pin: novoPin || prof.pin
      });

      mostrarToast('Senha e PIN de segurança atualizados com sucesso!', 'success');
      document.getElementById('senhaAtual').value = '';
      document.getElementById('novaSenha').value = '';
      document.getElementById('confirmaSenha').value = '';
    },

    alternarExigirSenha: (checked) => {
      salvarPerfilProfessor({ exigirSenha: checked });
      mostrarToast(`Exigência de senha ao abrir ${checked ? 'ativada' : 'desativada'}.`, 'info');
    },

    // Turmas
    filtrarTurmasStatus: (status) => {
      filtroTurmasStatus = status;
      reRenderizar();
    },
    abrirModalNovaTurma: () => {
      abrirModal(renderizarModalTurma());
    },
    abrirModalEditarTurma: (id) => {
      const turma = obterTurma(id);
      if (turma) abrirModal(renderizarModalTurma(turma));
    },
    confirmarExclusaoTurma: (id) => {
      const turma = obterTurma(id);
      if (confirm(`Tem certeza que deseja excluir a turma "${turma?.nome}"? Isso também removerá as aulas registradas para ela.`)) {
        excluirTurma(id);
        mostrarToast('Turma excluída com sucesso.', 'info');
      }
    },
    submeterFormTurma: (e) => {
      e.preventDefault();
      const form = e.target;
      const formData = new FormData(form);

      const diasChecked = [];
      form.querySelectorAll('input[name="diasSemana"]:checked').forEach(cb => diasChecked.push(cb.value));

      const dados = {
        id: formData.get('id') || undefined,
        nome: formData.get('nome'),
        disciplina: formData.get('disciplina'),
        anoLetivo: formData.get('anoLetivo'),
        periodo: formData.get('periodo'),
        sala: formData.get('sala'),
        cargaHorariaTotal: Number(formData.get('cargaHorariaTotal')),
        planoId: formData.get('planoId') || null,
        diasSemana: diasChecked,
        cor: formData.get('cor'),
        status: formData.get('status')
      };

      salvarTurma(dados);
      fecharModal();
      mostrarToast('Turma salva com sucesso!', 'success');
    },
    verDiarioTurma: (turmaId) => {
      filtroAulasTurmaId = turmaId;
      navegarPara('aulas');
    },
    verAcompanhamentoTurma: (turmaId) => {
      const turma = obterTurma(turmaId);
      if (turma) {
        turmaAcompanhamentoId = turma.id;
        if (turma.planoId) planoAcompanhamentoId = turma.planoId;
        navegarPara('acompanhamento');
      }
    },
    abrirModalAlunos: (turmaId) => {
      abrirModal(renderizarModalAlunos(turmaId));
    },
    adicionarAlunoTurma: (e, turmaId) => {
      e.preventDefault();
      const turma = obterTurma(turmaId);
      if (!turma) return;

      const nome = document.getElementById('alunoNome').value.trim();
      const matricula = document.getElementById('alunoMatricula').value.trim();
      if (!nome) return;

      if (!turma.alunos) turma.alunos = [];
      turma.alunos.push({
        id: gerarId('aluno'),
        nome,
        matricula,
        numero: turma.alunos.length + 1
      });

      salvarTurma(turma);
      abrirModal(renderizarModalAlunos(turmaId));
      mostrarToast(`Aluno "${nome}" adicionado!`, 'success');
    },
    importarAlunosEmMassa: (e, turmaId) => {
      e.preventDefault();
      const turma = obterTurma(turmaId);
      if (!turma) return;

      const texto = document.getElementById('textareaAlunosMassa').value.trim();
      if (!texto) return;

      const linhas = texto.split('\n').map(l => l.trim()).filter(Boolean);
      if (!turma.alunos) turma.alunos = [];

      linhas.forEach(linha => {
        turma.alunos.push({
          id: gerarId('aluno'),
          nome: linha,
          matricula: '',
          numero: turma.alunos.length + 1
        });
      });

      salvarTurma(turma);
      abrirModal(renderizarModalAlunos(turmaId));
      mostrarToast(`${linhas.length} alunos importados com sucesso!`, 'success');
    },
    removerAlunoTurma: (turmaId, alunoId) => {
      const turma = obterTurma(turmaId);
      if (!turma) return;
      turma.alunos = (turma.alunos || []).filter(a => a.id !== alunoId);
      salvarTurma(turma);
      abrirModal(renderizarModalAlunos(turmaId));
      mostrarToast('Aluno removido.', 'info');
    },
    limparAlunosTurma: (turmaId) => {
      if (confirm('Deseja realmente remover todos os alunos desta turma?')) {
        const turma = obterTurma(turmaId);
        if (turma) {
          turma.alunos = [];
          salvarTurma(turma);
          abrirModal(renderizarModalAlunos(turmaId));
          mostrarToast('Lista de alunos esvaziada.', 'info');
        }
      }
    },

    // Planos de Aula
    abrirModalNovoPlano: () => {
      abrirModal(renderizarModalPlano());
    },
    abrirModalEditarPlano: (id) => {
      const plano = obterPlano(id);
      if (plano) abrirModal(renderizarModalPlano(plano));
    },
    confirmarExclusaoPlano: (id) => {
      const plano = obterPlano(id);
      if (confirm(`Deseja excluir o plano "${plano?.titulo}"? O vínculo com turmas será desfeito.`)) {
        excluirPlano(id);
        mostrarToast('Plano de aula excluído.', 'info');
      }
    },
    duplicarPlano: (id) => {
      const plano = obterPlano(id);
      if (plano) {
        const clone = JSON.parse(JSON.stringify(plano));
        clone.id = gerarId('plano');
        clone.titulo = `${clone.titulo} (Cópia)`;
        clone.modulos.forEach(m => {
          m.id = gerarId('modulo');
          (m.topicos || []).forEach(t => {
            t.id = gerarId('topico');
            t.status = StatusTopico.PENDENTE;
            t.observacoesAjuste = '';
          });
        });
        salvarPlano(clone);
        mostrarToast('Plano duplicado com sucesso!', 'success');
      }
    },
    verAcompanhamentoPorPlano: (planoId) => {
      planoAcompanhamentoId = planoId;
      navegarPara('acompanhamento');
    },
    abrirModalTemplatesPlano: () => {
      abrirModal(renderizarModalTemplates());
    },
    carregarTemplate: (tipo) => {
      const templates = {
        informatica_aprendizes: obterPlanoInformaticaAprendizes(),
        tnc_iniciantes: obterPlanoTNCIniciantes(),
        programacao: {
          titulo: 'Desenvolvimento Web Full Stack & APIs',
          disciplina: 'Programação de Sistemas',
          nivelEnsino: 'Técnico em Desenvolvimento de Sistemas',
          cargaHorariaTotalEstimada: 100,
          objetivoGeral: 'Construir aplicações web profissionais com front-end responsivo e APIs RESTful.',
          competenciasBNCC: 'Desenvolvimento e testes de sistemas computacionais.',
          modulos: [
            {
              titulo: 'Módulo 1: Front-End Responsivo e Acessível',
              topicos: [
                { titulo: 'Estruturação Semântica e Acessibilidade (WCAG)', aulasEstimadas: 4, metodologiaSugerida: 'Live coding' },
                { titulo: 'Layouts Avançados com CSS Grid e Flexbox', aulasEstimadas: 6, metodologiaSugerida: 'Construção de dashboard' }
              ]
            },
            {
              titulo: 'Módulo 2: Lógica com JavaScript ES6+ e DOM',
              topicos: [
                { titulo: 'Manipulação Funcional de Arrays e Funções Assíncronas', aulasEstimadas: 6, metodologiaSugerida: 'Desafios em terminal' },
                { titulo: 'Consumo de APIs REST com Fetch e Async/Await', aulasEstimadas: 8, metodologiaSugerida: 'Projeto prático de integração' }
              ]
            }
          ]
        },
        automacao: {
          titulo: 'Eletrotécnica & Comandos Industriais',
          disciplina: 'Comandos Elétricos',
          nivelEnsino: 'Técnico em Eletrotécnica',
          cargaHorariaTotalEstimada: 80,
          objetivoGeral: 'Projetar e montar painéis de acionamento elétrico e proteção para motores industriais.',
          competenciasBNCC: 'Instalação e manutenção de sistemas elétricos e automação.',
          modulos: [
            {
              titulo: 'Módulo 1: Dispositivos de Manobra e Proteção',
              topicos: [
                { titulo: 'Dimensionamento de Disjuntores e Relés Térmicos', aulasEstimadas: 4, metodologiaSugerida: 'Prática em bancada' },
                { titulo: 'Contatores de Potência e Intertravamento Elétrico', aulasEstimadas: 4, metodologiaSugerida: 'Montagem de circuito de selo' }
              ]
            },
            {
              titulo: 'Módulo 2: Partidas de Motores Trifásicos',
              topicos: [
                { titulo: 'Partida Direta com Reversão de Rotação', aulasEstimadas: 6, metodologiaSugerida: 'Simulação no CADe_SIMU e bancada' },
                { titulo: 'Partida Estrela-Triângulo e Soft-Starter', aulasEstimadas: 6, metodologiaSugerida: 'Ensaio em motor trifásico' }
              ]
            }
          ]
        },
        administracao: {
          titulo: 'Gestão Empresarial & Operações Logísticas',
          disciplina: 'Administração da Produção',
          nivelEnsino: 'Técnico em Administração',
          cargaHorariaTotalEstimada: 80,
          objetivoGeral: 'Controlar fluxos de materiais, finanças e processos operacionais em organizações.',
          competenciasBNCC: 'Planejamento e coordenação de rotinas administrativas.',
          modulos: [
            {
              titulo: 'Módulo 1: Gestão de Suprimentos e Estoques',
              topicos: [
                { titulo: 'Classificação ABC e Curva de Demanda', aulasEstimadas: 4, metodologiaSugerida: 'Estudo de caso com dados reais' },
                { titulo: 'Dimensionamento de Estoque de Segurança e Ponto de Pedido', aulasEstimadas: 4, metodologiaSugerida: 'Prática em planilhas eletrônicas' }
              ]
            },
            {
              titulo: 'Módulo 2: Rotinas Financeiras e Orçamento',
              topicos: [
                { titulo: 'Fluxo de Caixa e Demonstração de Resultados (DRE)', aulasEstimadas: 4, metodologiaSugerida: 'Simulação empresarial' },
                { titulo: 'Formação de Preço de Venda e Margem de Contribuição', aulasEstimadas: 6, metodologiaSugerida: 'Oficina de precificação' }
              ]
            }
          ]
        },
        mecanica: {
          titulo: 'Metrologia Dimensional & Manutenção Mecânica',
          disciplina: 'Processos de Fabricação Mecânica',
          nivelEnsino: 'Técnico em Mecânica',
          cargaHorariaTotalEstimada: 80,
          objetivoGeral: 'Executar medições técnicas de precisão e planejar manutenção em componentes industriais.',
          competenciasBNCC: 'Medição, usinagem e manutenção mecânica.',
          modulos: [
            {
              titulo: 'Módulo 1: Metrologia Aplicada',
              topicos: [
                { titulo: 'Leitura e Medição com Paquímetro (Sistema Métrico e Polegada)', aulasEstimadas: 4, metodologiaSugerida: 'Prática com peças padrão' },
                { titulo: 'Medição com Micrômetro e Relógio Comparador', aulasEstimadas: 4, metodologiaSugerida: 'Inspeção de tolerâncias' }
              ]
            },
            {
              titulo: 'Módulo 2: Elementos de Fixação e Transmissão',
              topicos: [
                { titulo: 'Parafusos, Porcas, Chavetas e Rolamentos', aulasEstimadas: 6, metodologiaSugerida: 'Desmontagem e montagem prática' },
                { titulo: 'Alinhamento de Eixos e Tensão de Correias', aulasEstimadas: 6, metodologiaSugerida: 'Manutenção preventiva em bancada' }
              ]
            }
          ]
        }
      };

      const tpl = templates[tipo];
      if (tpl) {
        const novo = criarNovoPlano({
          titulo: tpl.titulo,
          disciplina: tpl.disciplina,
          nivelEnsino: tpl.nivelEnsino,
          anoSemestre: tpl.anoSemestre,
          cargaHorariaTotalEstimada: tpl.cargaHorariaTotalEstimada,
          ementa: tpl.ementa,
          objetivoGeral: tpl.objetivoGeral,
          competenciasBNCC: tpl.competenciasBNCC,
          metodologia: tpl.metodologia,
          recursos: tpl.recursos,
          criteriosAvaliacao: tpl.criteriosAvaliacao,
          bibliografia: tpl.bibliografia,
          modulos: tpl.modulos.map(m => criarNovoModulo({
            titulo: m.titulo,
            topicos: m.topicos.map(t => criarNovoTopico(t))
          }))
        });
        salvarPlano(novo);
        fecharModal();
        mostrarToast(`Plano técnico "${tpl.titulo}" carregado com sucesso!`, 'success');
        navegarPara('planos');
      }
    },
    adicionarModuloEditor: () => {
      if (!planoSendoEditado) return;
      if (!planoSendoEditado.modulos) planoSendoEditado.modulos = [];
      planoSendoEditado.modulos.push(criarNovoModulo({
        titulo: `Módulo ${planoSendoEditado.modulos.length + 1}: Prática Técnica`,
        topicos: [criarNovoTopico({ titulo: 'Novo Conteúdo de Aula / Laboratório', aulasEstimadas: 2 })]
      }));
      const container = document.getElementById('containerModulosEditor');
      if (container) container.innerHTML = renderizarListaModulosEditor(planoSendoEditado.modulos);
    },
    removerModuloEditor: (mIdx) => {
      if (!planoSendoEditado || !planoSendoEditado.modulos) return;
      planoSendoEditado.modulos.splice(mIdx, 1);
      const container = document.getElementById('containerModulosEditor');
      if (container) container.innerHTML = renderizarListaModulosEditor(planoSendoEditado.modulos);
    },
    atualizarTituloModulo: (mIdx, val) => {
      if (planoSendoEditado?.modulos?.[mIdx]) {
        planoSendoEditado.modulos[mIdx].titulo = val;
      }
    },
    adicionarTopicoEditor: (mIdx) => {
      if (planoSendoEditado?.modulos?.[mIdx]) {
        if (!planoSendoEditado.modulos[mIdx].topicos) planoSendoEditado.modulos[mIdx].topicos = [];
        planoSendoEditado.modulos[mIdx].topicos.push(criarNovoTopico({
          titulo: 'Novo Conteúdo Programático / Prática',
          aulasEstimadas: 2
        }));
        const container = document.getElementById('containerModulosEditor');
        if (container) container.innerHTML = renderizarListaModulosEditor(planoSendoEditado.modulos);
      }
    },
    removerTopicoEditor: (mIdx, tIdx) => {
      if (planoSendoEditado?.modulos?.[mIdx]?.topicos) {
        planoSendoEditado.modulos[mIdx].topicos.splice(tIdx, 1);
        const container = document.getElementById('containerModulosEditor');
        if (container) container.innerHTML = renderizarListaModulosEditor(planoSendoEditado.modulos);
      }
    },
    atualizarTopicoCampo: (mIdx, tIdx, campo, val) => {
      if (planoSendoEditado?.modulos?.[mIdx]?.topicos?.[tIdx]) {
        planoSendoEditado.modulos[mIdx].topicos[tIdx][campo] = val;
      }
    },
    salvarPlanoCompleto: () => {
      if (!planoSendoEditado) return;
      planoSendoEditado.titulo = document.getElementById('planoTitulo')?.value.trim() || planoSendoEditado.titulo;
      planoSendoEditado.disciplina = document.getElementById('planoDisciplina')?.value.trim() || planoSendoEditado.disciplina;
      planoSendoEditado.nivelEnsino = document.getElementById('planoNivel')?.value || planoSendoEditado.nivelEnsino;
      planoSendoEditado.anoSemestre = document.getElementById('planoAnoSemestre')?.value || planoSendoEditado.anoSemestre;
      planoSendoEditado.cargaHorariaTotalEstimada = Number(document.getElementById('planoCargaEst')?.value) || 80;
      planoSendoEditado.objetivoGeral = document.getElementById('planoObjetivoGeral')?.value || '';
      planoSendoEditado.competenciasBNCC = document.getElementById('planoBNCC')?.value || '';

      if (!planoSendoEditado.titulo || !planoSendoEditado.disciplina) {
        alert('Por favor, informe ao menos o Título do Plano e a Disciplina.');
        return;
      }

      salvarPlano(planoSendoEditado);
      fecharModal();
      mostrarToast('Plano de ensino salvo com sucesso!', 'success');
    },

    // Aulas Dadas
    filtrarAulasTurma: (turmaId) => {
      filtroAulasTurmaId = turmaId;
      reRenderizar();
    },
    abrirModalRegistrarAula: (turmaIdPreSelecionada = null) => {
      abrirModal(renderizarModalAula(null, turmaIdPreSelecionada));
    },
    abrirModalEditarAula: (id) => {
      const aula = obterAula(id);
      if (aula) abrirModal(renderizarModalAula(aula));
    },
    confirmarExclusaoAula: (id) => {
      if (confirm('Deseja excluir este registro de aula ministrada?')) {
        excluirAula(id);
        mostrarToast('Registro de aula excluído.', 'info');
      }
    },
    trocarTurmaModalAula: (turmaId) => {
      const turma = obterTurma(turmaId);
      const plano = turma?.planoId ? obterPlano(turma.planoId) : null;
      const cTopicos = document.getElementById('containerTopicosPlanoAula');
      const cPresenca = document.getElementById('containerChamadaPresenca');
      if (cTopicos) cTopicos.innerHTML = renderizarChecklistTopicosPlano(plano, []);
      if (cPresenca) cPresenca.innerHTML = renderizarGradePresenca(turma?.alunos || [], null);
    },
    togglePresencaAluno: (input) => {
      const label = input.closest('.attendance-item');
      if (label) {
        const statusSpan = label.querySelector('.att-status');
        if (input.checked) {
          label.classList.add('present');
          label.classList.remove('absent');
          if (statusSpan) statusSpan.textContent = 'Presente';
        } else {
          label.classList.remove('present');
          label.classList.add('absent');
          if (statusSpan) statusSpan.textContent = 'Falta';
        }
      }
    },
    marcarTodosPresentes: (marcar) => {
      document.querySelectorAll('#containerChamadaPresenca input[name="presencasIds"]').forEach(cb => {
        cb.checked = marcar;
        window.EduPlanApp.togglePresencaAluno(cb);
      });
    },
    submeterFormAula: (e) => {
      e.preventDefault();
      const form = e.target;
      const formData = new FormData(form);

      const turmaId = formData.get('turmaId');
      const turma = obterTurma(turmaId);

      const topicosIds = [];
      form.querySelectorAll('input[name="topicosIds"]:checked').forEach(cb => topicosIds.push(cb.value));

      const presencasIds = [];
      form.querySelectorAll('input[name="presencasIds"]:checked').forEach(cb => presencasIds.push(cb.value));

      const totalAlunos = turma?.alunos?.length || 0;
      const ausenciasIds = (turma?.alunos || []).map(a => a.id).filter(id => !presencasIds.includes(id));

      const dados = {
        id: formData.get('id') || undefined,
        turmaId: turmaId,
        planoId: turma?.planoId || null,
        data: formData.get('data'),
        duracaoAulas: Number(formData.get('duracaoAulas')),
        topicosIds: topicosIds,
        conteudoMinistrado: formData.get('conteudoMinistrado'),
        metodologiaUtilizada: formData.get('metodologiaUtilizada'),
        recursosUtilizados: formData.get('recursosUtilizados'),
        observacoesTurma: formData.get('observacoesTurma'),
        tarefasCasa: formData.get('tarefasCasa'),
        avaliacaoRealizada: formData.get('avaliacaoRealizada'),
        frequencia: {
          registrada: totalAlunos > 0,
          totalAlunos: totalAlunos,
          presencas: presencasIds,
          ausencias: ausenciasIds
        }
      };

      salvarAula(dados, true);
      fecharModal();
      mostrarToast('Aula registrada com sucesso no diário!', 'success');
    },
    imprimirDiarioClasse: (turmaId) => {
      if (turmaId) turmaRelatorioId = turmaId;
      tipoRelatorioAtual = 'diario';
      navegarPara('relatorios');
    },

    // Acompanhamento
    trocarTurmaAcompanhamento: (turmaId) => {
      turmaAcompanhamentoId = turmaId;
      const turma = obterTurma(turmaId);
      if (turma && turma.planoId) planoAcompanhamentoId = turma.planoId;
      reRenderizar();
    },
    trocarPlanoAcompanhamento: (planoId) => {
      planoAcompanhamentoId = planoId;
      const turma = estado.turmas.find(t => t.planoId === planoId);
      if (turma) turmaAcompanhamentoId = turma.id;
      reRenderizar();
    },
    filtrarStatusAcompanhamento: (status) => {
      filtroTopicoAcompStatus = status;
      reRenderizar();
    },
    alterarStatusTopicoTurma: (turmaId, topicoId, novoStatus, observacoes = null) => {
      atualizarStatusTopicoTurma(turmaId, topicoId, novoStatus, observacoes);
      mostrarToast(`Status do tópico atualizado para "${novoStatus}".`, 'info');
      reRenderizar();
    },
    alterarStatusTopicoPlano: (planoId, topicoId, novoStatus) => {
      atualizarStatusTopico(planoId, topicoId, novoStatus);
      mostrarToast(`Status do tópico atualizado para "${novoStatus}".`, 'info');
      reRenderizar();
    },
    abrirModalNotaAjusteTurma: (turmaId, topicoId, notaAtual) => {
      const turma = obterTurma(turmaId);
      const novaNota = prompt(`Anotação de Adaptação / Ajuste Pedagógico (${turma ? turma.nome : 'Turma'}):`, notaAtual);
      if (novaNota !== null) {
        atualizarStatusTopicoTurma(turmaId, topicoId, null, novaNota);
        mostrarToast('Anotação pedagógica da turma registrada!', 'success');
        reRenderizar();
      }
    },
    abrirModalNotaAjuste: (planoId, topicoId, notaAtual) => {
      const novaNota = prompt('Anotação de Adaptação / Ajuste Pedagógico:', notaAtual);
      if (novaNota !== null) {
        atualizarStatusTopico(planoId, topicoId, null, novaNota);
        mostrarToast('Anotação pedagógica registrada!', 'success');
        reRenderizar();
      }
    },
    imprimirRelatorioCumprimentoTurma: (turmaId) => {
      if (turmaId) turmaRelatorioId = turmaId;
      tipoRelatorioAtual = 'cumprimento';
      navegarPara('relatorios');
    },
    imprimirRelatorioPlano: (planoId) => {
      if (planoId) planoRelatorioId = planoId;
      tipoRelatorioAtual = 'plano_completo';
      navegarPara('relatorios');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    imprimirPlanoCompleto: (planoId) => {
      if (planoId) planoRelatorioId = planoId;
      tipoRelatorioAtual = 'plano_completo';
      navegarPara('relatorios');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // Relatórios
    trocarTipoRelatorio: (tipo) => {
      tipoRelatorioAtual = tipo;
      reRenderizar();
    },
    trocarTurmaRelatorio: (turmaId) => {
      turmaRelatorioId = turmaId;
      reRenderizar();
    },
    trocarPlanoRelatorio: (planoId) => {
      planoRelatorioId = planoId;
      reRenderizar();
    },
    alternarAssinaturasPlano: (ativo) => {
      exibirAssinaturasPlano = Boolean(ativo);
      if (estado.professor) {
        estado.professor.exibirAssinaturasPlano = exibirAssinaturasPlano;
        salvarNoStorage();
      }
      reRenderizar();
      mostrarToast(exibirAssinaturasPlano ? 'Campos de assinatura ativados no rodapé.' : 'Campos de assinatura ocultados para impressão.', 'info');
    },
    exportarCsvAulas: () => {
      exportarAulasParaCsv();
      mostrarToast('Planilha CSV gerada com sucesso!', 'success');
    },

    // Backups e Restauração
    exportarBackup: () => {
      exportarBackupJson();
      mostrarToast('Arquivo de backup baixado!', 'success');
    },
    importarBackupArquivo: (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const res = importarBackupJson(evt.target.result);
        if (res.sucesso) {
          mostrarToast(res.mensagem, 'success');
          navegarPara('dashboard');
        } else {
          alert('Erro ao importar backup: ' + res.mensagem);
        }
      };
      reader.readAsText(file);
    },
    restaurarExemplos: () => {
      if (confirm('Deseja restaurar os dados de demonstração da Educação Profissional?')) {
        restaurarDadosDemonstracao();
        mostrarToast('Dados técnicos de demonstração restaurados!', 'success');
        navegarPara('dashboard');
      }
    },
    limparTudoConfirmado: () => {
      if (confirm('ATENÇÃO: Deseja apagar todas as turmas, planos e aulas? Esta ação não pode ser desfeita.')) {
        limparTodosDados();
        mostrarToast('Todos os dados foram excluídos.', 'warning');
        navegarPara('dashboard');
      }
    },

    // Sincronização em Nuvem (Google Firebase)
    conectarFirebaseForm,
    desconectarFirebaseConfirmado,
    enviarTudoParaNuvemManual,
    puxarTudoDaNuvemManual,
    isFirebaseConectado
  };

  // ==========================================================================
  // 8. INICIALIZAÇÃO NO CARREGAMENTO DA PÁGINA
  // ==========================================================================

  document.addEventListener('DOMContentLoaded', () => {
    inicializarStore();
    aplicarTemaConfigurado();
    atualizarChipNavbar();
    atualizarBadgeNuvem(isFirebaseConectado() ? 'connected' : 'offline', firebaseProjectId);

    // Eventos de navegação das abas
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        const tab = item.getAttribute('data-tab');
        if (tab) navegarPara(tab);
      });
    });

    // Bloqueia fechamento involuntário por clique fora (backdrop) ou tecla ESC.
    // Para fechar, o usuário deve usar o botão 'X' ou os comandos que concluem/cancelam a operação.
    const overlay = document.getElementById('modalOverlay');
    if (overlay) {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) {
          animarAtencaoModal();
        }
      });
    }

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        const modalAtivo = document.getElementById('modalOverlay');
        if (modalAtivo && modalAtivo.classList.contains('active')) {
          animarAtencaoModal();
        }
      }
    });

    subscreverMudancas(() => {
      reRenderizar();
    });

    // Validação da Sessão de Login
    verificarAutenticacao();

    renderizarAba(abaAtiva);
  });

})();
