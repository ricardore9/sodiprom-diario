/**
 * EduPlan - Módulo de Planos de Aula e Matrizes Curriculares
 * Criação, estruturação em módulos/tópicos, objetivos, metodologias e BNCC.
 */

import {
  listarPlanos,
  obterPlano,
  salvarPlano,
  excluirPlano,
  listarTurmas,
  calcularMetricasPlano
} from './store.js';
import {
  criarNovoPlano,
  criarNovoModulo,
  criarNovoTopico,
  StatusTopico,
  gerarId
} from './models.js';

let termoBuscaPlanos = '';
let planoSendoEditado = null;

export function renderizarPlanos(container) {
  const planos = listarPlanos();
  const turmas = listarTurmas(false);

  const filtrados = planos.filter(p => {
    return !termoBuscaPlanos ||
      p.titulo.toLowerCase().includes(termoBuscaPlanos.toLowerCase()) ||
      p.disciplina.toLowerCase().includes(termoBuscaPlanos.toLowerCase());
  });

  container.innerHTML = `
    <div class="module-wrapper">
      <!-- Cabeçalho do Módulo -->
      <div class="module-header-row">
        <div>
          <h2>Planos de Aula & Matrizes de Ensino</h2>
          <p class="subtitle">Estruture ementas, módulos, tópicos pedagógicos, objetivos e competências BNCC</p>
        </div>
        <div class="header-action-group">
          <button class="btn btn-secondary" onclick="window.EduPlanApp.abrirModalTemplatesPlano()">
            <span class="btn-icon">💡</span> Modelos Prontos
          </button>
          <button class="btn btn-primary" onclick="window.EduPlanApp.abrirModalNovoPlano()">
            <span class="btn-icon">➕</span> Novo Plano de Aula
          </button>
        </div>
      </div>

      <!-- Barra de Busca -->
      <div class="filter-bar">
        <div class="search-input-box">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            id="inputBuscaPlanos" 
            placeholder="Buscar plano por título ou disciplina..." 
            value="${termoBuscaPlanos}"
          />
        </div>
      </div>

      <!-- Lista de Planos de Aula -->
      ${filtrados.length === 0 ? `
        <div class="empty-state-card">
          <div class="empty-icon">📋</div>
          <h3>Nenhum plano de aula cadastrado</h3>
          <p>Crie uma estrutura pedagógica do zero ou carregue um modelo pronto.</p>
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
                    <span class="badge badge-primary">${plano.disciplina || 'Geral'}</span>
                    <span class="badge badge-outline">${plano.nivelEnsino || 'Nível Médio'}</span>
                  </div>
                  <div class="pc-actions-menu">
                    <button class="btn-icon-subtle" title="Editar Plano" onclick="window.EduPlanApp.abrirModalEditarPlano('${plano.id}')">✏️</button>
                    <button class="btn-icon-subtle" title="Duplicar Plano" onclick="window.EduPlanApp.duplicarPlano('${plano.id}')">📑</button>
                    <button class="btn-icon-subtle text-danger" title="Excluir Plano" onclick="window.EduPlanApp.confirmarExclusaoPlano('${plano.id}')">🗑️</button>
                  </div>
                </div>

                <div class="pc-body">
                  <h3 class="pc-titulo">${plano.titulo}</h3>
                  <p class="pc-desc">${plano.objetivoGeral || plano.ementa || 'Sem objetivo geral cadastrado.'}</p>

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
                      <span class="stat-lbl">Carga Est.</span>
                    </div>
                    <div class="pc-stat-item">
                      <span class="stat-num text-emerald">${metricas.percentualGeral}%</span>
                      <span class="stat-lbl">Executado</span>
                    </div>
                  </div>

                  <!-- Barra de Progresso Geral -->
                  <div class="pc-progress-box">
                    <div class="progress-bar-sm">
                      <div class="progress-fill fill-emerald" style="width: ${metricas.percentualGeral}%"></div>
                    </div>
                    <div class="pc-progress-labels">
                      <span>${metricas.concluidos} de ${metricas.totalTopicos} tópicos concluídos</span>
                      <span class="badge ${metricas.ritmo === 'No prazo' ? 'badge-success' : 'badge-warning'}">${metricas.ritmo}</span>
                    </div>
                  </div>

                  <!-- Turmas Vinculadas -->
                  <div class="pc-turmas-linked">
                    <span class="ptl-title">Turmas Vinculadas:</span>
                    ${turmasQueUsam.length === 0 ? `
                      <span class="text-muted text-xs">Nenhuma turma vinculada a este plano.</span>
                    ` : `
                      <div class="turma-tags">
                        ${turmasQueUsam.map(t => `
                          <span class="turma-tag" style="border-left: 3px solid ${t.cor || '#2563eb'}">${t.nome}</span>
                        `).join('')}
                      </div>
                    `}
                  </div>
                </div>

                <div class="pc-footer">
                  <button class="btn btn-sm btn-primary" onclick="window.EduPlanApp.verAcompanhamentoPorPlano('${plano.id}')">
                    <span class="btn-icon">📊</span> Gestão Planejado vs Executado
                  </button>
                  <button class="btn btn-sm btn-outline" onclick="window.EduPlanApp.abrirModalEditarPlano('${plano.id}')">
                    Estruturar Tópicos
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;

  const inputBusca = container.querySelector('#inputBuscaPlanos');
  if (inputBusca) {
    inputBusca.addEventListener('input', (e) => {
      termoBuscaPlanos = e.target.value;
      renderizarPlanos(container);
    });
  }
}

