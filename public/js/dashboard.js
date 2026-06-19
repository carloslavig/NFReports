// ============================================================
// Dashboard — indicadores, ranking e gráficos
// ============================================================

const CORES_TIPO = {
  instalacao: '#4FA8FF',
  manutencao: '#FFB84F',
  retencao: '#FF5470',
  retirada: '#B084FF',
  posvenda: '#00D9A3',
};

const GRID_COLOR = 'rgba(138,150,163,0.12)';
const TEXT_MUTED = '#8A96A3';

Chart.defaults.color = TEXT_MUTED;
Chart.defaults.font.family = "'Inter', sans-serif";

let chartColaboradores, chartDistribuicao, chartEvolucao;

function montarKpis(resumo) {
  const cards = [
    { label: 'Hoje', valor: resumo.total_hoje, tipo: null, ativo: true },
    { label: 'Esta Semana', valor: resumo.total_semana, tipo: null },
    { label: 'Este Mês', valor: resumo.total_mes, tipo: null },
    { label: 'Instalações', valor: resumo.total_instalacoes, tipo: 'instalacao' },
    { label: 'Manutenções', valor: resumo.total_manutencoes, tipo: 'manutencao' },
    { label: 'Retenções', valor: resumo.total_retencoes, tipo: 'retencao' },
    { label: 'Retiradas', valor: resumo.total_retiradas, tipo: 'retirada' },
    { label: 'Pós-vendas', valor: resumo.total_posvendas, tipo: 'posvenda' },
  ];

  const grid = document.getElementById('kpiGrid');
  grid.innerHTML = cards.map((c) => `
    <div class="kpi-card ${c.ativo ? 'active' : ''}" data-tipo="${c.tipo || ''}">
      <div class="label">${c.label}</div>
      <div class="value">${c.valor}</div>
      <div class="signal-bars"><span></span><span></span><span></span><span></span></div>
    </div>
  `).join('');
}

function montarRanking(ranking) {
  const lista = document.getElementById('rankingList');
  if (!ranking.length) {
    lista.innerHTML = '<li class="empty-state">Nenhum serviço registrado ainda.</li>';
    return;
  }
  const maior = Math.max(...ranking.map((r) => r.total), 1);
  lista.innerHTML = ranking.slice(0, 8).map((r, i) => `
    <li>
      <span class="pos">${i + 1}</span>
      <span class="nome">${r.nome}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${(r.total / maior) * 100}%"></span></span>
      <span class="total">${r.total} (${r.percentual}%)</span>
    </li>
  `).join('');
}

function montarGraficoColaboradores(ranking) {
  const ctx = document.getElementById('chartColaboradores');
  const labels = ranking.map((r) => r.nome);
  const valores = ranking.map((r) => r.total);

  if (chartColaboradores) chartColaboradores.destroy();
  chartColaboradores = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ data: valores, backgroundColor: '#00D9A3', borderRadius: 5, maxBarThickness: 36 }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: GRID_COLOR }, beginAtZero: true, ticks: { precision: 0 } },
      },
    },
  });
}

function montarGraficoDistribuicao(distribuicao) {
  const ctx = document.getElementById('chartDistribuicao');
  const labels = distribuicao.map((d) => ROTULOS_TIPO[d.tipo] || d.tipo);
  const valores = distribuicao.map((d) => d.total);
  const cores = distribuicao.map((d) => CORES_TIPO[d.tipo] || '#666');

  if (chartDistribuicao) chartDistribuicao.destroy();
  chartDistribuicao = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data: valores, backgroundColor: cores, borderWidth: 0 }] },
    options: {
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 14 } } },
      cutout: '68%',
    },
  });
}

async function montarGraficoEvolucao(periodo = 'diario') {
  const dados = await api.get(`/dashboard/evolucao?periodo=${periodo}`);
  const labels = dados.map((d) => formatarDataBr(d.periodo));
  const valores = dados.map((d) => d.total);

  const ctx = document.getElementById('chartEvolucao');
  if (chartEvolucao) chartEvolucao.destroy();
  chartEvolucao = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: valores,
        borderColor: '#4FA8FF',
        backgroundColor: 'rgba(79,168,255,0.12)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
      }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: GRID_COLOR }, beginAtZero: true, ticks: { precision: 0 } },
      },
    },
  });
}

async function carregarDashboard() {
  try {
    const [resumo, ranking, distribuicao] = await Promise.all([
      api.get('/dashboard/resumo'),
      api.get('/dashboard/produtividade'),
      api.get('/dashboard/distribuicao'),
    ]);

    montarKpis(resumo);
    montarRanking(ranking);
    montarGraficoColaboradores(ranking);
    montarGraficoDistribuicao(distribuicao);
    await montarGraficoEvolucao('diario');
  } catch (err) {
    console.error(err);
    mostrarToast('Erro ao carregar dados do dashboard. Verifique se o backend está rodando.', 'erro');
  }
}

document.querySelectorAll('[data-periodo]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-periodo]').forEach((b) => b.classList.remove('btn-primary'));
    btn.classList.add('btn-primary');
    montarGraficoEvolucao(btn.dataset.periodo);
  });
});

document.addEventListener('DOMContentLoaded', carregarDashboard);
