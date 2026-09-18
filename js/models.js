/**
 * EduPlan - Modelos de Dados e Utilitários
 * Define as estruturas de dados para Turmas, Planos de Aula, Aulas Dadas e Frequência.
 */

export const StatusTopico = {
  PENDENTE: 'pendente',
  EM_ANDAMENTO: 'em_andamento',
  CONCLUIDO: 'concluido',
  REVISAO: 'revisao'
};

export const StatusTurma = {
  ATIVA: 'ativa',
  CONCLUIDA: 'concluida',
  ARQUIVADA: 'arquivada'
};

/**
 * Gera um ID único simples e confiável
 */
export function gerarId(prefixo = 'id') {
  return `${prefixo}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Formata data no formato brasileiro dd/mm/aaaa
 */
export function formatarData(dataIso) {
  if (!dataIso) return '-';
  const partes = String(dataIso).split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  const data = new Date(dataIso);
  return isNaN(data.getTime()) ? dataIso : data.toLocaleDateString('pt-BR');
}

/**
 * Retorna a data de hoje no formato YYYY-MM-DD
 */
export function dataHojeIso() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/**
 * Estrutura de uma nova Turma
 */
export function criarNovaTurma(dados = {}) {
  return {
    id: dados.id || gerarId('turma'),
    nome: dados.nome || '',
    disciplina: dados.disciplina || '',
    anoLetivo: dados.anoLetivo || new Date().getFullYear().toString(),
    periodo: dados.periodo || 'Matutino', // Matutino, Vespertino, Noturno, Integral
    sala: dados.sala || '',
    diasSemana: dados.diasSemana || ['Segunda-feira'],
    cargaHorariaTotal: Number(dados.cargaHorariaTotal) || 80, // horas ou aulas
    cor: dados.cor || '#2563eb', // cor tema
    status: dados.status || StatusTurma.ATIVA,
    planoId: dados.planoId || null,
    alunos: dados.alunos || [], // [{ id, nome, matricula, numero }]
    createdAt: dados.createdAt || new Date().toISOString()
  };
}

/**
 * Estrutura de um novo Tópico de Plano de Aula
 */
export function criarNovoTopico(dados = {}) {
  return {
    id: dados.id || gerarId('topico'),
    ordem: Number(dados.ordem) || 1,
    titulo: dados.titulo || '',
    objetivosEspecificos: dados.objetivosEspecificos || '',
    conteudoProgramatico: dados.conteudoProgramatico || '',
    metodologiaSugerida: dados.metodologiaSugerida || 'Aula expositiva dialogada e exercícios práticos',
    recursosDidaticos: dados.recursosDidaticos || 'Quadro, projetor, material didático',
    aulasEstimadas: Number(dados.aulasEstimadas) || 2,
    status: dados.status || StatusTopico.PENDENTE,
    observacoesAjuste: dados.observacoesAjuste || ''
  };
}

/**
 * Estrutura de um Módulo/Unidade de Plano de Aula
 */
export function criarNovoModulo(dados = {}) {
  return {
    id: dados.id || gerarId('modulo'),
    ordem: Number(dados.ordem) || 1,
    titulo: dados.titulo || 'Módulo 1',
    topicos: (dados.topicos || []).map(t => criarNovoTopico(t))
  };
}

/**
 * Estrutura de um novo Plano de Aula
 */
export function criarNovoPlano(dados = {}) {
  return {
    id: dados.id || gerarId('plano'),
    titulo: dados.titulo || '',
    disciplina: dados.disciplina || '',
    nivelEnsino: dados.nivelEnsino || 'Ensino Médio',
    anoSemestre: dados.anoSemestre || `${new Date().getFullYear()}.1`,
    ementa: dados.ementa || '',
    objetivoGeral: dados.objetivoGeral || '',
    competenciasBNCC: dados.competenciasBNCC || '',
    cargaHorariaTotalEstimada: Number(dados.cargaHorariaTotalEstimada) || 80,
    modulos: (dados.modulos || []).map(m => criarNovoModulo(m)),
    createdAt: dados.createdAt || new Date().toISOString(),
    updatedAt: dados.updatedAt || new Date().toISOString()
  };
}

/**
 * Estrutura de uma Aula Dada (Registro do Diário)
 */
export function criarNovaAulaDada(dados = {}) {
  return {
    id: dados.id || gerarId('aula'),
    turmaId: dados.turmaId || '',
    planoId: dados.planoId || null,
    data: dados.data || dataHojeIso(),
    duracaoAulas: Number(dados.duracaoAulas) || 2, // quantidade de aulas (ex: 2 tempos de 50min)
    topicosIds: dados.topicosIds || [], // tópicos do plano que foram abordados
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
