// ============================================================
// Relatórios — diário, semanal, mensal + exportação
// ============================================================

let formatoSelecionado = 'diario';

document.querySelectorAll('#formatoToggle button').forEach((btn) => {
  btn.addEventListener('click', () => {
    formatoSelecionado = btn.dataset.formato;
    document.querySelectorAll('#formatoToggle button').forEach((b) => b.classList.toggle('active', b === btn));

    const ehDiario = formatoSelecionado === 'diario';
    document.getElementById('filtroDiario').style.display = ehDiario ? 'flex' : 'none';
    document.getElementById('filtroPeriodo').style.display = ehDiario ? 'none' : 'flex';
    document.getElementById('resultado').innerHTML = '';
  });
});

function renderizarDiario(dados) {
  const el = document.getElementById('resultado');
  if (!dados.servicos.length) {
    el.innerHTML = `<h2>Relatório Diário — ${formatarDataBr(dados.data)}</h2><div class="empty-state">Nenhum atendimento registrado nesta data.</div>`;
    return;
  }
  el.innerHTML = `
    <h2>Relatório Diário — ${formatarDataBr(dados.data)} (${dados.total} atendimentos)</h2>
    <table class="data-table">
      <thead><tr><th>Cliente</th><th>Serviço</th><th>Motivo / Obs.</th><th>Responsável</th></tr></thead>
      <tbody>
        ${dados.servicos.map((s) => `
          <tr>
            <td>${s.cliente_id} — ${s.cliente_nome}</td>
            <td><span class="tag tag-${s.tipo}">${ROTULOS_TIPO[s.tipo]}</span></td>
            <td>${s.motivo || s.observacoes || '-'}</td>
            <td>${s.colaborador_nome}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderizarConsolidado(dados, titulo) {
  const el = document.getElementById('resultado');
  if (!dados.consolidado.length) {
    el.innerHTML = `<h2>${titulo}</h2><div class="empty-state">Nenhum atendimento no período selecionado.</div>`;
    return;
  }
  el.innerHTML = `
    <h2>${titulo} (${dados.total_geral} atendimentos)</h2>
    <table class="data-table">
      <thead>
        <tr><th>Colaborador</th><th>Instalações</th><th>Manutenções</th><th>Retenções</th><th>Retiradas</th><th>Pós-vendas</th><th>Total</th></tr>
      </thead>
      <tbody>
        ${dados.consolidado.map((c) => `
          <tr>
            <td>${c.colaborador_nome}</td>
            <td>${c.instalacao}</td>
            <td>${c.manutencao}</td>
            <td>${c.retencao}</td>
            <td>${c.retirada}</td>
            <td>${c.posvenda}</td>
            <td><strong>${c.total}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

document.getElementById('btnGerar').addEventListener('click', async () => {
  const data = document.getElementById('filtroData').value;
  if (!data) return mostrarToast('Selecione uma data', 'erro');
  try {
    const dados = await api.get(`/relatorios/diario?data=${data}`);
    renderizarDiario(dados);
  } catch (err) {
    mostrarToast('Erro ao gerar relatório diário', 'erro');
  }
});

document.getElementById('btnGerarPeriodo').addEventListener('click', async () => {
  const data_inicio = document.getElementById('filtroDataInicio').value;
  const data_fim = document.getElementById('filtroDataFim').value;
  if (!data_inicio || !data_fim) return mostrarToast('Selecione o período', 'erro');

  try {
    const dados = await api.get(`/relatorios/${formatoSelecionado}?data_inicio=${data_inicio}&data_fim=${data_fim}`);
    renderizarConsolidado(dados, formatoSelecionado === 'semanal' ? 'Relatório Semanal' : 'Relatório Mensal');
  } catch (err) {
    mostrarToast('Erro ao gerar relatório', 'erro');
  }
});

document.getElementById('btnPdf').addEventListener('click', () => {
  const data = document.getElementById('filtroData').value;
  if (!data) return mostrarToast('Selecione uma data', 'erro');
  window.open(`/api/relatorios/exportar/pdf?formato=diario&data=${data}`, '_blank');
});

document.getElementById('btnExcel').addEventListener('click', () => {
  const data = document.getElementById('filtroData').value;
  if (!data) return mostrarToast('Selecione uma data', 'erro');
  window.open(`/api/relatorios/exportar/excel?formato=diario&data=${data}`, '_blank');
});

document.getElementById('btnPdfPeriodo').addEventListener('click', () => {
  const data_inicio = document.getElementById('filtroDataInicio').value;
  const data_fim = document.getElementById('filtroDataFim').value;
  if (!data_inicio || !data_fim) return mostrarToast('Selecione o período', 'erro');
  window.open(`/api/relatorios/exportar/pdf?formato=${formatoSelecionado}&data_inicio=${data_inicio}&data_fim=${data_fim}`, '_blank');
});

document.getElementById('btnExcelPeriodo').addEventListener('click', () => {
  const data_inicio = document.getElementById('filtroDataInicio').value;
  const data_fim = document.getElementById('filtroDataFim').value;
  if (!data_inicio || !data_fim) return mostrarToast('Selecione o período', 'erro');
  window.open(`/api/relatorios/exportar/excel?formato=${formatoSelecionado}&data_inicio=${data_inicio}&data_fim=${data_fim}`, '_blank');
});

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('filtroData').valueAsDate = new Date();
});
