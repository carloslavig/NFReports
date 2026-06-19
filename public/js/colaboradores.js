// ============================================================
// Gestão de Colaboradores (CRUD)
// ============================================================

const modalOverlay = document.getElementById('modalOverlay');
const formColaborador = document.getElementById('formColaborador');

function abrirModal(colaborador = null) {
  document.getElementById('modalTitulo').textContent = colaborador ? 'Editar Colaborador' : 'Novo Colaborador';
  document.getElementById('colaborador_id_edit').value = colaborador ? colaborador.id : '';
  document.getElementById('nome').value = colaborador ? colaborador.nome : '';
  document.getElementById('cargo').value = colaborador ? (colaborador.cargo || '') : '';
  document.getElementById('status').value = colaborador ? colaborador.status : 'Ativo';
  modalOverlay.style.display = 'flex';
}

function fecharModal() {
  modalOverlay.style.display = 'none';
  formColaborador.reset();
}

document.getElementById('btnNovo').addEventListener('click', () => abrirModal());
document.getElementById('btnCancelar').addEventListener('click', fecharModal);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) fecharModal(); });

async function carregarColaboradores() {
  try {
    const colaboradores = await api.get('/colaboradores');
    const tbody = document.getElementById('tabelaColaboradores');

    if (!colaboradores.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Nenhum colaborador cadastrado ainda.</td></tr>';
      return;
    }

    tbody.innerHTML = colaboradores.map((c) => `
      <tr>
        <td>#${c.id}</td>
        <td>${c.nome}</td>
        <td>${c.cargo || '-'}</td>
        <td>${formatarDataBr(c.data_cadastro)}</td>
        <td><span class="tag tag-${c.status === 'Ativo' ? 'ativo' : 'inativo'}">${c.status}</span></td>
        <td>
          <button class="btn btn-sm" data-editar="${c.id}">Editar</button>
          <button class="btn btn-sm btn-danger" data-remover="${c.id}">Remover</button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('[data-editar]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const colaborador = colaboradores.find((c) => c.id === parseInt(btn.dataset.editar, 10));
        abrirModal(colaborador);
      });
    });

    tbody.querySelectorAll('[data-remover]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Remover este colaborador? Essa ação não pode ser desfeita.')) return;
        try {
          await api.delete(`/colaboradores/${btn.dataset.remover}`);
          mostrarToast('Colaborador removido.');
          carregarColaboradores();
        } catch (err) {
          mostrarToast(err.erro || 'Erro ao remover colaborador', 'erro');
        }
      });
    });
  } catch (err) {
    mostrarToast('Erro ao carregar colaboradores', 'erro');
  }
}

formColaborador.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('colaborador_id_edit').value;
  const payload = {
    nome: document.getElementById('nome').value.trim(),
    cargo: document.getElementById('cargo').value.trim() || null,
    status: document.getElementById('status').value,
  };

  try {
    if (id) {
      await api.put(`/colaboradores/${id}`, payload);
      mostrarToast('Colaborador atualizado.');
    } else {
      await api.post('/colaboradores', payload);
      mostrarToast('Colaborador cadastrado.');
    }
    fecharModal();
    carregarColaboradores();
  } catch (err) {
    mostrarToast(err.erro || 'Erro ao salvar colaborador', 'erro');
  }
});

document.addEventListener('DOMContentLoaded', carregarColaboradores);
