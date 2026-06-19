// ============================================================
// Lançamento de Serviços
// ============================================================

let tipoSelecionado = 'instalacao';

const CONFIG_TIPO = {
  instalacao:  { motivo: false, observacoes: false },
  manutencao:  { motivo: true,  labelMotivo: 'Motivo da Manutenção', observacoes: false },
  retencao:    { motivo: true,  labelMotivo: 'Motivo da Retenção', observacoes: false },
  retirada:    { motivo: true,  labelMotivo: 'Motivo da Retirada', observacoes: false },
  posvenda:    { motivo: false, observacoes: true },
};

function aplicarTipo(tipo) {
  tipoSelecionado = tipo;
  document.querySelectorAll('#tipoToggle button').forEach((b) => {
    b.classList.toggle('active', b.dataset.tipo === tipo);
  });

  const cfg = CONFIG_TIPO[tipo];
  const campoMotivo = document.getElementById('campoMotivo');
  const campoObs = document.getElementById('campoObservacoes');

  campoMotivo.style.display = cfg.motivo ? 'flex' : 'none';
  campoObs.style.display = cfg.observacoes ? 'flex' : 'none';
  if (cfg.motivo) document.getElementById('labelMotivo').textContent = cfg.labelMotivo;
}

document.querySelectorAll('#tipoToggle button').forEach((btn) => {
  btn.addEventListener('click', () => aplicarTipo(btn.dataset.tipo));
});

async function carregarColaboradores() {
  const select = document.getElementById('colaborador_id');
  try {
    const colaboradores = await api.get('/colaboradores?status=Ativo');
    select.innerHTML = colaboradores.map((c) => `<option value="${c.id}">${c.nome}</option>`).join('');
  } catch (err) {
    mostrarToast('Erro ao carregar colaboradores', 'erro');
  }
}

async function carregarUltimos() {
  try {
    const servicos = await api.get('/servicos');
    const tbody = document.querySelector('#tabelaUltimos tbody');
    if (!servicos.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Nenhum serviço registrado ainda.</td></tr>';
      return;
    }
    tbody.innerHTML = servicos.slice(0, 10).map((s) => `
      <tr>
        <td>${formatarDataBr(s.data_servico)}</td>
        <td>${s.cliente_id} — ${s.cliente_nome}</td>
        <td><span class="tag tag-${s.tipo}">${ROTULOS_TIPO[s.tipo]}</span></td>
        <td>${s.colaborador_nome}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

document.getElementById('formServico').addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    tipo: tipoSelecionado,
    cliente_id: document.getElementById('cliente_id').value.trim(),
    cliente_nome: document.getElementById('cliente_nome').value.trim(),
    motivo: CONFIG_TIPO[tipoSelecionado].motivo ? document.getElementById('motivo').value.trim() : null,
    observacoes: CONFIG_TIPO[tipoSelecionado].observacoes ? document.getElementById('observacoes').value.trim() : null,
    data_servico: document.getElementById('data_servico').value,
    colaborador_id: document.getElementById('colaborador_id').value,
  };

  try {
    await api.post('/servicos', payload);
    mostrarToast('Serviço registrado com sucesso!');
    e.target.reset();
    document.getElementById('data_servico').valueAsDate = new Date();
    await carregarUltimos();
  } catch (err) {
    mostrarToast(err.erro || 'Erro ao registrar serviço', 'erro');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('data_servico').valueAsDate = new Date();
  aplicarTipo('instalacao');
  carregarColaboradores();
  carregarUltimos();
});
