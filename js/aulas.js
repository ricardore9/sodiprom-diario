/**
 * EduPlan - Módulo de Aulas Dadas (Diário de Classe)
 * Registro detalhado das aulas ministradas, vínculo com o plano e controle de presença.
 */

import {
  listarAulas,
  listarTurmas,
  listarPlanos,
  obterTurma,
  obterPlano,
  obterAula,
  salvarAula,
  excluirAula
} from './store.js';
import {
  criarNovaAulaDada,
  formatarData,
  dataHojeIso,
  StatusTopico
} from './models.js';

let filtroTurmaId = '';
let filtroDataMes = '';
let termoBuscaConteudo = '';

export function renderizarAulas(container) {
  const turmas = listarTurmas(false);
  const aulas = listarAulas({ turmaId: filtroTurmaId });

  const aulasFiltradas = aulas.filter(a => {
    const matchMes = !filtroDataMes || (a.data && a.data.startsWith(filtroDataMes));
    const matchTexto = !termoBuscaConteudo || 
      (a.conteudoMinistrado && a.conteudoMinistrado.toLowerCase().includes(termoBuscaConteudo.toLowerCase())) ||
      (a.observacoesTurma && a.observacoesTurma.toLowerCase().includes(termoBuscaConteudo.toLowerCase()));
    return matchMes && matchTexto;
  });

  const totalAulasRegistradas = aulasFiltradas.reduce((acc, a) => acc + (Number(a.duracaoAulas) || 1), 0);

  container.innerHTML = `
    <div class="module-wrapper">
      <!-- Cabeçalho do Diário -->
      <div class="module-header-row">
        <div>
          <h2>Diário de Aulas Dadas</h2>
          <p class="subtitle">Histórico e registro oficial de encontros pedagógicos, conteúdos ministrados e presenças</p>
        </div>
        <div class="header-action-group">
          <button class="btn btn-secondary" onclick="window.EduPlanApp.imprimirDiarioClasse('${filtroTurmaId}')">
            <span class="btn-icon">🖨️</span> Imprimir Diário
          </button>
          <button class="btn btn-primary" onclick="window.EduPlanApp.abrirModalRegistrarAula('${filtroTurmaId}')">
            <span class="btn-icon">✍️</span> Registrar Nova Aula
          </button>
        </div>
      </div>

      <!-- Barra de Filtros -->
      <div class="filter-bar">
        <div class="form-inline-group">
          <label>Turma:</label>
          <select id="selectFiltroTurma" onchange="window.EduPlanApp.filtrarAulasTurma(this.value)">
            <option value="">-- Todas as Turmas --</option>
            ${turmas.map(t => `
              <option value="${t.id}" ${filtroTurmaId === t.id ? 'selected' : ''}>
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
            placeholder="Buscar por conteúdo ou anotações..." 
            value="${termoBuscaConteudo}"
          />
        </div>

        <div class="stats-pill">
          <strong>${aulasFiltradas.length}</strong> registros • <strong>${totalAulasRegistradas}</strong> aulas ministradas
        </div>
      </div>

      <!-- Lista de Aulas Registradas -->
      ${aulasFiltradas.length === 0 ? `
        <div class="empty-state-card">
          <div class="empty-icon">📝</div>
          <h3>Nenhuma aula registrada</h3>
          <p>Selecione uma turma e registre as atividades ministradas e conteúdos trabalhados.</p>
          <button class="btn btn-primary" onclick="window.EduPlanApp.abrirModalRegistrarAula('${filtroTurmaId}')">
            Registrar Primeira Aula
          </button>
        </div>
      ` : `
        <div class="aulas-timeline-list">
          ${aulasFiltradas.map((aula, idx) => {
            const turma = obterTurma(aula.turmaId);
            const plano = aula.planoId ? obterPlano(aula.planoId) : (turma?.planoId ? obterPlano(turma.planoId) : null);

            // Mapeia tópicos cobertos nesta aula
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

            // Presença
            let badgePresenca = '';
            if (aula.frequencia && aula.frequencia.registrada && aula.frequencia.totalAlunos > 0) {
              const pres = (aula.frequencia.presencas || []).length;
              const total = aula.frequencia.totalAlunos;
              const pct = Math.round((pres / total) * 100);
              badgePresenca = `
                <span class="badge ${pct >= 75 ? 'badge-success' : 'badge-warning'}" title="${pres} de ${total} alunos presentes">
                  👥 ${pres}/${total} presentes (${pct}%)
                </span>
              `;
            }

            return `
              <div class="aula-card" style="border-left: 6px solid ${turma?.cor || '#2563eb'}">
                <div class="ac-header">
                  <div class="ac-header-info">
                    <span class="ac-date-tag">📅 ${formatarData(aula.data)}</span>
                    <span class="badge badge-primary">${turma ? turma.nome : 'Turma'}</span>
                    <span class="badge badge-outline">${aula.duracaoAulas} ${aula.duracaoAulas === 1 ? 'aula' : 'aulas'} ministradas</span>
                    ${badgePresenca}
                  </div>
                  <div class="ac-actions">
                    <button class="btn-icon-subtle" title="Editar Aula" onclick="window.EduPlanApp.abrirModalEditarAula('${aula.id}')">✏️</button>
                    <button class="btn-icon-subtle text-danger" title="Excluir Aula" onclick="window.EduPlanApp.confirmarExclusaoAula('${aula.id}')">🗑️</button>
                  </div>
                </div>

                <div class="ac-body">
                  <div class="ac-conteudo-box">
                    <h4 class="ac-conteudo-title">Conteúdo Trabalhado:</h4>
                    <p class="ac-conteudo-text">${aula.conteudoMinistrado || 'Nenhum resumo informado.'}</p>
                  </div>

                  <!-- Tópicos do Plano Cobertos -->
                  ${topicosCobertos.length > 0 ? `
                    <div class="ac-topicos-box">
                      <span class="atb-label">🎯 Tópicos do Plano de Aula Vinculados:</span>
                      <div class="atb-tags">
                        ${topicosCobertos.map(t => `
                          <span class="badge badge-emerald">
                            ✓ ${t.titulo} <small>(${t.moduloTitulo})</small>
                          </span>
                        `).join('')}
                      </div>
                    </div>
                  ` : ''}

                  <!-- Metodologia e Recursos -->
                  <div class="ac-meta-grid">
                    ${aula.metodologiaUtilizada ? `
                      <div class="ac-meta-item">
                        <strong>Metodologia:</strong> ${aula.metodologiaUtilizada}
                      </div>
                    ` : ''}
                    ${aula.recursosUtilizados ? `
                      <div class="ac-meta-item">
                        <strong>Recursos Didáticos:</strong> ${aula.recursosUtilizados}
                      </div>
                    ` : ''}
                    ${aula.tarefasCasa ? `
                      <div class="ac-meta-item text-primary">
                        <strong>Tarefas de Casa / Próxima Aula:</strong> ${aula.tarefasCasa}
                      </div>
                    ` : ''}
                    ${aula.avaliacaoRealizada ? `
                      <div class="ac-meta-item text-purple">
                        <strong>Avaliação / Atividade:</strong> ${aula.avaliacaoRealizada}
                      </div>
                    ` : ''}
                  </div>

                  ${aula.observacoesTurma ? `
                    <div class="ac-observacoes-box">
                      <strong>💡 Observações Pedagógicas & Rendimento:</strong>
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

  const inputBusca = container.querySelector('#inputBuscaAulas');
  if (inputBusca) {
    inputBusca.addEventListener('input', (e) => {
      termoBuscaConteudo = e.target.value;
      renderizarAulas(container);
    });
  }
}

export function setFiltroTurmaId(turmaId) {
  filtroTurmaId = turmaId;
}

/**
 * Renderiza o modal de registro/edição de aula
 */
export function renderizarModalAula(aulaExistente = null, turmaIdPreSelecionada = null) {
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
          <p class="subtitle">Diário de classe e vinculação direta aos conteúdos do plano de aula</p>
        </div>
        <button class="modal-close" onclick="window.EduPlanApp.fecharModal()">&times;</button>
      </div>

      <div class="modal-body-scrollable">
        <form id="formSalvarAula" onsubmit="window.EduPlanApp.submeterFormAula(event)">
          <input type="hidden" name="id" value="${aula.id}" />

          <div class="form-grid-3">
            <div class="form-group">
              <label for="formAulaTurma">Turma *</label>
              <select 
                id="formAulaTurma" 
                name="turmaId" 
                required 
                onchange="window.EduPlanApp.trocarTurmaModalAula(this.value)"
              >
                ${turmas.map(t => `
                  <option value="${t.id}" ${t.id === aula.turmaId ? 'selected' : ''}>
                    ${t.nome} (${t.disciplina})
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="form-group">
              <label for="formAulaData">Data da Aula *</label>
              <input 
                type="date" 
                id="formAulaData" 
                name="data" 
                required 
                value="${aula.data || dataHojeIso()}"
              />
            </div>

            <div class="form-group">
              <label for="formAulaDuracao">Quantidade de Aulas / Horas *</label>
              <input 
                type="number" 
                id="formAulaDuracao" 
                name="duracaoAulas" 
                min="1" 
                max="10" 
                required 
                value="${aula.duracaoAulas || 2}"
              />
            </div>
          </div>

          <!-- Seleção de Tópicos do Plano de Aula -->
          <div class="card-inner-box">
            <div class="cib-header">
              <span class="cib-title">🎯 Conteúdos Cumpridos do Plano de Aula:</span>
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

          <!-- Detalhes do Conteúdo Ministrado -->
          <div class="form-group">
            <label for="formAulaConteudo">Resumo do Conteúdo Efetivamente Trabalhado *</label>
            <textarea 
              id="formAulaConteudo" 
              name="conteudoMinistrado" 
              rows="3" 
              required 
              placeholder="Descreva detalhadamente o que foi apresentado, exercitado ou debatido com a turma..."
            >${aula.conteudoMinistrado || ''}</textarea>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label for="formAulaMetodologia">Metodologia e Estratégias Utilizadas</label>
              <input 
                type="text" 
                id="formAulaMetodologia" 
                name="metodologiaUtilizada" 
                placeholder="Ex: Aula expositiva dialogada, trabalho em duplas, experimento..." 
                value="${aula.metodologiaUtilizada || ''}"
              />
            </div>

            <div class="form-group">
              <label for="formAulaRecursos">Recursos Didáticos / Materiais Utilizados</label>
              <input 
                type="text" 
                id="formAulaRecursos" 
                name="recursosUtilizados" 
                placeholder="Ex: Quadro, simulador digital, projetor, livro pág. 45..." 
                value="${aula.recursosUtilizados || ''}"
              />
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label for="formAulaTarefas">Tarefas de Casa / Orientações para Próxima Aula</label>
              <input 
                type="text" 
                id="formAulaTarefas" 
                name="tarefasCasa" 
                placeholder="Ex: Resolver exercícios 1 a 5 da página 32..." 
                value="${aula.tarefasCasa || ''}"
              />
            </div>

            <div class="form-group">
              <label for="formAulaAvaliacao">Atividade Avaliativa (se houver)</label>
              <input 
                type="text" 
                id="formAulaAvaliacao" 
                name="avaliacaoRealizada" 
                placeholder="Ex: Visto nas tarefas, quiz formativo, prova..." 
                value="${aula.avaliacaoRealizada || ''}"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="formAulaObs">Observações Pedagógicas & Clima da Turma</label>
            <textarea 
              id="formAulaObs" 
              name="observacoesTurma" 
              rows="2" 
              placeholder="Dificuldades identificadas nos alunos, participação, pontos de atenção para a próxima aula..."
            >${aula.observacoesTurma || ''}</textarea>
          </div>

          <!-- Controle de Chamada e Frequência -->
          <div class="card-inner-box">
            <div class="cib-header">
              <span class="cib-title">📋 Chamada de Frequência (${alunos.length} alunos)</span>
              ${alunos.length > 0 ? `
                <div class="chamada-actions">
                  <button type="button" class="btn-link btn-xs" onclick="window.EduPlanApp.marcarTodosPresentes(true)">Marcar Todos Presentes</button>
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

/**
 * Renderiza os tópicos do plano em módulos com checkboxes
 */
export function renderizarChecklistTopicosPlano(plano, topicosSelecionados = []) {
  if (!plano || !plano.modulos || plano.modulos.length === 0) {
    return `
      <div class="empty-state-sm">
        <p>Esta turma não possui um plano vinculado ou o plano não contém tópicos cadastrados.</p>
        <span class="text-xs text-muted">Você pode vincular um plano editando a turma em "Gestão de Turmas".</span>
      </div>
    `;
  }

  return `
    <div class="plan-topics-checklist">
      <p class="text-xs text-muted mb-sm">Marque os tópicos do plano que foram cobertos nesta aula (eles serão atualizados no acompanhamento):</p>
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

/**
 * Renderiza os alunos em formato de chamada rápida
 */
export function renderizarGradePresenca(alunos = [], frequencia = null) {
  if (!alunos || alunos.length === 0) {
    return `
      <div class="empty-state-sm">
        <p>Nenhum aluno cadastrado nesta turma.</p>
        <span class="text-xs text-muted">Acesse a aba "Turmas" para cadastrar a lista de chamada da turma.</span>
      </div>
    `;
  }

  const presencasIds = frequencia?.presencas || alunos.map(a => a.id); // por padrão todos presentes

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
