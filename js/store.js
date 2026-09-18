/**
 * EduPlan - Store e Persistência de Dados
 * Gerenciamento centralizado do estado, localStorage e dados de demonstração.
 */

import {
  criarNovaTurma,
  criarNovoPlano,
  criarNovoModulo,
  criarNovoTopico,
  criarNovaAulaDada,
  StatusTopico,
  StatusTurma,
  dataHojeIso
} from './models.js';

const CHAVE_STORAGE = 'eduplan_dados_v1';

// Estrutura inicial do estado
let estado = {
  config: {
    nomeProfessor: 'Prof. Carlos Eduardo',
    escola: 'Colégio Integrado de Educação',
    anoLetivoPadrao: '2026',
    tema: 'light' // 'light' ou 'dark'
  },
  turmas: [],
  planos: [],
  aulas: []
};

// Listeners para reatividade
const ouvintes = [];

export function subscreverMudancas(fn) {
  ouvintes.push(fn);
  return () => {
    const idx = ouvintes.indexOf(fn);
    if (idx !== -1) ouvintes.splice(idx, 1);
  };
}

function notificarMudancas() {
  ouvintes.forEach(fn => {
    try {
      fn(estado);
    } catch (err) {
      console.error('Erro ao notificar ouvinte:', err);
    }
  });
}

/**
 * Salva o estado atual no localStorage
 */
export function salvarNoStorage() {
  try {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(estado));
    notificarMudancas();
  } catch (erro) {
    console.error('Erro ao salvar dados no localStorage:', erro);
  }
}

/**
 * Carrega os dados salvos ou inicializa com dados de exemplo pedagógicos
 */
export function inicializarStore() {
  try {
    const dadosSalvos = localStorage.getItem(CHAVE_STORAGE);
    if (dadosSalvos) {
      const parsed = JSON.parse(dadosSalvos);
      estado = {
        config: { ...estado.config, ...(parsed.config || {}) },
        turmas: parsed.turmas || [],
        planos: parsed.planos || [],
        aulas: parsed.aulas || []
      };
    } else {
      carregarDadosDemonstracao();
    }
  } catch (erro) {
    console.warn('Erro ao carregar do localStorage, usando dados de exemplo:', erro);
    carregarDadosDemonstracao();
  }
  return estado;
}

/**
 * Retorna o estado completo
 */
export function getEstado() {
  return estado;
}

// ----------------------------------------------------
// OPERAÇÕES DE CONFIGURAÇÃO
// ----------------------------------------------------

export function obterConfig() {
  return { ...estado.config };
}

export function salvarConfig(novaConfig) {
  estado.config = { ...estado.config, ...novaConfig };
  salvarNoStorage();
}

// ----------------------------------------------------
// OPERAÇÕES DE TURMAS
// ----------------------------------------------------

export function listarTurmas(apenasAtivas = false) {
  if (apenasAtivas) {
    return estado.turmas.filter(t => t.status === StatusTurma.ATIVA);
  }
  return [...estado.turmas];
}

export function obterTurma(id) {
  return estado.turmas.find(t => t.id === id) || null;
}

export function salvarTurma(dadosTurma) {
  const indice = estado.turmas.findIndex(t => t.id === dadosTurma.id);
  if (indice >= 0) {
    estado.turmas[indice] = { ...estado.turmas[indice], ...dadosTurma };
  } else {
    estado.turmas.push(criarNovaTurma(dadosTurma));
  }
  salvarNoStorage();
}

export function excluirTurma(id) {
  estado.turmas = estado.turmas.filter(t => t.id !== id);
  // Remove vínculo nas aulas dadas
  estado.aulas = estado.aulas.filter(a => a.turmaId !== id);
  salvarNoStorage();
}

// ----------------------------------------------------
// OPERAÇÕES DE PLANOS DE AULA
// ----------------------------------------------------

export function listarPlanos() {
  return [...estado.planos];
}

export function obterPlano(id) {
  return estado.planos.find(p => p.id === id) || null;
}

export function salvarPlano(dadosPlano) {
  dadosPlano.updatedAt = new Date().toISOString();
  const indice = estado.planos.findIndex(p => p.id === dadosPlano.id);
  if (indice >= 0) {
    estado.planos[indice] = { ...estado.planos[indice], ...dadosPlano };
  } else {
    estado.planos.push(criarNovoPlano(dadosPlano));
  }
  salvarNoStorage();
}

