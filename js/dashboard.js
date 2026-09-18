/**
 * EduPlan - Módulo Dashboard
 * Apresenta métricas pedagógicas globais, alertas, gráficos e acesso rápido.
 */

import {
  listarTurmas,
  listarPlanos,
  listarAulas,
  calcularMetricasTurma,
  calcularMetricasPlano,
  obterConfig
} from './store.js';
import { formatarData } from './models.js';

export function renderizarDashboard(container) {
  const turmas = listarTurmas(true);
  const todasTurmas = listarTurmas(false);
  const planos = listarPlanos();
  const aulas = listarAulas();
  const config = obterConfig();

  // Métricas calculadas
  const metricasPorTurma = todasTurmas.map(t => calcularMetricasTurma(t.id)).filter(Boolean);
  const metricasPorPlano = planos.map(p => calcularMetricasPlano(p.id)).filter(Boolean);

  const totalAulasDadas = aulas.reduce((acc, a) => acc + (Number(a.duracaoAulas) || 1), 0);
  const totalCargaPrevista = todasTurmas.reduce((acc, t) => acc + (Number(t.cargaHorariaTotal) || 0), 0);
  const percentualCargaGeral = totalCargaPrevista > 0 ? Math.min(100, Math.round((totalAulasDadas / totalCargaPrevista) * 100)) : 0;

  const somaPercentuaisPlanos = metricasPorPlano.reduce((acc, m) => acc + m.percentualGeral, 0);
  const mediaCumprimentoPlanos = metricasPorPlano.length > 0 ? Math.round(somaPercentuaisPlanos / metricasPorPlano.length) : 0;

  // Aulas do mês atual
  const mesAtualStr = new Date().toISOString().substring(0, 7);
  const aulasMes = aulas.filter(a => (a.data || '').startsWith(mesAtualStr));
  const totalAulasMes = aulasMes.reduce((acc, a) => acc + (Number(a.duracaoAulas) || 1), 0);

  // Alertas Pedagógicos
  const alertas = [];
  todasTurmas.forEach(t => {
    if (!t.planoId) {
      alertas.push({
        tipo: 'aviso',
        icone: '⚠️',
        titulo: `Turma sem plano vinculado: ${t.nome}`,
        descricao: 'Vincule um plano pedagógico para monitorar o progresso dos conteúdos programáticos.',
        acao: `navegarParaAba('turmas')`
      });
    }
  });

  metricasPorPlano.forEach(m => {
    if (m.ritmo === 'Atrasado') {
      alertas.push({
        tipo: 'atencao',
        icone: '⏳',
        titulo: `Atenção ao ritmo: ${m.plano.titulo}`,
        descricao: `O plano está em ${m.percentualGeral}% de conclusão, com consumo elevado de aulas estimadas.`,
        acao: `navegarParaAba('acompanhamento')`
      });
    }
  });

  container.innerHTML = `
    <div class="dashboard-wrapper">
      <!-- Boas-vindas e Cabeçalho do Professor -->
      <section class="welcome-banner">
        <div class="welcome-text">
          <span class="badge badge-primary">Painel Pedagógico ${config.anoLetivoPadrao}</span>
          <h2>Olá, ${config.nomeProfessor}! 👋</h2>
          <p class="subtitle">${config.escola} • Controle integrado de aulas, turmas e matriz curricular</p>
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

      <!-- Grade de Indicadores (KPIs) -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon icon-blue">🏫</div>
          <div class="kpi-content">
            <span class="kpi-title">Turmas Ativas</span>
            <span class="kpi-value">${turmas.length}</span>
            <span class="kpi-meta">${todasTurmas.length} turmas no total</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-emerald">📚</div>
          <div class="kpi-content">
            <span class="kpi-title">Aulas Ministradas</span>
            <span class="kpi-value">${totalAulasDadas} <small>aulas</small></span>
            <span class="kpi-meta">${totalAulasMes} ministradas neste mês</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-purple">🎯</div>
          <div class="kpi-content">
            <span class="kpi-title">Progresso dos Planos</span>
            <span class="kpi-value">${mediaCumprimentoPlanos}%</span>
            <div class="kpi-progress-bar">
              <div class="progress-fill fill-purple" style="width: ${mediaCumprimentoPlanos}%"></div>
            </div>
            <span class="kpi-meta">Média global de conteúdos cumpridos</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-amber">⏱️</div>
          <div class="kpi-content">
            <span class="kpi-title">Carga Horária Cumprida</span>
            <span class="kpi-value">${percentualCargaGeral}%</span>
            <div class="kpi-progress-bar">
              <div class="progress-fill fill-amber" style="width: ${percentualCargaGeral}%"></div>
            </div>
            <span class="kpi-meta">${totalAulasDadas} de ${totalCargaPrevista} horas/aulas</span>
          </div>
        </div>
      </div>

      <!-- Alertas Pedagógicos (se houver) -->
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

      <!-- Duas Colunas: Visão por Turma e Últimas Aulas Registradas -->
      <div class="dashboard-grid-2col">
        <!-- Coluna 1: Status de Cada Turma -->
        <div class="card">
          <div class="card-header">
            <h3>Visão Geral das Turmas</h3>
            <button class="btn-link" onclick="window.EduPlanApp.navegarPara('turmas')">Ver todas →</button>
          </div>
          <div class="turmas-summary-list">
            ${metricasPorTurma.length === 0 ? `
              <div class="empty-state">
                <p>Nenhuma turma cadastrada ainda.</p>
                <button class="btn btn-sm btn-primary" onclick="window.EduPlanApp.abrirModalNovaTurma()">Cadastrar Primeira Turma</button>
              </div>
            ` : metricasPorTurma.map(m => `
              <div class="turma-summary-card" style="border-left: 5px solid ${m.turma.cor || '#2563eb'};">
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
                    <span class="metric-label">Plano de Aula</span>
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

        <!-- Coluna 2: Últimas Aulas Ministradas -->
        <div class="card">
          <div class="card-header">
            <h3>Últimas Aulas Ministradas</h3>
            <button class="btn-link" onclick="window.EduPlanApp.navegarPara('aulas')">Ver diário completo →</button>
          </div>
          <div class="recent-aulas-list">
            ${aulas.length === 0 ? `
              <div class="empty-state">
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
                      <strong class="rai-turma">${turma ? turma.nome : 'Turma Removida'}</strong>
                      <span class="badge badge-neutral">${aula.duracaoAulas} ${aula.duracaoAulas === 1 ? 'aula' : 'aulas'}</span>
                    </div>
                    <p class="rai-conteudo">${aula.conteudoMinistrado || 'Sem descrição de conteúdo.'}</p>
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

function formatarMesAbrev(dataIso) {
  const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const partes = dataIso.split('-');
  if (partes.length >= 2) {
    const idx = parseInt(partes[1], 10) - 1;
    return meses[idx] || '';
  }
  return '';
}
