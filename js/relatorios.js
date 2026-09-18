/**
 * EduPlan - Módulo de Relatórios e Impressão
 * Geração de Diário de Classe Oficial e Relatório de Cumprimento do Plano para a Coordenação Pedagógica.
 */

import {
  listarTurmas,
  listarPlanos,
  listarAulas,
  obterTurma,
  obterPlano,
  obterConfig,
  calcularMetricasTurma,
  calcularMetricasPlano
} from './store.js';
import { formatarData } from './models.js';

let tipoRelatorioAtual = 'diario'; // 'diario' ou 'cumprimento'
let turmaRelatorioId = '';
let planoRelatorioId = '';

export function renderizarRelatorios(container) {
  const turmas = listarTurmas(false);
  const planos = listarPlanos();

  if (!turmaRelatorioId && turmas.length > 0) {
    turmaRelatorioId = turmas[0].id;
  }
  if (!planoRelatorioId && planos.length > 0) {
    planoRelatorioId = planos[0].id;
  }

  container.innerHTML = `
    <div class="module-wrapper">
      <!-- Barra de Controle do Relatório (Oculta na Impressão) -->
      <div class="relatorios-control-bar no-print">
        <div class="rcb-left">
          <h2>Relatórios & Documentos Pedagógicos</h2>
          <p class="subtitle">Gere relatórios formatados para entrega à coordenação ou arquivamento escolar</p>
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

      <!-- Seletor de Tipo e Filtro de Documento -->
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
        </div>

        ${tipoRelatorioAtual === 'diario' ? `
          <div class="form-inline-group">
            <label>Selecione a Turma:</label>
            <select id="selectRelatorioTurma" onchange="window.EduPlanApp.trocarTurmaRelatorio(this.value)">
              ${turmas.map(t => `
                <option value="${t.id}" ${t.id === turmaRelatorioId ? 'selected' : ''}>
                  ${t.nome} (${t.disciplina})
                </option>
              `).join('')}
            </select>
          </div>
        ` : `
          <div class="form-inline-group">
            <label>Selecione o Plano:</label>
            <select id="selectRelatorioPlano" onchange="window.EduPlanApp.trocarPlanoRelatorio(this.value)">
              ${planos.map(p => `
                <option value="${p.id}" ${p.id === planoRelatorioId ? 'selected' : ''}>
                  ${p.titulo} (${p.disciplina})
                </option>
              `).join('')}
            </select>
          </div>
        `}
      </div>

      <!-- Documento Pronto para Visualização e Impressão A4 -->
      <div class="printable-document-container">
        ${tipoRelatorioAtual === 'diario' ? renderizarDocumentoDiario(turmaRelatorioId) : renderizarDocumentoCumprimento(planoRelatorioId)}
      </div>
    </div>
  `;
}

export function setTipoRelatorio(tipo) {
  tipoRelatorioAtual = tipo;
}

export function setTurmaRelatorioId(id) {
  turmaRelatorioId = id;
}

export function setPlanoRelatorioId(id) {
  planoRelatorioId = id;
}

/**
 * Renderiza o Diário de Classe Formatado
 */
