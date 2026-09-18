/**
 * EduPlan - Módulo de Acompanhamento do Plano de Aula (Planejado vs. Executado)
 * Gestão rigorosa da matriz curricular, status por tópico, ritmo pedagógico e desvios.
 */

import {
  listarPlanos,
  listarTurmas,
  listarAulas,
  obterPlano,
  obterTurma,
  atualizarStatusTopico,
  calcularMetricasPlano
} from './store.js';
import { formatarData, StatusTopico } from './models.js';

let planoSelecionadoId = '';
let filtroStatusTopico = 'todos';

export function renderizarAcompanhamento(container) {
  const planos = listarPlanos();
  const turmas = listarTurmas(false);

  // Se nenhum plano selecionado, pega o primeiro
  if (!planoSelecionadoId && planos.length > 0) {
    planoSelecionadoId = planos[0].id;
  }

  const planoAtual = obterPlano(planoSelecionadoId);
  const metricas = planoAtual ? calcularMetricasPlano(planoAtual.id) : null;
  const todasAulas = listarAulas();

  container.innerHTML = `
    <div class="module-wrapper">
      <!-- Cabeçalho do Acompanhamento -->
      <div class="module-header-row">
        <div>
          <h2>Gestão do Plano de Aula: Planejado vs. Executado</h2>
          <p class="subtitle">Monitore o ritmo pedagógico, cobertura da matriz curricular e cumprimento dos tópicos</p>
        </div>
        <div class="header-action-group">
          ${planoAtual ? `
            <button class="btn btn-secondary" onclick="window.EduPlanApp.imprimirRelatorioPlano('${planoAtual.id}')">
              <span class="btn-icon">📄</span> Relatório para Coordenação
            </button>
          ` : ''}
          <button class="btn btn-primary" onclick="window.EduPlanApp.abrirModalRegistrarAula()">
            <span class="btn-icon">✍️</span> Registrar Aula Ministrada
          </button>
        </div>
      </div>

      <!-- Barra de Seleção de Plano -->
      <div class="filter-bar">
        <div class="form-inline-group">
          <label><strong>Plano Pedagógico:</strong></label>
          <select id="selectAcompanhamentoPlano" onchange="window.EduPlanApp.trocarPlanoAcompanhamento(this.value)">
            ${planos.map(p => `
              <option value="${p.id}" ${planoSelecionadoId === p.id ? 'selected' : ''}>
                ${p.titulo} (${p.disciplina} • ${p.nivelEnsino})
              </option>
            `).join('')}
          </select>
        </div>

        <div class="filter-pills">
          <button class="pill ${filtroStatusTopico === 'todos' ? 'active' : ''}" onclick="window.EduPlanApp.filtrarStatusAcompanhamento('todos')">
            Todos os Tópicos
          </button>
          <button class="pill ${filtroStatusTopico === 'concluido' ? 'active' : ''}" onclick="window.EduPlanApp.filtrarStatusAcompanhamento('concluido')">
            Concluídos (${metricas?.concluidos || 0})
          </button>
          <button class="pill ${filtroStatusTopico === 'em_andamento' ? 'active' : ''}" onclick="window.EduPlanApp.filtrarStatusAcompanhamento('em_andamento')">
            Em Andamento (${metricas?.emAndamento || 0})
          </button>
          <button class="pill ${filtroStatusTopico === 'pendente' ? 'active' : ''}" onclick="window.EduPlanApp.filtrarStatusAcompanhamento('pendente')">
            Pendentes (${metricas?.pendentes || 0})
          </button>
          <button class="pill ${filtroStatusTopico === 'revisao' ? 'active' : ''}" onclick="window.EduPlanApp.filtrarStatusAcompanhamento('revisao')">
            Revisão (${metricas?.revisao || 0})
          </button>
        </div>
      </div>

      ${!planoAtual ? `
        <div class="empty-state-card">
          <div class="empty-icon">📊</div>
          <h3>Nenhum plano selecionado</h3>
          <p>Crie um plano pedagógico na aba "Planos de Aula" para iniciar o acompanhamento.</p>
          <button class="btn btn-primary" onclick="window.EduPlanApp.navegarPara('planos')">Ir para Planos de Aula</button>
        </div>
      ` : `
        <!-- Painel de Métricas e Ritmo Curricular -->
        <div class="plano-kpi-summary card">
          <div class="pks-main-row">
            <div class="pks-col">
              <span class="pks-label">Progresso da Matriz</span>
              <div class="pks-val-row">
                <span class="pks-huge-val text-emerald">${metricas.percentualGeral}%</span>
                <span class="pks-subval">${metricas.concluidos} de ${metricas.totalTopicos} tópicos</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill fill-emerald" style="width: ${metricas.percentualGeral}%"></div>
              </div>
            </div>

            <div class="pks-col">
              <span class="pks-label">Carga Horária / Aulas</span>
              <div class="pks-val-row">
                <span class="pks-huge-val">${metricas.totalAulasDadas}h</span>
                <span class="pks-subval">de ${metricas.totalAulasEstimadas}h estimadas</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill fill-blue" style="width: ${Math.min(100, Math.round((metricas.totalAulasDadas / (metricas.totalAulasEstimadas || 1)) * 100))}%"></div>
              </div>
            </div>

            <div class="pks-col">
              <span class="pks-label">Ritmo Pedagógico</span>
              <div class="pks-val-row">
                <span class="badge ${metricas.ritmo === 'No prazo' ? 'badge-success' : 'badge-warning'} badge-lg">
                  ${metricas.ritmo === 'No prazo' ? '⏱️ No Prazo Previsto' : (metricas.ritmo === 'Atrasado' ? '⚠️ Atenção: Atrasado' : '⚡ Ritmo Acelerado')}
                </span>
              </div>
              <p class="text-xs text-muted mt-xs">
                ${metricas.ritmo === 'No prazo' ? 'O ritmo de aulas ministradas está em conformidade com o cronograma.' : 'Recomenda-se ajustar a distribuição de conteúdos para cobrir a matriz no prazo letivo.'}
              </p>
            </div>
          </div>

          <!-- Turmas que usam este plano -->
          <div class="pks-turmas-row">
            <span><strong>Turmas vinculadas a este plano:</strong></span>
            ${metricas.turmasVinculadas.length === 0 ? `
              <span class="text-muted text-xs">Nenhuma turma vinculada. Associe este plano a uma turma em "Gestão de Turmas".</span>
            ` : metricas.turmasVinculadas.map(t => `
              <span class="turma-tag" style="border-left: 3px solid ${t.cor || '#2563eb'}">
                ${t.nome} (${t.periodo})
              </span>
            `).join('')}
          </div>
        </div>

        <!-- Grade de Acompanhamento Tópico a Tópico -->
        <div class="acompanhamento-modulos-list">
          ${(planoAtual.modulos || []).map((modulo, mIdx) => {
            const topicosFiltrados = (modulo.topicos || []).filter(t => {
              if (filtroStatusTopico === 'todos') return true;
              return t.status === filtroStatusTopico;
            });

            if (topicosFiltrados.length === 0 && filtroStatusTopico !== 'todos') {
              return '';
            }

            const modMetrica = metricas.modulosMetricas.find(mm => mm.moduloId === modulo.id) || { percentual: 0, concluidos: 0, totalTopicos: 0 };

            return `
              <div class="modulo-tracking-card card">
                <div class="mtc-header">
                  <div>
                    <h3 class="mtc-title">${modulo.titulo}</h3>
                    <span class="mtc-subtitle">${modulo.topicos ? modulo.topicos.length : 0} tópicos programados</span>
                  </div>
                  <div class="mtc-progress-wrap">
                    <span class="mtc-pct-label">${modMetrica.percentual}% do módulo concluído</span>
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
                        <th>Conteúdo / Tópico Programático</th>
                        <th style="width: 80px" class="text-center">Carga Est.</th>
                        <th style="width: 170px">Status Atual</th>
                        <th>Aulas Ministradas / Histórico</th>
                        <th style="width: 80px" class="text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${topicosFiltrados.map((topico, tIdx) => {
                        // Aulas em que esse tópico foi ministrado
                        const aulasDoTopico = todasAulas.filter(a => (a.topicosIds || []).includes(topico.id));

                        return `
                          <tr class="tracking-row status-row-${topico.status}">
                            <td class="text-center font-bold text-muted">${tIdx + 1}</td>
                            <td>
                              <div class="tt-topic-info">
                                <strong class="tt-topic-title">${topico.titulo}</strong>
                                ${topico.objetivosEspecificos ? `
                                  <p class="tt-topic-obj">🎯 <em>${topico.objetivosEspecificos}</em></p>
                                ` : ''}
                                ${topico.observacoesAjuste ? `
                                  <div class="tt-topic-note">
                                    <strong>Ajuste Pedagógico:</strong> ${topico.observacoesAjuste}
                                  </div>
                                ` : ''}
                              </div>
                            </td>
                            <td class="text-center font-semibold">${topico.aulasEstimadas}h</td>
                            <td>
                              <select 
                                class="status-select status-select-${topico.status}" 
                                onchange="window.EduPlanApp.alterarStatusTopicoPlano('${planoAtual.id}', '${topico.id}', this.value)"
                              >
                                <option value="${StatusTopico.PENDENTE}" ${topico.status === StatusTopico.PENDENTE ? 'selected' : ''}>⏳ Pendente</option>
                                <option value="${StatusTopico.EM_ANDAMENTO}" ${topico.status === StatusTopico.EM_ANDAMENTO ? 'selected' : ''}>🔄 Em Andamento</option>
                                <option value="${StatusTopico.CONCLUIDO}" ${topico.status === StatusTopico.CONCLUIDO ? 'selected' : ''}>✅ Concluído</option>
                                <option value="${StatusTopico.REVISAO}" ${topico.status === StatusTopico.REVISAO ? 'selected' : ''}>⚠️ Revisão / Reforço</option>
                              </select>
                            </td>
                            <td>
                              ${aulasDoTopico.length === 0 ? `
                                <span class="text-muted text-xs">Ainda não ministrado</span>
                              ` : `
                                <div class="topic-history-tags">
                                  ${aulasDoTopico.map(a => {
                                    const turmaAula = obterTurma(a.turmaId);
                                    return `
                                      <span class="topic-aula-tag" title="Conteúdo: ${a.conteudoMinistrado}">
                                        📅 ${formatarData(a.data)} (${turmaAula?.nome || 'Turma'})
                                      </span>
                                    `;
                                  }).join('')}
                                </div>
                              `}
                            </td>
                            <td class="text-center">
                              <button 
                                class="btn-icon-subtle" 
                                title="Adicionar anotação de ajuste pedagógico" 
                                onclick="window.EduPlanApp.abrirModalNotaAjuste('${planoAtual.id}', '${topico.id}', '${escapeAttr(topico.observacoesAjuste || '')}')"
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
      `}
    </div>
  `;
}

export function setPlanoSelecionadoId(id) {
  planoSelecionadoId = id;
}

export function setFiltroStatusTopico(status) {
  filtroStatusTopico = status;
}

function escapeAttr(str) {
  return String(str)
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\n/g, ' ');
}