/**
 * Renderiza o editor completo do plano de aula (cabeçalho + construtor de módulos e tópicos)
 */
export function renderizarModalPlano(planoExistente = null) {
  if (planoExistente) {
    planoSendoEditado = JSON.parse(JSON.stringify(planoExistente));
  } else {
    planoSendoEditado = criarNovoPlano({
      modulos: [
        criarNovoModulo({
          titulo: 'Módulo 1: Introdução e Fundamentos',
          topicos: [
            criarNovoTopico({ titulo: 'Apresentação da disciplina e conceitos introdutórios', aulasEstimadas: 2 })
          ]
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
          <h3>${isEdicao ? 'Editar Plano de Aula & Matriz' : 'Criar Novo Plano de Aula'}</h3>
          <p class="subtitle">Defina objetivos gerais, habilidades BNCC, módulos e conteúdos programáticos</p>
        </div>
        <button class="modal-close" onclick="window.EduPlanApp.fecharModal()">&times;</button>
      </div>

      <div class="modal-body-scrollable">
        <form id="formPlanoCabecalho">
          <input type="hidden" id="planoId" value="${p.id}" />

          <div class="card-inner-form">
            <h4 class="form-section-title">1. Dados Gerais do Plano</h4>
            
            <div class="form-grid-2">
              <div class="form-group">
                <label for="planoTitulo">Título do Plano de Aula *</label>
                <input 
                  type="text" 
                  id="planoTitulo" 
                  required 
                  placeholder="Ex: Física Aplicada e Eletromagnetismo" 
                  value="${p.titulo || ''}"
                />
              </div>

              <div class="form-group">
                <label for="planoDisciplina">Disciplina / Componente Curricular *</label>
                <input 
                  type="text" 
                  id="planoDisciplina" 
                  required 
                  placeholder="Ex: Física, Matemática, Programação..." 
                  value="${p.disciplina || ''}"
                />
              </div>
            </div>

            <div class="form-grid-3">
              <div class="form-group">
                <label for="planoNivel">Nível de Ensino</label>
                <select id="planoNivel">
                  <option value="Ensino Fundamental II" ${p.nivelEnsino === 'Ensino Fundamental II' ? 'selected' : ''}>Ensino Fundamental II</option>
                  <option value="Ensino Médio" ${p.nivelEnsino === 'Ensino Médio' ? 'selected' : ''}>Ensino Médio</option>
                  <option value="Curso Técnico" ${p.nivelEnsino === 'Curso Técnico' ? 'selected' : ''}>Curso Técnico</option>
                  <option value="Ensino Superior / Graduação" ${p.nivelEnsino === 'Ensino Superior / Graduação' ? 'selected' : ''}>Ensino Superior / Graduação</option>
                  <option value="Pós-Graduação / Livre" ${p.nivelEnsino === 'Pós-Graduação / Livre' ? 'selected' : ''}>Pós-Graduação / Livre</option>
                </select>
              </div>

              <div class="form-group">
                <label for="planoAnoSemestre">Ano / Semestre</label>
                <input 
                  type="text" 
                  id="planoAnoSemestre" 
                  placeholder="Ex: 2026.1" 
                  value="${p.anoSemestre || '2026.1'}"
                />
              </div>

              <div class="form-group">
                <label for="planoCargaEst">Carga Horária Estimada (Aulas)</label>
                <input 
                  type="number" 
                  id="planoCargaEst" 
                  min="1" 
                  max="1000" 
                  value="${p.cargaHorariaTotalEstimada || 80}"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="planoObjetivoGeral">Objetivo Geral da Aprendizagem</label>
              <textarea 
                id="planoObjetivoGeral" 
                rows="2" 
                placeholder="Descreva a meta principal que os estudantes deverão alcançar ao término deste plano..."
              >${p.objetivoGeral || ''}</textarea>
            </div>

            <div class="form-group">
              <label for="planoBNCC">Competências e Habilidades BNCC / Diretrizes Curriculares</label>
              <input 
                type="text" 
                id="planoBNCC" 
                placeholder="Ex: EM13CNT301, EM13CNT303 (Investigação científica e análise de fenômenos)" 
                value="${p.competenciasBNCC || ''}"
              />
            </div>
          </div>
        </form>

        <!-- Construtor de Módulos e Tópicos -->
        <div class="modulos-builder-section">
          <div class="builder-header">
            <div>
              <h4 class="form-section-title">2. Matriz Pedagógica: Módulos & Tópicos de Aula</h4>
              <p class="subtitle">Estruture a sequência de aulas previstas com objetivos e metodologias</p>
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
        <button type="button" class="btn btn-secondary" onclick="window.EduPlanApp.fecharModal()">Cancelar</button>
        <button type="button" class="btn btn-primary" onclick="window.EduPlanApp.salvarPlanoCompleto()">Salvar Plano de Aula</button>
      </div>
    </div>
  `;
}

/**
 * Renderiza os blocos visuais de módulos e tópicos dentro do modal de edição
 */
export function renderizarListaModulosEditor(modulos = []) {
  if (!modulos || modulos.length === 0) {
    return `
      <div class="empty-state-sm">
        <p>Nenhum módulo criado. Clique em "+ Adicionar Módulo" para iniciar.</p>
      </div>
    `;
  }

  return modulos.map((modulo, mIdx) => `
    <div class="modulo-edit-box" data-modulo-idx="${mIdx}">
      <div class="meb-header">
        <div class="meb-title-input">
          <span class="meb-num">Módulo ${mIdx + 1}</span>
          <input 
            type="text" 
            class="input-modulo-titulo" 
            placeholder="Nome do Módulo (Ex: Eletrostática e Cargas)" 
            value="${modulo.titulo || ''}"
            oninput="window.EduPlanApp.atualizarTituloModulo(${mIdx}, this.value)"
          />
        </div>
        <div class="meb-actions">
          <button 
            type="button" 
            class="btn btn-xs btn-outline" 
            onclick="window.EduPlanApp.adicionarTopicoEditor(${mIdx})"
          >
            + Adicionar Tópico/Aula
          </button>
          <button 
            type="button" 
            class="btn-icon-subtle text-danger" 
            title="Excluir Módulo" 
            onclick="window.EduPlanApp.removerModuloEditor(${mIdx})"
          >
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
                placeholder="Título do Tópico / Conteúdo da Aula *" 
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
              <button 
                type="button" 
                class="btn-icon-subtle text-danger" 
                title="Remover Tópico" 
                onclick="window.EduPlanApp.removerTopicoEditor(${mIdx}, ${tIdx})"
              >
                ✕
              </button>
            </div>

            <div class="tec-details-grid">
              <div class="form-group-sm">
                <label>Objetivo Específico</label>
                <input 
                  type="text" 
                  placeholder="O que o aluno aprenderá..." 
                  value="${topico.objetivosEspecificos || ''}"
                  oninput="window.EduPlanApp.atualizarTopicoCampo(${mIdx}, ${tIdx}, 'objetivosEspecificos', this.value)"
                />
              </div>
              <div class="form-group-sm">
                <label>Metodologia Sugerida</label>
                <input 
                  type="text" 
                  placeholder="Ex: Aula expositiva dialogada, estudo de caso..." 
                  value="${topico.metodologiaSugerida || ''}"
                  oninput="window.EduPlanApp.atualizarTopicoCampo(${mIdx}, ${tIdx}, 'metodologiaSugerida', this.value)"
                />
              </div>
              <div class="form-group-sm">
                <label>Recursos Didáticos / Materiais</label>
                <input 
                  type="text" 
                  placeholder="Ex: Quadro, projetor, simulador PhET..." 
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

export function getPlanoSendoEditado() {
  return planoSendoEditado;
}

export function setPlanoSendoEditado(p) {
  planoSendoEditado = p;
}

/**
 * Modal com Templates Prontos de Planos de Aula
 */
export function renderizarModalTemplates() {
  return `
    <div class="modal-content modal-large">
      <div class="modal-header">
        <div>
          <h3>Modelos Prontos de Planos de Ensino</h3>
          <p class="subtitle">Escolha um modelo pedagógico estruturado para acelerar seu planejamento</p>
        </div>
        <button class="modal-close" onclick="window.EduPlanApp.fecharModal()">&times;</button>
      </div>

      <div class="templates-grid">
        <div class="template-card">
          <div class="tpl-icon">🧪</div>
          <h4>Ciências & Física</h4>
          <p>Estrutura para Ensino Fundamental e Médio cobrindo fenômenos naturais, mecânica e eletricidade.</p>
          <button class="btn btn-sm btn-primary" onclick="window.EduPlanApp.carregarTemplate('fisica')">Usar Modelo</button>
        </div>

        <div class="template-card">
          <div class="tpl-icon">📐</div>
          <h4>Matemática Aplicada</h4>
          <p>Módulos de Funções, Geometria Espacial, Estatística e Resolução de Problemas cotidianos.</p>
          <button class="btn btn-sm btn-primary" onclick="window.EduPlanApp.carregarTemplate('matematica')">Usar Modelo</button>
        </div>

        <div class="template-card">
          <div class="tpl-icon">💻</div>
          <h4>Programação & Web</h4>
          <p>Módulos de Algoritmos, HTML5 Semântico, CSS Grid/Flexbox e Lógica com JavaScript.</p>
          <button class="btn btn-sm btn-primary" onclick="window.EduPlanApp.carregarTemplate('programacao')">Usar Modelo</button>
        </div>

        <div class="template-card">
          <div class="tpl-icon">📚</div>
          <h4>Língua Portuguesa & Redação</h4>
          <p>Gêneros textuais, interpretação crítica, oratória, gramática contextualizada e dissertação.</p>
          <button class="btn btn-sm btn-primary" onclick="window.EduPlanApp.carregarTemplate('portugues')">Usar Modelo</button>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="window.EduPlanApp.fecharModal()">Fechar</button>
      </div>
    </div>
  `;
}