function renderizarDocumentoDiario(turmaId) {
  const turma = obterTurma(turmaId);
  const config = obterConfig();
  if (!turma) {
    return `<div class="empty-state-card"><p>Nenhuma turma selecionada para o Diário de Classe.</p></div>`;
  }

  const metricas = calcularMetricasTurma(turmaId);
  const aulas = listarAulas({ turmaId });
  // Ordenar cronologicamente crescente para o diário oficial
  const aulasCronologicas = [...aulas].sort((a, b) => (a.data || '').localeCompare(b.data || ''));

  return `
    <article class="doc-a4-sheet">
      <!-- Cabeçalho Oficial -->
      <header class="doc-header">
        <div class="doc-institution">
          <h2>${config.escola}</h2>
          <h3>DIÁRIO DE CLASSE & REGISTRO DE CONTEÚDOS</h3>
          <p class="doc-sub">Ano Letivo: <strong>${turma.anoLetivo || config.anoLetivoPadrao}</strong> • Semestre: <strong>${turma.periodo}</strong></p>
        </div>
      </header>

      <!-- Dados da Turma -->
      <section class="doc-meta-table-wrap">
        <table class="doc-meta-table">
          <tr>
            <td><strong>Docente:</strong> ${config.nomeProfessor}</td>
            <td><strong>Turma:</strong> ${turma.nome}</td>
            <td><strong>Turno:</strong> ${turma.periodo}</td>
          </tr>
          <tr>
            <td><strong>Disciplina:</strong> ${turma.disciplina}</td>
            <td><strong>Carga Prevista:</strong> ${turma.cargaHorariaTotal} aulas</td>
            <td><strong>Carga Ministrada:</strong> ${metricas.totalAulasDadas} aulas (${metricas.percentualCarga}%)</td>
          </tr>
          <tr>
            <td><strong>Local / Sala:</strong> ${turma.sala || 'Sala regular'}</td>
            <td><strong>Total de Estudantes:</strong> ${metricas.totalAlunos} matriculados</td>
            <td><strong>Frequência Média:</strong> ${metricas.frequenciaMedia}%</td>
          </tr>
        </table>
      </section>

      <!-- Tabela de Aulas Ministradas -->
      <section class="doc-body-section">
        <h4 class="doc-section-title">REGISTRO CRONOLÓGICO DE AULAS</h4>
        <table class="doc-data-table">
          <thead>
            <tr>
              <th style="width: 35px">Nº</th>
              <th style="width: 85px">Data</th>
              <th style="width: 50px">Aulas</th>
              <th>Conteúdo Programático Efetivamente Desenvolvido</th>
              <th style="width: 140px">Metodologia / Recursos</th>
              <th style="width: 90px">Presença</th>
            </tr>
          </thead>
          <tbody>
            ${aulasCronologicas.length === 0 ? `
              <tr>
                <td colspan="6" class="text-center">Nenhuma aula registrada até o presente momento.</td>
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
                    <small>${aula.metodologiaUtilizada || aula.recursosUtilizados || 'Aula expositiva'}</small>
                  </td>
                  <td class="text-center font-bold">${infoPresenca}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </section>

      <!-- Assinaturas Formais -->
      <footer class="doc-signatures">
        <div class="signature-line">
          <div class="sig-line"></div>
          <span>${config.nomeProfessor}</span>
          <small>Professor(a) Responsável</small>
        </div>
        <div class="signature-line">
          <div class="sig-line"></div>
          <span>Coordenação Pedagógica</span>
          <small>Visto e Homologação</small>
        </div>
      </footer>
    </article>
  `;
}

/**
 * Renderiza o Relatório de Cumprimento do Plano de Ensino
 */
function renderizarDocumentoCumprimento(planoId) {
  const plano = obterPlano(planoId);
  const config = obterConfig();
  if (!plano) {
    return `<div class="empty-state-card"><p>Nenhum plano selecionado para o relatório.</p></div>`;
  }

  const metricas = calcularMetricasPlano(planoId);
  const todasAulas = listarAulas();

  return `
    <article class="doc-a4-sheet">
      <header class="doc-header">
        <div class="doc-institution">
          <h2>${config.escola}</h2>
          <h3>RELATÓRIO DE CUMPRIMENTO DO PLANO DE ENSINO</h3>
          <p class="doc-sub">Acompanhamento da Matriz Curricular • Ano/Semestre: <strong>${plano.anoSemestre || config.anoLetivoPadrao}</strong></p>
        </div>
      </header>

      <section class="doc-meta-table-wrap">
        <table class="doc-meta-table">
          <tr>
            <td><strong>Componente Curricular:</strong> ${plano.disciplina}</td>
            <td><strong>Plano:</strong> ${plano.titulo}</td>
            <td><strong>Nível:</strong> ${plano.nivelEnsino}</td>
          </tr>
          <tr>
            <td><strong>Professor Responsável:</strong> ${config.nomeProfessor}</td>
            <td><strong>Total de Tópicos:</strong> ${metricas.totalTopicos} planejados</td>
            <td><strong>Índice de Conclusão:</strong> <strong class="text-emerald">${metricas.percentualGeral}%</strong></td>
          </tr>
          <tr>
            <td colspan="2"><strong>Competências BNCC:</strong> ${plano.competenciasBNCC || 'Diretrizes curriculares regulares'}</td>
            <td><strong>Ritmo Pedagógico:</strong> ${metricas.ritmo}</td>
          </tr>
        </table>
      </section>

      <!-- Matriz de Tópicos e Status -->
      <section class="doc-body-section">
        <h4 class="doc-section-title">MATRIZ PEDAGÓGICA E ESTÁGIO DE EXECUÇÃO</h4>
        ${(plano.modulos || []).map(modulo => `
          <div class="doc-modulo-block">
            <h5 class="doc-modulo-title">${modulo.titulo}</h5>
            <table class="doc-data-table mb-md">
              <thead>
                <tr>
                  <th style="width: 35px">#</th>
                  <th>Conteúdo / Tópico Curricular</th>
                  <th style="width: 65px" class="text-center">Carga</th>
                  <th style="width: 120px" class="text-center">Status</th>
                  <th>Histórico de Execução / Ajustes Pedagógicos</th>
                </tr>
              </thead>
              <tbody>
                ${(modulo.topicos || []).map((t, idx) => {
                  const aulasT = todasAulas.filter(a => (a.topicosIds || []).includes(t.id));
                  let statusLabel = 'Pendente';
                  if (t.status === 'concluido') statusLabel = '✅ Concluído';
                  else if (t.status === 'em_andamento') statusLabel = '🔄 Em Andamento';
                  else if (t.status === 'revisao') statusLabel = '⚠️ Revisão / Reforço';

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
                          <small>Ministrado em: ${aulasT.map(a => formatarData(a.data)).join(', ')}</small>
                        ` : '<small class="text-muted">Ainda não ministrado</small>'}
                        ${t.observacoesAjuste ? `
                          <div class="doc-ajuste-box"><strong>Adaptação:</strong> ${t.observacoesAjuste}</div>
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

      <!-- Parecer Pedagógico Final -->
      <section class="doc-parecer-section">
        <h4 class="doc-section-title">PARECER DO PROFESSOR E CONSIDERAÇÕES</h4>
        <div class="doc-parecer-box">
          <p>
            O plano pedagógico atinge o percentual de <strong>${metricas.percentualGeral}%</strong> de cumprimento da matriz planejada. 
            Foram ministradas <strong>${metricas.totalAulasDadas}</strong> aulas em conformidade com as orientações curriculares, garantindo o desenvolvimento das competências e habilidades programadas.
          </p>
        </div>
      </section>

      <footer class="doc-signatures">
        <div class="signature-line">
          <div class="sig-line"></div>
          <span>${config.nomeProfessor}</span>
          <small>Docente Titular</small>
        </div>
        <div class="signature-line">
          <div class="sig-line"></div>
          <span>Supervisão / Coordenação Pedagógica</span>
          <small>Recebido e Aprovado em ____/____/2026</small>
        </div>
      </footer>
    </article>
  `;
}

/**
 * Exportação de Aulas para CSV compatível com Excel
 */
export function exportarAulasParaCsv() {
  const aulas = listarAulas();
  const turmas = listarTurmas(false);

  let csvContent = '\uFEFF'; // BOM para o Excel abrir caracteres UTF-8 corretamente
  csvContent += 'ID da Aula;Data;Turma;Disciplina;Duração (Aulas);Conteúdo Ministrado;Metodologia;Recursos;Tarefas de Casa;Avaliação;Presenças;Total de Alunos\n';

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
  a.download = `eduplan_diario_aulas_${new Date().toISOString().substring(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
