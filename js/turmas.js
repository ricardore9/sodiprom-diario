/**
 * EduPlan - Módulo de Gestão de Turmas
 * Cadastro, edição, listagem, vinculação de planos e gestão de alunos.
 */

import {
  listarTurmas,
  obterTurma,
  salvarTurma,
  excluirTurma,
  listarPlanos,
  calcularMetricasTurma
} from './store.js';
import { criarNovaTurma, StatusTurma, gerarId } from './models.js';

let filtroStatusAtual = 'todas';
let termoBusca = '';

export function renderizarTurmas(container) {
  const todas = listarTurmas(false);
  const planos = listarPlanos();

  let filtradas = todas.filter(t => {
    const matchStatus = filtroStatusAtual === 'todas' || t.status === filtroStatusAtual;
    const matchBusca = !termoBusca || 
      t.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
      t.disciplina.toLowerCase().includes(termoBusca.toLowerCase());
    return matchStatus && matchBusca;
  });

  container.innerHTML = `
    <div class="module-wrapper">
      <!-- Barra Superior de Ações e Filtros -->
      <div class="module-header-row">
        <div>
          <h2>Gestão de Turmas</h2>
          <p class="subtitle">Organize suas turmas, horários, alunos e matrizes curriculares</p>
        </div>
        <button class="btn btn-primary" onclick="window.EduPlanApp.abrirModalNovaTurma()">
          <span class="btn-icon">➕</span> Nova Turma
        </button>
      </div>

      <!-- Barra de Ferramentas: Busca e Filtro de Status -->
      <div class="filter-bar">
        <div class="search-input-box">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            id="inputBuscaTurmas" 
            placeholder="Buscar por nome da turma ou disciplina..." 
            value="${termoBusca}"
          />
        </div>
        <div class="filter-pills">
          <button class="pill ${filtroStatusAtual === 'todas' ? 'active' : ''}" onclick="window.EduPlanApp.filtrarTurmasStatus('todas')">
            Todas (${todas.length})
          </button>
          <button class="pill ${filtroStatusAtual === 'ativa' ? 'active' : ''}" onclick="window.EduPlanApp.filtrarTurmasStatus('ativa')">
            Ativas (${todas.filter(t => t.status === 'ativa').length})
          </button>
          <button class="pill ${filtroStatusAtual === 'concluida' ? 'active' : ''}" onclick="window.EduPlanApp.filtrarTurmasStatus('concluida')">
            Concluídas (${todas.filter(t => t.status === 'concluida').length})
          </button>
        </div>
      </div>

      <!-- Grade de Cards de Turmas -->
      ${filtradas.length === 0 ? `
        <div class="empty-state-card">
          <div class="empty-icon">👥</div>
          <h3>Nenhuma turma encontrada</h3>
          <p>Cadastre uma nova turma ou ajuste os filtros de busca.</p>
          <button class="btn btn-primary" onclick="window.EduPlanApp.abrirModalNovaTurma()">Criar Nova Turma</button>
        </div>
      ` : `
        <div class="turmas-grid">
          ${filtradas.map(turma => {
            const metricas = calcularMetricasTurma(turma.id);
            return `
              <div class="turma-card" style="border-top: 6px solid ${turma.cor || '#2563eb'}">
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
                      <span>${turma.sala || 'Sala não informada'}</span>
                    </div>
                    <div class="tc-info-item">
                      <span class="tii-icon">📅</span>
                      <span>${(turma.diasSemana || []).join(', ') || 'Dias flexíveis'}</span>
                    </div>
                    <div class="tc-info-item">
                      <span class="tii-icon">🎓</span>
                      <span>${turma.alunos ? turma.alunos.length : 0} alunos matriculados</span>
                      <button class="btn-link btn-xs" onclick="window.EduPlanApp.abrirModalAlunos('${turma.id}')">Gerenciar Alunos</button>
                    </div>
                  </div>

                  <!-- Plano de Aula Vinculado -->
                  <div class="tc-plano-box">
                    <div class="tpb-header">
                      <span class="tpb-title">📖 Plano Pedagógico:</span>
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
                      <p class="tpb-empty">Nenhum plano curricular associado a esta turma.</p>
                    `}
                  </div>

                  <!-- Progresso de Carga Horária -->
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

  // Listener para o campo de busca
  const inputBusca = container.querySelector('#inputBuscaTurmas');
  if (inputBusca) {
    inputBusca.addEventListener('input', (e) => {
      termoBusca = e.target.value;
      renderizarTurmas(container);
    });
  }
}

export function setFiltroStatus(status) {
  filtroStatusAtual = status;
}

/**
 * Renderiza o modal de criação/edição de turma
 */
export function renderizarModalTurma(turmaExistente = null) {
  const planos = listarPlanos();
  const t = turmaExistente || criarNovaTurma();
  const isEdicao = Boolean(turmaExistente && turmaExistente.id);

  const diasDisponiveis = [
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado'
  ];

  const coresDisponiveis = [
    '#2563eb', // Azul
    '#0d9488', // Verde-água
    '#16a34a', // Verde
    '#7c3aed', // Roxo
    '#ea580c', // Laranja
    '#e11d48', // Vermelho
    '#0284c7'  // Ciano
  ];

  return `
    <div class="modal-content">
      <div class="modal-header">
        <h3>${isEdicao ? 'Editar Turma' : 'Cadastrar Nova Turma'}</h3>
        <button class="modal-close" onclick="window.EduPlanApp.fecharModal()">&times;</button>
      </div>

      <form id="formSalvarTurma" onsubmit="window.EduPlanApp.submeterFormTurma(event)">
        <input type="hidden" name="id" value="${t.id}" />

        <div class="form-grid-2">
          <div class="form-group">
            <label for="turmaNome">Nome da Turma *</label>
            <input 
              type="text" 
              id="turmaNome" 
              name="nome" 
              required 
              placeholder="Ex: 3º Ano A, Turma TI-2026..." 
              value="${t.nome || ''}"
            />
          </div>

          <div class="form-group">
            <label for="turmaDisciplina">Disciplina / Matéria *</label>
            <input 
              type="text" 
              id="turmaDisciplina" 
              name="disciplina" 
              required 
              placeholder="Ex: Física, Matemática, Programação..." 
              value="${t.disciplina || ''}"
            />
          </div>
        </div>

        <div class="form-grid-3">
          <div class="form-group">
            <label for="turmaAno">Ano / Semestre Letivo</label>
            <input 
              type="text" 
              id="turmaAno" 
              name="anoLetivo" 
              placeholder="Ex: 2026" 
              value="${t.anoLetivo || '2026'}"
            />
          </div>

          <div class="form-group">
            <label for="turmaPeriodo">Turno / Período</label>
            <select id="turmaPeriodo" name="periodo">
              <option value="Matutino" ${t.periodo === 'Matutino' ? 'selected' : ''}>Matutino</option>
              <option value="Vespertino" ${t.periodo === 'Vespertino' ? 'selected' : ''}>Vespertino</option>
              <option value="Noturno" ${t.periodo === 'Noturno' ? 'selected' : ''}>Noturno</option>
              <option value="Integral" ${t.periodo === 'Integral' ? 'selected' : ''}>Integral</option>
            </select>
          </div>

          <div class="form-group">
            <label for="turmaSala">Sala / Local</label>
            <input 
              type="text" 
              id="turmaSala" 
              name="sala" 
              placeholder="Ex: Sala 302, Lab 4" 
              value="${t.sala || ''}"
            />
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label for="turmaCarga">Carga Horária Total (em Aulas ou Horas) *</label>
            <input 
              type="number" 
              id="turmaCarga" 
              name="cargaHorariaTotal" 
              min="1" 
              max="1000" 
              required 
              value="${t.cargaHorariaTotal || 80}"
            />
          </div>

          <div class="form-group">
            <label for="turmaPlano">Vincular Plano de Aula</label>
            <select id="turmaPlano" name="planoId">
              <option value="">-- Selecione um Plano Pedagógico --</option>
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
                <input 
                  type="checkbox" 
                  name="diasSemana" 
                  value="${dia}" 
                  ${(t.diasSemana || []).includes(dia) ? 'checked' : ''}
                />
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
                  <input 
                    type="radio" 
                    name="cor" 
                    value="${cor}" 
                    ${(t.cor || '#2563eb') === cor ? 'checked' : ''}
                  />
                  <span class="color-circle" style="background-color: ${cor}"></span>
                </label>
              `).join('')}
            </div>
          </div>

          <div class="form-group">
            <label for="turmaStatus">Status da Turma</label>
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

/**
 * Renderiza o modal para gerenciar a lista de alunos de uma turma
 */
export function renderizarModalAlunos(turmaId) {
  const turma = obterTurma(turmaId);
  if (!turma) return '<p>Turma não encontrada</p>';

  const alunos = turma.alunos || [];

  return `
    <div class="modal-content modal-large">
      <div class="modal-header">
        <div>
          <h3>Alunos da Turma: ${turma.nome}</h3>
          <p class="subtitle">${alunos.length} alunos cadastrados • Chamadas e controle de presença</p>
        </div>
        <button class="modal-close" onclick="window.EduPlanApp.fecharModal()">&times;</button>
      </div>

      <div class="alunos-manager-grid">
        <!-- Coluna de Adicionar Aluno / Importar em Massa -->
        <div class="card-inner">
          <h4>Adicionar Aluno</h4>
          <form id="formAdicionarAluno" onsubmit="window.EduPlanApp.adicionarAlunoTurma(event, '${turma.id}')">
            <div class="form-group">
              <label for="alunoNome">Nome Completo do Aluno *</label>
              <input type="text" id="alunoNome" required placeholder="Ex: Gabriel Barbosa Silva" />
            </div>
            <div class="form-group">
              <label for="alunoMatricula">Matrícula / Código (Opcional)</label>
              <input type="text" id="alunoMatricula" placeholder="Ex: 2026-0042" />
            </div>
            <button type="submit" class="btn btn-primary btn-block">+ Adicionar Aluno</button>
          </form>

          <hr class="divider-my" />

          <h4>Importar Lista de Nomes (Em Massa)</h4>
          <p class="text-xs text-muted">Cole uma lista de nomes, um por linha:</p>
          <form id="formImportarAlunos" onsubmit="window.EduPlanApp.importarAlunosEmMassa(event, '${turma.id}')">
            <div class="form-group">
              <textarea id="textareaAlunosMassa" rows="5" placeholder="Nome Aluno 1&#10;Nome Aluno 2&#10;Nome Aluno 3"></textarea>
            </div>
            <button type="submit" class="btn btn-secondary btn-block">📥 Importar Nomes</button>
          </form>
        </div>

        <!-- Coluna com Lista de Alunos -->
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
              <span class="text-xs text-muted">Adicione individualmente ou cole uma lista ao lado.</span>
            </div>
          ` : `
            <div class="students-table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="width: 40px">Nº</th>
                    <th>Nome do Aluno</th>
                    <th>Matrícula</th>
                    <th style="width: 50px">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  ${alunos.map((aluno, idx) => `
                    <tr>
                      <td class="text-center"><strong>${idx + 1}</strong></td>
                      <td>${aluno.nome}</td>
                      <td><span class="code-badge">${aluno.matricula || '-'}</span></td>
                      <td class="text-center">
                        <button 
                          class="btn-icon-subtle text-danger" 
                          title="Remover Aluno" 
                          onclick="window.EduPlanApp.removerAlunoTurma('${turma.id}', '${aluno.id}')"
                        >
                          ✕
                        </button>
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