export function excluirPlano(id) {
  estado.planos = estado.planos.filter(p => p.id !== id);
  // Desvincula turmas associadas a este plano
  estado.turmas.forEach(t => {
    if (t.planoId === id) t.planoId = null;
  });
  salvarNoStorage();
}

export function atualizarStatusTopico(planoId, topicoId, novoStatus, observacoes = null) {
  const plano = obterPlano(planoId);
  if (!plano) return false;

  let atualizou = false;
  for (const modulo of plano.modulos || []) {
    const topico = (modulo.topicos || []).find(t => t.id === topicoId);
    if (topico) {
      topico.status = novoStatus;
      if (observacoes !== null) {
        topico.observacoesAjuste = observacoes;
      }
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

// ----------------------------------------------------
// OPERAÇÕES DE AULAS DADAS (DIÁRIO)
// ----------------------------------------------------

export function listarAulas(filtros = {}) {
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
  // Ordena por data decrescente (mais recente primeiro)
  return lista.sort((a, b) => (b.data || '').localeCompare(a.data || ''));
}

export function obterAula(id) {
  return estado.aulas.find(a => a.id === id) || null;
}

export function salvarAula(dadosAula, atualizarStatusTopicosAutomatico = true) {
  const indice = estado.aulas.findIndex(a => a.id === dadosAula.id);
  const aulaPronta = criarNovaAulaDada(dadosAula);

  if (indice >= 0) {
    estado.aulas[indice] = aulaPronta;
  } else {
    estado.aulas.push(aulaPronta);
  }

  // Se a aula foi dada com tópicos do plano e a flag está ativa,
  // marca os tópicos como 'concluido' no plano
  if (atualizarStatusTopicosAutomatico && aulaPronta.planoId && aulaPronta.topicosIds?.length > 0) {
    const plano = obterPlano(aulaPronta.planoId);
    if (plano) {
      aulaPronta.topicosIds.forEach(tId => {
        for (const modulo of plano.modulos || []) {
          const topico = (modulo.topicos || []).find(t => t.id === tId);
          if (topico && topico.status === StatusTopico.PENDENTE) {
            topico.status = StatusTopico.CONCLUIDO;
          }
        }
      });
      plano.updatedAt = new Date().toISOString();
    }
  }

  salvarNoStorage();
  return aulaPronta;
}

export function excluirAula(id) {
  estado.aulas = estado.aulas.filter(a => a.id !== id);
  salvarNoStorage();
}

// ----------------------------------------------------
// CÁLCULOS E MÉTRICAS PEDAGÓGICAS
// ----------------------------------------------------

/**
 * Retorna as métricas de uma turma:
 * Total de aulas dadas, horas dadas, alunos matriculados,
 * progresso do plano de aula vinculado, frequência média.
 */
export function calcularMetricasTurma(turmaId) {
  const turma = obterTurma(turmaId);
  if (!turma) return null;

  const aulasTurma = estado.aulas.filter(a => a.turmaId === turmaId);
  const totalAulasDadas = aulasTurma.reduce((acc, a) => acc + (Number(a.duracaoAulas) || 1), 0);
  const cargaPrevista = Number(turma.cargaHorariaTotal) || 80;
  const percentualCarga = Math.min(100, Math.round((totalAulasDadas / cargaPrevista) * 100));

  let totalTopicos = 0;
  let topicosConcluidos = 0;
  let topicosEmAndamento = 0;
  let plano = null;

  if (turma.planoId) {
    plano = obterPlano(turma.planoId);
    if (plano && plano.modulos) {
      plano.modulos.forEach(m => {
        (m.topicos || []).forEach(t => {
          totalTopicos++;
          if (t.status === StatusTopico.CONCLUIDO) topicosConcluidos++;
          else if (t.status === StatusTopico.EM_ANDAMENTO) topicosEmAndamento++;
        });
      });
    }
  }

  const percentualPlano = totalTopicos > 0 ? Math.round((topicosConcluidos / totalTopicos) * 100) : 0;

  // Cálculo de frequência geral
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
    percentualPlano,
    frequenciaMedia,
    totalAlunos: turma.alunos?.length || 0,
    quantidadeEncontros: aulasTurma.length
  };
}

/**
 * Retorna as métricas detalhadas de um plano de aula (Planejado vs Executado)
 */
export function calcularMetricasPlano(planoId) {
  const plano = obterPlano(planoId);
  if (!plano) return null;

  let totalTopicos = 0;
  let concluidos = 0;
  let emAndamento = 0;
  let pendentes = 0;
  let revisao = 0;
  let totalAulasEstimadas = 0;

  const modulosMetricas = (plano.modulos || []).map(m => {
    let modTotal = 0;
    let modConcluidos = 0;
    let modAulas = 0;

    (m.topicos || []).forEach(t => {
      totalTopicos++;
      modTotal++;
      const horas = Number(t.aulasEstimadas) || 1;
      totalAulasEstimadas += horas;
      modAulas += horas;

      if (t.status === StatusTopico.CONCLUIDO) {
        concluidos++;
        modConcluidos++;
      } else if (t.status === StatusTopico.EM_ANDAMENTO) {
        emAndamento++;
      } else if (t.status === StatusTopico.REVISAO) {
        revisao++;
      } else {
        pendentes++;
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

  const percentualGeral = totalTopicos > 0 ? Math.round((concluidos / totalTopicos) * 100) : 0;

  // Aulas dadas vinculadas a este plano
  const aulasVinculadas = estado.aulas.filter(a => a.planoId === planoId);
  const totalAulasDadas = aulasVinculadas.reduce((acc, a) => acc + (Number(a.duracaoAulas) || 1), 0);

  // Turmas que utilizam este plano
  const turmasVinculadas = estado.turmas.filter(t => t.planoId === planoId);

  // Ritmo pedagógico estimado
  let ritmo = 'No prazo';
  if (percentualGeral < 30 && totalAulasDadas > totalAulasEstimadas * 0.4) {
    ritmo = 'Atrasado';
  } else if (percentualGeral > 60 && totalAulasDadas < totalAulasEstimadas * 0.4) {
    ritmo = 'Adiantado';
  }

  return {
    plano,
    totalTopicos,
    concluidos,
    emAndamento,
    pendentes,
    revisao,
    totalAulasEstimadas,
    totalAulasDadas,
    percentualGeral,
    modulosMetricas,
    turmasVinculadas,
    ritmo
  };
}

// ----------------------------------------------------
// EXPORTAÇÃO, IMPORTAÇÃO E BACKUP
// ----------------------------------------------------

export function exportarBackupJson() {
  const payload = {
    versao: '1.0',
    dataExportacao: new Date().toISOString(),
    dados: estado
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `eduplan_backup_${dataHojeIso()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importarBackupJson(conteudoJson) {
  try {
    const parsed = JSON.parse(conteudoJson);
    const dados = parsed.dados || parsed;
    if (!dados.turmas || !dados.planos || !dados.aulas) {
      throw new Error('Formato de arquivo inválido. Faltam coleções essenciais.');
    }
    estado = {
      config: { ...estado.config, ...(dados.config || {}) },
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

export function restaurarDadosDemonstracao() {
  localStorage.removeItem(CHAVE_STORAGE);
  carregarDadosDemonstracao();
  salvarNoStorage();
}

export function limparTodosDados() {
  estado = {
    config: { ...estado.config },
    turmas: [],
    planos: [],
    aulas: []
  };
  salvarNoStorage();
}

// ----------------------------------------------------
// DADOS DE DEMONSTRAÇÃO REALISTAS E RICOS
// ----------------------------------------------------

function carregarDadosDemonstracao() {
  const idPlanoFisica = 'plano_fisica_2026';
  const idPlanoProgramacao = 'plano_prog_2026';

  const idTurma3A = 'turma_3a_em';
  const idTurmaDev = 'turma_dev_web';
  const idTurma2B = 'turma_2b_em';

  // Plano 1: Física & Circuitos
  const planoFisica = {
    id: idPlanoFisica,
    titulo: 'Física Aplicada e Eletromagnetismo',
    disciplina: 'Física',
    nivelEnsino: 'Ensino Médio - 3º Ano',
    anoSemestre: '2026.1',
    ementa: 'Eletrostática, Eletrodinâmica, Circuitos Elétricos, Ondulatória e Fundamentos de Física Moderna.',
    objetivoGeral: 'Desenvolver a compreensão das leis fundamentais do eletromagnetismo e suas aplicações tecnológicas contemporâneas.',
    competenciasBNCC: 'EM13CNT301, EM13CNT303, EM13CNT308 (Investigar fenômenos físicos e aplicações energéticas).',
    cargaHorariaTotalEstimada: 80,
    modulos: [
      {
        id: 'mod_fis_1',
        ordem: 1,
        titulo: 'Módulo I: Carga Elétrica e Eletrostática',
        topicos: [
          {
            id: 'top_fis_1_1',
            ordem: 1,
            titulo: 'Conceito de Carga Elétrica e Processos de Eletrização',
            objetivosEspecificos: 'Compreender conservação de carga e os métodos por atrito, contato e indução.',
            conteudoProgramatico: 'Estrutura atômica, condutores e isolantes, quantização de carga.',
            metodologiaSugerida: 'Experimento demonstrativo com eletroscópio e debate guiado.',
            recursosDidaticos: 'Eletroscópio de folhas, bastão de acrílico, lã.',
            aulasEstimadas: 2,
            status: StatusTopico.CONCLUIDO,
            observacoesAjuste: 'Excelente participação da turma na demonstração prática.'
          },
          {
            id: 'top_fis_1_2',
            ordem: 2,
            titulo: 'Lei de Coulomb e Força Eletrostática',
            objetivosEspecificos: 'Calcular forças de atração e repulsão eletrostática no vácuo.',
            conteudoProgramatico: 'Constante eletrostática k, vetor força elétrica, superposição.',
            metodologiaSugerida: 'Resolução de exercícios em duplas e aplicação de gráficos.',
            recursosDidaticos: 'Lista de exercícios e simulador PhET Interactive Simulations.',
            aulasEstimadas: 3,
            status: StatusTopico.CONCLUIDO,
            observacoesAjuste: ''
          },
          {
            id: 'top_fis_1_3',
            ordem: 3,
            titulo: 'Campo Elétrico e Potencial Elétrico',
            objetivosEspecificos: 'Mapear linhas de força e calcular diferença de potencial (d.d.p.).',
            conteudoProgramatico: 'Vetor campo elétrico, linhas de campo, superfícies equipotenciais.',
            metodologiaSugerida: 'Visualização computacional em 3D de linhas de campo elétrico.',
            recursosDidaticos: 'Projetor e simulador de campos elétricos.',
            aulasEstimadas: 3,
            status: StatusTopico.CONCLUIDO,
            observacoesAjuste: ''
          }
        ]
      },
      {
        id: 'mod_fis_2',
        ordem: 2,
        titulo: 'Módulo II: Eletrodinâmica e Circuitos',
        topicos: [
          {
            id: 'top_fis_2_1',
            ordem: 1,
            titulo: 'Corrente Elétrica e Resistência: 1ª e 2ª Leis de Ohm',
            objetivosEspecificos: 'Diferenciar condutores ôhmicos e não-ôhmicos; calcular resistividade.',
            conteudoProgramatico: 'Intensidade de corrente, d.d.p, resistência, efeito Joule.',
            metodologiaSugerida: 'Aula expositiva e laboratório prático com multímetro e resistores.',
            recursosDidaticos: 'Multímetros digitais, protoboards e resistores de filme de carbono.',
            aulasEstimadas: 4,
            status: StatusTopico.EM_ANDAMENTO,
            observacoesAjuste: 'Reforçar conversão de unidades (miliamperes e microamperes).'
          },
          {
            id: 'top_fis_2_2',
            ordem: 2,
            titulo: 'Associação de Resistores (Série, Paralelo e Mista)',
            objetivosEspecificos: 'Determinar a resistência equivalente e distribuição de tensão e corrente.',
            conteudoProgramatico: 'Equivalência de resistores, nós e ramos de circuito.',
            metodologiaSugerida: 'Resolução colaborativa de problemas e montagem no simulador Tinkercad.',
            recursosDidaticos: 'Notebooks dos alunos, simulador Tinkercad Circuits.',
            aulasEstimadas: 4,
            status: StatusTopico.PENDENTE,
            observacoesAjuste: ''
          },
          {
            id: 'top_fis_2_3',
            ordem: 3,
            titulo: 'Potência Elétrica, Consumo de Energia e Dimensionamento Residencial',
            objetivosEspecificos: 'Calcular consumo em kWh e analisar contas de energia residencial.',
            conteudoProgramatico: 'P = V*I, disjuntores, fusíveis, segurança em instalações prediais.',
            metodologiaSugerida: 'Estudo de caso com análise de faturas reais de energia elétrica.',
            recursosDidaticos: 'Contas de energia reais trazidas pelos alunos.',
            aulasEstimadas: 3,
            status: StatusTopico.PENDENTE,
            observacoesAjuste: ''
          }
        ]
      },
      {
        id: 'mod_fis_3',
        ordem: 3,
        titulo: 'Módulo III: Eletromagnetismo e Indução',
        topicos: [
          {
            id: 'top_fis_3_1',
            ordem: 1,
            titulo: 'Campo Magnético e Fontes de Magnetismo',
            objetivosEspecificos: 'Compreender ímãs permanentes e campo gerado por condutores retilíneos.',
            conteudoProgramatico: 'Regra da mão direita, vetor indução magnética, linhas de indução.',
            metodologiaSugerida: 'Experiência histórica de Oersted com bússola e fio condutor.',
            recursosDidaticos: 'Bússolas, pilha grande e condutores de cobre.',
            aulasEstimadas: 3,
            status: StatusTopico.PENDENTE,
            observacoesAjuste: ''
          },
          {
            id: 'top_fis_3_2',
            ordem: 2,
            titulo: 'Lei de Faraday-Lenz e Geradores Elétricos',
            objetivosEspecificos: 'Explicar o princípio de funcionamento das usinas hidrelétricas e eólicas.',
            conteudoProgramatico: 'Fluxo magnético, força eletromotriz induzida, correntes de Foucault.',
            metodologiaSugerida: 'Vídeo documentário com debate e modelo didático de gerador manual.',
            recursosDidaticos: 'Gerador manual didático e projetor.',
            aulasEstimadas: 3,
            status: StatusTopico.PENDENTE,
            observacoesAjuste: ''
          }
        ]
      }
    ]
  };

  // Plano 2: Programação Web
  const planoProg = {
    id: idPlanoProgramacao,
    titulo: 'Desenvolvimento Web Front-End Moderno',
    disciplina: 'Programação Web',
    nivelEnsino: 'Curso Técnico em Informática',
    anoSemestre: '2026.1',
    ementa: 'Estruturação semântica com HTML5, estilização moderna com CSS Flexbox/Grid e lógica com JavaScript ES6+.',
    objetivoGeral: 'Capacitar o estudante a construir aplicações web completas, responsivas e acessíveis.',
    competenciasBNCC: 'Desenvolvimento de sistemas computacionais, acessibilidade web e boas práticas de engenharia de software.',
    cargaHorariaTotalEstimada: 80,
    modulos: [
      {
        id: 'mod_prog_1',
        ordem: 1,
        titulo: 'Módulo 1: Fundamentos de Web e HTML5 Semântico',
        topicos: [
          {
            id: 'top_prog_1_1',
            ordem: 1,
            titulo: 'Arquitetura Web Cliente-Servidor e Protocolo HTTP',
            objetivosEspecificos: 'Compreender ciclo de requisição/resposta, DNS e navegadores.',
            conteudoProgramatico: 'HTTP/HTTPS, métodos GET/POST, status codes.',
            metodologiaSugerida: 'Aula dialogada com inspeção de rede via Chrome DevTools.',
            recursosDidaticos: 'Navegador Chrome e DevTools.',
            aulasEstimadas: 2,
            status: StatusTopico.CONCLUIDO,
            observacoesAjuste: ''
          },
          {
            id: 'top_prog_1_2',
            ordem: 2,
            titulo: 'HTML5 Semântico, Estruturação e Acessibilidade (a11y)',
            objetivosEspecificos: 'Construir páginas estruturadas com header, main, nav, section e aria-labels.',
            conteudoProgramatico: 'Tags semânticas, formulários acessíveis, atributos alt e title.',
            metodologiaSugerida: 'Live coding com prática individual guiada no VS Code.',
            recursosDidaticos: 'Computadores do laboratório com VS Code.',
            aulasEstimadas: 4,
            status: StatusTopico.CONCLUIDO,
            observacoesAjuste: ''
          }
        ]
      },
      {
        id: 'mod_prog_2',
        ordem: 2,
        titulo: 'Módulo 2: Estilização Avançada com CSS Grid e Flexbox',
        topicos: [
          {
            id: 'top_prog_2_1',
            ordem: 1,
            titulo: 'Layouts Responsivos com Flexbox',
            objetivosEspecificos: 'Dominar eixos main/cross, justify-content e align-items.',
            conteudoProgramatico: 'Flex container, flex items, flex-direction, gap, flex-wrap.',
            metodologiaSugerida: 'Prática interativa com o jogo Flexbox Froggy e projeto prático.',
            recursosDidaticos: 'Laboratório de informática.',
            aulasEstimadas: 4,
            status: StatusTopico.EM_ANDAMENTO,
            observacoesAjuste: ''
          },
          {
            id: 'top_prog_2_2',
            ordem: 2,
            titulo: 'CSS Grid Layout e Media Queries para Mobile-First',
            objetivosEspecificos: 'Criar grids bi-dimensionais complexos que se adaptam a celulares.',
            conteudoProgramatico: 'grid-template-columns, fr, repeat, minmax, @media.',
            metodologiaSugerida: 'Desenvolvimento do layout de um dashboard responsivo.',
            recursosDidaticos: 'VS Code, Figma.',
            aulasEstimadas: 4,
            status: StatusTopico.PENDENTE,
            observacoesAjuste: ''
          }
        ]
      }
    ]
  };

  // Turma 1: 3º Ano A
  const turma3A = {
    id: idTurma3A,
    nome: '3º Ano A - Ensino Médio',
    disciplina: 'Física',
    anoLetivo: '2026',
    periodo: 'Matutino',
    sala: 'Sala 302 - Bloco B',
    diasSemana: ['Segunda-feira', 'Quarta-feira'],
    cargaHorariaTotal: 80,
    cor: '#2563eb',
    status: StatusTurma.ATIVA,
    planoId: idPlanoFisica,
    alunos: [
      { id: 'al_1', nome: 'Ana Beatriz Souza', matricula: '2026-3A01', numero: 1 },
      { id: 'al_2', nome: 'Arthur Lima Ramos', matricula: '2026-3A02', numero: 2 },
      { id: 'al_3', nome: 'Bruno Henrique Silva', matricula: '2026-3A03', numero: 3 },
      { id: 'al_4', nome: 'Camila de Oliveira', matricula: '2026-3A04', numero: 4 },
      { id: 'al_5', nome: 'Daniel Mendes Costa', matricula: '2026-3A05', numero: 5 },
      { id: 'al_6', nome: 'Eduardo Martins Dias', matricula: '2026-3A06', numero: 6 },
      { id: 'al_7', nome: 'Fernanda Rocha Ribeiro', matricula: '2026-3A07', numero: 7 },
      { id: 'al_8', nome: 'Gabriel Barbosa Gomes', matricula: '2026-3A08', numero: 8 },
      { id: 'al_9', nome: 'Helena Castro Pires', matricula: '2026-3A09', numero: 9 },
      { id: 'al_10', nome: 'Igor Ferreira Santos', matricula: '2026-3A10', numero: 10 },
      { id: 'al_11', nome: 'Isabela Fontes Neves', matricula: '2026-3A11', numero: 11 },
      { id: 'al_12', nome: 'João Pedro Carvalho', matricula: '2026-3A12', numero: 12 },
      { id: 'al_13', nome: 'Larissa Azevedo Maia', matricula: '2026-3A13', numero: 13 },
      { id: 'al_14', nome: 'Lucas Vieira Prado', matricula: '2026-3A14', numero: 14 },
      { id: 'al_15', nome: 'Mariana Duarte Torres', matricula: '2026-3A15', numero: 15 }
    ]
  };

  // Turma 2: Técnico Desenvolvimento Web
  const turmaDev = {
    id: idTurmaDev,
    nome: 'Módulo II - Técnico em Informática',
    disciplina: 'Programação Web',
    anoLetivo: '2026',
    periodo: 'Vespertino',
    sala: 'Laboratório 04 - Informática',
    diasSemana: ['Terça-feira', 'Quinta-feira'],
    cargaHorariaTotal: 80,
    cor: '#0d9488',
    status: StatusTurma.ATIVA,
    planoId: idPlanoProgramacao,
    alunos: [
      { id: 'dev_1', nome: 'Carlos Vinicius Prado', matricula: 'TI-2026-01', numero: 1 },
      { id: 'dev_2', nome: 'Débora Moreira Freitas', matricula: 'TI-2026-02', numero: 2 },
      { id: 'dev_3', nome: 'Felipe Alcantara Cunha', matricula: 'TI-2026-03', numero: 3 },
      { id: 'dev_4', nome: 'Juliana Penteado Lopes', matricula: 'TI-2026-04', numero: 4 },
      { id: 'dev_5', nome: 'Matheus Nogueira Siqueira', matricula: 'TI-2026-05', numero: 5 }
    ]
  };

  // Turma 3: 2º Ano B
  const turma2B = {
    id: idTurma2B,
    nome: '2º Ano B - Ensino Médio',
    disciplina: 'Física Térmica e Óptica',
    anoLetivo: '2026',
    periodo: 'Matutino',
    sala: 'Sala 204 - Bloco A',
    diasSemana: ['Quarta-feira', 'Sexta-feira'],
    cargaHorariaTotal: 60,
    cor: '#7c3aed',
    status: StatusTurma.ATIVA,
    planoId: null,
    alunos: [
      { id: 'al2_1', nome: 'Beatriz Almeida Costa', matricula: '2026-2B01', numero: 1 },
      { id: 'al2_2', nome: 'Caio Junqueira Lima', matricula: '2026-2B02', numero: 2 },
      { id: 'al2_3', nome: 'Diego Fernandes Pinto', matricula: '2026-2B03', numero: 3 }
    ]
  };

  // Aulas Dadas Simuladas para a Turma 3A
  const aulas = [
    {
      id: 'aula_1',
      turmaId: idTurma3A,
      planoId: idPlanoFisica,
      data: '2026-08-03',
      duracaoAulas: 2,
      topicosIds: ['top_fis_1_1'],
      conteudoMinistrado: 'Apresentação do plano de ensino, critérios avaliativos e introdução à carga elétrica e eletrização por atrito e contato.',
      metodologiaUtilizada: 'Aula expositiva dialogada com demonstração prática usando canudos e papel.',
      recursosUtilizados: 'Quadro branco, canudos plásticos, papel toalha.',
      observacoesTurma: 'Turma receptiva e atenta. Todos os alunos participaram do experimento.',
      tarefasCasa: 'Leitura do capítulo 1 do livro didático (páginas 12 a 18).',
      avaliacaoRealizada: '',
      frequencia: {
        registrada: true,
        totalAlunos: 15,
        presencas: ['al_1', 'al_2', 'al_3', 'al_4', 'al_5', 'al_6', 'al_7', 'al_8', 'al_9', 'al_10', 'al_11', 'al_12', 'al_13', 'al_14', 'al_15'],
        ausencias: []
      }
    },
    {
      id: 'aula_2',
      turmaId: idTurma3A,
      planoId: idPlanoFisica,
      data: '2026-08-05',
      duracaoAulas: 2,
      topicosIds: ['top_fis_1_1', 'top_fis_1_2'],
      conteudoMinistrado: 'Indução eletrostática, funcionamento do eletroscópio e formulação matemática da Lei de Coulomb.',
      metodologiaUtilizada: 'Resolução passo a passo de exercícios com exemplos cotidianos de atração/repulsão.',
      recursosUtilizados: 'Quadro branco e eletroscópio de folhas.',
      observacoesTurma: 'Alguns alunos sentiram dificuldade inicial na notação científica das potências de 10.',
      tarefasCasa: 'Exercícios 1 a 6 da lista complementar.',
      avaliacaoRealizada: '',
      frequencia: {
        registrada: true,
        totalAlunos: 15,
        presencas: ['al_1', 'al_2', 'al_3', 'al_4', 'al_5', 'al_6', 'al_7', 'al_8', 'al_9', 'al_10', 'al_12', 'al_13', 'al_14', 'al_15'],
        ausencias: ['al_11']
      }
    },
    {
      id: 'aula_3',
      turmaId: idTurma3A,
      planoId: idPlanoFisica,
      data: '2026-08-10',
      duracaoAulas: 2,
      topicosIds: ['top_fis_1_2'],
      conteudoMinistrado: 'Superposição de forças elétricas em sistemas de múltiplas cargas no plano cartesiano.',
      metodologiaUtilizada: 'Trabalho em duplas para resolução de problemas com acompanhamento individual.',
      recursosUtilizados: 'Lista de problemas e simulador de cargas.',
      observacoesTurma: 'Bom rendimento após a revisão da regra do paralelogramo para vetores.',
      tarefasCasa: 'Finalizar exercícios do módulo 1.',
      avaliacaoRealizada: 'Visto nas listas de exercícios.',
      frequencia: {
        registrada: true,
        totalAlunos: 15,
        presencas: ['al_1', 'al_2', 'al_3', 'al_4', 'al_5', 'al_6', 'al_7', 'al_8', 'al_9', 'al_10', 'al_11', 'al_12', 'al_13', 'al_14', 'al_15'],
        ausencias: []
      }
    },
    {
      id: 'aula_4',
      turmaId: idTurma3A,
      planoId: idPlanoFisica,
      data: '2026-08-12',
      duracaoAulas: 2,
      topicosIds: ['top_fis_1_3'],
      conteudoMinistrado: 'Conceituação de Campo Elétrico, cálculo vetorial e representação por linhas de força.',
      metodologiaUtilizada: 'Simulação interativa PhET com projeção em tela cheia.',
      recursosUtilizados: 'Data show, computador com simulador PhET.',
      observacoesTurma: 'A visualização dinâmica facilitou o entendimento de cargas pontuais e dipolos.',
      tarefasCasa: 'Resumo esquemático das linhas de força no caderno.',
      avaliacaoRealizada: '',
      frequencia: {
        registrada: true,
        totalAlunos: 15,
        presencas: ['al_1', 'al_2', 'al_3', 'al_4', 'al_5', 'al_7', 'al_8', 'al_9', 'al_10', 'al_11', 'al_12', 'al_13', 'al_14', 'al_15'],
        ausencias: ['al_6']
      }
    },
    {
      id: 'aula_5',
      turmaId: idTurma3A,
      planoId: idPlanoFisica,
      data: '2026-08-17',
      duracaoAulas: 2,
      topicosIds: ['top_fis_2_1'],
      conteudoMinistrado: 'Início da eletrodinâmica: corrente elétrica contínua, sentido real vs convencional e 1ª Lei de Ohm.',
      metodologiaUtilizada: 'Aula expositiva e laboratório prático com medições de tensão e corrente com multímetro.',
      recursosUtilizados: 'Multímetros, resistores, protoboard e fontes DC 9V.',
      observacoesTurma: 'Alunos muito motivados com o manuseio dos multímetros.',
      tarefasCasa: 'Relatório simplificado das medições de laboratório.',
      avaliacaoRealizada: 'Avaliação formativa da prática de laboratório.',
      frequencia: {
        registrada: true,
        totalAlunos: 15,
        presencas: ['al_1', 'al_2', 'al_3', 'al_4', 'al_5', 'al_6', 'al_7', 'al_8', 'al_9', 'al_10', 'al_11', 'al_12', 'al_13', 'al_14', 'al_15'],
        ausencias: []
      }
    }
  ];

  // Aula para Turma Dev
  const aulaDev1 = {
    id: 'aula_dev_1',
    turmaId: idTurmaDev,
    planoId: idPlanoProgramacao,
    data: '2026-08-04',
    duracaoAulas: 2,
    topicosIds: ['top_prog_1_1', 'top_prog_1_2'],
    conteudoMinistrado: 'Configuração do ambiente de desenvolvimento, histórico da web, semântica no HTML5 e boas práticas de acessibilidade.',
    metodologiaUtilizada: 'Live coding no VS Code com replicação simultânea pelos alunos nos terminais.',
    recursosUtilizados: 'VS Code, Live Server, projetor e computadores dos estudantes.',
    observacoesTurma: 'Todos concluíram a primeira página web funcional com cabeçalho e menu de navegação semântico.',
    tarefasCasa: 'Criar uma página sobre um tema de escolha pessoal utilizando ao menos 6 tags semânticas diferentes.',
    avaliacaoRealizada: 'Avaliação prática do código estruturado.',
    frequencia: {
      registrada: true,
      totalAlunos: 5,
      presencas: ['dev_1', 'dev_2', 'dev_3', 'dev_4', 'dev_5'],
      ausencias: []
    }
  };

  estado = {
    config: {
      nomeProfessor: 'Prof. Carlos Eduardo',
      escola: 'Colégio Integrado de Educação',
      anoLetivoPadrao: '2026',
      tema: 'light'
    },
    turmas: [turma3A, turmaDev, turma2B],
    planos: [planoFisica, planoProg],
    aulas: [...aulas, aulaDev1]
  };

  salvarNoStorage();
}
